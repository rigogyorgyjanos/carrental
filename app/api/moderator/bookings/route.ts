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

    const bookings = await prisma.transaction.findMany({
        where:   { product: { companyId } },
        orderBy: { createdAt: "desc" },
        include: {
            product: { select: { id: true, name: true, brand: true, dailyKmLimit: true, excessKmFee: true } },
            user:    { select: { id: true, name: true, email: true, image: true } },
        },
    })

    return NextResponse.json(bookings)
}
