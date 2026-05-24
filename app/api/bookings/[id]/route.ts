// app/api/bookings/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

// --- GET ---
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user)
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const { id: bookingId } = await context.params
    if (!bookingId)
        return NextResponse.json({ error: "Missing booking ID" }, { status: 400 })

    try {
        const booking = await prisma.transaction.findUnique({
            where: { id: bookingId },
            include: { product: true },
        })

        if (!booking || booking.userId !== session.user.id)
            return NextResponse.json({ error: "Booking not found or forbidden" }, { status: 403 })

        return NextResponse.json(booking)
    } catch (error) {
        console.error("Booking fetch error:", error)
        return NextResponse.json({ error: "Failed to fetch booking" }, { status: 500 })
    }
}

// --- DELETE ---
export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user)
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const { id: bookingId } = await context.params
    if (!bookingId)
        return NextResponse.json({ error: "Missing booking ID" }, { status: 400 })

    try {
        const existing = await prisma.transaction.findUnique({
            where: { id: bookingId },
        })

        if (!existing || existing.userId !== session.user.id)
            return NextResponse.json({ error: "Booking not found or forbidden" }, { status: 403 })

        if (!["PENDING", "CONFIRMED"].includes(existing.status)) {
            return NextResponse.json(
                { error: "Only pending or confirmed bookings can be cancelled" },
                { status: 409 }
            )
        }

        await prisma.transaction.update({
            where: { id: bookingId },
            data:  { status: "CANCELLED" },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Booking deletion error:", error)
        return NextResponse.json({ error: "Delete failed" }, { status: 500 })
    }
}

// --- PUT (update) ---
export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user)
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const { id: bookingId } = await context.params
    const { startDate, endDate } = await req.json()
    if (!bookingId || !startDate || !endDate)
        return NextResponse.json({ error: "Missing booking data" }, { status: 400 })

    const start = new Date(startDate)
    const end = new Date(endDate)
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end)
        return NextResponse.json({ error: "Invalid rental period" }, { status: 400 })

    try {
        const existing = await prisma.transaction.findUnique({
            where: { id: bookingId },
            include: { product: true },
        })

        if (!existing || existing.userId !== session.user.id)
            return NextResponse.json({ error: "Booking not found or forbidden" }, { status: 403 })

        const overlapping = await prisma.transaction.findMany({
            where: {
                productId: existing.productId,
                id: { not: bookingId },
                status: { in: ["PENDING", "CONFIRMED", "ACTIVE"] },
                OR: [
                    { startDate: { lte: end }, endDate: { gte: start } },
                ],
            },
        })

        if (overlapping.length > 0)
            return NextResponse.json({ error: "Car already booked for this period" }, { status: 409 })

        const totalDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
        const totalPrice = totalDays * existing.product.pricePerDay
        const deposit = existing.product.deposit ?? totalPrice * 0.2

        const updated = await prisma.transaction.update({
            where: { id: bookingId },
            data: {
                startDate: start,
                endDate: end,
                totalDays,
                totalPrice,
                deposit,
            },
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error("Booking update error:", error)
        return NextResponse.json({ error: "Update failed" }, { status: 500 })
    }
}