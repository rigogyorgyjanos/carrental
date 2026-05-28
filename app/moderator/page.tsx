"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

interface Stats {
    fleet:     number
    total:     { bookings: number; revenue: number }
    thisWeek:  { bookings: number; revenue: number }
    lastWeek:  { bookings: number; revenue: number }
    thisMonth: { bookings: number; revenue: number }
    lastMonth: { bookings: number; revenue: number }
    byStatus:  { PENDING: number; CONFIRMED: number; ACTIVE: number; COMPLETED: number }
}

function StatCard({ label, value, sub, gold }: { label: string; value: string; sub?: string; gold?: boolean }) {
    return (
        <div className="bg-surface border border-surface-3 rounded-2xl px-5 py-4">
            <p className="text-muted-2 text-[10px] font-stats uppercase tracking-wider mb-2">{label}</p>
            <p className={`font-heading text-2xl font-light ${gold ? "text-gold" : "text-white-soft"}`}>{value}</p>
            {sub && <p className="text-muted text-xs font-stats mt-1">{sub}</p>}
        </div>
    )
}

function trend(current: number, prev: number) {
    if (prev === 0) return current > 0 ? "↑ new" : "—"
    const pct = Math.round(((current - prev) / prev) * 100)
    return pct >= 0 ? `↑ ${pct}% vs last week` : `↓ ${Math.abs(pct)}% vs last week`
}

export default function ModeratorDashboard() {
    const [stats,   setStats]   = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch("/api/moderator/stats")
            .then(r => r.json())
            .then(data => { setStats(data); setLoading(false) })
            .catch(() => setLoading(false))
    }, [])

    if (loading) return <div className="text-center py-16 text-muted font-stats">Loading…</div>
    if (!stats)  return <div className="text-center py-16 text-muted font-stats">Failed to load stats.</div>

    return (
        <div className="space-y-8">
            <div>
                <h1 className="font-heading text-3xl text-white-soft">Fleet Portal</h1>
                <p className="text-muted text-sm font-stats mt-1">Overview of your fleet and bookings</p>
            </div>

            {/* This week summary */}
            <div>
                <p className="text-muted-2 text-[10px] font-stats uppercase tracking-[0.2em] mb-3">This Week</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard label="Bookings"     value={String(stats.thisWeek.bookings)} sub={trend(stats.thisWeek.bookings, stats.lastWeek.bookings)} />
                    <StatCard label="Revenue"      value={`€${stats.thisWeek.revenue.toFixed(0)}`} sub={trend(stats.thisWeek.revenue, stats.lastWeek.revenue)} gold />
                    <StatCard label="Active fleet" value={String(stats.fleet)} sub="live listings" />
                    <StatCard label="Active now"   value={String(stats.byStatus.ACTIVE)} sub="cars currently rented" />
                </div>
            </div>

            {/* This month summary */}
            <div>
                <p className="text-muted-2 text-[10px] font-stats uppercase tracking-[0.2em] mb-3">This Month</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <StatCard label="Bookings"     value={String(stats.thisMonth.bookings)} sub={`vs ${stats.lastMonth.bookings} last month`} />
                    <StatCard label="Revenue"      value={`€${stats.thisMonth.revenue.toFixed(0)}`} sub={`vs €${stats.lastMonth.revenue.toFixed(0)} last month`} gold />
                    <StatCard label="All-time rev" value={`€${stats.total.revenue.toFixed(0)}`} sub={`${stats.total.bookings} total bookings`} />
                </div>
            </div>

            {/* Booking pipeline */}
            <div>
                <p className="text-muted-2 text-[10px] font-stats uppercase tracking-[0.2em] mb-3">Booking Pipeline</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: "Pending",   val: stats.byStatus.PENDING,   color: "text-amber-400"   },
                        { label: "Confirmed", val: stats.byStatus.CONFIRMED,  color: "text-blue-400"    },
                        { label: "Active",    val: stats.byStatus.ACTIVE,     color: "text-emerald-400" },
                        { label: "Completed", val: stats.byStatus.COMPLETED,  color: "text-gold"        },
                    ].map(({ label, val, color }) => (
                        <div key={label} className="bg-surface border border-surface-3 rounded-2xl px-5 py-4 text-center">
                            <p className="text-muted-2 text-[10px] font-stats uppercase tracking-wider mb-2">{label}</p>
                            <p className={`font-heading text-3xl font-light ${color}`}>{val}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link href="/moderator/fleet/new" className="flex items-center gap-4 bg-surface border border-surface-3 hover:border-gold/30 rounded-2xl px-5 py-4 transition-colors group">
                    <span className="text-2xl">🚗</span>
                    <div>
                        <p className="text-white-soft font-heading text-lg group-hover:text-gold transition-colors">Add new car</p>
                        <p className="text-muted text-xs font-stats">Submit for admin approval</p>
                    </div>
                </Link>
                <Link href="/moderator/bookings" className="flex items-center gap-4 bg-surface border border-surface-3 hover:border-gold/30 rounded-2xl px-5 py-4 transition-colors group">
                    <span className="text-2xl">📋</span>
                    <div>
                        <p className="text-white-soft font-heading text-lg group-hover:text-gold transition-colors">Manage bookings</p>
                        <p className="text-muted text-xs font-stats">Update statuses, track rentals</p>
                    </div>
                </Link>
            </div>
        </div>
    )
}
