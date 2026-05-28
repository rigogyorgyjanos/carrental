// app/api/admin/transactions/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { completeBooking, ensureBadgesSeeded } from "@/lib/gamification"
import { stripe } from "@/lib/stripe"
import { audit } from "@/lib/audit"

// Valid forward-only transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
    PENDING:   ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["ACTIVE",    "CANCELLED"],
    ACTIVE:    ["COMPLETED"],
}

// --- PATCH /api/admin/transactions/[id] — status transition ---
export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    try {
        const { id } = await context.params
        const { status: newStatus, notes, startMileage, endMileage } = await req.json()

        if (!newStatus) return NextResponse.json({ error: "Missing status" }, { status: 400 })

        const existing = await prisma.transaction.findUnique({ where: { id } })
        if (!existing) return NextResponse.json({ error: "Booking not found" }, { status: 404 })

        const allowed = VALID_TRANSITIONS[existing.status] ?? []
        if (!allowed.includes(newStatus)) {
            return NextResponse.json(
                { error: `Cannot transition from ${existing.status} to ${newStatus}` },
                { status: 409 }
            )
        }

        // ACTIVE → COMPLETED must go through gamification
        if (newStatus === "COMPLETED") {
            const full = await prisma.transaction.findUnique({
                where: { id },
                include: { product: { select: { brand: true, name: true, dailyKmLimit: true, excessKmFee: true } } },
            })
            if (!full) return NextResponse.json({ error: "Booking not found" }, { status: 404 })

            // Build extraData: endMileage (from request or already on record) + excess km charge
            const resolvedEndMileage = endMileage != null ? Number(endMileage) : full.endMileage
            const extraData: Record<string, unknown> = {}
            if (resolvedEndMileage != null) extraData.endMileage = resolvedEndMileage
            if (notes != null) extraData.notes = notes

            if (resolvedEndMileage != null && full.startMileage != null
                && full.product.dailyKmLimit != null && full.product.excessKmFee != null
                && full.product.excessKmFee > 0) {
                const usedKm    = resolvedEndMileage - full.startMileage
                const allowedKm = full.totalDays * full.product.dailyKmLimit + full.extraKmPurchased
                const excessKm  = Math.max(0, usedKm - allowedKm)
                const charge    = Math.round(excessKm * full.product.excessKmFee * 100) / 100
                if (charge > 0) {
                    const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
                    const checkoutSession = await stripe.checkout.sessions.create({
                        mode:                 "payment",
                        payment_method_types: ["card"],
                        line_items: [{
                            price_data: {
                                currency:     "eur",
                                product_data: {
                                    name:        `Excess km — ${full.product.brand} ${full.product.name}`,
                                    description: `${excessKm.toLocaleString()} km over limit × €${full.product.excessKmFee}/km`,
                                },
                                unit_amount: Math.round(charge * 100),
                            },
                            quantity: 1,
                        }],
                        success_url: `${appUrl}/bookings/${id}/confirm?excess_paid=1`,
                        cancel_url:  `${appUrl}/bookings/${id}/confirm`,
                        metadata:    { bookingId: id, type: "excess_km", excessKm: String(excessKm) },
                    })
                    extraData.excessKmCharge          = charge
                    extraData.excessKmStripeSessionId = checkoutSession.id
                    extraData.excessKmStripeUrl       = checkoutSession.url
                    extraData.excessKmPaid            = false
                }
            }

            await ensureBadgesSeeded()
            const result = await completeBooking(id, extraData)
            if (result.error) {
                return NextResponse.json({ error: result.error }, { status: 400 })
            }
            audit({
                action:    "booking.completed",
                entity:    "booking",
                entityId:  id,
                userId:    session.user.id,
                userEmail: session.user.email,
                userRole:  session.user.role,
                metadata:  { xpAwarded: result.xpAwarded, source: "admin" },
            })
            return NextResponse.json({
                success:           true,
                xpAwarded:         result.xpAwarded,
                newBadges:         result.newBadges,
                excessKmCharge:    extraData.excessKmCharge ?? null,
                excessKmStripeUrl: extraData.excessKmStripeUrl ?? null,
            })
        }

        // PENDING or CONFIRMED → CANCELLED: auto-refund then immediately update DB
        // Both steps are inside one try block so a DB failure after a successful
        // refund is logged as a critical inconsistency rather than silently ignored.
        if (["PENDING", "CONFIRMED"].includes(existing.status) && newStatus === "CANCELLED" && existing.paymentIntentId) {
            try {
                await stripe.refunds.create({ payment_intent: existing.paymentIntentId })
            } catch (err: any) {
                if (err?.code !== "charge_already_refunded") {
                    console.error("Auto-refund on cancel failed:", err)
                    return NextResponse.json({ error: "Stripe refund failed — booking not cancelled" }, { status: 502 })
                }
            }
            // DB update immediately after refund — if this fails we log a critical
            // alert because the customer was already refunded
            try {
                const updated = await prisma.transaction.update({
                    where: { id },
                    data:  { status: "CANCELLED", ...(notes !== undefined ? { notes } : {}) },
                })
                audit({
                    action:    "booking.cancelled_by_admin",
                    entity:    "booking",
                    entityId:  id,
                    userId:    session.user.id,
                    userEmail: session.user.email,
                    userRole:  session.user.role,
                    metadata:  { from: existing.status, to: "CANCELLED", refunded: true },
                })
                return NextResponse.json(updated)
            } catch (dbErr) {
                console.error(`CRITICAL: Stripe refund succeeded for booking ${id} but DB update failed. Manual intervention required.`, dbErr)
                return NextResponse.json({ error: "Refund processed but booking status update failed. Please contact support." }, { status: 500 })
            }
        }

        if (startMileage != null && Number(startMileage) < 0) {
            return NextResponse.json({ error: "Start odometer cannot be negative." }, { status: 400 })
        }
        if (endMileage != null && Number(endMileage) < 0) {
            return NextResponse.json({ error: "End odometer cannot be negative." }, { status: 400 })
        }

        // All other transitions — simple status update (includes startMileage for ACTIVE)
        const updated = await prisma.transaction.update({
            where: { id },
            data:  {
                status: newStatus as any,
                ...(notes        !== undefined ? { notes }                           : {}),
                ...(startMileage != null       ? { startMileage: Number(startMileage) } : {}),
            },
        })

        audit({
            action:    newStatus === "CANCELLED" ? "booking.cancelled_by_admin" : "booking.status_changed",
            entity:    "booking",
            entityId:  id,
            userId:    session.user.id,
            userEmail: session.user.email,
            userRole:  session.user.role,
            metadata:  { from: existing.status, to: newStatus },
        })
        return NextResponse.json(updated)
    } catch (error) {
        console.error("PATCH transaction error:", error)
        return NextResponse.json({ error: "Status update failed" }, { status: 500 })
    }
}

