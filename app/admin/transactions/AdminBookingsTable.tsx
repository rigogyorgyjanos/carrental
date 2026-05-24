"use client"

import { useState } from "react"
import Link from "next/link"

interface BookingRow {
    id:              string
    userName:        string
    userEmail:       string
    productName:     string
    productId:       string
    category:        string
    startDate:       string
    endDate:         string
    totalDays:       number
    pricePerDay:     number
    totalPrice:      number
    deposit:         number | null
    discountApplied: number | null
    xpAwarded:       number | null
    status:          string
    notes:           string | null
    createdAt:       string
    paymentIntentId: string | null
    startMileage:     number | null
    endMileage:       number | null
    excessKmCharge:   number | null
    dailyKmLimit:     number | null
    excessKmFee:      number | null
    extraKmPurchased: number
}

const STATUS_CONFIG: Record<string, {
    label:   string
    classes: string
    next:    { label: string; status: string; color: string }[]
}> = {
    PENDING: {
        label:   "Pending",
        classes: "bg-amber-500/15 text-amber-400 border-amber-500/30",
        next: [
            { label: "Confirm",  status: "CONFIRMED", color: "blue"   },
            { label: "Cancel",   status: "CANCELLED", color: "danger" },
        ],
    },
    CONFIRMED: {
        label:   "Confirmed",
        classes: "bg-blue-500/15 text-blue-400 border-blue-500/30",
        next: [
            { label: "Activate", status: "ACTIVE",    color: "green"  },
            { label: "Cancel",   status: "CANCELLED", color: "danger" },
        ],
    },
    ACTIVE: {
        label:   "Active",
        classes: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
        next: [
            { label: "Complete", status: "COMPLETED", color: "gold"   },
        ],
    },
    COMPLETED: {
        label:   "Completed",
        classes: "bg-gold/15 text-gold border-gold/30",
        next: [],
    },
    CANCELLED: {
        label:   "Cancelled",
        classes: "bg-surface-3 text-muted border-surface-3",
        next: [],
    },
}

const BTN_COLOR: Record<string, string> = {
    blue:   "border-blue-500/30 text-blue-400 hover:bg-blue-500/10",
    green:  "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10",
    gold:   "border-gold/30 text-gold hover:bg-gold/10",
    danger: "border-danger/30 text-danger/80 hover:bg-danger/10",
}

const FILTER_OPTIONS = ["ALL", "PENDING", "CONFIRMED", "ACTIVE", "COMPLETED", "CANCELLED"]

