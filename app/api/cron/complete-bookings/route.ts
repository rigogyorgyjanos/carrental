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
    const overdue = await prisma.transaction.findMany({
        where: {
            status: { in: ["CONFIRMED", "ACTIVE"] },
            endDate: { lt: now },
        },
        select: { id: true },
    })

    const results = await Promise.allSettled(
        overdue.map(b => completeBooking(b.id))
    )

    const completed = results.filter(r => r.status === "fulfilled").length
    const failed    = results.length - completed

    return NextResponse.json({ processed: overdue.length, completed, failed })
}

// Vercel Cron sends GET; POST kept for manual triggers
export async function GET(req: NextRequest)  { return handleCron(req) }
export async function POST(req: NextRequest) { return handleCron(req) }
