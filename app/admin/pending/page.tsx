"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

interface PendingCar {
    id:          string
    name:        string
    brand:       string
    category:    string
    pricePerDay: number
    location:    string
    description: string
    approvalStatus: string
    adminNote:   string | null
    createdAt:   string
    company:     { id: string; name: string; slug: string } | null
    images:      { id: string; url: string }[]
}

const STATUS_TABS = ["PENDING", "APPROVED", "REJECTED"] as const

export default function AdminPendingPage() {
    const [cars,    setCars]    = useState<PendingCar[]>([])
    const [loading, setLoading] = useState(true)
    const [tab,     setTab]     = useState<typeof STATUS_TABS[number]>("PENDING")
    const [notes,   setNotes]   = useState<Record<string, string>>({})
    const [acting,  setActing]  = useState<string | null>(null)

    const load = () => {
        setLoading(true)
        fetch(`/api/admin/products/pending`)
            .then(r => r.json())
            .then(data => { setCars(data); setLoading(false) })
            .catch(() => setLoading(false))
    }

    useEffect(() => { load() }, [])

    const handleAction = async (id: string, action: "approve" | "reject") => {
        setActing(id)
        await fetch(`/api/admin/products/${id}/approve`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ action, adminNote: notes[id] ?? null }),
        })
        setActing(null)
        load()
    }

    const filtered = cars.filter(c => c.approvalStatus === tab)

    const COUNTS = Object.fromEntries(
        STATUS_TABS.map(s => [s, cars.filter(c => c.approvalStatus === s).length])
    )

    const TAB_STYLE: Record<string, string> = {
        PENDING:  "text-amber-400 border-amber-400",
        APPROVED: "text-emerald-400 border-emerald-400",
        REJECTED: "text-danger border-danger",
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-heading text-3xl text-white-soft">Car Approvals</h1>
                <p className="text-muted text-sm font-stats mt-1">Review and approve cars submitted by fleet operators</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-surface-3">
                {STATUS_TABS.map(s => (
                    <button
                        key={s}
                        onClick={() => setTab(s)}
                        className={`px-4 py-2 text-xs font-stats uppercase tracking-wider transition-colors border-b-2 -mb-px ${
                            tab === s
                                ? TAB_STYLE[s]
                                : "border-transparent text-muted hover:text-white-soft"
                        }`}
                    >
                        {s} ({COUNTS[s]})
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="text-center py-12 text-muted font-stats">Loading…</div>
            ) : filtered.length === 0 ? (
                <div className="bg-surface border border-surface-3 rounded-2xl px-6 py-14 text-center">
                    <p className="text-muted text-4xl mb-4">◎</p>
                    <p className="text-white-soft font-heading text-xl">No {tab.toLowerCase()} cars</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filtered.map(car => (
                        <div key={car.id} className="bg-surface border border-surface-3 rounded-2xl overflow-hidden">
                            <div className="flex flex-col sm:flex-row gap-0">

                                {/* Thumbnail */}
                                {car.images[0] ? (
                                    <div className="relative w-full sm:w-48 h-40 sm:h-auto shrink-0">
                                        <Image src={car.images[0].url} alt={car.name} fill className="object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-full sm:w-48 h-40 sm:h-auto shrink-0 bg-surface-2 flex items-center justify-center">
                                        <span className="text-muted text-3xl">🚗</span>
                                    </div>
                                )}

                                {/* Info */}
                                <div className="flex-1 p-5 flex flex-col gap-3">
                                    <div className="flex items-start justify-between gap-4 flex-wrap">
                                        <div>
                                            <p className="text-gold text-[11px] font-stats uppercase tracking-wider mb-1">
                                                {car.company?.name ?? "No company"} · {car.category}
                                            </p>
                                            <h3 className="font-heading text-xl text-white-soft">{car.brand} {car.name}</h3>
                                            <p className="text-muted text-xs font-stats mt-0.5">
                                                €{car.pricePerDay}/day · {car.location}
                                            </p>
                                        </div>
                                        <span className="text-[10px] font-stats text-muted">
                                            {new Date(car.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                        </span>
                                    </div>

                                    <p className="text-muted text-sm font-stats line-clamp-2">{car.description}</p>

                                    {/* Existing admin note */}
                                    {car.adminNote && (
                                        <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl px-4 py-2.5">
                                            <p className="text-amber-400 text-xs font-stats">
                                                <span className="font-semibold">Admin note:</span> {car.adminNote}
                                            </p>
                                        </div>
                                    )}

                                    {/* Actions — only for PENDING */}
                                    {car.approvalStatus === "PENDING" && (
                                        <div className="space-y-2 mt-auto">
                                            <textarea
                                                value={notes[car.id] ?? ""}
                                                onChange={e => setNotes(p => ({ ...p, [car.id]: e.target.value }))}
                                                placeholder="Optional feedback for the moderator (visible if rejected)…"
                                                rows={2}
                                                className="w-full bg-surface-2 border border-surface-3 rounded-xl px-4 py-2.5 text-xs text-white-soft font-stats focus:outline-none focus:border-gold/50 resize-none"
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleAction(car.id, "approve")}
                                                    disabled={acting === car.id}
                                                    className="flex-1 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 text-xs font-stats font-semibold transition-all disabled:opacity-50"
                                                >
                                                    {acting === car.id ? "Processing…" : "✓ Approve"}
                                                </button>
                                                <button
                                                    onClick={() => handleAction(car.id, "reject")}
                                                    disabled={acting === car.id}
                                                    className="flex-1 py-2.5 rounded-xl bg-danger/10 border border-danger/25 text-danger hover:bg-danger/20 text-xs font-stats font-semibold transition-all disabled:opacity-50"
                                                >
                                                    {acting === car.id ? "Processing…" : "✕ Reject"}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
