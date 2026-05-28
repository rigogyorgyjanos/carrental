"use client"

import { useEffect, useState } from "react"

interface RecentBooking {
    id:      string
    status:  string
    carName: string
    start:   string
    end:     string
    price:   number
}

interface UserRow {
    id:              string
    name:            string | null
    email:           string
    image:           string | null
    totalBookings:   number
    activeCount:     number
    pendingCount:    number
    totalSpent:      number
    lastBookingDate: string | null
    lastCarName:     string | null
    recentBookings:  RecentBooking[]
}

const STATUS_STYLES: Record<string, string> = {
    PENDING:   "bg-amber-500/10 text-amber-400 border-amber-500/25",
    CONFIRMED: "bg-blue-500/10 text-blue-400 border-blue-500/25",
    ACTIVE:    "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
    COMPLETED: "bg-gold/10 text-gold border-gold/25",
    CANCELLED: "bg-surface-3 text-muted border-surface-3",
}

const STATUS_LABEL: Record<string, string> = {
    PENDING:   "Pending",
    CONFIRMED: "Confirmed",
    ACTIVE:    "Active",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
}

export default function ModeratorUsersPage() {
    const [users,    setUsers]    = useState<UserRow[]>([])
    const [loading,  setLoading]  = useState(true)
    const [error,    setError]    = useState<string | null>(null)
    const [search,   setSearch]   = useState("")
    const [expanded, setExpanded] = useState<string | null>(null)

    useEffect(() => {
        fetch("/api/moderator/users")
            .then(r => {
                if (!r.ok) throw new Error(`Server error ${r.status}`)
                return r.json()
            })
            .then((data: UserRow[]) => { setUsers(data); setLoading(false) })
            .catch(err => { setError(err?.message ?? "Failed to load"); setLoading(false) })
    }, [])

    const q = search.trim().toLowerCase()
    const filtered = users.filter(u => {
        if (!q) return true
        return (
            u.name?.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q)
        )
    })

    const fmtDate = (iso: string) =>
        new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-heading text-3xl text-white-soft">Customers</h1>
                    <p className="text-muted text-sm font-stats mt-1">
                        {loading ? "Loading…" : `${users.length} customer${users.length !== 1 ? "s" : ""} · booked from your fleet`}
                    </p>
                </div>
            </div>

            {/* Search */}
            <input
                type="text"
                placeholder="Search by name or email…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-dark border border-surface-3 rounded-xl px-4 py-2.5 text-sm font-stats text-white-soft placeholder:text-muted focus:outline-none focus:border-gold/40 transition-colors"
            />

            {loading ? (
                <div className="text-center py-16 text-muted font-stats">Loading…</div>
            ) : error ? (
                <div className="bg-danger/5 border border-danger/25 rounded-2xl px-6 py-10 text-center">
                    <p className="text-danger text-sm font-stats">{error}</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-surface border border-surface-3 rounded-2xl px-6 py-14 text-center">
                    <p className="text-muted text-4xl mb-4">◎</p>
                    <p className="text-white-soft font-heading text-xl">No customers found</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(u => {
                        const isOpen = expanded === u.id
                        return (
                            <div key={u.id} className="bg-surface border border-surface-3 rounded-2xl overflow-hidden">

                                {/* Collapsed row */}
                                <button
                                    onClick={() => setExpanded(isOpen ? null : u.id)}
                                    className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-surface-2 transition-colors"
                                >
                                    {/* Avatar */}
                                    <div className="shrink-0">
                                        {u.image ? (
                                            <img src={u.image} alt="" className="w-10 h-10 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-surface-3 flex items-center justify-center text-muted text-sm font-stats font-semibold">
                                                {(u.name ?? u.email)[0].toUpperCase()}
                                            </div>
                                        )}
                                    </div>

                                    {/* Name + email */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white-soft font-stats font-semibold text-sm truncate">
                                            {u.name ?? "—"}
                                        </p>
                                        <p className="text-muted text-xs font-stats truncate">{u.email}</p>
                                    </div>

                                    {/* Stats */}
                                    <div className="hidden sm:flex items-center gap-5 shrink-0 text-xs font-stats">
                                        <div className="text-center">
                                            <p className="text-white-soft font-semibold">{u.totalBookings}</p>
                                            <p className="text-muted text-[10px] uppercase tracking-wider">Bookings</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-gold font-semibold">€{u.totalSpent.toFixed(0)}</p>
                                            <p className="text-muted text-[10px] uppercase tracking-wider">Spent</p>
                                        </div>
                                        {u.activeCount > 0 && (
                                            <span className="px-2 py-0.5 rounded-full border text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/25">
                                                {u.activeCount} active
                                            </span>
                                        )}
                                        {u.pendingCount > 0 && (
                                            <span className="px-2 py-0.5 rounded-full border text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/25">
                                                {u.pendingCount} pending
                                            </span>
                                        )}
                                    </div>

                                    <span className="text-muted text-sm shrink-0">{isOpen ? "▲" : "▼"}</span>
                                </button>

                                {/* Expanded */}
                                {isOpen && (
                                    <div className="border-t border-surface-3 px-5 py-4 space-y-4">

                                        {/* Stats row */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-stats">
                                            <div className="bg-surface-2 border border-surface-3 rounded-xl px-3 py-2">
                                                <p className="text-muted text-[10px] uppercase tracking-wider mb-0.5">Total bookings</p>
                                                <p className="text-white-soft font-semibold">{u.totalBookings}</p>
                                            </div>
                                            <div className="bg-surface-2 border border-surface-3 rounded-xl px-3 py-2">
                                                <p className="text-muted text-[10px] uppercase tracking-wider mb-0.5">Total spent</p>
                                                <p className="text-gold font-semibold">€{u.totalSpent.toFixed(0)}</p>
                                            </div>
                                            <div className="bg-surface-2 border border-surface-3 rounded-xl px-3 py-2">
                                                <p className="text-muted text-[10px] uppercase tracking-wider mb-0.5">Active now</p>
                                                <p className={u.activeCount > 0 ? "text-emerald-400 font-semibold" : "text-muted font-semibold"}>{u.activeCount}</p>
                                            </div>
                                            <div className="bg-surface-2 border border-surface-3 rounded-xl px-3 py-2">
                                                <p className="text-muted text-[10px] uppercase tracking-wider mb-0.5">Last booking</p>
                                                <p className="text-white-soft font-semibold">
                                                    {u.lastBookingDate ? fmtDate(u.lastBookingDate) : "—"}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Recent bookings */}
                                        {u.recentBookings.length > 0 && (
                                            <div className="space-y-2">
                                                <p className="text-[11px] font-stats text-muted uppercase tracking-wider">Recent bookings</p>
                                                {u.recentBookings.map(b => (
                                                    <div key={b.id} className="flex items-center gap-3 bg-surface-2 border border-surface-3 rounded-xl px-4 py-2.5">
                                                        <span className={`text-[10px] font-stats px-2 py-0.5 rounded-full border shrink-0 ${STATUS_STYLES[b.status] ?? STATUS_STYLES.CANCELLED}`}>
                                                            {STATUS_LABEL[b.status] ?? b.status}
                                                        </span>
                                                        <span className="text-white-soft text-xs font-stats font-semibold flex-1 truncate">{b.carName}</span>
                                                        <span className="text-muted text-xs font-stats whitespace-nowrap shrink-0">
                                                            {fmtDate(b.start)} → {fmtDate(b.end)}
                                                        </span>
                                                        <span className="text-gold text-xs font-stats font-semibold shrink-0">
                                                            €{b.price.toFixed(0)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <p className="text-muted/40 text-[10px] font-stats">User ID: {u.id}</p>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
