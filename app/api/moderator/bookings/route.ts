import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

// GET /api/moderator/bookings — bookings for this company's cars
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== "MODERATOR" && session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const companyId = session.user.companyId
    if (!companyId) return NextResponse.json({ error: "No company assigned" }, { status: 400 })

    const { searchParams } = new URL(req.url)
    const page  = Math.max(1, parseInt(searchParams.get("page")  ?? "1",  10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)))
    const skip  = (page - 1) * limit

    const [bookings, total] = await Promise.all([
        prisma.transaction.findMany({
            where:   { product: { companyId } },
            orderBy: { createdAt: "desc" },
            skip,
            take:    limit,
            include: {
                product: { select: { id: true, name: true, brand: true, dailyKmLimit: true, excessKmFee: true } },
                user:    { select: { id: true, name: true, email: true, image: true } },
            },
        }),
        prisma.transaction.count({ where: { product: { companyId } } }),
    ])

    return NextResponse.json({ bookings, total, page, limit })
}
