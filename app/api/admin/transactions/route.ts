import { NextResponse } from "next/server"
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
        const transactions = await prisma.transaction.findMany({
            include: { user: true, product: true },
            orderBy: { createdAt: "desc" },
            take: 200,
        })

        const formatted = transactions.map(t => ({
            id:               t.id,
            userName:         t.user.name,
            userEmail:        t.user.email,
            productName:      t.product.name,
            startDate:        t.startDate,
            endDate:          t.endDate,
            totalDays:        t.totalDays,
            pricePerDay:      t.pricePerDay,
            totalPrice:       t.totalPrice,
            deposit:          t.deposit ?? 0,
            status:           t.status,
            paymentIntentId:  t.paymentIntentId ?? null,
            createdAt:        t.createdAt,
        }))

        return NextResponse.json(formatted)
    } catch (error) {
        console.error("Failed to fetch transactions:", error)
        return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
    }
}
