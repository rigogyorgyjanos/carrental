"use client"

import { useState } from "react"
import Link from "next/link"

interface CarRow {
    id:             string
    name:           string
    brand:          string
    model:          string
    category:       string
    year:           number
    pricePerDay:    number
    active:         boolean
    location:       string
    todayAvailable: boolean
    totalBookings:  number
}

const ITEMS_PER_PAGE = 20
const FILTER_OPTIONS = ["ALL", "ACTIVE", "INACTIVE"]

export default function AdminCarsTable({ initialCars }: { initialCars: CarRow[] }) {
    const [cars,      setCars]      = useState(initialCars)
    const [filter,    setFilter]    = useState("ALL")
    const [search,    setSearch]    = useState("")
    const [page,      setPage]      = useState(1)
    const [toggling,  setToggling]  = useState<string | null>(null)
    const [deleting,  setDeleting]  = useState<string | null>(null)
    const [errorMsg,  setErrorMsg]  = useState("")

    const filtered = cars
        .filter(c => filter === "ALL" || (filter === "ACTIVE" ? c.active : !c.active))
        .filter(c =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.brand.toLowerCase().includes(search.toLowerCase()) ||
            c.location.toLowerCase().includes(search.toLowerCase()) ||
            c.category.toLowerCase().includes(search.toLowerCase())
        )

    const totalPages    = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
    const safePage      = Math.min(page, totalPages)
    const paginated     = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)

    const activeCount   = cars.filter(c => c.active).length
    const inactiveCount = cars.filter(c => !c.active).length
    const bookedCount   = cars.filter(c => !c.todayAvailable).length

    const toggleActive = async (car: CarRow) => {
        setToggling(car.id)
        setErrorMsg("")
        try {
            const res = await fetch(`/api/admin/cars/${car.id}`, {
                method:  "PATCH",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ active: !car.active }),
            })
            if (res.ok) {
                setCars(prev => prev.map(c => c.id === car.id ? { ...c, active: !c.active } : c))
            } else {
                setErrorMsg("Failed to update car status.")
            }
        } catch {
            setErrorMsg("Network error.")
        } finally {
            setToggling(null)
        }
    }

    const deleteCar = async (id: string) => {
        if (!confirm("Delete this car? This cannot be undone.")) return
        setDeleting(id)
        setErrorMsg("")
        try {
            const res = await fetch(`/api/admin/cars/${id}`, { method: "DELETE" })
            if (res.ok) {
                setCars(prev => prev.filter(c => c.id !== id))
            } else {
                setErrorMsg("Failed to delete car.")
            }
        } catch {
            setErrorMsg("Network error.")
        } finally {
            setDeleting(null)
        }
    }

    return (
        <div className="space-y-5">

            {/* Summary chips */}
            <div className="flex flex-wrap gap-2 text-xs font-stats">
                <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full">
                    {activeCount} active
                </span>
                {inactiveCount > 0 && (
                    <span className="bg-surface-3 text-muted border border-surface-3 px-3 py-1 rounded-full">
                        {inactiveCount} inactive
                    </span>
                )}
                {bookedCount > 0 && (
                    <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full">
                        {bookedCount} booked today
                    </span>
                )}
            </div>

            {/* Controls row */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Filter tabs */}
                <div className="flex flex-wrap gap-1">
                    {FILTER_OPTIONS.map(f => (
                        <button
                            key={f}
                            onClick={() => { setFilter(f); setPage(1) }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-stats transition-colors ${
                                filter === f
                                    ? "bg-gold/15 text-gold"
                                    : "bg-surface border border-surface-3 text-muted hover:text-white-soft hover:border-gold/20"
                            }`}
                        >
                            {f === "ALL" ? `All (${cars.length})` : f.charAt(0) + f.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Search brand, model, location…"
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1) }}
                        className="w-full bg-surface border border-surface-3 rounded-xl px-4 py-2 pr-9 text-sm font-stats text-white-soft placeholder:text-muted focus:outline-none focus:border-gold/40"
                    />
                    {search && (
                        <button
                            onClick={() => { setSearch(""); setPage(1) }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white-soft transition-colors text-xs leading-none"
                            aria-label="Clear search"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Add car */}
                <Link
                    href="/admin/cars/create"
                    className="shrink-0 px-4 py-2 bg-gold hover:bg-gold-light text-dark text-xs font-stats font-semibold rounded-xl transition-colors"
                >
                    + Add Car
                </Link>
            </div>

            {/* Error */}
            {errorMsg && (
                <p className="text-danger text-xs font-stats bg-danger/8 border border-danger/20 rounded-xl px-4 py-2">
                    {errorMsg}
                </p>
            )}

            {/* Cars list */}
            {paginated.length === 0 ? (
                <div className="bg-surface border border-surface-3 rounded-2xl px-6 py-12 text-center">
                    <p className="text-muted text-4xl mb-3">◎</p>
                    <p className="text-muted text-sm font-stats">No cars match this filter.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {paginated.map(car => (
                        <div
                            key={car.id}
                            className="bg-surface border border-surface-3 rounded-2xl px-5 py-4 hover:border-surface-2 transition-colors"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

                                {/* Left: info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <h3 className="font-heading text-base text-white-soft font-light leading-none">
                                            {car.brand} {car.name}
                                        </h3>
                                        {/* Active badge */}
                                        <span className={`text-[10px] font-stats px-2 py-0.5 rounded-full border ${
                                            car.active
                                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                                : "bg-surface-3 text-muted border-surface-3"
                                        }`}>
                                            {car.active ? "Active" : "Inactive"}
                                        </span>
                                        {/* Today status */}
                                        <span className={`text-[10px] font-stats px-2 py-0.5 rounded-full border ${
                                            car.todayAvailable
                                                ? "bg-surface-2 text-muted border-surface-3"
                                                : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                                        }`}>
                                            {car.todayAvailable ? "Free today" : "Booked today"}
                                        </span>
                                    </div>
                                    <p className="text-muted text-xs font-stats">
                                        {car.category} · {car.year} · {car.location} · {car.totalBookings} bookings
                                    </p>
                                </div>

                                {/* Right: price + actions */}
                                <div className="flex items-center gap-3 shrink-0">
                                    <p className="text-gold font-stats font-bold text-base">
                                        €{car.pricePerDay}<span className="text-muted font-normal text-xs">/day</span>
                                    </p>

                                    <div className="flex gap-1.5">
                                        {/* Active toggle */}
                                        <button
                                            onClick={() => toggleActive(car)}
                                            disabled={toggling === car.id}
                                            className={`text-[11px] font-stats px-3 py-1.5 rounded-lg border transition-all disabled:opacity-50 ${
                                                car.active
                                                    ? "border-surface-3 text-muted hover:text-danger/80 hover:border-danger/30"
                                                    : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                                            }`}
                                        >
                                            {toggling === car.id ? "…" : car.active ? "Deactivate" : "Activate"}
                                        </button>

                                        <Link
                                            href={`/admin/cars/${car.id}/edit`}
                                            className="text-[11px] font-stats px-3 py-1.5 rounded-lg border border-surface-3 text-muted hover:text-white-soft hover:border-gold/20 transition-all"
                                        >
                                            Edit
                                        </Link>

                                        <button
                                            onClick={() => deleteCar(car.id)}
                                            disabled={deleting === car.id}
                                            className="text-[11px] font-stats px-3 py-1.5 rounded-lg border border-danger/20 text-danger/70 hover:bg-danger/10 transition-all disabled:opacity-50"
                                        >
                                            {deleting === car.id ? "…" : "Delete"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1.5 pt-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={safePage === 1}
                        className="px-3 py-1.5 text-xs font-stats rounded-lg border border-surface-3 text-muted hover:text-white-soft hover:border-gold/20 disabled:opacity-40 transition-all"
                    >
                        ← Prev
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(n => n === 1 || n === totalPages || Math.abs(n - safePage) <= 2)
                        .reduce<(number | "…")[]>((acc, n, idx, arr) => {
                            if (idx > 0 && n - (arr[idx - 1] as number) > 1) acc.push("…")
                            acc.push(n)
                            return acc
                        }, [])
                        .map((n, i) =>
                            n === "…" ? (
                                <span key={`ellipsis-${i}`} className="px-2 text-muted text-xs">…</span>
                            ) : (
                                <button
                                    key={n}
                                    onClick={() => setPage(n as number)}
                                    className={`w-8 h-8 text-xs font-stats rounded-lg border transition-all ${
                                        safePage === n
                                            ? "bg-gold/15 text-gold border-gold/30"
                                            : "border-surface-3 text-muted hover:text-white-soft hover:border-gold/20"
                                    }`}
                                >
                                    {n}
                                </button>
                            )
                        )
                    }
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={safePage === totalPages}
                        className="px-3 py-1.5 text-xs font-stats rounded-lg border border-surface-3 text-muted hover:text-white-soft hover:border-gold/20 disabled:opacity-40 transition-all"
                    >
                        Next →
                    </button>
                </div>
            )}
        </div>
    )
}
