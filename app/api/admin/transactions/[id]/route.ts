// app/api/admin/transactions/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { completeBooking, ensureBadgesSeeded } from "@/lib/gamification"
import { stripe } from "@/lib/stripe"

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
        const { status: newStatus, notes } = await req.json()

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
            // Calculate excess km charge if mileage was tracked
            const full = await prisma.transaction.findUnique({
                where: { id },
                include: { product: { select: { dailyKmLimit: true, excessKmFee: true } } },
            })
            if (full?.startMileage != null && full.endMileage != null
                && full.product.dailyKmLimit != null && full.product.excessKmFee != null) {
                const usedKm      = full.endMileage - full.startMileage
                const allowedKm   = full.totalDays * full.product.dailyKmLimit + full.extraKmPurchased
                const excessKm    = Math.max(0, usedKm - allowedKm)
                const charge      = Math.round(excessKm * full.product.excessKmFee * 100) / 100
                if (charge > 0) {
                    await prisma.transaction.update({ where: { id }, data: { excessKmCharge: charge } })
                }
            }

            await ensureBadgesSeeded()
            const result = await completeBooking(id)
            if (result.error) {
                return NextResponse.json({ error: result.error }, { status: 400 })
            }
            if (notes) {
                await prisma.transaction.update({ where: { id }, data: { notes } })
            }
            return NextResponse.json({ success: true, xpAwarded: result.xpAwarded, newBadges: result.newBadges })
        }

        // CONFIRMED → CANCELLED: auto-refund if payment was collected
        if (existing.status === "CONFIRMED" && newStatus === "CANCELLED" && existing.paymentIntentId) {
            try {
                await stripe.refunds.create({ payment_intent: existing.paymentIntentId })
            } catch (err) {
                console.error("Auto-refund on cancel failed:", err)
                return NextResponse.json({ error: "Stripe refund failed — booking not cancelled" }, { status: 502 })
            }
        }

        // All other transitions — simple status update
        const updated = await prisma.transaction.update({
            where: { id },
            data:  { status: newStatus as any, ...(notes !== undefined ? { notes } : {}) },
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

        const updated = await prisma.transaction.update({
            where: { id },
            data: {
                startDate:    start,
                endDate:      end,
                totalDays:    days,
                pricePerDay:  pricePerDay ?? existing.pricePerDay,
                totalPrice:   (pricePerDay ?? existing.pricePerDay) * days,
                deposit:      deposit      ?? existing.deposit,
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
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("DELETE transaction error:", error)
        return NextResponse.json({ error: "Failed to delete transaction" }, { status: 500 })
    }
}