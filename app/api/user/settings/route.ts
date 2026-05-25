import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function PATCH(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { showOnLeaderboard, receivePromotionalEmails } = body

    const data: Record<string, boolean> = {}

    if (typeof showOnLeaderboard === "boolean") {
        data.showOnLeaderboard = showOnLeaderboard
    }
    if (typeof receivePromotionalEmails === "boolean") {
        data.receivePromotionalEmails = receivePromotionalEmails
    }

    if (Object.keys(data).length === 0) {
        return NextResponse.json({ error: "No valid fields provided" }, { status: 400 })
    }

    await prisma.user.update({
        where: { id: session.user.id },
        data,
    })

    return NextResponse.json({ success: true })
}