// --- GET single transaction with availability check ---
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await context.params

    if (!id) return NextResponse.json({ error: "Missing transaction ID" }, { status: 400 })

    try {
        const tx = await prisma.transaction.findUnique({
            where:   { id },
            include: {
                user:    { select: { id: true, name: true, email: true, image: true } },
                product: true,
            },
        })
        if (!tx) return NextResponse.json({ error: "Transaction not found" }, { status: 404 })

        // Mai napra elérhetőség ellenőrzés
        const today = new Date()
        today.setHours(0, 0, 0, 0) // csak a napot nézzük
        const start = new Date(tx.startDate)
        const end = new Date(tx.endDate)
        start.setHours(0, 0, 0, 0)
        end.setHours(0, 0, 0, 0)

        const availableToday = today < start || today > end

        return NextResponse.json({
            id: tx.id,
            userName: tx.user.name,
            productName: tx.product.name,
            startDate: tx.startDate,
            endDate: tx.endDate,
            totalDays: tx.totalDays,
            pricePerDay: tx.pricePerDay,
            totalPrice: tx.totalPrice,
            deposit: tx.deposit ?? 0,
            status: tx.status,
            notes: tx.notes,
            createdAt: tx.createdAt,
            updatedAt: tx.updatedAt,
            availableToday, // új mező
        })
    } catch (error) {
        console.error("GET transaction error:", error)
        return NextResponse.json({ error: "Failed to fetch transaction" }, { status: 500 })
    }
}

