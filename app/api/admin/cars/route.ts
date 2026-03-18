// app/api/admin/cars/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// --- GET all cars ---
export async function GET() {
    try {
        const cars = await prisma.product.findMany()
        return NextResponse.json(cars)
    } catch (error) {
        console.error("GET cars error:", error)
        return NextResponse.json({ error: "Fetching cars failed" }, { status: 500 })
    }
}

// --- POST new car ---
export async function POST(req: NextRequest) {
    const data = await req.json()

    try {
        const newCar = await prisma.product.create({
            data: {
                name: data.name,
                brand: data.brand,
                model: data.model ?? "Unknown",
                year: data.year ?? 2020,
                category: data.category ?? "Sedan",
                description: data.description ?? "",
                pricePerDay: data.pricePerDay,
                licensePlate: data.licensePlate ?? "UNKNOWN",
                location: data.location ?? "Budapest",
                mileage: data.mileage ?? 0,
                seats: data.seats ?? 4,
                transmission: data.transmission ?? "Automatic",
                fuelType: data.fuelType ?? "Petrol",
                images: data.images
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