import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

// GET /api/admin/companies/[id]
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const company = await prisma.company.findUnique({
        where: { id },
        include: {
            users:    { select: { id: true, name: true, email: true, image: true, role: true, createdAt: true } },
            products: { select: { id: true, name: true, brand: true, active: true, approvalStatus: true, pricePerDay: true }, orderBy: { createdAt: "desc" } },
        },
    })

    if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(company)
}

// PATCH /api/admin/companies/[id]
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const { name, description, logoUrl, website, address, status } = await req.json()

    const company = await prisma.company.update({
        where: { id },
        data: {
            ...(name        !== undefined && { name }),
            ...(description !== undefined && { description }),
            ...(logoUrl     !== undefined && { logoUrl }),
            ...(website     !== undefined && { website }),
            ...(address     !== undefined && { address }),
            ...(status      !== undefined && { status }),
        },
    })

    return NextResponse.json(company)
}

// DELETE /api/admin/companies/[id]
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    await prisma.company.delete({ where: { id } })
    return NextResponse.json({ success: true })
}
