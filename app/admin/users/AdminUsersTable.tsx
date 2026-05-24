"use client"

import { useState } from "react"
import Link from "next/link"

interface UserRow {
    id:            string
    name:          string | null
    email:         string
    role:          string
    xp:            number
    level:         number
    createdAt:     string
    totalBookings: number
    tierName:      string
    tierColor:     string
}

const ITEMS_PER_PAGE = 20
const FILTER_OPTIONS = ["ALL", "ADMIN", "USER"]

const ROLE_STYLES: Record<string, string> = {
    ADMIN:     "bg-gold/15 text-gold border-gold/30",
    USER:      "bg-blue-500/15 text-blue-400 border-blue-500/30",
    MODERATOR: "bg-purple-500/15 text-purple-400 border-purple-500/30",
}

function Initials({ name, email }: { name: string | null; email: string }) {
    const src = name ?? email
    const parts = src.split(/[\s@.]/).filter(Boolean)
    const letters = parts.length >= 2
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : src.slice(0, 2).toUpperCase()
    return (
        <div className="w-9 h-9 rounded-full bg-surface-2 border border-surface-3 flex items-center justify-center shrink-0">
            <span className="text-xs font-stats text-muted">{letters}</span>
        </div>
    )
}

export default function AdminUsersTable({ initialUsers }: { initialUsers: UserRow[] }) {
    const [users,    setUsers]    = useState(initialUsers)
    const [filter,   setFilter]   = useState("ALL")
    const [search,   setSearch]   = useState("")
    const [page,     setPage]     = useState(1)
    const [deleting, setDeleting] = useState<string | null>(null)
    const [errorMsg, setErrorMsg] = useState("")

    const filtered = users
        .filter(u => filter === "ALL" || u.role === filter)
        .filter(u =>
            (u.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase())
        )

    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
    const safePage   = Math.min(page, totalPages)
    const paginated  = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)

    const adminCount = users.filter(u => u.role === "ADMIN").length
    const userCount  = users.filter(u => u.role === "USER").length

    const deleteUser = async (id: string) => {
        if (!confirm("Delete this user and all their data? This cannot be undone.")) return
        setDeleting(id)
        setErrorMsg("")
        try {
            const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" })
            if (res.ok) {
                setUsers(prev => prev.filter(u => u.id !== id))
            } else {
                setErrorMsg("Failed to delete user.")
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
                <span className="bg-surface-2 text-muted border border-surface-3 px-3 py-1 rounded-full">
                    {users.length} total
                </span>
                {adminCount > 0 && (
                    <span className="bg-gold/15 text-gold border border-gold/30 px-3 py-1 rounded-full">
                        {adminCount} admin
                    </span>
                )}
                <span className="bg-blue-500/15 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full">
                    {userCount} users
                </span>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
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
                            {f === "ALL" ? `All (${users.length})` : f.charAt(0) + f.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>

                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Search name or email…"
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

                <Link
                    href="/admin/users/create"
                    className="shrink-0 px-4 py-2 bg-gold hover:bg-gold-light text-dark text-xs font-stats font-semibold rounded-xl transition-colors"
                >
                    + Add User
                </Link>
            </div>

            {/* Error */}
            {errorMsg && (
                <p className="text-danger text-xs font-stats bg-danger/8 border border-danger/20 rounded-xl px-4 py-2">
                    {errorMsg}
                </p>
            )}

            {/* Users list */}
            {paginated.length === 0 ? (
                <div className="bg-surface border border-surface-3 rounded-2xl px-6 py-12 text-center">
                    <p className="text-muted text-4xl mb-3">◎</p>
                    <p className="text-muted text-sm font-stats">No users match this filter.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {paginated.map(u => (
                        <div
                            key={u.id}
                            className="bg-surface border border-surface-3 rounded-2xl px-5 py-4 hover:border-surface-2 transition-colors"
                        >
                            <div className="flex items-center justify-between gap-4">

                                {/* Avatar + info */}
                                <div className="flex items-center gap-3 min-w-0">
                                    <Initials name={u.name} email={u.email} />
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                            <span className="font-stats text-sm text-white-soft font-medium leading-none">
                                                {u.name ?? "—"}
                                            </span>
                                            <span className={`text-[10px] font-stats px-2 py-0.5 rounded-full border ${ROLE_STYLES[u.role] ?? ROLE_STYLES.USER}`}>
                                                {u.role}
                                            </span>
                                            {/* Tier badge */}
                                            <span
                                                className="text-[10px] font-stats px-2 py-0.5 rounded-full border"
                                                style={{
                                                    color:       u.tierColor,
                                                    borderColor: `${u.tierColor}40`,
                                                    background:  `${u.tierColor}12`,
                                                }}
                                            >
                                                ◆ {u.tierName}
                                            </span>
                                        </div>
                                        <p className="text-muted text-xs font-stats truncate">{u.email}</p>
                                        <p className="text-muted-2 text-[11px] font-stats mt-0.5">
                                            {u.xp} XP · Lv.{u.level} · {u.totalBookings} booking{u.totalBookings !== 1 ? "s" : ""}
                                        </p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-1.5 shrink-0">
                                    <Link
                                        href={`/admin/users/${u.id}/edit`}
                                        className="text-[11px] font-stats px-3 py-1.5 rounded-lg border border-surface-3 text-muted hover:text-white-soft hover:border-gold/20 transition-all"
                                    >
                                        Edit
                                    </Link>
                                    <button
                                        onClick={() => deleteUser(u.id)}
                                        disabled={deleting === u.id}
                                        className="text-[11px] font-stats px-3 py-1.5 rounded-lg border border-danger/20 text-danger/70 hover:bg-danger/10 transition-all disabled:opacity-50"
                                    >
                                        {deleting === u.id ? "…" : "Delete"}
                                    </button>
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
