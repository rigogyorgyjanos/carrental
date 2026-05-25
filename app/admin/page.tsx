import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import Link from "next/link"

export const dynamic = "force-dynamic"

// ── KPI card ───────────────────────────────────────────────────────────────
function KpiCard({
    label, value, sub, color = "#C9A84C", href,
}: {
    label: string; value: string; sub?: string; color?: string; href?: string
}) {
    const inner = (
        <div
            className="bg-surface border border-surface-3 rounded-2xl px-6 py-5 hover:border-gold/20 transition-colors"
        >
            <p className="text-[11px] font-stats uppercase tracking-[0.15em] text-muted mb-2">{label}</p>
            <p className="font-heading text-3xl font-light text-white-soft" style={{ color }}>{value}</p>
            {sub && <p className="text-muted text-xs font-stats mt-1">{sub}</p>}
        </div>
    )
    return href ? <Link href={href}>{inner}</Link> : inner
}

export default async function AdminDashboard() {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") redirect("/")

    const now      = new Date()
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())

    const [
        revenueAgg,
        monthRevenueAgg,
        activeCount,
        pendingCount,
        confirmedCount,
        completedCount,
        totalUsers,
        pendingReviewCount,
        topCarsRaw,
        recentBookings,
    ] = await Promise.all([
        prisma.transaction.aggregate({
            where: { status: { in: ["COMPLETED", "ACTIVE"] } },
            _sum:  { totalPrice: true },
        }),
        prisma.transaction.aggregate({
            where: { status: { in: ["COMPLETED", "ACTIVE"] }, createdAt: { gte: monthAgo } },
            _sum:  { totalPrice: true },
        }),
        prisma.transaction.count({ where: { status: "ACTIVE"     } }),
        prisma.transaction.count({ where: { status: "PENDING"    } }),
        prisma.transaction.count({ where: { status: "CONFIRMED"  } }),
        prisma.transaction.count({ where: { status: "COMPLETED"  } }),
        prisma.user.count(),
        prisma.review.count({ where: { approved: false } }),
        prisma.transaction.groupBy({
            by:      ["productId"],
            where:   { status: { in: ["COMPLETED", "ACTIVE"] } },
            _sum:    { totalPrice: true },
            _count:  { id: true },
            orderBy: { _sum: { totalPrice: "desc" } },
            take:    5,
        }),
        prisma.transaction.findMany({
            take:    8,
            orderBy: { createdAt: "desc" },
            include: {
                user:    { select: { name: true, email: true } },
                product: { select: { name: true, brand: true } },
            },
        }),
    ])

    // Resolve top car names
    const topCarIds = topCarsRaw.map(r => r.productId)
    const topCarProducts = await prisma.product.findMany({
        where:  { id: { in: topCarIds } },
        select: { id: true, name: true, brand: true },
    })
    const productMap = new Map(topCarProducts.map(p => [p.id, p]))

    const totalRevenue = revenueAgg._sum.totalPrice ?? 0
    const monthRevenue = monthRevenueAgg._sum.totalPrice ?? 0

    const STATUS_STYLE: Record<string, { label: string; classes: string }> = {
        PENDING:   { label: "Pending",   classes: "bg-amber-500/15 text-amber-400 border-amber-500/30"   },
        CONFIRMED: { label: "Confirmed", classes: "bg-blue-500/15 text-blue-400 border-blue-500/30"     },
        ACTIVE:    { label: "Active",    classes: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
        COMPLETED: { label: "Completed", classes: "bg-gold/15 text-gold border-gold/30"                  },
        CANCELLED: { label: "Cancelled", classes: "bg-surface-3 text-muted border-surface-3"             },
    }

    return (
        <div className="space-y-8">

            {/* ── Header ──────────────────────────────────────────── */}
            <div>
                <p className="text-gold text-[11px] font-stats uppercase tracking-[0.2em] mb-1">AURUM Admin</p>
                <h1 className="font-heading text-4xl font-light text-white-soft">Dashboard</h1>
            </div>

            {/* ── KPI row ─────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <KpiCard
                    label="Total Revenue"
                    value={`€${Math.round(totalRevenue).toLocaleString()}`}
                    sub={`€${Math.round(monthRevenue).toLocaleString()} this month`}
                    color="#C9A84C"
                />
                <KpiCard
                    label="Active Rentals"
                    value={activeCount.toString()}
                    sub={`${confirmedCount} confirmed`}
                    color="#34D399"
                    href="/admin/transactions?filter=ACTIVE"
                />
                <KpiCard
                    label="Pending Bookings"
                    value={pendingCount.toString()}
                    sub="Awaiting confirmation"
                    color="#F59E0B"
                    href="/admin/transactions?filter=PENDING"
                />
                <KpiCard
                    label="Pending Reviews"
                    value={pendingReviewCount.toString()}
                    sub="Awaiting approval"
                    color="#A78BFA"
                    href="/admin/reviews"
                />
                <KpiCard
                    label="Total Users"
                    value={totalUsers.toString()}
                    sub={`${completedCount} completed rentals`}
                    color="#60A5FA"
                    href="/admin/users"
                />
            </div>

            {/* ── Top cars + Recent bookings ───────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Top cars by revenue */}
                <div className="bg-surface border border-surface-3 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-surface-3">
                        <h2 className="font-heading text-lg text-white-soft font-light">Top Vehicles by Revenue</h2>
                    </div>
                    <div className="divide-y divide-surface-3">
                        {topCarsRaw.map((row, i) => {
                            const p = productMap.get(row.productId)
                            return (
                                <div key={row.productId} className="flex items-center justify-between px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 text-center text-xs font-stats text-muted">{i + 1}</span>
                                        <div>
                                            <p className="text-white-soft text-sm font-stats font-semibold">
                                                {p ? `${p.brand} ${p.name}` : row.productId}
                                            </p>
                                            <p className="text-muted text-[11px] font-stats">
                                                {row._count.id} rental{row._count.id !== 1 ? "s" : ""}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-gold font-stats font-semibold text-sm">
                                        €{Math.round(row._sum.totalPrice ?? 0).toLocaleString()}
                                    </span>
                                </div>
                            )
                        })}
                        {topCarsRaw.length === 0 && (
                            <div className="px-6 py-8 text-center text-muted text-sm font-stats">No data yet</div>
                        )}
                    </div>
                    <div className="px-6 py-3 border-t border-surface-3">
                        <Link href="/admin/cars" className="text-gold text-xs font-stats hover:underline">
                            Manage all cars →
                        </Link>
                    </div>
                </div>

                {/* Recent bookings */}
                <div className="bg-surface border border-surface-3 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-surface-3">
                        <h2 className="font-heading text-lg text-white-soft font-light">Recent Bookings</h2>
                    </div>
                    <div className="divide-y divide-surface-3">
                        {recentBookings.map(b => {
                            const s = STATUS_STYLE[b.status] ?? STATUS_STYLE.PENDING
                            return (
                                <div key={b.id} className="flex items-center justify-between px-6 py-3.5 gap-4">
                                    <div className="min-w-0">
                                        <p className="text-white-soft text-sm font-stats font-semibold truncate">
                                            {b.product.brand} {b.product.name}
                                        </p>
                                        <p className="text-muted text-[11px] font-stats truncate">
                                            {b.user.name ?? b.user.email}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className="text-gold font-stats text-sm font-semibold">
                                            €{Math.round(b.totalPrice)}
                                        </span>
                                        <span className={`text-[10px] font-stats px-2 py-1 rounded-full border ${s.classes}`}>
                                            {s.label}
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                        {recentBookings.length === 0 && (
                            <div className="px-6 py-8 text-center text-muted text-sm font-stats">No bookings yet</div>
                        )}
                    </div>
                    <div className="px-6 py-3 border-t border-surface-3">
                        <Link href="/admin/transactions" className="text-gold text-xs font-stats hover:underline">
                            View all bookings →
                        </Link>
                    </div>
                </div>
            </div>

        </div>
    )
}