// --- UPDATE transaction ---
export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await context.params
    if (!id) return NextResponse.json({ error: "Missing transaction ID" }, { status: 400 })

    const data = await req.json()
    // status is intentionally excluded — use PATCH for status transitions
    const { startDate, endDate, pricePerDay, deposit, notes, startMileage, endMileage } = data

    if (startDate != null && isNaN(new Date(startDate).getTime())) {
        return NextResponse.json({ error: "Invalid startDate" }, { status: 400 })
    }
    if (endDate != null && isNaN(new Date(endDate).getTime())) {
        return NextResponse.json({ error: "Invalid endDate" }, { status: 400 })
    }
    if (startMileage != null && Number(startMileage) < 0) {
        return NextResponse.json({ error: "Start odometer cannot be negative." }, { status: 400 })
    }
    if (endMileage != null && Number(endMileage) < 0) {
        return NextResponse.json({ error: "End odometer cannot be negative." }, { status: 400 })
    }

    try {
        const existing = await prisma.transaction.findUnique({
            where: { id },
            include: { product: true },
        })
        if (!existing) return NextResponse.json({ error: "Transaction not found" }, { status: 404 })

        const start = startDate ? new Date(startDate) : existing.startDate
        const end   = endDate   ? new Date(endDate)   : existing.endDate
        const days  = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
        if (days < 1) return NextResponse.json({ error: "Invalid rental period" }, { status: 400 })

        const effectivePricePerDay = pricePerDay ?? existing.pricePerDay
        const discount    = existing.discountApplied ?? 0
        const SERVICE_FEE = 10
        const totalPrice  = Math.round(
            (effectivePricePerDay * days * (1 - discount) + SERVICE_FEE) * 100
        ) / 100

        // Recalculate deposit when price or days changed, unless admin explicitly provided one
        const effectiveDeposit = deposit != null
            ? deposit
            : existing.product.deposit ?? Math.round(totalPrice * 0.2 * 100) / 100

        const updated = await prisma.transaction.update({
            where: { id },
            data: {
                startDate:    start,
                endDate:      end,
                totalDays:    days,
                pricePerDay:  effectivePricePerDay,
                totalPrice,
                deposit:      effectiveDeposit,
                notes:        notes        ?? existing.notes,
                startMileage: startMileage != null ? Number(startMileage) : existing.startMileage,
                endMileage:   endMileage   != null ? Number(endMileage)   : existing.endMileage,
            },
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error("UPDATE transaction error:", error)
        return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 })
    }
}

// --- DELETE transaction ---
export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await context.params
    if (!id) return NextResponse.json({ error: "Missing transaction ID" }, { status: 400 })

    try {
        const existing = await prisma.transaction.findUnique({ where: { id } })
        if (!existing) return NextResponse.json({ error: "Transaction not found" }, { status: 404 })

        await prisma.transaction.delete({ where: { id } })
        audit({
            action:    "booking.deleted",
            entity:    "booking",
            entityId:  id,
            userId:    session.user.id,
            userEmail: session.user.email,
            userRole:  session.user.role,
            level:     "WARN",
            metadata:  { previousStatus: existing.status },
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("DELETE transaction error:", error)
        return NextResponse.json({ error: "Failed to delete transaction" }, { status: 500 })
    }
}