// app/api/bookings/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { getTierDiscount } from "@/lib/tiers"
import { stripe } from "@/lib/stripe"

const DATE_RE    = /^\d{4}-\d{2}-\d{2}$/
const SERVICE_FEE = 10

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

        // Refund deposit for CONFIRMED bookings that already paid
        if (existing.status === "CONFIRMED" && existing.paymentIntentId) {
            try {
                await stripe.refunds.create({ payment_intent: existing.paymentIntentId })
            } catch (refundErr) {
                console.error("Stripe refund failed (cancellation proceeds):", refundErr)
            }
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
    const body = await req.json()
    const { startDate, endDate } = body
    if (!bookingId || !startDate || !endDate)
        return NextResponse.json({ error: "Missing booking data" }, { status: 400 })

    if (typeof startDate !== "string" || typeof endDate !== "string" || !DATE_RE.test(startDate) || !DATE_RE.test(endDate))
        return NextResponse.json({ error: "Invalid date format — expected YYYY-MM-DD" }, { status: 400 })

    const start = new Date(startDate + "T00:00:00.000Z")
    const end   = new Date(endDate   + "T00:00:00.000Z")
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end)
        return NextResponse.json({ error: "Invalid rental period" }, { status: 400 })

    try {
        const existing = await prisma.transaction.findUnique({
            where: { id: bookingId },
            include: { product: true },
        })

        if (!existing || existing.userId !== session.user.id)
            return NextResponse.json({ error: "Booking not found or forbidden" }, { status: 403 })

        if (!["PENDING", "CONFIRMED"].includes(existing.status))
            return NextResponse.json({ error: "Only pending or confirmed bookings can be edited" }, { status: 409 })

        const totalDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

        if (existing.product.minimumRentalDays && totalDays < existing.product.minimumRentalDays)
            return NextResponse.json(
                { error: `Minimum rental period for this vehicle is ${existing.product.minimumRentalDays} days` },
                { status: 400 }
            )

        const overlapping = await prisma.transaction.findFirst({
            where: {
                productId: existing.productId,
                id: { not: bookingId },
                status: { in: ["PENDING", "CONFIRMED", "ACTIVE"] },
                OR: [{ startDate: { lte: end }, endDate: { gte: start } }],
            },
            select: { id: true },
        })
        if (overlapping)
            return NextResponse.json({ error: "Car already booked for this period" }, { status: 409 })

        const dbUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { xp: true },
        })
        const discount   = getTierDiscount(dbUser?.xp ?? 0)
        const basePrice  = totalDays * existing.product.pricePerDay
        const totalPrice = Math.round((basePrice * (1 - discount) + SERVICE_FEE) * 100) / 100
        const deposit    = existing.product.deposit ?? Math.round(totalPrice * 0.2 * 100) / 100

        const updated = await prisma.transaction.update({
            where: { id: bookingId },
            data: {
                startDate:       start,
                endDate:         end,
                totalDays,
                totalPrice,
                deposit,
                discountApplied: discount > 0 ? discount : null,
            },
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error("Booking update error:", error)
        return NextResponse.json({ error: "Update failed" }, { status: 500 })
    }
}