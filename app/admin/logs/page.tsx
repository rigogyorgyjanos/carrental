"use client"

import { Fragment, useEffect, useState, useCallback } from "react"

interface AuditLog {
    id:        string
    createdAt: string
    level:     "INFO" | "WARN" | "ERROR"
    action:    string
    entity:    string | null
    entityId:  string | null
    userId:    string | null
    userEmail: string | null
    userRole:  string | null
    metadata:  Record<string, unknown> | null
}

interface LogsResponse {
    logs:       AuditLog[]
    total:      number
    page:       number
    pageSize:   number
    totalPages: number
}

const LEVEL_STYLES: Record<string, string> = {
    INFO:  "bg-blue-500/10 text-blue-400 border-blue-500/20",
    WARN:  "bg-amber-500/10 text-amber-400 border-amber-500/20",
    ERROR: "bg-danger/10 text-danger border-danger/20",
}

const ACTION_COLORS: Record<string, string> = {
    "booking.created":          "text-emerald-400",
    "booking.completed":        "text-gold",
    "booking.cancelled_by_user":"text-amber-400",
    "booking.cancelled_by_admin":"text-amber-500",
    "booking.deleted":          "text-danger",
    "booking.refunded":         "text-orange-400",
    "booking.activated":        "text-blue-400",
    "booking.status_changed":   "text-white-soft",
    "booking.dates_edited":     "text-white-soft",
    "car.submitted":            "text-indigo-400",
    "car.approved":             "text-emerald-400",
    "car.rejected":             "text-danger",
    "car.edited":               "text-white-soft",
    "car.deactivated":          "text-amber-400",
    "payment.deposit_confirmed":"text-emerald-400",
    "payment.km_purchased":     "text-emerald-300",
    "payment.excess_km_paid":   "text-emerald-300",
    "review.approved":          "text-gold",
    "review.rejected":          "text-danger",
    "user.registered":          "text-indigo-400",
    "user.edited":              "text-white-soft",
    "user.deleted":             "text-danger",
    "user.role_changed":        "text-amber-400",
}

const ALL_ACTIONS = Object.keys(ACTION_COLORS)

const ALL_ENTITIES = ["booking", "car", "user", "review", "payment"]

const INPUT = "bg-dark border border-surface-3 rounded-xl px-3 py-2 text-xs font-stats text-white-soft placeholder:text-muted focus:outline-none focus:border-gold/40 transition-colors"

