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

    const now             = new Date()
    const thisWeekStart   = startOfWeek(now,            { weekStartsOn: 1 })
    const lastWeekStart   = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
    const thisMonthStart  = startOfMonth(now)
    const lastMonthStart  = startOfMonth(subMonths(now, 1))

    const baseWhere = { product: { companyId }, status: { not: "CANCELLED" as const } }

    const [
        totalAgg,
        thisWeekAgg,
        lastWeekAgg,
        thisMonthAgg,
        lastMonthAgg,
        byStatus,
        fleetCount,
    ] = await Promise.all([
        prisma.transaction.aggregate({ where: baseWhere,                                                             _sum: { totalPrice: true }, _count: true }),
        prisma.transaction.aggregate({ where: { ...baseWhere, createdAt: { gte: thisWeekStart,   lt: now } },        _sum: { totalPrice: true }, _count: true }),
        prisma.transaction.aggregate({ where: { ...baseWhere, createdAt: { gte: lastWeekStart,   lt: thisWeekStart } }, _sum: { totalPrice: true }, _count: true }),
        prisma.transaction.aggregate({ where: { ...baseWhere, createdAt: { gte: thisMonthStart,  lt: now } },        _sum: { totalPrice: true }, _count: true }),
        prisma.transaction.aggregate({ where: { ...baseWhere, createdAt: { gte: lastMonthStart,  lt: thisMonthStart } }, _sum: { totalPrice: true }, _count: true }),
        prisma.transaction.groupBy({
            by:     ["status"],
            where:  { product: { companyId }, status: { in: ["PENDING", "CONFIRMED", "ACTIVE", "COMPLETED"] } },
            _count: { _all: true },
        }),
        prisma.product.count({ where: { companyId, active: true } }),
    ])

    const statusMap = Object.fromEntries(byStatus.map(r => [r.status, r._count._all]))

    return NextResponse.json({
        fleet:     fleetCount,
        total:     { bookings: totalAgg._count,     revenue: totalAgg._sum.totalPrice     ?? 0 },
        thisWeek:  { bookings: thisWeekAgg._count,  revenue: thisWeekAgg._sum.totalPrice  ?? 0 },
        lastWeek:  { bookings: lastWeekAgg._count,  revenue: lastWeekAgg._sum.totalPrice  ?? 0 },
        thisMonth: { bookings: thisMonthAgg._count, revenue: thisMonthAgg._sum.totalPrice ?? 0 },
        lastMonth: { bookings: lastMonthAgg._count, revenue: lastMonthAgg._sum.totalPrice ?? 0 },
        byStatus: {
            PENDING:   statusMap["PENDING"]   ?? 0,
            CONFIRMED: statusMap["CONFIRMED"] ?? 0,
            ACTIVE:    statusMap["ACTIVE"]    ?? 0,
            COMPLETED: statusMap["COMPLETED"] ?? 0,
        },
    })
}
