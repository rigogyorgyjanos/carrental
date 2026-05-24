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
        const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 200 })
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
    try {
        const newUser = await prisma.user.create({
            data: {
                name:  data.name,
                email: data.email,
                role:  data.role ?? "USER",
                xp:    0,
                level: 1,
            },
        })
        return NextResponse.json(newUser)
    } catch (error) {
        console.error("POST user error:", error)
        return NextResponse.json({ error: "User creation failed" }, { status: 500 })
    }
}
