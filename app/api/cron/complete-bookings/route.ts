import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { completeBooking, ensureBadgesSeeded } from "@/lib/gamification"

const CRON_SECRET = process.env.CRON_SECRET

async function handleCron(req: NextRequest): Promise<NextResponse> {
    if (!CRON_SECRET) {
        console.error("[cron] CRON_SECRET env var is not set — endpoint disabled")
        return NextResponse.json({ error: "Endpoint not configured" }, { status: 503 })
    }

    const authHeader = req.headers.get("authorization")
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await ensureBadgesSeeded()

    const now = new Date()

    // ACTIVE bookings past end date → complete (awards XP)
    const overdueActive = await prisma.transaction.findMany({
        where: { status: "ACTIVE", endDate: { lt: now } },
        select: { id: true },
    })

    const completionResults = await Promise.allSettled(
        overdueActive.map(b => completeBooking(b.id))
    )
    const completed = completionResults.filter(r => r.status === "fulfilled" && !(r.value as any).error).length
    const completeFailed = completionResults.length - completed

    // CONFIRMED bookings past end date → cancel (car was never picked up)
    const overdueConfirmed = await prisma.transaction.findMany({
        where: { status: "CONFIRMED", endDate: { lt: now } },
        select: { id: true },
    })

    let confirmedCancelled = 0
    for (const b of overdueConfirmed) {
        try {
            await prisma.transaction.update({
                where: { id: b.id },
                data:  { status: "CANCELLED", notes: "Auto-cancelled: never activated past rental end date" },
            })
            confirmedCancelled++
        } catch (err) {
            console.error(`[cron] Failed to auto-cancel confirmed booking ${b.id}:`, err)
        }
    }

    // PENDING bookings past end date → cancel (payment never completed)
    const overduePending = await prisma.transaction.findMany({
        where: { status: "PENDING", endDate: { lt: now } },
        select: { id: true },
    })

    let pendingCancelled = 0
    for (const b of overduePending) {
        try {
            await prisma.transaction.update({
                where: { id: b.id },
                data:  { status: "CANCELLED", notes: "Auto-cancelled: payment never completed past rental end date" },
            })
            pendingCancelled++
        } catch (err) {
            console.error(`[cron] Failed to auto-cancel pending booking ${b.id}:`, err)
        }
    }

    return NextResponse.json({
        activeProcessed:    overdueActive.length,
        completed,
        completeFailed,
        confirmedCancelled,
        pendingCancelled,
    })
}

// Vercel Cron sends GET; POST kept for manual triggers
export async function GET(req: NextRequest)  { return handleCron(req) }
export async function POST(req: NextRequest) { return handleCron(req) }
