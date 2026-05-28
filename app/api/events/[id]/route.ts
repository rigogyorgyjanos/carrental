import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { sendEventNotifications } from "@/lib/events"
import { audit } from "@/lib/audit"

interface Params { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
    const session = await getServerSession(authOptions)
    const { id } = await params

    const event = await prisma.event.findUnique({
        where:   { id },
        include: { company: { select: { id: true, name: true } } },
    })
    if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 })

    // Unauthenticated users may only see approved events
    if (!session?.user && event.status !== "APPROVED") {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // Moderators may only see their own company's events (or approved global ones)
    if (session?.user?.role === "MODERATOR") {
        const companyId = session.user.companyId
        if (event.status !== "APPROVED" && event.companyId !== companyId) {
            return NextResponse.json({ error: "Not found" }, { status: 404 })
        }
    }

    return NextResponse.json(event)
}

export async function PATCH(req: NextRequest, { params }: Params) {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { id } = await params
    const event = await prisma.event.findUnique({ where: { id } })
    if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 })

    // Moderators can only touch their own company's events
    if (session.user.role === "MODERATOR" && event.companyId !== session.user.companyId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    let body: Record<string, unknown>
    try {
        body = await req.json()
    } catch {
        return NextResponse.json({ error: "Invalid body" }, { status: 400 })
    }

    const { action, adminNote, ...fields } = body

    // Admin approve / reject flow
    if (action === "approve" || action === "reject") {
        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Only admins can approve/reject" }, { status: 403 })
        }
        const newStatus = action === "approve" ? "APPROVED" : "REJECTED"
        const updated = await prisma.event.update({
            where: { id },
            data:  { status: newStatus, adminNote: adminNote ? String(adminNote) : null },
        })

        audit({
            action:    action === "approve" ? "event.approved" : "event.rejected",
            entity:    "event",
            entityId:  id,
            userId:    session.user.id,
            userEmail: session.user.email,
            userRole:  session.user.role,
            metadata:  { adminNote },
        })

        // Send notifications when approved
        if (action === "approve") {
            sendEventNotifications(id).catch(err =>
                console.error("Event notification send failed:", err)
            )
        }

        return NextResponse.json(updated)
    }

    // General field update (admin or owner moderator)
    const allowedFields = [
        "title", "description", "bannerUrl", "startsAt", "endsAt",
        "effectType", "effectValue", "targetCategories", "targetBrands", "minDays",
    ]
    const data: Record<string, unknown> = {}
    for (const f of allowedFields) {
        if (f in fields) {
            if (f === "startsAt" || f === "endsAt") {
                data[f] = new Date(fields[f] as string)
            } else {
                data[f] = fields[f]
            }
        }
    }

    if (Object.keys(data).length === 0) {
        return NextResponse.json({ error: "No updatable fields" }, { status: 400 })
    }

    // If moderator edits an approved event, reset to PENDING_APPROVAL
    if (session.user.role === "MODERATOR" && event.status === "APPROVED") {
        data.status = "PENDING_APPROVAL"
        data.notificationSent = false
    }

    const updated = await prisma.event.update({ where: { id }, data })

    audit({
        action:    "event.updated",
        entity:    "event",
        entityId:  id,
        userId:    session.user.id,
        userEmail: session.user.email,
        userRole:  session.user.role,
        metadata:  { fields: Object.keys(data) },
    })

    return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { id } = await params
    const event = await prisma.event.findUnique({ where: { id } })
    if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 })

    if (session.user.role === "MODERATOR" && event.companyId !== session.user.companyId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.event.delete({ where: { id } })

    audit({
        action:    "event.deleted",
        entity:    "event",
        entityId:  id,
        userId:    session.user.id,
        userEmail: session.user.email,
        userRole:  session.user.role,
        metadata:  { title: event.title },
    })

    return NextResponse.json({ deleted: true })
}
