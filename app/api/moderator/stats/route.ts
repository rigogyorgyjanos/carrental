import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { startOfWeek, startOfMonth, subWeeks, subMonths } from "date-fns"

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== "MODERATOR" && session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const companyId = session.user.companyId
    if (!companyId) return NextResponse.json({ error: "No company assigned" }, { status: 400 })

    const now          = new Date()
    const thisWeekStart  = startOfWeek(now,        { weekStartsOn: 1 })
    const lastWeekStart  = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
    const thisMonthStart = startOfMonth(now)
    const lastMonthStart = startOfMonth(subMonths(now, 1))

    const [allBookings, fleetCount] = await Promise.all([
        prisma.transaction.findMany({
            where:   { product: { companyId }, status: { not: "CANCELLED" } },
            select:  { id: true, totalPrice: true, status: true, createdAt: true },
        }),
        prisma.product.count({ where: { companyId, active: true } }),
    ])

    const inRange = (date: Date, from: Date, to: Date) => date >= from && date < to

    const thisWeek   = allBookings.filter(b => inRange(new Date(b.createdAt), thisWeekStart, now))
    const lastWeek   = allBookings.filter(b => inRange(new Date(b.createdAt), lastWeekStart, thisWeekStart))
    const thisMonth  = allBookings.filter(b => inRange(new Date(b.createdAt), thisMonthStart, now))
    const lastMonth  = allBookings.filter(b => inRange(new Date(b.createdAt), lastMonthStart, thisMonthStart))

    const sum = (list: typeof allBookings) => list.reduce((s, b) => s + b.totalPrice, 0)

    return NextResponse.json({
        fleet:      fleetCount,
        total:      { bookings: allBookings.length, revenue: sum(allBookings) },
        thisWeek:   { bookings: thisWeek.length,    revenue: sum(thisWeek)    },
        lastWeek:   { bookings: lastWeek.length,    revenue: sum(lastWeek)    },
        thisMonth:  { bookings: thisMonth.length,   revenue: sum(thisMonth)   },
        lastMonth:  { bookings: lastMonth.length,   revenue: sum(lastMonth)   },
        byStatus: {
            PENDING:   allBookings.filter(b => b.status === "PENDING").length,
            CONFIRMED: allBookings.filter(b => b.status === "CONFIRMED").length,
            ACTIVE:    allBookings.filter(b => b.status === "ACTIVE").length,
            COMPLETED: allBookings.filter(b => b.status === "COMPLETED").length,
        },
    })
}
