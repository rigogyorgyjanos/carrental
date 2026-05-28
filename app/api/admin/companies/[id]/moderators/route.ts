import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import bcrypt from "bcrypt"

// POST /api/admin/companies/[id]/moderators — create new moderator user + assign
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id: companyId } = await params
    const { name, email, password } = await req.json()

    if (!name?.trim() || !email?.trim() || !password?.trim()) {
        return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 })
    }

    const company = await prisma.company.findUnique({ where: { id: companyId } })
    if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 })

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 409 })

    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
        data: {
            name:      name.trim(),
            email:     email.trim().toLowerCase(),
            password:  hashed,
            role:      "MODERATOR",
            companyId,
        },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
    })

    return NextResponse.json(user, { status: 201 })
}

// DELETE /api/admin/companies/[id]/moderators?userId=xxx — remove moderator from company
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id: companyId } = await params
    const userId = req.nextUrl.searchParams.get("userId")
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

    await prisma.user.update({
        where: { id: userId, companyId },
        data:  { role: "USER", companyId: null },
    })

    return NextResponse.json({ success: true })
}
