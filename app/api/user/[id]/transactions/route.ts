import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    const transactions = await prisma.transaction.findMany({
        where: { userId: id },
        include: { product: true }
    })

    const formatted = transactions.map(t => ({
        id: t.id,
        productName: t.product.name,
        startDate: t.startDate,
        endDate: t.endDate,
        price: t.price,
        status: t.status
    }))

    return NextResponse.json(formatted)
}