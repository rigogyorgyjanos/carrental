import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { buildRecipientWhere, type NewsletterFilters } from "@/lib/newsletterFilters"

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const filters: NewsletterFilters = await req.json().catch(() => ({}))
    const where = buildRecipientWhere(filters)
    const count = await prisma.user.count({ where })

    return NextResponse.json({ count })
}
