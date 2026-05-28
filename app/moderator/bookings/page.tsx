"use client"

import { useEffect, useRef, useState } from "react"

interface Booking {
    id: string
    status: string
    startDate: string
    endDate: string
    totalDays: number
    totalPrice: number
    pricePerDay: number
    createdAt: string
    notes: string | null
    startMileage:            number | null
    endMileage:              number | null
    extraKmPurchased:        number
    excessKmCharge:          number | null
    excessKmStripeSessionId: string | null
    excessKmStripeUrl:       string | null
    excessKmPaid:            boolean
    inspectionReport:        Record<string, { ok: boolean; note: string }> | null
    damageCharge:            number | null
    damageStripeUrl:         string | null
    damagePaid:              boolean
    product: {
        id: string; name: string; brand: string
        dailyKmLimit: number | null
        excessKmFee:  number | null
    }
    user: { id: string; name: string | null; email: string; image: string | null }
}

type PendingAction = {
    bookingId:    string
    targetStatus: "ACTIVE"
    km:           string
}

type InspectionItem = { ok: boolean; note: string }

type InspectionModal = {
    bookingId:         string
    km:                string
    items:             Record<string, InspectionItem>
    damageCharge:      string
    damageDescription: string
    submitting:        boolean
}

const INSPECTION_ITEMS = [
    { key: "exterior",    label: "Exterior",       hint: "Bodywork, paint, glass, lights" },
    { key: "interior",    label: "Interior",        hint: "Seats, dashboard, carpets" },
    { key: "tires",       label: "Tires & Wheels",  hint: "Tread, sidewalls, rims" },
    { key: "cleanliness", label: "Cleanliness",     hint: "Interior & exterior cleanliness" },
] as const

function defaultItems(): Record<string, InspectionItem> {
    return Object.fromEntries(INSPECTION_ITEMS.map(i => [i.key, { ok: true, note: "" }]))
}

// Per-booking excess stripe URL (only needed right after completing — afterwards fetched from DB)
type LiveExcess = {
    drivenKm:   number
    allowedKm:  number
    purchasedKm: number
    excessKm:   number
    charge:     number
    stripeUrl:  string
}

