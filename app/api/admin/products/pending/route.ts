import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

// GET /api/admin/products/pending — all cars grouped by approval status
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const cars = await prisma.product.findMany({
        where:   { companyId: { not: null } }, // only company-owned cars
        orderBy: { createdAt: "desc" },
        include: {
            company: { select: { id: true, name: true, slug: true } },
            images:  { take: 1 },
        },
    })

    return NextResponse.json(cars)
}
