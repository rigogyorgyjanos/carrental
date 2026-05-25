import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

// GET /api/admin/reviews — list pending (unapproved) reviews
export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const reviews = await prisma.review.findMany({
        where:   { approved: false },
        include: {
            user:    { select: { id: true, name: true, email: true, image: true } },
            product: { select: { id: true, name: true, brand: true } },
        },
        orderBy: { createdAt: "asc" },
    })

    return NextResponse.json(reviews)
}
