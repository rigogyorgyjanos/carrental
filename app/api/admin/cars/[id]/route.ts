// app/api/admin/cars/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// --- GET ---
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
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
    const { id } = await context.params
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

    const data = await req.json()
    const {
        name,
        brand,
        model,
        year,
        category,
        description,
        pricePerDay,
        licensePlate,
        location,
        mileage,
        seats,
        transmission,
        fuelType,
        images
    } = data

    try {
        const updatedCar = await prisma.product.update({
            where: { id },
            data: {
                name,
                brand,
                model: model ?? undefined,
                year: year ?? undefined,
                category: category ?? undefined,
                description,
                pricePerDay: pricePerDay ? Number(pricePerDay) : undefined,
                licensePlate: licensePlate ?? undefined,
                location: location ?? undefined,
                mileage: mileage ?? undefined,
                seats: seats ?? undefined,
                transmission: transmission ?? undefined,
                fuelType: fuelType ?? undefined,
                // Új képek kezelése: létezőket töröljük, az újat hozzáadjuk
                images: images
                    ? {
                        deleteMany: {}, // törli az összes korábbi képet
                        create: images.map((url: string) => ({ url }))
                    }
                    : undefined
            },
        })

        return NextResponse.json(updatedCar)
    } catch (error) {
        console.error("PUT car error:", error)
        return NextResponse.json({ error: "Update failed" }, { status: 500 })
    }
}

// --- DELETE ---
export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

    try {
        await prisma.product.delete({ where: { id } })
        return NextResponse.json({ message: "Car deleted" })
    } catch (error) {
        console.error("DELETE car error:", error)
        return NextResponse.json({ error: "Delete failed" }, { status: 500 })
    }
}