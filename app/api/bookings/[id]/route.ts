// app/api/bookings/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { stripe } from "@/lib/stripe"
import { audit } from "@/lib/audit"

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
            } catch (refundErr: any) {
                if (refundErr?.code === "charge_already_refunded") {
                    // already refunded — safe to proceed
                } else {
                    console.error("Stripe refund failed:", refundErr)
                    return NextResponse.json({ error: "Refund failed — please contact support" }, { status: 502 })
                }
            }
        }

        await prisma.transaction.update({
            where: { id: bookingId },
            data:  { status: "CANCELLED" },
        })

        audit({
            action:    "booking.cancelled_by_user",
            entity:    "booking",
            entityId:  bookingId,
            userId:    session.user.id,
            userEmail: session.user.email,
            userRole:  session.user.role,
            metadata:  { previousStatus: existing.status },
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

    // Lazy import to avoid bundling server-only lib when this file is tree-shaken
    const { getActiveEventsForProduct } = await import("@/lib/events")

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

        // Re-check active events for the new date range
        const tierDiscount  = existing.discountApplied ?? 0
        const eventEffect   = await getActiveEventsForProduct(
            existing.product.category, existing.product.brand, start, end, totalDays
        )
        const discount      = Math.min(tierDiscount + eventEffect.totalDiscountPct, 0.9)
        const basePrice     = totalDays * existing.product.pricePerDay
        const freeDayDiscount = Math.min(eventEffect.freeDays, totalDays - 1) * existing.product.pricePerDay
        const totalPrice    = Math.round((basePrice * (1 - discount) - freeDayDiscount + SERVICE_FEE) * 100) / 100
        const deposit       = existing.product.deposit ?? Math.round(totalPrice * 0.2 * 100) / 100

        // Serializable transaction: overlap check + update are atomic to prevent race conditions
        let updated
        try {
            updated = await prisma.$transaction(async (tx) => {
                const overlapping = await tx.transaction.findFirst({
                    where: {
                        productId: existing.productId,
                        id:     { not: bookingId },
                        status: { in: ["PENDING", "CONFIRMED", "ACTIVE"] },
                        OR: [{ startDate: { lte: end }, endDate: { gte: start } }],
                    },
                    select: { id: true },
                })
                if (overlapping) throw Object.assign(new Error("OVERLAP"), { code: "OVERLAP" })

                return tx.transaction.update({
                    where: { id: bookingId },
                    data: {
                        startDate:            start,
                        endDate:              end,
                        totalDays,
                        totalPrice,
                        deposit,
                        discountApplied:      tierDiscount > 0 ? tierDiscount : null,
                        eventDiscountApplied: eventEffect.totalDiscountPct > 0 ? eventEffect.totalDiscountPct : null,
                        xpMultiplier:         eventEffect.xpMultiplier,
                    },
                })
            }, { isolationLevel: "Serializable" })
        } catch (err: any) {
            if (err?.code === "OVERLAP") {
                return NextResponse.json({ error: "Car already booked for this period" }, { status: 409 })
            }
            throw err
        }

        audit({
            action:    "booking.dates_edited",
            entity:    "booking",
            entityId:  bookingId,
            userId:    session.user.id,
            userEmail: session.user.email,
            userRole:  session.user.role,
            metadata:  {
                newStart:    startDate,
                newEnd:      endDate,
                totalDays,
                totalPrice,
            },
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error("Booking update error:", error)
        return NextResponse.json({ error: "Update failed" }, { status: 500 })
    }
}