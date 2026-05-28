import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

function slugify(name: string) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
}

// GET /api/admin/companies
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const companies = await prisma.company.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            _count: { select: { users: true, products: true } },
        },
    })

    return NextResponse.json(companies)
}

// POST /api/admin/companies
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { name, description, logoUrl, website, address } = await req.json()
    if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 })

    const baseSlug = slugify(name)
    let slug = baseSlug
    let i = 1
    while (await prisma.company.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${i++}`
    }

    const company = await prisma.company.create({
        data: { name: name.trim(), slug, description, logoUrl, website, address },
    })

    return NextResponse.json(company, { status: 201 })
}
