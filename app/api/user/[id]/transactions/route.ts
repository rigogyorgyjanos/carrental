import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id } = await params

    // Users can only fetch their own transactions; admins can fetch any
    if (session.user.id !== id && session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    try {
        const transactions = await prisma.transaction.findMany({
            where:   { userId: id },
            include: { product: true },
            orderBy: { createdAt: "desc" },
        })

        const formatted = transactions.map(t => ({
            id:          t.id,
            productName: t.product.name,
            startDate:   t.startDate,
            endDate:     t.endDate,
            totalPrice:  t.totalPrice,
            status:      t.status,
        }))

        return NextResponse.json(formatted)
    } catch (error) {
        console.error("Fetch user transactions error:", error)
        return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
    }
}
