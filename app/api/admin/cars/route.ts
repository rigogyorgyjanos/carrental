// app/api/admin/cars/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

async function requireAdmin() {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") return null
    return session
}

// --- GET all cars ---
export async function GET() {
    if (!await requireAdmin()) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    try {
        const cars = await prisma.product.findMany({ orderBy: { createdAt: "desc" }, take: 200 })
        return NextResponse.json(cars)
    } catch (error) {
        console.error("GET cars error:", error)
        return NextResponse.json({ error: "Fetching cars failed" }, { status: 500 })
    }
}

// --- POST new car ---
export async function POST(req: NextRequest) {
    if (!await requireAdmin()) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const data = await req.json()

    const pricePerDay = Number(data.pricePerDay)
    if (!pricePerDay || pricePerDay <= 0) {
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
        const newCar = await prisma.product.create({
            data: {
                name:              (data.name  ?? "").trim(),
                brand:             (data.brand ?? "").trim(),
                model:             data.model             ? String(data.model).trim() : "Unknown",
                year:              data.year              ?? 2020,
                category:          data.category          ?? "Sedan",
                description:       (data.description ?? "").trim(),
                pricePerDay,
                deposit:           data.deposit           != null ? Number(data.deposit)           : undefined,
                transmission:      data.transmission      ?? "Automatic",
                fuelType:          data.fuelType          ?? "Petrol",
                seats:             data.seats             ?? 4,
                horsepower:        data.horsepower        != null ? Number(data.horsepower)        : undefined,
                drivetrain:        data.drivetrain        || undefined,
                zeroToHundred:     data.zeroToHundred     != null ? Number(data.zeroToHundred)     : undefined,
                topSpeed:          data.topSpeed          != null ? Number(data.topSpeed)          : undefined,
                mileage:           data.mileage           ?? 0,
                licensePlate:      data.licensePlate      ?? "UNKNOWN",
                location:          data.location          ?? "Budapest",
                minimumAge:        data.minimumAge        != null ? Number(data.minimumAge)        : undefined,
                minimumRentalDays: data.minimumRentalDays != null ? Number(data.minimumRentalDays) : undefined,
                dailyKmLimit:      data.dailyKmLimit      != null ? Number(data.dailyKmLimit)      : undefined,
                excessKmFee:       data.excessKmFee       != null ? Number(data.excessKmFee)       : undefined,
                featured:          data.featured          ?? false,
                active:            data.active            ?? true,
                images: data.images?.length
                    ? { create: data.images.map((url: string) => ({ url })) }
                    : undefined,
            },
        })
        return NextResponse.json(newCar)
    } catch (error) {
        console.error("POST car error:", error)
        return NextResponse.json({ error: "Creation failed" }, { status: 500 })
    }
}