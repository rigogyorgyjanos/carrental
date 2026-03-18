// app/api/bookings/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { productId, startDate, endDate } = await req.json()
    if (!productId || !startDate || !endDate) {
        return NextResponse.json({ error: "Missing booking data" }, { status: 400 })
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
        return NextResponse.json({ error: "Invalid rental period" }, { status: 400 })
    }

    try {
        // Ellenőrizzük, hogy a termék létezik és aktív
        const product = await prisma.product.findUnique({
            where: { id: productId },
        })

        if (!product || !product.active) {
            return NextResponse.json({ error: "Car not available" }, { status: 404 })
        }

        // Ellenőrizzük az overbooking-et
        const overlappingBookings = await prisma.transaction.findMany({
            where: {
                productId,
                status: { in: ["PENDING", "CONFIRMED", "ACTIVE"] },
                OR: [
                    { startDate: { lte: end }, endDate: { gte: start } }, // bármilyen átfedés
                ],
            },
        })

        if (overlappingBookings.length > 0) {
            return NextResponse.json({ error: "Car already booked for this period" }, { status: 409 })
        }

        const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
        const totalPrice = totalDays * product.pricePerDay
        const deposit = product.deposit ?? totalPrice * 0.2 // default 20% deposit

        // Létrehozás tranzakcióval, hogy atomic legyen
        const booking = await prisma.transaction.create({
            data: {
                userId: session.user.id,
                productId: product.id,
                startDate: start,
                endDate: end,
                totalDays,
                pricePerDay: product.pricePerDay,
                totalPrice,
                deposit,
                status: "PENDING",
            },
        })

        return NextResponse.json(booking, { status: 201 })
    } catch (error) {
        console.error("Booking creation error:", error)
        return NextResponse.json({ error: "Booking failed" }, { status: 500 })
    }
}

// --- GET (foglalások lekérése autóhoz) ---
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const carId = searchParams.get("carId")

    if (!carId) {
        return NextResponse.json({ error: "Missing carId" }, { status: 400 })
    }

    try {
        const bookings = await prisma.transaction.findMany({
            where: {
                productId: carId,
                status: {
                    in: ["PENDING", "CONFIRMED", "ACTIVE"], // csak aktív foglalások
                },
            },
            select: {
                startDate: true,
                endDate: true,
            },
        })

        return NextResponse.json(bookings)
    } catch (error) {
        console.error("Fetch bookings error:", error)
        return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 })
    }
}