const STATUS_STYLES: Record<string, { label: string; classes: string }> = {
    PENDING:   { label: "Pending",   classes: "bg-amber-500/15 text-amber-400 border-amber-500/30"       },
    CONFIRMED: { label: "Confirmed", classes: "bg-blue-500/15 text-blue-400 border-blue-500/30"         },
    ACTIVE:    { label: "Active",    classes: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
    COMPLETED: { label: "Completed", classes: "bg-gold/15 text-gold border-gold/30"                      },
    CANCELLED: { label: "Cancelled", classes: "bg-surface-3 text-muted border-surface-3"                 },
}

const TRANSITIONS: Record<string, string[]> = {
    PENDING:   ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["ACTIVE",    "CANCELLED"],
    ACTIVE:    ["COMPLETED"],
}

const STATUS_TABS = ["ALL", "PENDING", "CONFIRMED", "ACTIVE", "COMPLETED", "CANCELLED"] as const

const INPUT = "w-full bg-dark border border-surface-3 rounded-xl px-3 py-2 text-sm font-stats text-white-soft placeholder:text-muted focus:outline-none focus:border-gold/40 transition-colors"
const LABEL = "block text-[11px] font-stats text-muted uppercase tracking-wider mb-1"

export default function ModeratorBookingsPage() {
    const [bookings,        setBookings]        = useState<Booking[]>([])
    const [loading,         setLoading]         = useState(true)
    const [loadError,       setLoadError]       = useState<string | null>(null)
    const [tab,             setTab]             = useState<typeof STATUS_TABS[number]>("ALL")
    const [expanded,        setExpanded]        = useState<string | null>(null)
    const [pendingAction,   setPendingAction]   = useState<PendingAction | null>(null)
    const [inspectionModal, setInspectionModal] = useState<InspectionModal | null>(null)
    // liveExcess: keyed by bookingId — set right after completing, before first poll
    const [liveExcess,    setLiveExcess]    = useState<Record<string, LiveExcess>>({})
    // paidIds: bookings confirmed paid via polling
    const [paidIds,       setPaidIds]       = useState<Set<string>>(new Set())
    const [transitioning, setTransitioning] = useState(false)
    const [errorMsg,      setErrorMsg]      = useState<Record<string, string>>({})
    const [copied,        setCopied]        = useState<string | null>(null)
    const [search,        setSearch]        = useState("")

    // ── Data load ────────────────────────────────────────────────────────────
    const load = () => {
        setLoading(true)
        setLoadError(null)
        fetch("/api/moderator/bookings")
            .then(r => {
                if (!r.ok) throw new Error(`Server error ${r.status}`)
                return r.json()
            })
            .then((data: Booking[]) => { setBookings(data); setLoading(false) })
            .catch((err) => {
                setLoadError(err?.message ?? "Failed to load bookings. Please refresh.")
                setLoading(false)
            })
    }

    useEffect(() => { load() }, [])

    // ── Polling: check unpaid excess charges every 5 s ────────────────────
    const bookingsRef = useRef(bookings)
    bookingsRef.current = bookings
    const paidIdsRef = useRef(paidIds)
    paidIdsRef.current = paidIds

    useEffect(() => {
        const interval = setInterval(async () => {
            const targets = bookingsRef.current.filter(
                b =>
                    b.excessKmStripeSessionId &&
                    !b.excessKmPaid &&
                    !paidIdsRef.current.has(b.id)
            )
            for (const b of targets) {
                try {
                    const res  = await fetch(`/api/moderator/bookings/${b.id}/excess-status`)
                    const data = await res.json()
                    if (data.paid) {
                        setPaidIds(prev => new Set([...prev, b.id]))
                        setBookings(prev =>
                            prev.map(x => x.id === b.id ? { ...x, excessKmPaid: true } : x)
                        )
                    }
                } catch {}
            }
        }, 5000)
        return () => clearInterval(interval)
    }, [])

    // ── Actions ──────────────────────────────────────────────────────────────
    const startAction = (bookingId: string, targetStatus: "ACTIVE" | "COMPLETED") => {
        setErrorMsg(p => ({ ...p, [bookingId]: "" }))
        if (targetStatus === "COMPLETED") {
            setInspectionModal({
                bookingId,
                km:                "",
                items:             defaultItems(),
                damageCharge:      "",
                damageDescription: "",
                submitting:        false,
            })
        } else {
            setPendingAction({ bookingId, targetStatus: "ACTIVE", km: "" })
        }
    }

    const cancelAction = () => setPendingAction(null)

    const confirmAction = async () => {
        if (!pendingAction) return
        const { bookingId, km } = pendingAction

        if (!km.trim()) {
            setErrorMsg(p => ({ ...p, [bookingId]: "Odometer reading is required." }))
            return
        }

        setTransitioning(true)
        setErrorMsg(p => ({ ...p, [bookingId]: "" }))

        const res  = await fetch(`/api/moderator/bookings/${bookingId}`, {
            method:  "PATCH",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ status: "ACTIVE", startMileage: Number(km) }),
        })
        const data = await res.json().catch(() => ({}))

        if (!res.ok) {
            setErrorMsg(p => ({ ...p, [bookingId]: data.error ?? "Transition failed." }))
        } else {
            setPendingAction(null)
            load()
        }
        setTransitioning(false)
    }

    const submitInspection = async () => {
        if (!inspectionModal) return
        const { bookingId, km, items, damageCharge, damageDescription } = inspectionModal

        if (!km.trim()) {
            setInspectionModal(m => m ? { ...m, submitting: false } : null)
            setErrorMsg(p => ({ ...p, [bookingId]: "End odometer is required." }))
            return
        }

        setInspectionModal(m => m ? { ...m, submitting: true } : null)

        const body: Record<string, unknown> = {
            status:            "COMPLETED",
            endMileage:        Number(km),
            inspection:        items,
            damageCharge:      damageCharge ? Number(damageCharge) : undefined,
            damageDescription: damageDescription || undefined,
        }

        try {
            const res  = await fetch(`/api/moderator/bookings/${bookingId}`, {
                method:  "PATCH",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify(body),
            })
            const data = await res.json().catch(() => ({}))

            if (!res.ok) {
                setErrorMsg(p => ({ ...p, [bookingId]: data.error ?? "Completion failed." }))
                setInspectionModal(m => m ? { ...m, submitting: false } : null)
            } else {
                setInspectionModal(null)
                if (data.excess) setLiveExcess(p => ({ ...p, [bookingId]: data.excess }))
                load()
            }
        } catch {
            setErrorMsg(p => ({ ...p, [bookingId]: "Network error. Please try again." }))
            setInspectionModal(m => m ? { ...m, submitting: false } : null)
        }
    }

    const handleSimpleTransition = async (bookingId: string, newStatus: string) => {
        setTransitioning(true)
        setErrorMsg(p => ({ ...p, [bookingId]: "" }))
        try {
            const res  = await fetch(`/api/moderator/bookings/${bookingId}`, {
                method:  "PATCH",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ status: newStatus }),
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) {
                setErrorMsg(p => ({ ...p, [bookingId]: data.error ?? "Transition failed." }))
            } else {
                load()
            }
        } catch {
            setErrorMsg(p => ({ ...p, [bookingId]: "Network error. Please try again." }))
        }
        setTransitioning(false)
    }

    const copyLink = (bookingId: string, url: string) => {
        navigator.clipboard.writeText(url).then(() => {
            setCopied(bookingId)
            setTimeout(() => setCopied(null), 2500)
        })
    }

    // ── Helpers ──────────────────────────────────────────────────────────────
    const q = search.trim().toLowerCase()
    const filtered = (tab === "ALL" ? bookings : bookings.filter(b => b.status === tab))
        .filter(b => {
            if (!q) return true
            return (
                b.user.name?.toLowerCase().includes(q) ||
                b.user.email.toLowerCase().includes(q) ||
                b.product.brand.toLowerCase().includes(q) ||
                b.product.name.toLowerCase().includes(q)
            )
        })
    const counts   = Object.fromEntries(
        STATUS_TABS.map(s => [s, s === "ALL" ? bookings.length : bookings.filter(b => b.status === s).length])
    )

    return (
        <>
        {/* ── Inspection / Completion Modal ── */}
        {inspectionModal && (() => {
            const m          = inspectionModal
            const hasIssues  = INSPECTION_ITEMS.some(i => !m.items[i.key]?.ok)
            const dmgNum     = m.damageCharge ? Number(m.damageCharge) : 0
            const errForBook = errorMsg[m.bookingId]
            return (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 overflow-y-auto"
                    style={{ background: "rgba(0,0,0,0.80)", backdropFilter: "blur(6px)" }}
                >
                    <div className="bg-surface border border-surface-3 rounded-2xl w-full max-w-lg shadow-2xl my-auto">
                        {/* Header */}
                        <div className="px-6 pt-6 pb-4 border-b border-surface-3 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-stats text-gold uppercase tracking-wider mb-0.5">Complete Booking</p>
                                <h2 className="font-heading text-xl text-white-soft font-light">Vehicle Inspection</h2>
                            </div>
                            <button
                                onClick={() => !m.submitting && setInspectionModal(null)}
                                className="text-muted hover:text-white-soft text-xl leading-none"
                            >✕</button>
                        </div>

                        <div className="px-6 py-5 space-y-5">
                            {/* End odometer */}
                            <div>
                                <label className={LABEL}>End Odometer (km) <span className="text-danger">*</span></label>
                                <input
                                    type="number"
                                    min={0}
                                    value={m.km}
                                    onChange={e => setInspectionModal(prev => prev ? { ...prev, km: e.target.value } : null)}
                                    placeholder="e.g. 28500"
                                    className={INPUT}
                                    autoFocus
                                />
                            </div>

                            {/* Checklist */}
                            <div>
                                <p className={LABEL}>Condition Checklist</p>
                                <div className="space-y-2">
                                    {INSPECTION_ITEMS.map(item => {
                                        const entry = m.items[item.key]
                                        return (
                                            <div key={item.key} className="bg-dark border border-surface-3 rounded-xl p-3 space-y-2">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="text-white-soft text-sm font-stats font-semibold">{item.label}</p>
                                                        <p className="text-muted text-[10px] font-stats">{item.hint}</p>
                                                    </div>
                                                    <div className="flex gap-1.5 shrink-0">
                                                        <button
                                                            type="button"
                                                            onClick={() => setInspectionModal(prev => prev ? {
                                                                ...prev,
                                                                items: { ...prev.items, [item.key]: { ...entry, ok: true } }
                                                            } : null)}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-stats border transition-all ${
                                                                entry.ok
                                                                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                                                                    : "border-surface-3 text-muted hover:border-emerald-500/30 hover:text-emerald-400"
                                                            }`}
                                                        >✓ OK</button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setInspectionModal(prev => prev ? {
                                                                ...prev,
                                                                items: { ...prev.items, [item.key]: { ...entry, ok: false } }
                                                            } : null)}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-stats border transition-all ${
                                                                !entry.ok
                                                                    ? "bg-danger/20 border-danger/40 text-danger"
                                                                    : "border-surface-3 text-muted hover:border-danger/30 hover:text-danger"
                                                            }`}
                                                        >✕ Issue</button>
                                                    </div>
                                                </div>
                                                {!entry.ok && (
                                                    <input
                                                        type="text"
                                                        value={entry.note}
                                                        onChange={e => setInspectionModal(prev => prev ? {
                                                            ...prev,
                                                            items: { ...prev.items, [item.key]: { ...entry, note: e.target.value } }
                                                        } : null)}
                                                        placeholder="Describe the issue…"
                                                        className="w-full bg-surface border border-danger/20 rounded-lg px-3 py-2 text-xs font-stats text-white-soft placeholder:text-muted focus:outline-none focus:border-danger/40 transition-colors"
                                                    />
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Damage charge — only shown if any issue */}
                            {hasIssues && (
                                <div className="bg-danger/5 border border-danger/20 rounded-xl p-4 space-y-3">
                                    <p className="text-[10px] font-stats text-danger uppercase tracking-wider">Damage Penalty (optional)</p>
                                    <div className="flex gap-3 items-center">
                                        <span className="text-muted font-stats text-sm">€</span>
                                        <input
                                            type="number"
                                            min={0}
                                            step="0.01"
                                            value={m.damageCharge}
                                            onChange={e => setInspectionModal(prev => prev ? { ...prev, damageCharge: e.target.value } : null)}
                                            placeholder="0.00"
                                            className="flex-1 bg-dark border border-surface-3 rounded-xl px-3 py-2 text-sm font-stats text-white-soft placeholder:text-muted focus:outline-none focus:border-danger/40 transition-colors"
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        value={m.damageDescription}
                                        onChange={e => setInspectionModal(prev => prev ? { ...prev, damageDescription: e.target.value } : null)}
                                        placeholder="Damage description (shown on invoice)…"
                                        className={INPUT}
                                    />
                                    {dmgNum > 0 && (
                                        <p className="text-danger/70 text-xs font-stats">
                                            Customer will receive a Stripe payment link for <span className="text-danger font-bold">€{dmgNum.toFixed(2)}</span>.
                                        </p>
                                    )}
                                </div>
                            )}

                            {errForBook && (
                                <p className="text-danger text-xs font-stats">{errForBook}</p>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 pb-6 flex gap-3">
                            <button
                                onClick={() => !m.submitting && setInspectionModal(null)}
                                disabled={m.submitting}
                                className="flex-1 border border-surface-3 text-muted font-stats text-sm py-2.5 rounded-xl hover:text-white-soft hover:border-gold/20 transition-colors disabled:opacity-50"
                            >Cancel</button>
                            <button
                                onClick={submitInspection}
                                disabled={m.submitting || !m.km.trim()}
                                className="flex-1 bg-gold hover:bg-gold-light disabled:opacity-50 disabled:cursor-not-allowed text-dark font-body font-semibold py-2.5 rounded-xl text-sm transition-colors"
                            >
                                {m.submitting ? "Completing…" : "Complete Booking"}
                            </button>
                        </div>
                    </div>
                </div>
            )
        })()}

        <div className="space-y-6">
            <div>
                <h1 className="font-heading text-3xl text-white-soft">Bookings</h1>
                <p className="text-muted text-sm font-stats mt-1">Manage reservations for your fleet</p>
            </div>

            {/* Search */}
            <input
                type="text"
                placeholder="Search by customer name, email or car…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-dark border border-surface-3 rounded-xl px-4 py-2.5 text-sm font-stats text-white-soft placeholder:text-muted focus:outline-none focus:border-gold/40 transition-colors"
            />

            {/* Tabs */}
            <div className="flex gap-1 border-b border-surface-3 overflow-x-auto">
                {STATUS_TABS.map(s => (
                    <button key={s} onClick={() => setTab(s)}
                        className={`px-3 py-2 text-xs font-stats uppercase tracking-wider whitespace-nowrap transition-colors border-b-2 -mb-px shrink-0 ${
                            tab === s ? "border-gold text-gold" : "border-transparent text-muted hover:text-white-soft"
                        }`}>
                        {s} ({counts[s]})
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="text-center py-12 text-muted font-stats">Loading…</div>
            ) : loadError ? (
                <div className="bg-danger/5 border border-danger/25 rounded-2xl px-6 py-10 text-center">
                    <p className="text-danger text-sm font-stats">{loadError}</p>
                    <button onClick={load} className="mt-4 text-xs font-stats text-gold hover:underline">
                        Retry
                    </button>
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-surface border border-surface-3 rounded-2xl px-6 py-14 text-center">
                    <p className="text-muted text-4xl mb-4">◎</p>
                    <p className="text-white-soft font-heading text-xl">
                        No {tab !== "ALL" ? tab.toLowerCase() : ""} bookings
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(b => {
                        const style     = STATUS_STYLES[b.status] ?? { label: b.status, classes: "bg-surface-3 text-muted border-surface-3" }
                        const isOpen    = expanded === b.id
                        const nextSteps = TRANSITIONS[b.status] ?? []
                        const isPending = pendingAction?.bookingId === b.id
                        const err       = errorMsg[b.id]

                        // Excess state: prefer live data (just completed), fall back to DB fields
                        const live      = liveExcess[b.id]
                        const isPaid    = b.excessKmPaid || paidIds.has(b.id)
                        const hasExcess = !!(b.excessKmStripeSessionId || live)

                        // km breakdown — calculate from DB fields when live data not available
                        const drivenKm  = live?.drivenKm  ?? (b.startMileage != null && b.endMileage != null ? b.endMileage - b.startMileage : null)
                        const purchasedKm = live?.purchasedKm ?? b.extraKmPurchased
                        const allowedKm = live?.allowedKm ?? (
                            b.product.dailyKmLimit != null && drivenKm != null
                                ? b.product.dailyKmLimit * b.totalDays + purchasedKm
                                : null
                        )
                        const excessKm  = live?.excessKm  ?? (drivenKm != null && allowedKm != null && drivenKm > allowedKm ? drivenKm - allowedKm : null)
                        const excessCharge = live?.charge  ?? b.excessKmCharge
                        // Stripe URL: use live data first, then stored DB url, hide once paid
                        const excessUrl = isPaid ? null : (live?.stripeUrl ?? b.excessKmStripeUrl)

                        return (
                            <div key={b.id} className="bg-surface border border-surface-3 rounded-2xl overflow-hidden">
                                {/* ── Collapsed row ── */}
                                <button
                                    onClick={() => setExpanded(isOpen ? null : b.id)}
                                    className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-surface-2 transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <span className="text-white-soft font-stats font-semibold text-sm">
                                                {b.product.brand} {b.product.name}
                                            </span>
                                            <span className={`text-[10px] font-stats px-2 py-0.5 rounded-full border ${style.classes}`}>
                                                {style.label}
                                            </span>
                                            {/* Unpaid excess indicator on collapsed row */}
                                            {hasExcess && !isPaid && (
                                                <span className="text-[10px] font-stats px-2 py-0.5 rounded-full border bg-danger/10 text-danger border-danger/25">
                                                    ⚠ Excess unpaid
                                                </span>
                                            )}
                                            {hasExcess && isPaid && (
                                                <span className="text-[10px] font-stats px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/25">
                                                    ✓ Excess paid
                                                </span>
                                            )}
                                            {b.damageCharge != null && b.damageCharge > 0 && !b.damagePaid && (
                                                <span className="text-[10px] font-stats px-2 py-0.5 rounded-full border bg-danger/10 text-danger border-danger/25">
                                                    ⚠ Damage unpaid
                                                </span>
                                            )}
                                            {b.damageCharge != null && b.damageCharge > 0 && b.damagePaid && (
                                                <span className="text-[10px] font-stats px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/25">
                                                    ✓ Damage paid
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-muted text-xs font-stats">
                                            <span className="text-white-soft/70">{b.user.name ?? b.user.email}</span>
                                            {" · "}
                                            {new Date(b.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                                            {" → "}
                                            {new Date(b.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                            {" · "}{b.totalDays}d · €{b.totalPrice.toFixed(0)}
                                        </p>
                                    </div>
                                    <span className="text-muted text-sm shrink-0">{isOpen ? "▲" : "▼"}</span>
                                </button>

                                {/* ── Expanded detail ── */}
                                {isOpen && (
                                    <div className="border-t border-surface-3 px-5 py-4 space-y-4">

                                        {/* Customer */}
                                        <div className="flex items-center gap-3">
                                            {b.user.image && (
                                                <img src={b.user.image} alt="" className="w-8 h-8 rounded-full object-cover" />
                                            )}
                                            <div>
                                                <p className="text-white-soft text-sm font-stats font-semibold">{b.user.name ?? "—"}</p>
                                                <p className="text-muted text-xs font-stats">{b.user.email}</p>
                                            </div>
                                        </div>

                                        {/* Price breakdown */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-stats">
                                            {[
                                                { l: "Days",    v: b.totalDays },
                                                { l: "Per day", v: `€${b.pricePerDay}` },
                                                { l: "Total",   v: `€${b.totalPrice.toFixed(0)}` },
                                                { l: "Booked",  v: new Date(b.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) },
                                            ].map(({ l, v }) => (
                                                <div key={l} className="bg-surface-2 border border-surface-3 rounded-xl px-3 py-2">
                                                    <p className="text-muted-2 text-[10px] uppercase tracking-wider mb-0.5">{l}</p>
                                                    <p className="text-white-soft font-semibold">{v}</p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Odometer read-only */}
                                        {(b.startMileage != null || b.endMileage != null) && (
                                            <div className="grid grid-cols-2 gap-3">
                                                {b.startMileage != null && (
                                                    <div className="bg-surface-2 border border-surface-3 rounded-xl px-3 py-2">
                                                        <p className="text-[10px] font-stats text-muted uppercase tracking-wider mb-0.5">Start odometer</p>
                                                        <p className="text-white-soft font-stats font-semibold text-sm">
                                                            {b.startMileage.toLocaleString()} km
                                                        </p>
                                                    </div>
                                                )}
                                                {b.endMileage != null && (
                                                    <div className="bg-surface-2 border border-surface-3 rounded-xl px-3 py-2">
                                                        <p className="text-[10px] font-stats text-muted uppercase tracking-wider mb-0.5">End odometer</p>
                                                        <p className="text-white-soft font-stats font-semibold text-sm">
                                                            {b.endMileage.toLocaleString()} km
                                                            {b.startMileage != null && (
                                                                <span className="text-muted text-[10px] ml-1.5">
                                                                    (+{(b.endMileage - b.startMileage).toLocaleString()} km)
                                                                </span>
                                                            )}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* ── Excess km panel (persistent on COMPLETED) ── */}
                                        {hasExcess && (
                                            isPaid ? (
                                                /* PAID — green */
                                                <div className="bg-emerald-500/5 border border-emerald-500/25 rounded-2xl p-4 space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-emerald-400 text-base">✓</span>
                                                        <p className="text-emerald-400 text-sm font-stats font-semibold">
                                                            Excess km charge paid
                                                        </p>
                                                        <span className="ml-auto text-emerald-400 font-stats font-bold">
                                                            €{excessCharge?.toFixed(2)}
                                                        </span>
                                                    </div>
                                                    {drivenKm != null && allowedKm != null && excessKm != null && (
                                                        <div className="grid grid-cols-3 gap-2 text-xs font-stats">
                                                            <div className="bg-surface-2 border border-surface-3 rounded-xl px-3 py-2">
                                                                <p className="text-muted-2 text-[10px] uppercase tracking-wider mb-0.5">Driven</p>
                                                                <p className="text-white-soft font-semibold">{drivenKm.toLocaleString()} km</p>
                                                            </div>
                                                            <div className="bg-surface-2 border border-surface-3 rounded-xl px-3 py-2">
                                                                <p className="text-muted-2 text-[10px] uppercase tracking-wider mb-0.5">
                                                                    Allowed{purchasedKm > 0 ? " (+pkg)" : ""}
                                                                </p>
                                                                <p className="text-white-soft font-semibold">{allowedKm.toLocaleString()} km</p>
                                                            </div>
                                                            <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl px-3 py-2">
                                                                <p className="text-emerald-400/70 text-[10px] uppercase tracking-wider mb-0.5">Excess</p>
                                                                <p className="text-emerald-400 font-semibold">+{excessKm.toLocaleString()} km</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                /* UNPAID — red */
                                                <div className="bg-danger/5 border border-danger/25 rounded-2xl p-4 space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-danger text-base">⚠</span>
                                                        <p className="text-danger text-sm font-stats font-semibold">Excess km charge — awaiting payment</p>
                                                        <span className="ml-auto flex items-center gap-1.5 text-[10px] font-stats text-muted">
                                                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-muted animate-pulse" />
                                                            checking…
                                                        </span>
                                                    </div>

                                                    {drivenKm != null && allowedKm != null && excessKm != null && (
                                                        <div className="grid grid-cols-3 gap-2 text-xs font-stats">
                                                            <div className="bg-surface-2 border border-surface-3 rounded-xl px-3 py-2">
                                                                <p className="text-muted-2 text-[10px] uppercase tracking-wider mb-0.5">Driven</p>
                                                                <p className="text-white-soft font-semibold">{drivenKm.toLocaleString()} km</p>
                                                            </div>
                                                            <div className="bg-surface-2 border border-surface-3 rounded-xl px-3 py-2">
                                                                <p className="text-muted-2 text-[10px] uppercase tracking-wider mb-0.5">
                                                                    Allowed{purchasedKm > 0 ? ` (+${purchasedKm} pkg)` : ""}
                                                                </p>
                                                                <p className="text-white-soft font-semibold">{allowedKm.toLocaleString()} km</p>
                                                            </div>
                                                            <div className="bg-danger/10 border border-danger/30 rounded-xl px-3 py-2">
                                                                <p className="text-danger/70 text-[10px] uppercase tracking-wider mb-0.5">Excess</p>
                                                                <p className="text-danger font-semibold">+{excessKm.toLocaleString()} km</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center justify-between bg-surface-2 border border-surface-3 rounded-xl px-4 py-3">
                                                        <span className="text-muted text-xs font-stats">
                                                            {excessKm != null && b.product.excessKmFee
                                                                ? `${excessKm.toLocaleString()} km × €${b.product.excessKmFee}/km`
                                                                : "Excess charge"}
                                                        </span>
                                                        <span className="text-danger font-stats font-bold text-lg">
                                                            €{excessCharge?.toFixed(2)}
                                                        </span>
                                                    </div>

                                                    {excessUrl && (
                                                        <div className="space-y-2">
                                                            <p className="text-[11px] font-stats text-muted uppercase tracking-wider">
                                                                Payment link — share with customer
                                                            </p>
                                                            <div className="flex gap-2">
                                                                <div className="flex-1 bg-dark border border-surface-3 rounded-xl px-3 py-2 text-xs font-stats text-muted truncate">
                                                                    {excessUrl}
                                                                </div>
                                                                <button
                                                                    onClick={() => copyLink(b.id, excessUrl)}
                                                                    className="shrink-0 px-4 py-2 rounded-xl border border-gold/30 text-gold text-xs font-stats hover:bg-gold/10 transition-colors"
                                                                >
                                                                    {copied === b.id ? "Copied ✓" : "Copy"}
                                                                </button>
                                                                <a
                                                                    href={excessUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="shrink-0 px-4 py-2 rounded-xl border border-surface-3 text-muted text-xs font-stats hover:text-white-soft hover:border-gold/20 transition-colors"
                                                                >
                                                                    Open ↗
                                                                </a>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        )}

                                        {/* ── Inspection report ── */}
                                        {b.inspectionReport && Object.keys(b.inspectionReport).length > 0 && (
                                            <div className="bg-surface-2 border border-surface-3 rounded-2xl p-4 space-y-2">
                                                <p className="text-[10px] font-stats text-muted uppercase tracking-wider">Inspection Report</p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {INSPECTION_ITEMS.map(item => {
                                                        const entry = b.inspectionReport![item.key]
                                                        if (!entry) return null
                                                        return (
                                                            <div key={item.key} className={`flex items-start gap-2 rounded-xl px-3 py-2 border text-xs font-stats ${
                                                                entry.ok
                                                                    ? "bg-emerald-500/5 border-emerald-500/20"
                                                                    : "bg-danger/5 border-danger/20"
                                                            }`}>
                                                                <span className={entry.ok ? "text-emerald-400" : "text-danger"}>{entry.ok ? "✓" : "✕"}</span>
                                                                <div className="min-w-0">
                                                                    <p className={`font-semibold ${entry.ok ? "text-emerald-400" : "text-danger"}`}>{item.label}</p>
                                                                    {!entry.ok && entry.note && (
                                                                        <p className="text-muted text-[10px] truncate">{entry.note}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* ── Damage charge panel ── */}
                                        {b.damageCharge != null && b.damageCharge > 0 && (
                                            b.damagePaid ? (
                                                <div className="bg-emerald-500/5 border border-emerald-500/25 rounded-2xl p-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-emerald-400 text-base">✓</span>
                                                        <p className="text-emerald-400 text-sm font-stats font-semibold">Damage charge paid</p>
                                                        <span className="ml-auto text-emerald-400 font-stats font-bold">€{b.damageCharge.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="bg-danger/5 border border-danger/25 rounded-2xl p-4 space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-danger text-base">⚠</span>
                                                        <p className="text-danger text-sm font-stats font-semibold">Damage charge — awaiting payment</p>
                                                        <span className="ml-auto text-danger font-stats font-bold">€{b.damageCharge.toFixed(2)}</span>
                                                    </div>
                                                    {b.damageStripeUrl && (
                                                        <div className="space-y-2">
                                                            <p className="text-[11px] font-stats text-muted uppercase tracking-wider">
                                                                Payment link — share with customer
                                                            </p>
                                                            <div className="flex gap-2">
                                                                <div className="flex-1 bg-dark border border-surface-3 rounded-xl px-3 py-2 text-xs font-stats text-muted truncate">
                                                                    {b.damageStripeUrl}
                                                                </div>
                                                                <button
                                                                    onClick={() => copyLink(`dmg-${b.id}`, b.damageStripeUrl!)}
                                                                    className="shrink-0 px-4 py-2 rounded-xl border border-gold/30 text-gold text-xs font-stats hover:bg-gold/10 transition-colors"
                                                                >
                                                                    {copied === `dmg-${b.id}` ? "Copied ✓" : "Copy"}
                                                                </button>
                                                                <a
                                                                    href={b.damageStripeUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="shrink-0 px-4 py-2 rounded-xl border border-surface-3 text-muted text-xs font-stats hover:text-white-soft hover:border-gold/20 transition-colors"
                                                                >
                                                                    Open ↗
                                                                </a>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        )}

                                        {/* ── Inline km confirm form ── */}
                                        {isPending && pendingAction && (
                                            <div className="bg-surface-2 border border-gold/20 rounded-xl p-4 space-y-3">
                                                <p className="text-[11px] font-stats text-gold uppercase tracking-wider">
                                                    {pendingAction.targetStatus === "ACTIVE"
                                                        ? "Enter start odometer to activate"
                                                        : "Enter end odometer to complete"}
                                                </p>
                                                <div>
                                                    <label className={LABEL}>
                                                        {pendingAction.targetStatus === "ACTIVE" ? "Start odometer (km)" : "End odometer (km)"}
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        autoFocus
                                                        value={pendingAction.km}
                                                        onChange={e => setPendingAction(p => p ? { ...p, km: e.target.value } : p)}
                                                        placeholder="e.g. 24500"
                                                        className={INPUT}
                                                    />
                                                </div>
                                                {err && <p className="text-danger text-xs font-stats">{err}</p>}
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={confirmAction}
                                                        disabled={transitioning}
                                                        className="flex-1 bg-gold hover:bg-gold-light disabled:opacity-60 text-dark font-body font-semibold py-2 rounded-xl text-xs transition-colors"
                                                    >
                                                        {transitioning ? "Saving…" : "Confirm"}
                                                    </button>
                                                    <button
                                                        onClick={cancelAction}
                                                        disabled={transitioning}
                                                        className="px-4 py-2 rounded-xl border border-surface-3 text-muted hover:text-white-soft text-xs font-stats transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* ── Action buttons ── */}
                                        {!isPending && nextSteps.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {nextSteps.map(ns => {
                                                    const needsKm  = ns === "ACTIVE" || ns === "COMPLETED"
                                                    const isDanger = ns === "CANCELLED"
                                                    const isGold   = ns === "COMPLETED"
                                                    const btnClass = isDanger
                                                        ? "border-danger/25 text-danger hover:bg-danger/10"
                                                        : isGold
                                                        ? "border-gold/30 text-gold hover:bg-gold/10"
                                                        : "border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/10"
                                                    return (
                                                        <button
                                                            key={ns}
                                                            disabled={transitioning}
                                                            onClick={() =>
                                                                needsKm
                                                                    ? startAction(b.id, ns as "ACTIVE" | "COMPLETED")
                                                                    : handleSimpleTransition(b.id, ns)
                                                            }
                                                            className={`text-xs font-stats px-4 py-2 rounded-xl border transition-all disabled:opacity-50 ${btnClass}`}
                                                        >
                                                            {transitioning ? "…" : `Mark ${ns.toLowerCase()}`}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        )}

                                        <p className="text-muted-2 text-[10px] font-stats">Booking ID: {b.id}</p>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
        </>
    )
}
