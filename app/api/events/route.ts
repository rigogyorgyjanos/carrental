import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { sendEventNotifications } from "@/lib/events"
import { audit } from "@/lib/audit"

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const statusFilter = searchParams.get("status")   // "APPROVED" | "PENDING_APPROVAL" | "all"
    const publicOnly   = searchParams.get("public") === "1"

    const session = await getServerSession(authOptions)
    const isAdmin     = session?.user?.role === "ADMIN"
    const isModerator = session?.user?.role === "MODERATOR"

    const where: Record<string, unknown> = {}

    if (publicOnly || !session?.user) {
        // Unauthenticated or explicit public request — approved only
        where.status = "APPROVED"
    } else if (isAdmin) {
        // Admin sees everything, can filter by status
        if (statusFilter && statusFilter !== "all") {
            where.status = statusFilter
        }
    } else if (isModerator) {
        // Moderator sees only their own company's events, filtered by status if requested
        if (statusFilter && statusFilter !== "all") {
            where.status = statusFilter
        }
    }

    // Moderators only see their own company's events
    if (isModerator && session.user.companyId) {
        where.companyId = session.user.companyId
    }

    const events = await prisma.event.findMany({
        where,
        include: { company: { select: { id: true, name: true } } },
        orderBy: { startsAt: "asc" },
    })

    return NextResponse.json(events)
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    let body: Record<string, unknown>
    try {
        body = await req.json()
    } catch {
        return NextResponse.json({ error: "Invalid body" }, { status: 400 })
    }

    const { title, description, bannerUrl, startsAt, endsAt,
            effectType, effectValue, targetCategories, targetBrands, minDays } = body

    if (!title || !startsAt || !endsAt || !effectType || effectValue == null) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const startDt = new Date(startsAt as string)
    const endDt   = new Date(endsAt as string)
    if (isNaN(startDt.getTime()) || isNaN(endDt.getTime()) || startDt >= endDt) {
        return NextResponse.json({ error: "Invalid date range" }, { status: 400 })
    }

    const isAdmin = session.user.role === "ADMIN"

    // Moderators can only create events for their own company
    const companyId = isAdmin
        ? ((body.companyId as string | null) ?? null)
        : (session.user.companyId ?? null)

    // Admin events are auto-approved; moderator events need approval
    const status = isAdmin ? "APPROVED" : "PENDING_APPROVAL"

    const event = await prisma.event.create({
        data: {
            title:            String(title),
            description:      description ? String(description) : null,
            bannerUrl:        bannerUrl   ? String(bannerUrl)   : null,
            startsAt:         startDt,
            endsAt:           endDt,
            effectType:       effectType as any,
            effectValue:      Number(effectValue),
            targetCategories: Array.isArray(targetCategories) ? targetCategories : [],
            targetBrands:     Array.isArray(targetBrands)     ? targetBrands     : [],
            minDays:          minDays ? Number(minDays) : null,
            companyId,
            createdById:      session.user.id,
            status,
        },
    })

    audit({
        action:    "event.created",
        entity:    "event",
        entityId:  event.id,
        userId:    session.user.id,
        userEmail: session.user.email,
        userRole:  session.user.role,
        metadata:  { title, status, companyId },
    })

    // Admin events are immediately approved → send notifications
    if (isAdmin) {
        sendEventNotifications(event.id).catch(err =>
            console.error("Event notification send failed:", err)
        )
    }

    return NextResponse.json(event, { status: 201 })
}
