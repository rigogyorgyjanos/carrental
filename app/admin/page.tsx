import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
    Building2, ShieldCheck, Car, TrendingUp,
    Clock, Star, Gavel, ArrowRight, CheckCircle,
    AlertTriangle, Plus, Activity,
    type LucideIcon,
} from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminDashboard() {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") redirect("/")

    const now      = new Date()
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())

    const [
        totalCompanies,
        totalModerators,
        pendingCarsCount,
        pendingReviewCount,
        unpaidPenaltiesCount,
        revenueAgg,
        monthRevenueAgg,
        activeRentalsCount,
        recentPendingCars,
        recentCompanies,
    ] = await Promise.all([
        prisma.company.count(),
        prisma.user.count({ where: { role: "MODERATOR" } }),
        prisma.product.count({ where: { approvalStatus: "PENDING" } }),
        prisma.review.count({ where: { approved: false } }),
        prisma.penalty.count({ where: { status: "UNPAID" } }),
        prisma.transaction.aggregate({
            where: { status: { in: ["COMPLETED", "ACTIVE"] } },
            _sum:  { totalPrice: true },
        }),
        prisma.transaction.aggregate({
            where: { status: { in: ["COMPLETED", "ACTIVE"] }, createdAt: { gte: monthAgo } },
            _sum:  { totalPrice: true },
        }),
        prisma.transaction.count({ where: { status: "ACTIVE" } }),
        prisma.product.findMany({
            where:   { approvalStatus: "PENDING" },
            take:    5,
            orderBy: { createdAt: "desc" },
            include: {
                company: { select: { id: true, name: true } },
                images:  { take: 1 },
            },
        }),
        prisma.company.findMany({
            take:    5,
            orderBy: { createdAt: "desc" },
            include: { _count: { select: { users: true, products: true } } },
        }),
    ])

    const totalRevenue  = revenueAgg._sum.totalPrice  ?? 0
    const monthRevenue  = monthRevenueAgg._sum.totalPrice ?? 0
    const totalAttention = pendingCarsCount + pendingReviewCount + unpaidPenaltiesCount

    // Attention items — each has baked-in Tailwind classes (no dynamic construction)
    const attentionItems = [
        pendingCarsCount > 0 ? {
            count: pendingCarsCount,
            label: "Car Approval",
            href:  "/admin/pending",
            Icon:  Clock,
            wrap:  "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 hover:border-amber-500/50",
            iconBg: "bg-amber-500/20",
            text:  "text-amber-400",
            arrow: "text-amber-400/50 group-hover:text-amber-400",
        } : null,
        pendingReviewCount > 0 ? {
            count: pendingReviewCount,
            label: "Review",
            href:  "/admin/reviews",
            Icon:  Star,
            wrap:  "bg-violet-500/10 hover:bg-violet-500/20 border-violet-500/30 hover:border-violet-500/50",
            iconBg: "bg-violet-500/20",
            text:  "text-violet-400",
            arrow: "text-violet-400/50 group-hover:text-violet-400",
        } : null,
        unpaidPenaltiesCount > 0 ? {
            count: unpaidPenaltiesCount,
            label: "Unpaid Fine",
            href:  "/admin/penalties",
            Icon:  Gavel,
            wrap:  "bg-red-500/10 hover:bg-red-500/15 border-red-500/25 hover:border-red-500/50",
            iconBg: "bg-red-500/15",
            text:  "text-red-400",
            arrow: "text-red-400/50 group-hover:text-red-400",
        } : null,
    ].filter(Boolean) as { count: number; label: string; href: string; Icon: LucideIcon; wrap: string; iconBg: string; text: string; arrow: string }[]

    return (
        <div className="space-y-8">

            {/* ── Header ───────────────────────────────────── */}
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <p className="text-gold text-[11px] font-stats uppercase tracking-[0.2em] mb-1">AURUM Platform</p>
                    <h1 className="font-heading text-4xl font-light text-white-soft">Admin Dashboard</h1>
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

            {/* ── Attention banner ─────────────────────────── */}
            {attentionItems.length > 0 && (
                <div className={`grid gap-3 ${attentionItems.length === 1 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : attentionItems.length === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-3"}`}>
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

                <Link href="/admin/companies" className="group bg-surface border border-surface-3 hover:border-gold/30 rounded-2xl px-6 py-5 transition-all cursor-pointer">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-gold" />
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted group-hover:text-gold transition-colors" />
                    </div>
                    <p className="font-heading text-3xl font-light text-white-soft">{totalCompanies}</p>
                    <p className="text-[11px] font-stats uppercase tracking-[0.15em] text-muted mt-1">Companies</p>
                    <p className="text-muted text-xs font-stats mt-0.5">Registered on platform</p>
                </Link>

                <Link href="/admin/users" className="group bg-surface border border-surface-3 hover:border-blue-400/30 rounded-2xl px-6 py-5 transition-all cursor-pointer">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <ShieldCheck className="w-5 h-5 text-blue-400" />
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted group-hover:text-blue-400 transition-colors" />
                    </div>
                    <p className="font-heading text-3xl font-light text-white-soft">{totalModerators}</p>
                    <p className="text-[11px] font-stats uppercase tracking-[0.15em] text-muted mt-1">Moderators</p>
                    <p className="text-muted text-xs font-stats mt-0.5">Active fleet managers</p>
                </Link>

                <Link href="/admin/transactions?filter=ACTIVE" className="group bg-surface border border-surface-3 hover:border-emerald-400/30 rounded-2xl px-6 py-5 transition-all cursor-pointer">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <Car className="w-5 h-5 text-emerald-400" />
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted group-hover:text-emerald-400 transition-colors" />
                    </div>
                    <p className="font-heading text-3xl font-light text-white-soft">{activeRentalsCount}</p>
                    <p className="text-[11px] font-stats uppercase tracking-[0.15em] text-muted mt-1">Active Rentals</p>
                    <p className="text-muted text-xs font-stats mt-0.5">Cars out right now</p>
                </Link>

                <div className="bg-surface border border-surface-3 rounded-2xl px-6 py-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-gold" />
                        </div>
                    </div>
                    <p className="font-heading text-3xl font-light" style={{ color: "#C9A84C" }}>
                        €{Math.round(totalRevenue).toLocaleString()}
                    </p>
                    <p className="text-[11px] font-stats uppercase tracking-[0.15em] text-muted mt-1">Platform Revenue</p>
                    <p className="text-muted text-xs font-stats mt-0.5">€{Math.round(monthRevenue).toLocaleString()} this month</p>
                </div>

            </div>

            {/* ── Quick Actions ────────────────────────────── */}
            <div>
                <h2 className="font-heading text-lg text-white-soft font-light mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

                    <Link href="/admin/companies" className="group flex flex-col gap-3 bg-surface border border-surface-3 hover:border-gold/30 hover:bg-surface-2 rounded-xl px-5 py-4 transition-all cursor-pointer">
                        <div className="w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center">
                            <Plus className="w-5 h-5 text-gold" />
                        </div>
                        <div>
                            <p className="text-sm font-stats font-semibold text-gold">Add Company</p>
                            <p className="text-muted text-xs font-stats mt-0.5">Register new rental company</p>
                        </div>
                    </Link>

                    <Link href="/admin/pending" className="group flex flex-col gap-3 bg-surface border border-surface-3 hover:border-amber-400/30 hover:bg-surface-2 rounded-xl px-5 py-4 transition-all cursor-pointer">
                        <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <p className="text-sm font-stats font-semibold text-amber-400">Car Approvals</p>
                            <p className="text-muted text-xs font-stats mt-0.5">
                                {pendingCarsCount > 0 ? `${pendingCarsCount} pending review` : "All up to date"}
                            </p>
                        </div>
                    </Link>

                    <Link href="/admin/transactions" className="group flex flex-col gap-3 bg-surface border border-surface-3 hover:border-emerald-400/30 hover:bg-surface-2 rounded-xl px-5 py-4 transition-all cursor-pointer">
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <Car className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm font-stats font-semibold text-emerald-400">All Bookings</p>
                            <p className="text-muted text-xs font-stats mt-0.5">{activeRentalsCount} active rentals</p>
                        </div>
                    </Link>

                    <Link href="/admin/logs" className="group flex flex-col gap-3 bg-surface border border-surface-3 hover:border-blue-400/30 hover:bg-surface-2 rounded-xl px-5 py-4 transition-all cursor-pointer">
                        <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Activity className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm font-stats font-semibold text-blue-400">Audit Log</p>
                            <p className="text-muted text-xs font-stats mt-0.5">Track all system activity</p>
                        </div>
                    </Link>

                </div>
            </div>

            {/* ── Pending cars + Recent companies ──────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Pending car approvals */}
                <div className="bg-surface border border-surface-3 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-surface-3 flex items-center justify-between gap-4">
                        <h2 className="font-heading text-lg text-white-soft font-light">Pending Approvals</h2>
                        {pendingCarsCount > 0 ? (
                            <span className="text-[10px] font-stats px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
                                {pendingCarsCount} waiting
                            </span>
                        ) : (
                            <span className="text-[10px] font-stats px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shrink-0">
                                All clear
                            </span>
                        )}
                    </div>
                    <div className="divide-y divide-surface-3">
                        {recentPendingCars.map(car => (
                            <div key={car.id} className="flex items-center gap-4 px-6 py-4">
                                <div className="w-14 h-10 rounded-lg bg-surface-2 overflow-hidden shrink-0">
                                    {car.images[0] ? (
                                        <Image
                                            src={car.images[0].url}
                                            alt={`${car.brand} ${car.name}`}
                                            width={56} height={40}
                                            className="object-cover w-full h-full"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Car className="w-4 h-4 text-muted" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white-soft text-sm font-stats font-semibold truncate">
                                        {car.brand} {car.name}
                                    </p>
                                    <p className="text-muted text-[11px] font-stats truncate">
                                        {car.company?.name ?? "No company"} · €{car.pricePerDay}/day
                                    </p>
                                </div>
                                <span className="text-muted text-xs font-stats shrink-0">
                                    {new Date(car.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                                </span>
                            </div>
                        ))}
                        {recentPendingCars.length === 0 && (
                            <div className="px-6 py-12 flex flex-col items-center gap-3 text-center">
                                <CheckCircle className="w-10 h-10 text-emerald-400/40" />
                                <p className="text-white-soft text-sm font-stats">No pending car approvals</p>
                                <p className="text-muted text-xs font-stats">All fleet submissions have been reviewed</p>
                            </div>
                        )}
                    </div>
                    <div className="px-6 py-3 border-t border-surface-3">
                        <Link href="/admin/pending" className="text-gold text-xs font-stats hover:underline cursor-pointer">
                            Review all car approvals →
                        </Link>
                    </div>
                </div>

                {/* Recent companies */}
                <div className="bg-surface border border-surface-3 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-surface-3 flex items-center justify-between gap-4">
                        <h2 className="font-heading text-lg text-white-soft font-light">Recent Companies</h2>
                        <Link
                            href="/admin/companies"
                            className="flex items-center gap-1.5 text-xs font-stats px-3 py-1.5 rounded-lg bg-gold/10 text-gold hover:bg-gold/20 transition-all border border-gold/25 cursor-pointer shrink-0"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Add Company
                        </Link>
                    </div>
                    <div className="divide-y divide-surface-3">
                        {recentCompanies.map(company => (
                            <Link
                                key={company.id}
                                href={`/admin/companies/${company.id}`}
                                className="group flex items-center gap-4 px-6 py-4 hover:bg-surface-2 transition-colors cursor-pointer"
                            >
                                <div className="w-9 h-9 rounded-lg bg-gold/8 group-hover:bg-gold/15 flex items-center justify-center shrink-0 transition-colors">
                                    <Building2 className="w-4 h-4 text-gold" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white-soft text-sm font-stats font-semibold truncate group-hover:text-gold transition-colors">
                                        {company.name}
                                    </p>
                                    <p className="text-muted text-[11px] font-stats">
                                        {company._count.users} moderator{company._count.users !== 1 ? "s" : ""}
                                        {" · "}
                                        {company._count.products} car{company._count.products !== 1 ? "s" : ""}
                                    </p>
                                </div>
                                <span className="text-muted text-xs font-stats shrink-0">
                                    {new Date(company.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                                </span>
                            </Link>
                        ))}
                        {recentCompanies.length === 0 && (
                            <div className="px-6 py-12 text-center">
                                <p className="text-muted text-sm font-stats">No companies registered yet</p>
                            </div>
                        )}
                    </div>
                    <div className="px-6 py-3 border-t border-surface-3">
                        <Link href="/admin/companies" className="text-gold text-xs font-stats hover:underline cursor-pointer">
                            Manage all companies →
                        </Link>
                    </div>
                </div>

            </div>

        </div>
    )
}
