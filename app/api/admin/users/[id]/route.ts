import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

async function requireAdmin() {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") return null
    return session
}

export async function GET(
    _req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    if (!await requireAdmin()) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const { id } = await context.params
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

    try {
        const user = await prisma.user.findUnique({ where: { id } })
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
        return NextResponse.json(user)
    } catch (error) {
        console.error("GET user error:", error)
        return NextResponse.json({ error: "Database error" }, { status: 500 })
    }
}

export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    if (!await requireAdmin()) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const { id } = await context.params
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

    const { name, email, role, xp, level } = await req.json()

    try {
        if (email) {
            const existing = await prisma.user.findUnique({ where: { email } })
            if (existing && existing.id !== id) {
                return NextResponse.json({ error: "Email is already in use by another account." }, { status: 409 })
            }
        }

        const updated = await prisma.user.update({
            where: { id },
            data: {
                name:  name  ?? undefined,
                email: email ?? undefined,
                role:  role  ?? undefined,
                xp:    xp    != null ? Number(xp)    : undefined,
                level: level != null ? Number(level) : undefined,
            },
        })
        return NextResponse.json(updated)
    } catch (error) {
        console.error("PUT user error:", error)
        return NextResponse.json({ error: "User update failed" }, { status: 500 })
    }
}

export async function DELETE(
    _req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    if (!await requireAdmin()) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const { id } = await context.params
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

    try {
        await prisma.user.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("DELETE user error:", error)
        return NextResponse.json({ error: "Delete failed" }, { status: 500 })
    }
}
