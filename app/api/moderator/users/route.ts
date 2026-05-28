import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== "MODERATOR" && session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const companyId = session.user.companyId
    if (!companyId) return NextResponse.json({ error: "No company assigned" }, { status: 400 })

    // Users who have at least one booking with this company's cars
    const users = await prisma.user.findMany({
        where: {
            transactions: { some: { product: { companyId } } },
        },
        select: {
            id:    true,
            name:  true,
            email: true,
            image: true,
            transactions: {
                where:   { product: { companyId } },
                select:  {
                    id:         true,
                    status:     true,
                    totalPrice: true,
                    startDate:  true,
                    endDate:    true,
                    createdAt:  true,
                    product:    { select: { brand: true, name: true } },
                },
                orderBy: { createdAt: "desc" },
            },
        },
        orderBy: { createdAt: "desc" },
    })

    const result = users.map(u => {
        const bookings     = u.transactions
        const totalSpent   = bookings
            .filter(b => b.status === "COMPLETED")
            .reduce((s, b) => s + b.totalPrice, 0)
        const activeCount  = bookings.filter(b => b.status === "ACTIVE").length
        const pendingCount = bookings.filter(b => ["PENDING", "CONFIRMED"].includes(b.status)).length
        const lastBooking  = bookings[0] ?? null

        return {
            id:           u.id,
            name:         u.name,
            email:        u.email,
            image:        u.image,
            totalBookings: bookings.length,
            activeCount,
            pendingCount,
            totalSpent,
            lastBookingDate: lastBooking?.createdAt ?? null,
            lastCarName:     lastBooking ? `${lastBooking.product.brand} ${lastBooking.product.name}` : null,
            recentBookings:  bookings.slice(0, 5).map(b => ({
                id:       b.id,
                status:   b.status,
                carName:  `${b.product.brand} ${b.product.name}`,
                start:    b.startDate,
                end:      b.endDate,
                price:    b.totalPrice,
            })),
        }
    })

    return NextResponse.json(result)
}
