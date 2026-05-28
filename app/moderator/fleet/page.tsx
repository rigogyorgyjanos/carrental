"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"

interface Car {
    id: string; name: string; brand: string; category: string
    pricePerDay: number; location: string; active: boolean
    approvalStatus: string; adminNote: string | null; createdAt: string
    images: { id: string; url: string }[]
}

const APPROVAL_STYLE: Record<string, { label: string; classes: string }> = {
    PENDING:  { label: "Pending approval", classes: "bg-amber-500/10 text-amber-400 border-amber-500/25"    },
    APPROVED: { label: "Approved",         classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25" },
    REJECTED: { label: "Rejected",         classes: "bg-danger/10 text-danger border-danger/25"              },
}

const STATUS_TABS = ["ALL", "PENDING", "APPROVED", "REJECTED"] as const

export default function ModeratorFleetPage() {
    const [cars,     setCars]     = useState<Car[]>([])
    const [loading,  setLoading]  = useState(true)
    const [error,    setError]    = useState("")
    const [tab,      setTab]      = useState<typeof STATUS_TABS[number]>("ALL")
    const [toggling, setToggling] = useState<string | null>(null)
    const [search,   setSearch]   = useState("")

    const load = () => {
        setLoading(true)
        setError("")
        fetch("/api/moderator/fleet")
            .then(async r => {
                if (!r.ok) throw new Error("Failed to load fleet")
                const data = await r.json()
                setCars(data)
                setLoading(false)
            })
            .catch(() => { setError("Failed to load fleet. Please refresh."); setLoading(false) })
    }

    useEffect(() => { load() }, [])

    const toggleActive = async (car: Car) => {
        if (car.approvalStatus !== "APPROVED") return
        setToggling(car.id)
        await fetch(`/api/moderator/fleet/${car.id}`, {
            method:  "PATCH",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ active: !car.active }),
        })
        setToggling(null)
        load()
    }

    const q = search.trim().toLowerCase()
    const filtered = (tab === "ALL" ? cars : cars.filter(c => c.approvalStatus === tab))
        .filter(c => !q || `${c.brand} ${c.name}`.toLowerCase().includes(q))
    const counts   = Object.fromEntries(STATUS_TABS.map(s => [s, s === "ALL" ? cars.length : cars.filter(c => c.approvalStatus === s).length]))

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-heading text-3xl text-white-soft">Fleet</h1>
                    <p className="text-muted text-sm font-stats mt-1">Manage your company's vehicles</p>
                </div>
                <Link
                    href="/moderator/fleet/new"
                    className="bg-gold hover:bg-gold-light text-dark font-body font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
                >
                    + Add Car
                </Link>
            </div>

            {/* Search */}
            <input
                type="text"
                placeholder="Search by car name or brand…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-dark border border-surface-3 rounded-xl px-4 py-2.5 text-sm font-stats text-white-soft placeholder:text-muted focus:outline-none focus:border-gold/40 transition-colors"
            />

            {/* Tabs */}
            <div className="flex gap-1 border-b border-surface-3">
                {STATUS_TABS.map(s => (
                    <button
                        key={s}
                        onClick={() => setTab(s)}
                        className={`px-4 py-2 text-xs font-stats uppercase tracking-wider transition-colors border-b-2 -mb-px ${
                            tab === s ? "border-gold text-gold" : "border-transparent text-muted hover:text-white-soft"
                        }`}
                    >
                        {s} ({counts[s]})
                    </button>
                ))}
            </div>

            {error && (
                <div className="bg-danger/8 border border-danger/20 rounded-2xl px-6 py-4">
                    <p className="text-danger text-sm font-stats">{error}</p>
                </div>
            )}

            {loading ? (
                <div className="text-center py-12 text-muted font-stats">Loading…</div>
            ) : filtered.length === 0 ? (
                <div className="bg-surface border border-surface-3 rounded-2xl px-6 py-14 text-center">
                    <p className="text-muted text-4xl mb-4">🚗</p>
                    <p className="text-white-soft font-heading text-xl mb-2">No cars {tab !== "ALL" ? `with status ${tab}` : "yet"}</p>
                    {tab === "ALL" && (
                        <Link href="/moderator/fleet/new" className="text-gold text-sm font-stats hover:underline">
                            Add your first car →
                        </Link>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(car => {
                        const s = APPROVAL_STYLE[car.approvalStatus] ?? { label: car.approvalStatus, classes: "bg-surface-3 text-muted border-surface-3" }
                        return (
                            <div key={car.id} className="bg-surface border border-surface-3 rounded-2xl overflow-hidden flex flex-col sm:flex-row">
                                {car.images[0] ? (
                                    <div className="relative w-full sm:w-36 h-32 sm:h-auto shrink-0">
                                        <Image src={car.images[0].url} alt={car.name} fill className="object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-full sm:w-36 h-32 sm:h-auto shrink-0 bg-surface-2 flex items-center justify-center">
                                        <span className="text-muted text-2xl">🚗</span>
                                    </div>
                                )}
                                <div className="flex-1 p-5 flex flex-col sm:flex-row justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <h3 className="font-heading text-lg text-white-soft">{car.brand} {car.name}</h3>
                                            <span className={`text-[10px] font-stats px-2 py-0.5 rounded-full border ${s.classes}`}>{s.label}</span>
                                            {car.approvalStatus === "APPROVED" && (
                                                <span className={`text-[10px] font-stats px-2 py-0.5 rounded-full border ${car.active ? "bg-emerald-500/8 text-emerald-400 border-emerald-500/20" : "bg-surface-3 text-muted border-surface-3"}`}>
                                                    {car.active ? "Live" : "Hidden"}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-muted text-xs font-stats">{car.category} · €{car.pricePerDay}/day · {car.location}</p>

                                        {car.approvalStatus === "REJECTED" && car.adminNote && (
                                            <div className="mt-2 bg-danger/8 border border-danger/20 rounded-xl px-3 py-2">
                                                <p className="text-danger text-xs font-stats">
                                                    <span className="font-semibold">Admin feedback:</span> {car.adminNote}
                                                </p>
                                            </div>
                                        )}
                                        {car.approvalStatus === "PENDING" && (
                                            <p className="text-amber-400/70 text-xs font-stats mt-1.5">Waiting for admin review…</p>
                                        )}
                                    </div>
                                    <div className="flex sm:flex-col gap-2 items-start sm:items-end shrink-0">
                                        <Link
                                            href={`/moderator/fleet/${car.id}/edit`}
                                            className="text-xs font-stats px-3 py-1.5 rounded-xl border border-surface-3 text-muted hover:text-white-soft hover:border-gold/30 transition-all"
                                        >
                                            Edit
                                        </Link>
                                        {car.approvalStatus === "APPROVED" && (
                                            <button
                                                onClick={() => toggleActive(car)}
                                                disabled={toggling === car.id}
                                                className={`text-xs font-stats px-3 py-1.5 rounded-xl border transition-all disabled:opacity-50 ${
                                                    car.active
                                                        ? "border-danger/20 text-danger/70 hover:bg-danger/10"
                                                        : "border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
                                                }`}
                                            >
                                                {car.active ? "Hide" : "Show"}
                                            </button>
                                        )}
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