export default function AdminBookingsTable({ initialBookings }: { initialBookings: BookingRow[] }) {
    const [bookings,      setBookings]      = useState(initialBookings)
    const [filter,        setFilter]        = useState("ALL")
    const [loading,       setLoading]       = useState<string | null>(null)
    const [errorMsg,      setErrorMsg]      = useState("")
    const [mileageInput,  setMileageInput]  = useState<Record<string, string>>({})  // bookingId → km value
    const [mileagePrompt, setMileagePrompt] = useState<Record<string, "activate" | "complete" | null>>({})

    const filtered = filter === "ALL"
        ? bookings
        : bookings.filter(b => b.status === filter)

    const pendingCount   = bookings.filter(b => b.status === "PENDING").length
    const confirmedCount = bookings.filter(b => b.status === "CONFIRMED").length
    const activeCount    = bookings.filter(b => b.status === "ACTIVE").length

    const refund = async (bookingId: string) => {
        setLoading(bookingId + "REFUND")
        setErrorMsg("")
        try {
            const res = await fetch(`/api/admin/transactions/${bookingId}/refund`, { method: "POST" })
            if (res.ok) {
                setBookings(prev => prev.map(b =>
                    b.id === bookingId ? { ...b, status: "CANCELLED" } : b
                ))
            } else {
                const data = await res.json().catch(() => ({}))
                setErrorMsg(data.error ?? "Refund failed.")
            }
        } catch {
            setErrorMsg("Network error. Please try again.")
        } finally {
            setLoading(null)
        }
    }

    const transition = async (bookingId: string, newStatus: string, km?: number) => {
        setLoading(bookingId + newStatus)
        setErrorMsg("")

        // If km limit is on this car, record mileage via PUT before status PATCH
        const booking = bookings.find(b => b.id === bookingId)
        if (km != null && booking) {
            const mileageField = newStatus === "ACTIVE" ? "startMileage" : "endMileage"
            await fetch(`/api/admin/transactions/${bookingId}`, {
                method:  "PUT",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ [mileageField]: km }),
            }).catch(() => {})
        }

        try {
            const res = await fetch(`/api/admin/transactions/${bookingId}`, {
                method:  "PATCH",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ status: newStatus }),
            })
            if (res.ok) {
                const result = await res.json().catch(() => ({}))
                setBookings(prev => prev.map(b => {
                    if (b.id !== bookingId) return b
                    return {
                        ...b,
                        status:         newStatus,
                        startMileage:   newStatus === "ACTIVE"     && km != null ? km : b.startMileage,
                        endMileage:     newStatus === "COMPLETED"  && km != null ? km : b.endMileage,
                        excessKmCharge: result.excessKmCharge ?? b.excessKmCharge,
                        xpAwarded:      result.xpAwarded      ?? b.xpAwarded,
                    }
                }))
                setMileagePrompt(prev => ({ ...prev, [bookingId]: null }))
                setMileageInput(prev => { const n = { ...prev }; delete n[bookingId]; return n })
            } else {
                const data = await res.json().catch(() => ({}))
                setErrorMsg(data.error ?? "Status update failed.")
            }
        } catch {
            setErrorMsg("Network error. Please try again.")
        } finally {
            setLoading(null)
        }
    }

    return (
        <div className="space-y-5">

            {/* Summary chips */}
            <div className="flex flex-wrap gap-2 text-xs font-stats">
                {pendingCount > 0 && (
                    <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full">
                        {pendingCount} pending
                    </span>
                )}
                {confirmedCount > 0 && (
                    <span className="bg-blue-500/15 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full">
                        {confirmedCount} confirmed
                    </span>
                )}
                {activeCount > 0 && (
                    <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full">
                        {activeCount} active
                    </span>
                )}
            </div>

            {/* Filter tabs */}
            <div className="flex flex-wrap gap-1">
                {FILTER_OPTIONS.map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-stats transition-colors ${
                            filter === f
                                ? "bg-gold/15 text-gold"
                                : "bg-surface border border-surface-3 text-muted hover:text-white-soft hover:border-gold/20"
                        }`}
                    >
                        {f === "ALL" ? `All (${bookings.length})` : f.charAt(0) + f.slice(1).toLowerCase()}
                    </button>
                ))}
            </div>

            {/* Error */}
            {errorMsg && (
                <p className="text-danger text-xs font-stats bg-danger/8 border border-danger/20 rounded-xl px-4 py-2">
                    {errorMsg}
                </p>
            )}

            {/* Bookings list */}
            {filtered.length === 0 ? (
                <div className="bg-surface border border-surface-3 rounded-2xl px-6 py-12 text-center">
                    <p className="text-muted text-4xl mb-3">◎</p>
                    <p className="text-muted text-sm font-stats">No bookings match this filter.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(b => {
                        const cfg    = STATUS_CONFIG[b.status] ?? STATUS_CONFIG.CANCELLED
                        const start  = new Date(b.startDate)
                        const end    = new Date(b.endDate)
                        const fmt    = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })

                        return (
                            <div
                                key={b.id}
                                className="bg-surface border border-surface-3 rounded-2xl p-5 hover:border-surface-2 transition-colors"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">

                                    {/* Left: info */}
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-heading text-lg text-white-soft font-light leading-none">
                                                {b.productName}
                                            </h3>
                                            <span className={`text-[10px] font-stats px-2.5 py-1 rounded-full border ${cfg.classes}`}>
                                                {cfg.label}
                                            </span>
                                        </div>

                                        <p className="text-muted text-xs font-stats">{b.category}</p>

                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-stats text-muted pt-1">
                                            <span>👤 {b.userName}</span>
                                            <span>📅 {fmt(start)} → {fmt(end)} ({b.totalDays}d)</span>
                                        </div>

                                        {b.notes && (
                                            <p className="text-muted-2 text-[11px] font-stats bg-surface-2 border border-surface-3 rounded-lg px-3 py-1.5 mt-1">
                                                Note: {b.notes}
                                            </p>
                                        )}
                                    </div>

                                    {/* Right: pricing + actions */}
                                    <div className="flex flex-col items-end gap-3 shrink-0">
                                        <div className="text-right">
                                            <p className="text-gold font-stats font-bold text-xl leading-none">
                                                €{b.totalPrice.toFixed(0)}
                                            </p>
                                            <p className="text-muted text-[11px] font-stats mt-0.5">
                                                €{b.pricePerDay}/day
                                                {b.discountApplied ? (
                                                    <span className="ml-1 text-emerald-400">
                                                        −{(b.discountApplied * 100).toFixed(0)}%
                                                    </span>
                                                ) : null}
                                            </p>
                                        </div>

                                        {b.xpAwarded && b.xpAwarded > 0 && (
                                            <span className="text-[10px] font-stats text-gold/80 bg-gold/8 border border-gold/15 px-2 py-0.5 rounded-full">
                                                ◆ {b.xpAwarded} XP
                                            </span>
                                        )}

                                        {/* Action buttons */}
                                        <div className="flex flex-col gap-2 items-end">

                                        {/* Mileage inline input — shown when prompted */}
                                        {mileagePrompt[b.id] && (
                                            <div className="flex items-center gap-2 bg-surface-2 border border-gold/20 rounded-xl px-3 py-2">
                                                <span className="text-[10px] font-stats text-muted uppercase tracking-wider whitespace-nowrap">
                                                    {mileagePrompt[b.id] === "activate" ? "Start km" : "End km"}
                                                </span>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    value={mileageInput[b.id] ?? ""}
                                                    onChange={e => setMileageInput(prev => ({ ...prev, [b.id]: e.target.value }))}
                                                    placeholder="e.g. 24500"
                                                    className="w-28 bg-dark border border-surface-3 rounded-lg px-2 py-1 text-xs font-stats text-white-soft placeholder:text-muted focus:outline-none focus:border-gold/40"
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={() => {
                                                        const km = mileageInput[b.id] ? Number(mileageInput[b.id]) : undefined
                                                        const status = mileagePrompt[b.id] === "activate" ? "ACTIVE" : "COMPLETED"
                                                        transition(b.id, status, km)
                                                    }}
                                                    disabled={loading === b.id + (mileagePrompt[b.id] === "activate" ? "ACTIVE" : "COMPLETED")}
                                                    className="text-[11px] font-stats px-3 py-1 rounded-lg bg-gold/15 border border-gold/30 text-gold hover:bg-gold/25 transition-colors disabled:opacity-50"
                                                >
                                                    {loading ? "…" : "Confirm"}
                                                </button>
                                                <button
                                                    onClick={() => setMileagePrompt(prev => ({ ...prev, [b.id]: null }))}
                                                    className="text-[11px] font-stats text-muted hover:text-white-soft px-1"
                                                >✕</button>
                                            </div>
                                        )}

                                        <div className="flex flex-wrap gap-1.5 justify-end">
                                            {cfg.next.map(n => {
                                                const needsMileage = b.dailyKmLimit != null &&
                                                    (n.status === "ACTIVE" || n.status === "COMPLETED")
                                                const isPrompted   = mileagePrompt[b.id] === (n.status === "ACTIVE" ? "activate" : "complete")
                                                return (
                                                    <button
                                                        key={n.status}
                                                        onClick={() => {
                                                            if (needsMileage && !isPrompted) {
                                                                setMileagePrompt(prev => ({ ...prev, [b.id]: n.status === "ACTIVE" ? "activate" : "complete" }))
                                                            } else {
                                                                transition(b.id, n.status)
                                                            }
                                                        }}
                                                        disabled={loading === b.id + n.status}
                                                        className={`text-[11px] font-stats px-3 py-1.5 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${BTN_COLOR[n.color] ?? BTN_COLOR.blue}`}
                                                    >
                                                        {loading === b.id + n.status ? "…" : n.label}
                                                    </button>
                                                )
                                            })}

                                            {/* Refund & cancel — shown for paid bookings that are not yet cancelled/completed */}
                                            {b.paymentIntentId && !["CANCELLED", "COMPLETED"].includes(b.status) && (
                                                <button
                                                    onClick={() => refund(b.id)}
                                                    disabled={loading === b.id + "REFUND"}
                                                    className="text-[11px] font-stats px-3 py-1.5 rounded-lg border border-danger/30 text-danger/80 hover:bg-danger/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {loading === b.id + "REFUND" ? "…" : "Refund & Cancel"}
                                                </button>
                                            )}

                                            <Link
                                                href={`/cars/${b.productId}`}
                                                target="_blank"
                                                className="text-[11px] font-stats px-3 py-1.5 rounded-lg border border-surface-3 text-muted hover:text-white-soft hover:border-gold/20 transition-all"
                                            >
                                                Car ↗
                                            </Link>
                                        </div>

                                        {/* Mileage summary — shown once recorded */}
                                        {(b.startMileage != null || b.endMileage != null || b.excessKmCharge != null || b.extraKmPurchased > 0) && (
                                            <div className="flex flex-wrap gap-3 text-[10px] font-stats text-muted justify-end">
                                                {b.startMileage != null && (
                                                    <span>Start: <span className="text-white-soft">{b.startMileage.toLocaleString()} km</span></span>
                                                )}
                                                {b.endMileage != null && (
                                                    <span>End: <span className="text-white-soft">{b.endMileage.toLocaleString()} km</span></span>
                                                )}
                                                {b.startMileage != null && b.endMileage != null && (
                                                    <span>Used: <span className="text-white-soft">{(b.endMileage - b.startMileage).toLocaleString()} km</span></span>
                                                )}
                                                {b.extraKmPurchased > 0 && (
                                                    <span className="text-emerald-400">
                                                        +{b.extraKmPurchased} km purchased
                                                    </span>
                                                )}
                                                {b.excessKmCharge != null && b.excessKmCharge > 0 && (
                                                    <span className="text-danger/80">
                                                        Excess: <span className="font-semibold">€{b.excessKmCharge.toFixed(2)}</span>
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
