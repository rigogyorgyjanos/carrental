"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface KmPurchaseRow {
    kmAmount:  number
    pricePaid: number
    createdAt: string
}

interface BookingRow {
    id:               string
    productName:      string
    productBrand:     string
    productCategory:  string
    productId:        string
    startDate:        string
    endDate:          string
    totalDays:        number
    pricePerDay:      number
    totalPrice:       number
    deposit:          number | null
    discountApplied:  number | null
    xpAwarded:        number | null
    status:           string
    createdAt:        string
    dailyKmLimit:     number | null
    excessKmFee:      number | null
    extraKmPurchased: number
    startMileage:     number | null
    endMileage:       number | null
    kmPurchases:      KmPurchaseRow[]
}

interface StatusStyle {
    label:   string
    classes: string
}

interface Props {
    transactions: BookingRow[]
    statusStyles: Record<string, StatusStyle>
}

const CANCELLABLE = new Set(["PENDING", "CONFIRMED"])
const KM_PACKAGES = [50, 100, 200] as const
const DISCOUNT    = 0.70

function KmDetailsSection({ tx }: { tx: BookingRow }) {
    if (!tx.dailyKmLimit) return null

    const baseKm        = tx.dailyKmLimit * tx.totalDays
    const totalAllowed  = baseKm + tx.extraKmPurchased
    const returnTarget  = tx.startMileage != null ? tx.startMileage + totalAllowed : null
    const isCompleted   = tx.status === "COMPLETED"

    return (
        <div className="mt-3 border-t border-surface-3 pt-3 space-y-2.5">

            {/* Odometer row */}
            {(tx.startMileage != null || tx.endMileage != null) && (
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs font-stats">
                    {tx.startMileage != null && (
                        <span className="text-muted">
                            🔑 Picked up at:{" "}
                            <span className="text-white-soft font-semibold">
                                {tx.startMileage.toLocaleString()} km
                            </span>
                        </span>
                    )}
                    {isCompleted && tx.endMileage != null ? (
                        <span className="text-muted">
                            🏁 Returned at:{" "}
                            <span className="text-white-soft font-semibold">
                                {tx.endMileage.toLocaleString()} km
                            </span>
                        </span>
                    ) : returnTarget != null ? (
                        <span className="text-muted">
                            📍 Return by:{" "}
                            <span className="text-white-soft font-semibold">
                                {returnTarget.toLocaleString()} km
                            </span>
                        </span>
                    ) : null}
                </div>
            )}

            {/* Km allowance breakdown */}
            <div className="bg-surface-2 border border-surface-3 rounded-xl px-4 py-3 space-y-1.5">
                {/* Base */}
                <div className="flex justify-between text-xs font-stats">
                    <span className="text-muted">
                        Included ({tx.dailyKmLimit} km/day × {tx.totalDays} day{tx.totalDays > 1 ? "s" : ""})
                    </span>
                    <span className="text-white-soft">{baseKm.toLocaleString()} km</span>
                </div>

                {/* Individual purchases */}
                {tx.kmPurchases.map((p, i) => (
                    <div key={i} className="flex justify-between text-xs font-stats">
                        <span className="text-emerald-400 flex items-center gap-1">
                            <span className="text-[9px]">◆</span>
                            Extra package #{i + 1}
                            <span className="text-muted ml-1">
                                — {new Date(p.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                            </span>
                        </span>
                        <span className="text-emerald-400">
                            +{p.kmAmount} km
                            <span className="text-muted ml-1.5">€{p.pricePaid.toFixed(2)}</span>
                        </span>
                    </div>
                ))}

                {/* Total */}
                <div className="flex justify-between text-xs font-stats border-t border-surface-3 pt-1.5 mt-0.5">
                    <span className="text-white-soft font-semibold">Total allowed</span>
                    <span className="text-gold font-bold">{totalAllowed.toLocaleString()} km</span>
                </div>
            </div>

            {/* Used km summary (completed) */}
            {isCompleted && tx.startMileage != null && tx.endMileage != null && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-stats">
                    <span className="text-muted">
                        Used: <span className="text-white-soft font-semibold">
                            {(tx.endMileage - tx.startMileage).toLocaleString()} km
                        </span>
                        <span className="text-muted"> / {totalAllowed.toLocaleString()} km allowed</span>
                    </span>
                    {tx.endMileage - tx.startMileage > totalAllowed && (
                        <span className="text-danger/80">
                            Excess: {(tx.endMileage - tx.startMileage - totalAllowed).toLocaleString()} km
                        </span>
                    )}
                </div>
            )}
        </div>
    )
}

interface KmConfirmModal {
    km:    number
    price: number
    pricePerKm: number
    excessKmFee: number
}

function KmPackageWidget({ tx }: { tx: BookingRow }) {
    const [modal,     setModal]     = useState<KmConfirmModal | null>(null)
    const [accepted,  setAccepted]  = useState(false)
    const [buying,    setBuying]    = useState(false)
    const [error,     setError]     = useState("")

    if (!tx.dailyKmLimit || !tx.excessKmFee) return null

    const pricePerKm   = tx.excessKmFee * DISCOUNT
    const baseIncluded = tx.dailyKmLimit * tx.totalDays

    const openModal = (km: number) => {
        const price = Math.round(km * pricePerKm * 100) / 100
        setModal({ km, price, pricePerKm, excessKmFee: tx.excessKmFee! })
        setAccepted(false)
        setError("")
    }

    const closeModal = () => {
        if (buying) return
        setModal(null)
        setAccepted(false)
        setError("")
    }

    useEffect(() => {
        if (!modal) return
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeModal() }
        document.addEventListener("keydown", onKey)
        return () => document.removeEventListener("keydown", onKey)
    }, [modal, buying])

    const confirmPurchase = async () => {
        if (!modal || !accepted) return
        setBuying(true)
        setError("")
        try {
            const res = await fetch(`/api/bookings/${tx.id}/buy-km`, {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ kmPackage: modal.km }),
            })
            const data = await res.json()
            if (res.ok && data.url) {
                window.location.href = data.url
            } else {
                setError(data.error ?? "Something went wrong.")
                setBuying(false)
            }
        } catch {
            setError("Network error. Please try again.")
            setBuying(false)
        }
    }

    return (
        <>
            <div className="mt-4 border-t border-surface-3 pt-4">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-stats text-emerald-400 uppercase tracking-wider">Extra Km Packages</span>
                    <span className="text-[10px] font-stats text-muted">30% cheaper than excess rate</span>
                </div>

                {/* Km status */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-stats text-muted mb-3">
                    <span>Base: <span className="text-white-soft">{baseIncluded} km</span></span>
                    {tx.extraKmPurchased > 0 && (
                        <span className="text-emerald-400">+{tx.extraKmPurchased} km purchased</span>
                    )}
                    <span>Excess rate: <span className="text-white-soft">€{tx.excessKmFee}/km</span></span>
                    <span>Package rate: <span className="text-emerald-400">€{pricePerKm.toFixed(2)}/km</span></span>
                </div>

                {/* Package buttons */}
                <div className="flex flex-wrap gap-2">
                    {KM_PACKAGES.map(km => {
                        const price = Math.round(km * pricePerKm * 100) / 100
                        return (
                            <button
                                key={km}
                                onClick={() => openModal(km)}
                                className="flex flex-col items-center px-4 py-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/8 hover:border-emerald-500/50 hover:bg-emerald-500/15 transition-all"
                            >
                                <span className="text-emerald-400 font-stats font-bold text-sm leading-none">+{km} km</span>
                                <span className="text-muted text-[10px] font-stats mt-0.5">€{price.toFixed(0)}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* ── Confirmation modal ── */}
            {modal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center px-4"
                    style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
                    onClick={e => { if (e.target === e.currentTarget) closeModal() }}
                >
                    <div className="bg-surface border border-surface-3 rounded-2xl w-full max-w-sm shadow-2xl">

                        {/* Header */}
                        <div className="px-6 pt-6 pb-4 border-b border-surface-3">
                            <p className="text-[10px] font-stats text-emerald-400 uppercase tracking-[0.2em] mb-1">Extra Km Package</p>
                            <h2 className="font-heading text-2xl font-light text-white-soft">
                                +{modal.km} km
                            </h2>
                            <p className="text-muted text-xs font-stats mt-1">
                                {tx.productName}
                            </p>
                        </div>

                        {/* Price breakdown */}
                        <div className="px-6 py-4 space-y-2.5">
                            <div className="flex justify-between text-sm font-stats">
                                <span className="text-muted">{modal.km} km × €{modal.pricePerKm.toFixed(2)}/km</span>
                                <span className="text-white-soft">€{modal.price.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm font-stats">
                                <span className="text-muted">vs. excess penalty rate</span>
                                <span className="text-muted line-through">€{(modal.km * modal.excessKmFee).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm font-stats text-emerald-400">
                                <span>You save</span>
                                <span>€{(modal.km * modal.excessKmFee - modal.price).toFixed(2)} (30%)</span>
                            </div>
                            <div className="flex justify-between font-stats border-t border-surface-3 pt-2.5 mt-1">
                                <span className="text-white-soft font-semibold text-sm">Total charge</span>
                                <span className="text-gold font-bold text-lg">€{modal.price.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* No-refund notice */}
                        <div className="mx-6 mb-4 bg-amber-500/8 border border-amber-500/20 rounded-xl px-4 py-3">
                            <p className="text-amber-400/90 text-[11px] font-stats leading-relaxed">
                                ⚠ <span className="font-semibold">Non-refundable.</span> If you return the car without using all purchased km, the unused distance is not refunded.
                            </p>
                        </div>

                        {/* Checkbox */}
                        <label className="flex items-start gap-3 px-6 mb-5 cursor-pointer group">
                            <div className="relative mt-0.5 shrink-0">
                                <input
                                    type="checkbox"
                                    checked={accepted}
                                    onChange={e => setAccepted(e.target.checked)}
                                    className="sr-only"
                                />
                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                                    accepted
                                        ? "bg-gold border-gold"
                                        : "bg-transparent border-surface-3 group-hover:border-gold/40"
                                }`}>
                                    {accepted && <span className="text-dark text-[10px] font-bold leading-none">✓</span>}
                                </div>
                            </div>
                            <span className="text-muted text-xs font-stats leading-relaxed">
                                I understand that this package is <span className="text-white-soft">non-refundable</span> and unused km will not be reimbursed.
                            </span>
                        </label>

                        {error && (
                            <p className="mx-6 mb-4 text-danger text-[11px] font-stats bg-danger/8 border border-danger/20 rounded-xl px-3 py-2">
                                {error}
                            </p>
                        )}

                        {/* Actions */}
                        <div className="px-6 pb-6 flex gap-3">
                            <button
                                onClick={closeModal}
                                disabled={buying}
                                className="flex-1 py-3 rounded-xl border border-surface-3 text-muted hover:text-white-soft hover:border-gold/20 font-stats text-sm transition-all disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmPurchase}
                                disabled={!accepted || buying}
                                className="flex-1 py-3 rounded-xl bg-gold hover:bg-gold-light disabled:opacity-40 disabled:cursor-not-allowed text-dark font-body font-semibold text-sm transition-all"
                            >
                                {buying ? "Redirecting…" : `Pay €${modal.price.toFixed(2)}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default function ProfileActions({ transactions, statusStyles }: Props) {
    const [txs,        setTxs]        = useState(transactions)
    const [cancelling, setCancelling] = useState<string | null>(null)
    const router = useRouter()

    const cancelBooking = async (id: string) => {
        if (!confirm("Cancel this booking? This action cannot be undone.")) return
        setCancelling(id)
        try {
            const res = await fetch(`/api/bookings/${id}`, { method: "DELETE" })
            if (res.ok) {
                setTxs(prev => prev.map(tx => tx.id === id ? { ...tx, status: "CANCELLED" } : tx))
            } else {
                alert("Failed to cancel booking. Please try again.")
            }
        } catch {
            alert("An error occurred. Please try again.")
        } finally {
            setCancelling(null)
        }
    }

    if (txs.length === 0) {
        return (
            <div className="bg-surface border border-surface-3 rounded-2xl px-6 py-14 text-center">
                <p className="text-muted text-5xl mb-4">◎</p>
                <p className="text-white-soft font-heading text-xl mb-2">No bookings yet</p>
                <p className="text-muted text-sm font-stats mb-6">
                    Your rental history will appear here.
                </p>
                <Link
                    href="/cars"
                    className="inline-flex items-center gap-2 bg-gold hover:bg-gold-light text-dark font-body font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
                >
                    Browse vehicles →
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {txs.map(tx => {
                const start         = new Date(tx.startDate)
                const end           = new Date(tx.endDate)
                const style         = statusStyles[tx.status] ?? { label: tx.status, classes: "bg-surface-3 text-muted border-surface-3" }
                const isCancellable = CANCELLABLE.has(tx.status)
                const isCancelling  = cancelling === tx.id
                const isActive      = tx.status === "ACTIVE"

                return (
                    <div
                        key={tx.id}
                        className="bg-surface border border-surface-3 rounded-2xl p-5 hover:border-surface-2 transition-colors"
                    >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">

                            {/* Left: car info + dates */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <h3 className="font-heading text-lg text-white-soft font-light leading-none">
                                        {tx.productName}
                                    </h3>
                                    <span
                                        className={`inline-flex items-center text-[10px] font-stats uppercase tracking-wider px-2.5 py-1 rounded-full border ${style.classes}`}
                                    >
                                        {style.label}
                                    </span>
                                </div>

                                <p className="text-muted text-xs font-stats mb-3">
                                    {tx.productBrand} · {tx.productCategory}
                                </p>

                                <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs font-stats text-muted">
                                    <span>
                                        📅{" "}
                                        {start.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                        {" → "}
                                        {end.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                    </span>
                                    <span>{tx.totalDays} day{tx.totalDays > 1 ? "s" : ""}</span>
                                </div>

                                {/* Km details — for any booking with a km limit */}
                                {tx.dailyKmLimit && <KmDetailsSection tx={tx} />}

                                {/* Extra km widget — only for ACTIVE bookings with km limit */}
                                {isActive && tx.dailyKmLimit && <KmPackageWidget tx={tx} />}
                            </div>

                            {/* Right: pricing + actions */}
                            <div className="flex flex-col items-end gap-3 shrink-0">
                                {/* Price */}
                                <div className="text-right">
                                    <p className="text-gold font-stats font-bold text-xl leading-none">
                                        €{tx.totalPrice.toFixed(0)}
                                    </p>
                                    <p className="text-muted text-[11px] font-stats mt-0.5">
                                        €{tx.pricePerDay}/day
                                        {tx.discountApplied ? (
                                            <span className="ml-1.5 text-emerald-400">
                                                −{(tx.discountApplied * 100).toFixed(0)}%
                                            </span>
                                        ) : null}
                                    </p>
                                </div>

                                {/* XP earned */}
                                {tx.xpAwarded && tx.xpAwarded > 0 && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-stats text-gold/80 bg-gold/10 border border-gold/20 px-2.5 py-1 rounded-full">
                                        ◆ +{tx.xpAwarded} XP
                                    </span>
                                )}

                                {/* Deposit */}
                                {tx.deposit != null && (
                                    <p className="text-[11px] font-stats text-muted">
                                        Deposit: €{tx.deposit.toFixed(0)}
                                    </p>
                                )}

                                {/* Action buttons */}
                                <div className="flex gap-2">
                                    {isCancellable && (
                                        <>
                                            <button
                                                onClick={() => router.push(`/bookings/${tx.id}/edit`)}
                                                className="text-xs font-stats px-3 py-2 rounded-xl border border-surface-3 text-muted hover:text-white-soft hover:border-gold/30 transition-all"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => cancelBooking(tx.id)}
                                                disabled={isCancelling}
                                                className="text-xs font-stats px-3 py-2 rounded-xl border border-danger/20 text-danger/80 hover:bg-danger/10 hover:border-danger/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                            >
                                                {isCancelling ? "Cancelling…" : "Cancel"}
                                            </button>
                                        </>
                                    )}
                                    <Link
                                        href={`/cars/${tx.productId}`}
                                        className="text-xs font-stats px-3 py-2 rounded-xl border border-surface-3 text-muted hover:text-white-soft hover:border-gold/30 transition-all"
                                    >
                                        View car
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