export default function AdminLogsPage() {
    const [data,        setData]        = useState<LogsResponse | null>(null)
    const [loading,     setLoading]     = useState(true)
    const [error,       setError]       = useState<string | null>(null)

    // Filters
    const [page,        setPage]        = useState(1)
    const [action,      setAction]      = useState("")
    const [entity,      setEntity]      = useState("")
    const [level,       setLevel]       = useState("")
    const [search,      setSearch]      = useState("")
    const [dateFrom,    setDateFrom]    = useState("")
    const [dateTo,      setDateTo]      = useState("")
    const [searchInput, setSearchInput] = useState("")

    // Expanded metadata
    const [expanded, setExpanded] = useState<string | null>(null)

    const fetchLogs = useCallback(async () => {
        setLoading(true)
        setError(null)
        const params = new URLSearchParams({ page: String(page) })
        if (action)   params.set("action",   action)
        if (entity)   params.set("entity",   entity)
        if (level)    params.set("level",    level)
        if (search)   params.set("search",   search)
        if (dateFrom) params.set("dateFrom", dateFrom)
        if (dateTo)   params.set("dateTo",   dateTo)

        try {
            const res = await fetch(`/api/admin/logs?${params}`)
            if (!res.ok) throw new Error(`Server error ${res.status}`)
            setData(await res.json())
        } catch (e: any) {
            setError(e?.message ?? "Failed to load logs")
        } finally {
            setLoading(false)
        }
    }, [page, action, entity, level, search, dateFrom, dateTo])

    useEffect(() => { fetchLogs() }, [fetchLogs])

    const resetFilters = () => {
        setAction(""); setEntity(""); setLevel("")
        setSearch(""); setSearchInput("")
        setDateFrom(""); setDateTo(""); setPage(1)
    }

    const applySearch = () => { setSearch(searchInput); setPage(1) }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-heading text-3xl text-white-soft">Audit Logs</h1>
                    <p className="text-muted text-sm font-stats mt-1">
                        {data ? `${data.total.toLocaleString()} total entries` : "All system actions"}
                    </p>
                </div>
                <button onClick={fetchLogs} className="text-xs font-stats text-muted hover:text-gold border border-surface-3 hover:border-gold/20 px-4 py-2 rounded-xl transition-colors">
                    ↻ Refresh
                </button>
            </div>

            {/* Filters */}
            <div className="bg-surface border border-surface-3 rounded-2xl p-4 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {/* Action */}
                    <select value={action} onChange={e => { setAction(e.target.value); setPage(1) }} className={INPUT}>
                        <option value="">All actions</option>
                        {ALL_ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>

                    {/* Entity */}
                    <select value={entity} onChange={e => { setEntity(e.target.value); setPage(1) }} className={INPUT}>
                        <option value="">All entities</option>
                        {ALL_ENTITIES.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>

                    {/* Level */}
                    <select value={level} onChange={e => { setLevel(e.target.value); setPage(1) }} className={INPUT}>
                        <option value="">All levels</option>
                        <option value="INFO">INFO</option>
                        <option value="WARN">WARN</option>
                        <option value="ERROR">ERROR</option>
                    </select>

                    {/* Date from */}
                    <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1) }}
                        className={INPUT} placeholder="From" />

                    {/* Date to */}
                    <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1) }}
                        className={INPUT} placeholder="To" />

                    {/* Reset */}
                    <button onClick={resetFilters}
                        className="text-xs font-stats text-muted hover:text-danger border border-surface-3 hover:border-danger/30 px-3 py-2 rounded-xl transition-colors">
                        Clear filters
                    </button>
                </div>

                {/* Search bar */}
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Search by email, user ID or entity ID…"
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && applySearch()}
                        className={`flex-1 ${INPUT}`}
                    />
                    <button onClick={applySearch}
                        className="text-xs font-stats text-gold border border-gold/30 hover:bg-gold/10 px-4 py-2 rounded-xl transition-colors">
                        Search
                    </button>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="text-center py-16 text-muted font-stats">Loading…</div>
            ) : error ? (
                <div className="bg-danger/5 border border-danger/25 rounded-2xl px-6 py-10 text-center">
                    <p className="text-danger text-sm font-stats">{error}</p>
                    <button onClick={fetchLogs} className="mt-4 text-xs font-stats text-gold hover:underline">Retry</button>
                </div>
            ) : !data || data.logs.length === 0 ? (
                <div className="bg-surface border border-surface-3 rounded-2xl px-6 py-14 text-center">
                    <p className="text-muted text-4xl mb-3">◎</p>
                    <p className="text-white-soft font-heading text-xl">No log entries found</p>
                </div>
            ) : (
                <div className="bg-surface border border-surface-3 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs font-stats">
                            <thead>
                                <tr className="border-b border-surface-3">
                                    <th className="text-left px-4 py-3 text-muted uppercase tracking-wider whitespace-nowrap">Time</th>
                                    <th className="text-left px-4 py-3 text-muted uppercase tracking-wider">Level</th>
                                    <th className="text-left px-4 py-3 text-muted uppercase tracking-wider">Action</th>
                                    <th className="text-left px-4 py-3 text-muted uppercase tracking-wider">Entity</th>
                                    <th className="text-left px-4 py-3 text-muted uppercase tracking-wider">Actor</th>
                                    <th className="text-left px-4 py-3 text-muted uppercase tracking-wider">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-3">
                                {data.logs.map(log => {
                                    const isExpanded = expanded === log.id
                                    return (
                                        <Fragment key={log.id}>
                                            <tr className="hover:bg-surface-2 transition-colors cursor-pointer"
                                                onClick={() => setExpanded(isExpanded ? null : log.id)}
                                            >
                                                {/* Time */}
                                                <td className="px-4 py-3 whitespace-nowrap text-muted">
                                                    <div>{new Date(log.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</div>
                                                    <div className="text-[10px] text-muted/60">{new Date(log.createdAt).toLocaleTimeString("en-GB")}</div>
                                                </td>

                                                {/* Level */}
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 rounded-full border text-[10px] uppercase tracking-wider ${LEVEL_STYLES[log.level] ?? ""}`}>
                                                        {log.level}
                                                    </span>
                                                </td>

                                                {/* Action */}
                                                <td className={`px-4 py-3 whitespace-nowrap font-semibold ${ACTION_COLORS[log.action] ?? "text-white-soft"}`}>
                                                    {log.action}
                                                </td>

                                                {/* Entity */}
                                                <td className="px-4 py-3">
                                                    {log.entity && (
                                                        <div>
                                                            <span className="text-muted capitalize">{log.entity}</span>
                                                            {log.entityId && (
                                                                <div className="text-[10px] text-muted/50 font-mono truncate max-w-[120px]">
                                                                    {log.entityId}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Actor */}
                                                <td className="px-4 py-3">
                                                    {log.userEmail ? (
                                                        <div>
                                                            <div className="text-white-soft truncate max-w-[160px]">{log.userEmail}</div>
                                                            {log.userRole && (
                                                                <div className="text-[10px] text-muted/60 uppercase">{log.userRole}</div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted/50 italic">system</span>
                                                    )}
                                                </td>

                                                {/* Details toggle */}
                                                <td className="px-4 py-3 text-muted">
                                                    {log.metadata && Object.keys(log.metadata).length > 0 ? (
                                                        <span className="text-gold/70 hover:text-gold">
                                                            {isExpanded ? "▲ hide" : "▼ show"}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted/30">—</span>
                                                    )}
                                                </td>
                                            </tr>

                                            {/* Expanded metadata row */}
                                            {isExpanded && log.metadata && (
                                                <tr key={`${log.id}-meta`} className="bg-surface-2">
                                                    <td colSpan={6} className="px-6 py-3">
                                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                                            {Object.entries(log.metadata)
                                                                .filter(([, v]) => v !== null && v !== undefined)
                                                                .map(([k, v]) => (
                                                                    <div key={k} className="bg-dark border border-surface-3 rounded-xl px-3 py-2">
                                                                        <p className="text-[10px] text-muted uppercase tracking-wider mb-0.5">{k}</p>
                                                                        <p className="text-white-soft text-xs break-all">
                                                                            {typeof v === "object" ? JSON.stringify(v) : String(v)}
                                                                        </p>
                                                                    </div>
                                                                ))
                                                            }
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {data.totalPages > 1 && (
                        <div className="border-t border-surface-3 px-4 py-3 flex items-center justify-between">
                            <p className="text-muted text-xs font-stats">
                                Page {data.page} of {data.totalPages} · {data.total.toLocaleString()} entries
                            </p>
                            <div className="flex gap-2">
                                <button
                                    disabled={page <= 1}
                                    onClick={() => setPage(p => p - 1)}
                                    className="text-xs font-stats px-3 py-1.5 rounded-xl border border-surface-3 text-muted hover:text-white-soft disabled:opacity-40 transition-colors"
                                >
                                    ← Prev
                                </button>
                                <button
                                    disabled={page >= data.totalPages}
                                    onClick={() => setPage(p => p + 1)}
                                    className="text-xs font-stats px-3 py-1.5 rounded-xl border border-surface-3 text-muted hover:text-white-soft disabled:opacity-40 transition-colors"
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
