// app/api/admin/cars/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

async function requireAdmin() {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") return null
    return session
}

// --- GET ---
export async function GET(
    _req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    if (!await requireAdmin()) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const { id } = await context.params
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

    try {
        const car = await prisma.product.findUnique({
            where: { id },
            include: { images: true } // képeket is betöltjük
        })
        
        if (!car) return NextResponse.json({ error: "Car not found" }, { status: 404 })
        return NextResponse.json(car)
    } catch (error) {
        console.error("GET car error:", error)
        return NextResponse.json({ error: "Database error" }, { status: 500 })
    }
}

// --- PUT ---
export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    if (!await requireAdmin()) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const { id } = await context.params
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

    const data = await req.json()

    if (data.pricePerDay != null && Number(data.pricePerDay) <= 0) {
        return NextResponse.json({ error: "Price per day must be greater than 0." }, { status: 400 })
    }
    if (data.deposit != null && Number(data.deposit) < 0) {
        return NextResponse.json({ error: "Deposit cannot be negative." }, { status: 400 })
    }
    if (data.dailyKmLimit != null && Number(data.dailyKmLimit) <= 0) {
        return NextResponse.json({ error: "Daily km limit must be greater than 0." }, { status: 400 })
    }
    if (data.excessKmFee != null && Number(data.excessKmFee) < 0) {
        return NextResponse.json({ error: "Excess km fee cannot be negative." }, { status: 400 })
    }
    if (data.minimumAge != null && Number(data.minimumAge) < 18) {
        return NextResponse.json({ error: "Minimum age cannot be less than 18." }, { status: 400 })
    }

    try {
        const updatedCar = await prisma.product.update({
            where: { id },
            data: {
                name:              data.name  ? String(data.name).trim()  : undefined,
                brand:             data.brand ? String(data.brand).trim() : undefined,
                model:             data.model             ?? undefined,
                year:              data.year              ? Number(data.year)              : undefined,
                category:          data.category          ?? undefined,
                description:       data.description,
                pricePerDay:       data.pricePerDay       ? Number(data.pricePerDay)       : undefined,
                deposit:           data.deposit           != null ? Number(data.deposit)           : null,
                transmission:      data.transmission      ?? undefined,
                fuelType:          data.fuelType          ?? undefined,
                seats:             data.seats             ? Number(data.seats)             : undefined,
                horsepower:        data.horsepower        != null ? Number(data.horsepower)        : null,
                drivetrain:        data.drivetrain        || null,
                zeroToHundred:     data.zeroToHundred     != null ? Number(data.zeroToHundred)     : null,
                topSpeed:          data.topSpeed          != null ? Number(data.topSpeed)          : null,
                mileage:           data.mileage           != null ? Number(data.mileage)           : undefined,
                licensePlate:      data.licensePlate      ?? undefined,
                location:          data.location          ?? undefined,
                minimumAge:        data.minimumAge        != null ? Number(data.minimumAge)        : null,
                minimumRentalDays: data.minimumRentalDays != null ? Number(data.minimumRentalDays) : null,
                dailyKmLimit:      data.dailyKmLimit      != null ? Number(data.dailyKmLimit)      : null,
                excessKmFee:       data.excessKmFee       != null ? Number(data.excessKmFee)       : null,
                featured:          data.featured          ?? undefined,
                active:            data.active            ?? undefined,
                images: data.images
                    ? { deleteMany: {}, create: data.images.map((url: string) => ({ url })) }
                    : undefined,
            },
        })

        return NextResponse.json(updatedCar)
    } catch (error) {
        console.error("PUT car error:", error)
        return NextResponse.json({ error: "Update failed" }, { status: 500 })
    }
}

// --- PATCH (active/featured toggle only) ---
export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    if (!await requireAdmin()) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const { id } = await context.params
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

    const body = await req.json()
    const patch: { active?: boolean; featured?: boolean } = {}
    if (body.active   !== undefined) patch.active   = Boolean(body.active)
    if (body.featured !== undefined) patch.featured = Boolean(body.featured)
    if (Object.keys(patch).length === 0)
        return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })

    try {
        const updated = await prisma.product.update({ where: { id }, data: patch })
        return NextResponse.json(updated)
    } catch (error) {
        console.error("PATCH car error:", error)
        return NextResponse.json({ error: "Update failed" }, { status: 500 })
    }
}

// --- DELETE ---
export async function DELETE(
    _req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    if (!await requireAdmin()) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const { id } = await context.params
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

    try {
        const activeCount = await prisma.transaction.count({
            where: { productId: id, status: { in: ["PENDING", "CONFIRMED", "ACTIVE"] } },
        })
        if (activeCount > 0) {
            return NextResponse.json(
                { error: `Cannot delete: car has ${activeCount} active booking(s)` },
                { status: 409 }
            )
        }

        await prisma.product.delete({ where: { id } })
        return NextResponse.json({ message: "Car deleted" })
    } catch (error) {
        console.error("DELETE car error:", error)
        return NextResponse.json({ error: "Delete failed" }, { status: 500 })
    }
}