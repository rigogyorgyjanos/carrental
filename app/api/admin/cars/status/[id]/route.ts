import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id: carId } = await context.params

    if (!carId) {
        return NextResponse.json({ error: "Missing car ID" }, { status: 400 })
    }

    try {
        const today = new Date()
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        const todayEnd = new Date(todayStart)
        todayEnd.setDate(todayEnd.getDate() + 1)

        // Ellenőrizzük, hogy van-e foglalás a mai napra
        const booked = await prisma.transaction.findFirst({
            where: {
                productId: carId,
                startDate: { lte: todayEnd },
                endDate: { gte: todayStart },
                status: { not: "CANCELLED" } // csak aktív foglalások
            }
        })

        return NextResponse.json({
            carId,
            todayAvailable: !booked
        })
    } catch (err) {
        console.error(err)
        return NextResponse.json({ error: "Failed to fetch car status" }, { status: 500 })
    }
}