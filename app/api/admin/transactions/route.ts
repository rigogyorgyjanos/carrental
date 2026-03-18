// app/api/admin/transactions/route.ts
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
    try {
        const transactions = await prisma.transaction.findMany({
            include: { user: true, product: true },
            orderBy: { createdAt: "desc" },
        })

        const formatted = transactions.map(t => ({
            id: t.id,
            userName: t.user.name,
            productName: t.product.name,
            startDate: t.startDate,
            endDate: t.endDate,
            totalDays: t.totalDays,
            pricePerDay: t.pricePerDay,
            totalPrice: t.totalPrice,
            deposit: t.deposit ?? 0,
            status: t.status,
            createdAt: t.createdAt,
        }))

        return NextResponse.json(formatted)
    } catch (error) {
        console.error("Failed to fetch transactions:", error)
        return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
    }
}