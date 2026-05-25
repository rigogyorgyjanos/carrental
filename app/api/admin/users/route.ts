import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

async function requireAdmin() {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") return null
    return session
}

export async function GET() {
    if (!await requireAdmin()) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: "desc" },
            take: 200,
            select: { id: true, name: true, email: true, role: true, xp: true, level: true, image: true, createdAt: true, receivePromotionalEmails: true, showOnLeaderboard: true },
        })
        return NextResponse.json(users)
    } catch (error) {
        console.error("GET users error:", error)
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    if (!await requireAdmin()) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const data = await req.json()
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        return NextResponse.json({ error: "Valid email required" }, { status: 400 })
    }
    const exists = await prisma.user.findUnique({ where: { email: data.email } })
    if (exists) {
        return NextResponse.json({ error: "Email already in use" }, { status: 409 })
    }
    try {
        const newUser = await prisma.user.create({
            data: {
                name:  data.name ?? null,
                email: data.email,
                role:  data.role ?? "USER",
                xp:    0,
                level: 1,
            },
            select: { id: true, name: true, email: true, role: true, xp: true, level: true, createdAt: true },
        })
        return NextResponse.json(newUser)
    } catch (error) {
        console.error("POST user error:", error)
        return NextResponse.json({ error: "User creation failed" }, { status: 500 })
    }
}
