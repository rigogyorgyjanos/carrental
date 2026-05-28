import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { audit } from "@/lib/audit"

interface Params { params: Promise<{ id: string }> }

// PATCH /api/penalties/[id] — cancel a penalty
export async function PATCH(req: NextRequest, { params }: Params) {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const penalty = await prisma.penalty.findUnique({ where: { id } })
    if (!penalty) return NextResponse.json({ error: "Not found" }, { status: 404 })

    // Moderators can only touch their own company's penalties
    if (session.user.role === "MODERATOR" && penalty.companyId !== session.user.companyId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { action } = body

    if (action !== "cancel") {
        return NextResponse.json({ error: "Only 'cancel' action is supported" }, { status: 400 })
    }

    if (penalty.status !== "UNPAID") {
        return NextResponse.json(
            { error: `Cannot cancel a penalty that is already ${penalty.status.toLowerCase()}` },
            { status: 409 }
        )
    }

    const updated = await prisma.penalty.update({
        where: { id },
        data:  { status: "CANCELLED" },
    })

    audit({
        action:    "penalty.cancelled",
        entity:    "penalty",
        entityId:  id,
        userId:    session.user.id,
        userEmail: session.user.email,
        userRole:  session.user.role,
        level:     "WARN",
        metadata:  { targetUserId: penalty.userId, amount: penalty.amount },
    })

    return NextResponse.json(updated)
}
