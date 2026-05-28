"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Circle, Check, X } from "lucide-react"
import { effectLabel, effectColor } from "@/lib/eventUtils"
import { EventEffectType, EventStatus } from "@prisma/client"

interface EventRow {
    id:               string
    title:            string
    description:      string | null
    startsAt:         string
    endsAt:           string
    effectType:       EventEffectType
    effectValue:      number
    targetCategories: string[]
    targetBrands:     string[]
    minDays:          number | null
    status:           EventStatus
    adminNote:        string | null
    companyName:      string | null
    companyId:        string | null
    notificationSent: boolean
    isActive:         boolean
    isUpcoming:       boolean
    isExpired:        boolean
}

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
    PENDING_APPROVAL: { label: "Pending",  color: "#F59E0B", bg: "#F59E0B15" },
    APPROVED:         { label: "Approved", color: "#34D399", bg: "#34D39915" },
    REJECTED:         { label: "Rejected", color: "#EF4444", bg: "#EF444415" },
    DRAFT:            { label: "Draft",    color: "#6B7280", bg: "#6B728015" },
}

const FILTER_TABS = ["all", "PENDING_APPROVAL", "APPROVED", "REJECTED"] as const

export default function AdminEventsClient({ events }: { events: EventRow[] }) {
    const router    = useRouter()
    const [tab, setTab]           = useState<string>("all")
    const [loading, setLoading]   = useState<string | null>(null)
    const [noteInputs, setNotes]  = useState<Record<string, string>>({})

    const visible = tab === "all" ? events : events.filter(e => e.status === tab)

    const fmt = (iso: string) =>
        new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })

    async function doAction(id: string, action: "approve" | "reject") {
        setLoading(id + action)
        const res = await fetch(`/api/events/${id}`, {
            method:  "PATCH",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ action, adminNote: noteInputs[id] ?? "" }),
        })
        setLoading(null)
        if (res.ok) router.refresh()
    }

    async function doDelete(id: string) {
        if (!confirm("Delete this event?")) return
        setLoading(id + "del")
        await fetch(`/api/events/${id}`, { method: "DELETE" })
        setLoading(null)
        router.refresh()
    }

    const tabCounts: Record<string, number> = {
        all:              events.length,
        PENDING_APPROVAL: events.filter(e => e.status === "PENDING_APPROVAL").length,
        APPROVED:         events.filter(e => e.status === "APPROVED").length,
        REJECTED:         events.filter(e => e.status === "REJECTED").length,
    }

    return (
        <div className="space-y-5">

            {/* Filter tabs */}
            <div className="flex items-center gap-2 flex-wrap">
                {FILTER_TABS.map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-stats transition-colors ${
                            tab === t
                                ? "bg-gold/15 text-gold border border-gold/25"
                                : "text-muted hover:text-white-soft hover:bg-surface border border-transparent"
                        }`}
                    >
                        {t === "all" ? "All" : STATUS_STYLES[t]?.label ?? t}
                        {tabCounts[t] > 0 && (
                            <span className="ml-1.5 bg-surface-3 text-muted-2 px-1.5 py-0.5 rounded-full text-[10px]">
                                {tabCounts[t]}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {visible.length === 0 && (
                <div className="text-center py-16 text-muted font-stats text-sm">No events found</div>
            )}

            <div className="space-y-4">
                {visible.map(ev => {
                    const clr   = effectColor(ev.effectType)
                    const st    = STATUS_STYLES[ev.status] ?? STATUS_STYLES.DRAFT
                    const scope = [
                        ...ev.targetCategories,
                        ...ev.targetBrands,
                    ].join(", ") || "All vehicles"

                    return (
                        <div
                            key={ev.id}
                            className={`bg-surface border rounded-2xl overflow-hidden ${
                                ev.status === "PENDING_APPROVAL"
                                    ? "border-amber-500/30"
                                    : "border-surface-3"
                            }`}
                        >
                            <div className="px-6 py-5">
                                <div className="flex items-start justify-between gap-4 flex-wrap">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 flex-wrap mb-1">
                                            <h3 className="font-heading text-lg text-white-soft font-light">{ev.title}</h3>
                                            {ev.isActive   && <span className="inline-flex items-center gap-1 text-[10px] font-stats px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 rounded-full"><Circle className="w-2 h-2 fill-current" /> Live</span>}
                                            {ev.isUpcoming && <span className="text-[10px] font-stats px-2 py-0.5 bg-blue-500/15 border border-blue-500/25 text-blue-400 rounded-full">Upcoming</span>}
                                            {ev.isExpired  && <span className="text-[10px] font-stats px-2 py-0.5 bg-surface-3 border border-surface-3 text-muted rounded-full">Expired</span>}
                                        </div>
                                        {ev.companyName && (
                                            <p className="text-[11px] font-stats text-muted-2 mb-2">From: {ev.companyName}</p>
                                        )}
                                        <div className="flex items-center gap-3 flex-wrap text-xs font-stats text-muted">
                                            <span>{fmt(ev.startsAt)} → {fmt(ev.endsAt)}</span>
                                            <span className="text-surface-3">·</span>
                                            <span>{scope}</span>
                                            {ev.minDays && <><span className="text-surface-3">·</span><span>min {ev.minDays}d</span></>}
                                        </div>
                                        {ev.description && (
                                            <p className="text-muted text-xs font-stats mt-2 line-clamp-2">{ev.description}</p>
                                        )}
                                        {ev.adminNote && (
                                            <p className="text-amber-400/80 text-xs font-stats mt-1.5 italic">Note: {ev.adminNote}</p>
                                        )}
                                    </div>

                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                        <span
                                            className="text-xs font-stats font-bold px-3 py-1.5 rounded-full border"
                                            style={{ color: clr.text, background: clr.bg, borderColor: clr.border }}
                                        >
                                            {effectLabel(ev.effectType, ev.effectValue)}
                                        </span>
                                        <span
                                            className="text-[11px] font-stats px-2.5 py-1 rounded-full"
                                            style={{ color: st.color, background: st.bg }}
                                        >
                                            {st.label}
                                        </span>
                                        {ev.notificationSent && (
                                            <span className="text-[10px] font-stats text-muted-2">✓ Notified</span>
                                        )}
                                    </div>
                                </div>

                                {/* Approve / Reject panel */}
                                {ev.status === "PENDING_APPROVAL" && (
                                    <div className="mt-4 pt-4 border-t border-amber-500/15 space-y-3">
                                        <input
                                            type="text"
                                            placeholder="Admin note (optional)"
                                            value={noteInputs[ev.id] ?? ""}
                                            onChange={e => setNotes(prev => ({ ...prev, [ev.id]: e.target.value }))}
                                            className="w-full bg-dark border border-surface-3 rounded-lg px-3 py-2 text-xs font-stats text-white-soft placeholder:text-muted focus:border-gold/40 focus:outline-none"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => doAction(ev.id, "approve")}
                                                disabled={loading === ev.id + "approve"}
                                                className="flex-1 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-stats font-semibold py-2 rounded-lg transition-colors disabled:opacity-50 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:outline-none"
                                            >
                                                {loading === ev.id + "approve"
                                                ? "Approving…"
                                                : <span className="flex items-center justify-center gap-1"><Check className="w-3.5 h-3.5" /> Approve & Notify</span>
                                            }
                                            </button>
                                            <button
                                                onClick={() => doAction(ev.id, "reject")}
                                                disabled={loading === ev.id + "reject"}
                                                className="flex-1 bg-danger/10 hover:bg-danger/20 border border-danger/25 text-danger text-xs font-stats font-semibold py-2 rounded-lg transition-colors disabled:opacity-50 cursor-pointer focus-visible:ring-2 focus-visible:ring-danger/50 focus-visible:outline-none"
                                            >
                                                {loading === ev.id + "reject"
                                                    ? "Rejecting…"
                                                    : <span className="flex items-center justify-center gap-1"><X className="w-3.5 h-3.5" /> Reject</span>
                                                }
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Delete */}
                                {ev.status !== "PENDING_APPROVAL" && (
                                    <div className="mt-3 flex justify-end">
                                        <button
                                            onClick={() => doDelete(ev.id)}
                                            disabled={loading === ev.id + "del"}
                                            className="text-[11px] font-stats text-muted hover:text-danger transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
