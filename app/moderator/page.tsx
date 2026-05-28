import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import Link from "next/link"
import { startOfWeek, startOfMonth, subWeeks, subMonths } from "date-fns"
import {
    Car, Plus, Calendar, Users, TrendingUp, TrendingDown,
    ArrowRight, CheckCircle, AlertTriangle, Gavel, BarChart3, Clock,
    type LucideIcon,
} from "lucide-react"

export const dynamic = "force-dynamic"

type AttentionItem = {
    count:   number
    label:   string
    href:    string
    Icon:    LucideIcon
    wrap:    string
    iconBg:  string
    text:    string
    arrow:   string
}

export default async function ModeratorDashboard() {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== "MODERATOR" && session.user.role !== "ADMIN")) redirect("/")
    const companyId = session.user.companyId
    if (!companyId) redirect("/")

    const now            = new Date()
    const thisWeekStart  = startOfWeek(now,              { weekStartsOn: 1 })
    const lastWeekStart  = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
    const thisMonthStart = startOfMonth(now)
    const lastMonthStart = startOfMonth(subMonths(now, 1))

    const [
        company,
        allBookings,
        fleetCount,
        pendingApprovalCount,
        recentBookings,
        unpaidPenaltiesCount,
        totalCustomers,
    ] = await Promise.all([
        prisma.company.findUnique({
            where:  { id: companyId },
            select: { name: true },
        }),
        prisma.transaction.findMany({
            where:  { product: { companyId }, status: { not: "CANCELLED" } },
            select: { id: true, totalPrice: true, status: true, createdAt: true },
        }),
        prisma.product.count({ where: { companyId, active: true } }),
        prisma.product.count({ where: { companyId, approvalStatus: "PENDING" } }),
        prisma.transaction.findMany({
            where:   { product: { companyId } },
            take:    6,
            orderBy: { createdAt: "desc" },
            include: {
                user:    { select: { name: true, email: true } },
                product: { select: { name: true, brand: true } },
            },
        }),
        prisma.penalty.count({ where: { companyId, status: "UNPAID" } }),
        prisma.user.count({
            where: { transactions: { some: { product: { companyId } } } },
        }),
    ])

    // ── Stats calculation ────────────────────────────────────────────────────
    const inRange = (d: Date, from: Date, to: Date) => d >= from && d < to
    const sum     = (list: typeof allBookings) => list.reduce((s, b) => s + b.totalPrice, 0)

    const thisWeekBkgs  = allBookings.filter(b => inRange(new Date(b.createdAt), thisWeekStart, now))
    const lastWeekBkgs  = allBookings.filter(b => inRange(new Date(b.createdAt), lastWeekStart, thisWeekStart))
    const thisMonthBkgs = allBookings.filter(b => inRange(new Date(b.createdAt), thisMonthStart, now))
    const lastMonthBkgs = allBookings.filter(b => inRange(new Date(b.createdAt), lastMonthStart, thisMonthStart))

    const weekRevenue  = sum(thisWeekBkgs)
    const lastWeekRev  = sum(lastWeekBkgs)
    const monthRevenue = sum(thisMonthBkgs)
    const lastMonthRev = sum(lastMonthBkgs)
    const totalRevenue = sum(allBookings)

    const byStatus = {
        PENDING:   allBookings.filter(b => b.status === "PENDING").length,
        CONFIRMED: allBookings.filter(b => b.status === "CONFIRMED").length,
        ACTIVE:    allBookings.filter(b => b.status === "ACTIVE").length,
        COMPLETED: allBookings.filter(b => b.status === "COMPLETED").length,
    }

    function trendPct(current: number, prev: number) {
        if (prev === 0) return null
        return Math.round(((current - prev) / prev) * 100)
    }

    const weekTrend  = trendPct(weekRevenue, lastWeekRev)
    const monthTrend = trendPct(monthRevenue, lastMonthRev)

    // ── Attention items ──────────────────────────────────────────────────────
    const attentionItems: AttentionItem[] = [
        byStatus.PENDING > 0 ? {
            count:  byStatus.PENDING,
            label:  "Unconfirmed Booking",
            href:   "/moderator/bookings",
            Icon:   Clock,
            wrap:   "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 hover:border-amber-500/50",
            iconBg: "bg-amber-500/20",
            text:   "text-amber-400",
            arrow:  "text-amber-400/50 group-hover:text-amber-400",
        } : null,
        pendingApprovalCount > 0 ? {
            count:  pendingApprovalCount,
            label:  "Car Pending Approval",
            href:   "/moderator/fleet",
            Icon:   Car,
            wrap:   "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30 hover:border-blue-500/50",
            iconBg: "bg-blue-500/20",
            text:   "text-blue-400",
            arrow:  "text-blue-400/50 group-hover:text-blue-400",
        } : null,
        unpaidPenaltiesCount > 0 ? {
            count:  unpaidPenaltiesCount,
            label:  "Unpaid Fine",
            href:   "/moderator/penalties",
            Icon:   Gavel,
            wrap:   "bg-red-500/10 hover:bg-red-500/15 border-red-500/25 hover:border-red-500/50",
            iconBg: "bg-red-500/15",
            text:   "text-red-400",
            arrow:  "text-red-400/50 group-hover:text-red-400",
        } : null,
    ].filter(Boolean) as AttentionItem[]

    const totalAttention = attentionItems.reduce((s, i) => s + i.count, 0)

    // ── Booking status styles ─────────────────────────────────────────────────
    const STATUS_STYLE: Record<string, { label: string; classes: string }> = {
        PENDING:   { label: "Pending",   classes: "bg-amber-500/15 text-amber-400 border-amber-500/30"       },
        CONFIRMED: { label: "Confirmed", classes: "bg-blue-500/15 text-blue-400 border-blue-500/30"         },
        ACTIVE:    { label: "Active",    classes: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
        COMPLETED: { label: "Completed", classes: "bg-gold/15 text-gold border-gold/30"                      },
        CANCELLED: { label: "Cancelled", classes: "bg-surface-3 text-muted border-surface-3"                 },
    }

    return (
        <div className="space-y-8">

            {/* ── Header ───────────────────────────────────── */}
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <p className="text-gold text-[11px] font-stats uppercase tracking-[0.2em] mb-1">
                        Fleet Portal · {company?.name ?? "Your Company"}
                    </p>
                    <h1 className="font-heading text-4xl font-light text-white-soft">Dashboard</h1>
                    <p className="text-muted text-sm font-stats mt-1">
                        {now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    </p>
                </div>
                {totalAttention > 0 && (
                    <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2.5">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="text-amber-400 text-xs font-stats font-semibold">
                            {totalAttention} item{totalAttention !== 1 ? "s" : ""} need attention
                        </span>
                    </div>
                )}
            </div>

            {/* ── Attention items ──────────────────────────── */}
            {attentionItems.length > 0 && (
                <div className={`grid gap-3 ${
                    attentionItems.length === 1
                        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                        : attentionItems.length === 2
                        ? "grid-cols-1 sm:grid-cols-2"
                        : "grid-cols-1 sm:grid-cols-3"
                }`}>
                    {attentionItems.map(({ count, label, href, Icon, wrap, iconBg, text, arrow }) => (
                        <Link
                            key={href}
                            href={href}
                            className={`group flex items-center gap-4 border rounded-xl px-5 py-4 transition-all cursor-pointer ${wrap}`}
                        >
                            <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
                                <Icon className={`w-5 h-5 ${text}`} />
                            </div>
                            <div>
                                <p className={`font-stats font-semibold text-sm ${text}`}>
                                    {count} {label}{count !== 1 ? "s" : ""}
                                </p>
                                <p className="text-muted text-xs font-stats">Needs attention</p>
                            </div>
                            <ArrowRight className={`w-4 h-4 ml-auto transition-colors ${arrow}`} />
                        </Link>
                    ))}
                </div>
            )}

            {/* ── KPI Cards ────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

                {/* Week revenue */}
                <div className="bg-surface border border-surface-3 rounded-2xl px-6 py-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-gold" />
                        </div>
                        {weekTrend !== null && (
                            <span className={`flex items-center gap-1 text-[10px] font-stats px-2 py-1 rounded-full ${
                                weekTrend >= 0
                                    ? "bg-emerald-500/10 text-emerald-400"
                                    : "bg-red-500/10 text-red-400"
                            }`}>
                                {weekTrend >= 0
                                    ? <TrendingUp className="w-3 h-3" />
                                    : <TrendingDown className="w-3 h-3" />
                                }
                                {Math.abs(weekTrend)}%
                            </span>
                        )}
                    </div>
                    <p className="font-heading text-3xl font-light" style={{ color: "#C9A84C" }}>
                        €{Math.round(weekRevenue).toLocaleString()}
                    </p>
                    <p className="text-[11px] font-stats uppercase tracking-[0.15em] text-muted mt-1">This Week</p>
                    <p className="text-muted text-xs font-stats mt-0.5">
                        {thisWeekBkgs.length} booking{thisWeekBkgs.length !== 1 ? "s" : ""}
                    </p>
                </div>

                {/* Month revenue */}
                <div className="bg-surface border border-surface-3 rounded-2xl px-6 py-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center">
                            <BarChart3 className="w-5 h-5 text-gold" />
                        </div>
                        {monthTrend !== null && (
                            <span className={`flex items-center gap-1 text-[10px] font-stats px-2 py-1 rounded-full ${
                                monthTrend >= 0
                                    ? "bg-emerald-500/10 text-emerald-400"
                                    : "bg-red-500/10 text-red-400"
                            }`}>
                                {monthTrend >= 0
                                    ? <TrendingUp className="w-3 h-3" />
                                    : <TrendingDown className="w-3 h-3" />
                                }
                                {Math.abs(monthTrend)}%
                            </span>
                        )}
                    </div>
                    <p className="font-heading text-3xl font-light" style={{ color: "#C9A84C" }}>
                        €{Math.round(monthRevenue).toLocaleString()}
                    </p>
                    <p className="text-[11px] font-stats uppercase tracking-[0.15em] text-muted mt-1">This Month</p>
                    <p className="text-muted text-xs font-stats mt-0.5">
                        {thisMonthBkgs.length} booking{thisMonthBkgs.length !== 1 ? "s" : ""}
                    </p>
                </div>

                {/* Active rentals */}
                <Link href="/moderator/bookings" className="group bg-surface border border-surface-3 hover:border-emerald-400/30 rounded-2xl px-6 py-5 transition-all cursor-pointer">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <Car className="w-5 h-5 text-emerald-400" />
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted group-hover:text-emerald-400 transition-colors" />
                    </div>
                    <p className="font-heading text-3xl font-light text-white-soft">{byStatus.ACTIVE}</p>
                    <p className="text-[11px] font-stats uppercase tracking-[0.15em] text-muted mt-1">Active Rentals</p>
                    <p className="text-muted text-xs font-stats mt-0.5">Cars out right now</p>
                </Link>

                {/* Fleet size */}
                <Link href="/moderator/fleet" className="group bg-surface border border-surface-3 hover:border-blue-400/30 rounded-2xl px-6 py-5 transition-all cursor-pointer">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Car className="w-5 h-5 text-blue-400" />
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted group-hover:text-blue-400 transition-colors" />
                    </div>
                    <p className="font-heading text-3xl font-light text-white-soft">{fleetCount}</p>
                    <p className="text-[11px] font-stats uppercase tracking-[0.15em] text-muted mt-1">Active Fleet</p>
                    <p className="text-muted text-xs font-stats mt-0.5">Live listings</p>
                </Link>

            </div>

            {/* ── Booking Pipeline ─────────────────────────── */}
            <div>
                <h2 className="font-heading text-lg text-white-soft font-light mb-4">Booking Pipeline</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: "Pending",   val: byStatus.PENDING,   col: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20",   hover: "hover:border-amber-500/40"   },
                        { label: "Confirmed", val: byStatus.CONFIRMED, col: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/20",    hover: "hover:border-blue-500/40"    },
                        { label: "Active",    val: byStatus.ACTIVE,    col: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", hover: "hover:border-emerald-500/40" },
                        { label: "Completed", val: byStatus.COMPLETED, col: "text-gold",        bg: "bg-gold/10",        border: "border-gold/20",        hover: "hover:border-gold/40"        },
                    ].map(({ label, val, col, bg, border, hover }) => (
                        <Link
                            key={label}
                            href={`/moderator/bookings`}
                            className={`group flex flex-col items-center justify-center gap-2 rounded-xl px-4 py-5 border ${bg} ${border} ${hover} transition-all cursor-pointer`}
                        >
                            <p className={`font-heading text-4xl font-light ${col}`}>{val}</p>
                            <p className="text-[11px] font-stats uppercase tracking-[0.15em] text-muted">{label}</p>
                        </Link>
                    ))}
                </div>
            </div>

            {/* ── Recent bookings + Quick actions ──────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Recent bookings */}
                <div className="bg-surface border border-surface-3 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-surface-3 flex items-center justify-between">
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
                            <div className="px-6 py-10 flex flex-col items-center gap-3 text-center">
                                <CheckCircle className="w-10 h-10 text-gold/30" />
                                <p className="text-muted text-sm font-stats">No bookings yet</p>
                                <p className="text-muted-2 text-xs font-stats">Add cars to your fleet to start receiving bookings</p>
                            </div>
                        )}
                    </div>
                    <div className="px-6 py-3 border-t border-surface-3">
                        <Link href="/moderator/bookings" className="text-gold text-xs font-stats hover:underline cursor-pointer">
                            View all bookings →
                        </Link>
                    </div>
                </div>

                {/* Quick actions */}
                <div className="flex flex-col gap-3">
                    <h2 className="font-heading text-lg text-white-soft font-light">Quick Actions</h2>

                    <Link
                        href="/moderator/fleet/new"
                        className="group flex items-center gap-4 bg-surface border border-surface-3 hover:border-gold/30 hover:bg-surface-2 rounded-xl px-5 py-4 transition-all cursor-pointer"
                    >
                        <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                            <Plus className="w-5 h-5 text-gold" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white-soft text-sm font-stats font-semibold group-hover:text-gold transition-colors">
                                Add New Car
                            </p>
                            <p className="text-muted text-xs font-stats mt-0.5">Submit vehicle for admin approval</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted group-hover:text-gold transition-colors shrink-0" />
                    </Link>

                    <Link
                        href="/moderator/bookings"
                        className="group flex items-center gap-4 bg-surface border border-surface-3 hover:border-emerald-400/30 hover:bg-surface-2 rounded-xl px-5 py-4 transition-all cursor-pointer"
                    >
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <Calendar className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white-soft text-sm font-stats font-semibold group-hover:text-emerald-400 transition-colors">
                                Manage Bookings
                            </p>
                            <p className="text-muted text-xs font-stats mt-0.5">
                                Confirm, activate and complete rentals
                            </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted group-hover:text-emerald-400 transition-colors shrink-0" />
                    </Link>

                    <Link
                        href="/moderator/penalties"
                        className="group flex items-center gap-4 bg-surface border border-surface-3 hover:border-red-400/30 hover:bg-surface-2 rounded-xl px-5 py-4 transition-all cursor-pointer"
                    >
                        <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                            <Gavel className="w-5 h-5 text-red-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white-soft text-sm font-stats font-semibold group-hover:text-red-400 transition-colors">
                                Issue Penalty
                            </p>
                            <p className="text-muted text-xs font-stats mt-0.5">Fine a customer for damages or violations</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted group-hover:text-red-400 transition-colors shrink-0" />
                    </Link>

                    <Link
                        href="/moderator/users"
                        className="group flex items-center gap-4 bg-surface border border-surface-3 hover:border-blue-400/30 hover:bg-surface-2 rounded-xl px-5 py-4 transition-all cursor-pointer"
                    >
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                            <Users className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white-soft text-sm font-stats font-semibold group-hover:text-blue-400 transition-colors">
                                View Customers
                            </p>
                            <p className="text-muted text-xs font-stats mt-0.5">
                                {totalCustomers} customer{totalCustomers !== 1 ? "s" : ""} have booked from you
                            </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted group-hover:text-blue-400 transition-colors shrink-0" />
                    </Link>
                </div>

            </div>

            {/* ── All-time summary ─────────────────────────── */}
            <div className="grid grid-cols-3 gap-4 bg-surface border border-surface-3 rounded-2xl px-6 py-5">
                <div className="text-center">
                    <p className="font-heading text-2xl font-light text-white-soft">
                        {allBookings.length}
                    </p>
                    <p className="text-[11px] font-stats uppercase tracking-[0.15em] text-muted mt-1">Total Bookings</p>
                </div>
                <div className="text-center border-x border-surface-3">
                    <p className="font-heading text-2xl font-light" style={{ color: "#C9A84C" }}>
                        €{Math.round(totalRevenue).toLocaleString()}
                    </p>
                    <p className="text-[11px] font-stats uppercase tracking-[0.15em] text-muted mt-1">All-Time Revenue</p>
                </div>
                <div className="text-center">
                    <p className="font-heading text-2xl font-light text-white-soft">{totalCustomers}</p>
                    <p className="text-[11px] font-stats uppercase tracking-[0.15em] text-muted mt-1">Total Customers</p>
                </div>
            </div>

        </div>
    )
}
