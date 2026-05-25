"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { TIERS } from "@/lib/tiers"
import { BADGE_DEFS } from "@/lib/badgeDefs"
import type { NewsletterFilters, BookingActivity } from "@/lib/newsletterFilters"

type SendState = "idle" | "sending" | "success" | "error"
type TestState = "idle" | "sending" | "sent" | "error"

type LogEntry = {
    id:          string
    subject:     string
    sentCount:   number
    failedCount: number
    filters:     string | null
    createdAt:   string
}

// ── Small helpers ──────────────────────────────────────────────────────────

function CheckboxGroup<T extends string>({
    label,
    items,
    selected,
    onToggle,
    renderItem,
}: {
    label:      string
    items:      T[]
    selected:   T[]
    onToggle:   (v: T) => void
    renderItem: (v: T) => React.ReactNode
}) {
    const all = selected.length === items.length
    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-stats uppercase tracking-[0.2em] text-muted-2">{label}</span>
                <button
                    type="button"
                    onClick={() => items.forEach(v => { if (selected.includes(v) === all) onToggle(v) })}
                    className="text-[10px] font-stats text-gold/60 hover:text-gold transition-colors"
                >
                    {all ? "Clear all" : "Select all"}
                </button>
            </div>
            <div className="flex flex-wrap gap-2">
                {items.map(v => {
                    const active = selected.includes(v)
                    return (
                        <button
                            key={v}
                            type="button"
                            onClick={() => onToggle(v)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-stats border transition-all ${
                                active
                                    ? "bg-gold/15 border-gold/40 text-gold"
                                    : "bg-surface border-surface-3 text-muted hover:border-surface-2 hover:text-white-soft"
                            }`}
                        >
                            {renderItem(v)}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function AdminNewsletterPage() {
    // Compose state
    const [subject,    setSubject]    = useState("")
    const [body,       setBody]       = useState("")
    const [ctaLabel,   setCtaLabel]   = useState("")
    const [ctaUrl,     setCtaUrl]     = useState("")

    // Filter state
    const [activity,   setActivity]   = useState<BookingActivity>("all")
    const [tierNames,  setTierNames]  = useState<string[]>(TIERS.map(t => t.name))
    const [badgeSlugs, setBadgeSlugs] = useState<string[]>([])

    // Live recipient count
    const [count,      setCount]      = useState<number | null>(null)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Send / test state
    const [sendState,  setSendState]  = useState<SendState>("idle")
    const [testState,  setTestState]  = useState<TestState>("idle")
    const [result,     setResult]     = useState<{ sent: number; failed: number; total: number } | null>(null)
    const [errorMsg,   setErrorMsg]   = useState("")

    // History
    const [logs,       setLogs]       = useState<LogEntry[]>([])
    const [logsLoaded, setLogsLoaded] = useState(false)

    // ── Fetch count whenever filters change ────────────────────────────────
    const fetchCount = useCallback((filters: NewsletterFilters) => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(async () => {
            setCount(null)
            try {
                const res  = await fetch("/api/admin/newsletter/count", {
                    method:  "POST",
                    headers: { "Content-Type": "application/json" },
                    body:    JSON.stringify(filters),
                })
                const data = await res.json()
                setCount(data.count ?? 0)
            } catch {
                setCount(0)
            }
        }, 300)
    }, [])

    const currentFilters = useCallback((): NewsletterFilters => ({
        activity:   activity === "all" ? undefined : activity,
        tierNames:  tierNames.length === TIERS.length ? undefined : tierNames,
        badgeSlugs: badgeSlugs.length > 0 ? badgeSlugs : undefined,
    }), [activity, tierNames, badgeSlugs])

    useEffect(() => {
        fetchCount(currentFilters())
    }, [activity, tierNames, badgeSlugs, fetchCount, currentFilters])

    // ── Fetch history on mount ─────────────────────────────────────────────
    useEffect(() => {
        fetch("/api/admin/newsletter")
            .then(r => r.json())
            .then(d => { setLogs(d.logs ?? []); setLogsLoaded(true) })
            .catch(() => setLogsLoaded(true))
    }, [])

    const refreshLogs = () => {
        fetch("/api/admin/newsletter")
            .then(r => r.json())
            .then(d => setLogs(d.logs ?? []))
            .catch(() => {})
    }

    // ── Toggle helpers ─────────────────────────────────────────────────────
    const toggleTier = (name: string) =>
        setTierNames(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name])

    const toggleBadge = (slug: string) =>
        setBadgeSlugs(prev => prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug])

    // ── Send ───────────────────────────────────────────────────────────────
    const handleSend = async () => {
        if (!subject.trim() || !body.trim()) return
        setSendState("sending")
        setResult(null)
        setErrorMsg("")

        try {
            const res  = await fetch("/api/admin/newsletter", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({
                    subject: subject.trim(),
                    body:    body.trim(),
                    ctaLabel: ctaLabel.trim() || undefined,
                    ctaUrl:   ctaUrl.trim()   || undefined,
                    filters:  currentFilters(),
                }),
            })
            const data = await res.json()
            if (!res.ok) { setErrorMsg(data.error ?? "Failed to send"); setSendState("error"); return }
            setResult(data)
            setSendState("success")
            setSubject(""); setBody(""); setCtaLabel(""); setCtaUrl("")
            refreshLogs()
        } catch {
            setErrorMsg("Network error. Please try again.")
            setSendState("error")
        }
    }

    // ── Test email ─────────────────────────────────────────────────────────
    const handleTest = async () => {
        if (!subject.trim() || !body.trim()) return
        setTestState("sending")
        try {
            const res = await fetch("/api/admin/newsletter/test", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({
                    subject: subject.trim(),
                    body:    body.trim(),
                    ctaLabel: ctaLabel.trim() || undefined,
                    ctaUrl:   ctaUrl.trim()   || undefined,
                }),
            })
            setTestState(res.ok ? "sent" : "error")
            setTimeout(() => setTestState("idle"), 3000)
        } catch {
            setTestState("error")
            setTimeout(() => setTestState("idle"), 3000)
        }
    }

    const canSend = subject.trim().length > 0 && body.trim().length > 0 && sendState !== "sending"
    const canTest = subject.trim().length > 0 && body.trim().length > 0 && testState !== "sending"

    return (
        <div className="max-w-2xl mx-auto space-y-6">

            {/* Header */}
            <div>
                <h1 className="font-heading text-3xl font-light text-white-soft mb-1">Newsletter</h1>
                <p className="text-muted text-sm font-stats">Send a promotional email to opted-in users</p>
            </div>

            {/* ── FILTERS ─────────────────────────────────────────────────── */}
            <div className="bg-surface border border-surface-3 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-surface-3">
                    <h2 className="font-heading text-base font-light text-white-soft">Audience</h2>
                </div>

                <div className="px-6 py-5 space-y-5">
                    {/* Booking activity */}
                    <div>
                        <span className="block text-[10px] font-stats uppercase tracking-[0.2em] text-muted-2 mb-2">Booking activity</span>
                        <div className="flex gap-2">
                            {(["all", "has_bookings", "never_booked"] as BookingActivity[]).map(opt => (
                                <button
                                    key={opt}
                                    type="button"
                                    onClick={() => setActivity(opt)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-stats border transition-all ${
                                        activity === opt
                                            ? "bg-gold/15 border-gold/40 text-gold"
                                            : "bg-surface border-surface-3 text-muted hover:border-surface-2 hover:text-white-soft"
                                    }`}
                                >
                                    {opt === "all" ? "All users" : opt === "has_bookings" ? "Has bookings" : "Never booked"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tier */}
                    <CheckboxGroup
                        label="Tier"
                        items={TIERS.map(t => t.name)}
                        selected={tierNames}
                        onToggle={toggleTier}
                        renderItem={name => {
                            const tier = TIERS.find(t => t.name === name)!
                            return <span style={{ color: tier.color }}>{name}</span>
                        }}
                    />

                    {/* Badge */}
                    <CheckboxGroup
                        label="Has badge (any selected)"
                        items={BADGE_DEFS.map(b => b.slug)}
                        selected={badgeSlugs}
                        onToggle={toggleBadge}
                        renderItem={slug => {
                            const b = BADGE_DEFS.find(b => b.slug === slug)!
                            return <>{b.icon} {b.name}</>
                        }}
                    />
                </div>

                {/* Live count */}
                <div className="px-6 pb-5">
                    <div className="inline-flex items-center gap-2 bg-dark border border-surface-3 rounded-full px-4 py-2">
                        {count === null
                            ? <span className="w-2 h-2 rounded-full bg-surface-3 animate-pulse" />
                            : <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        }
                        <span className="text-sm font-stats text-white-soft">
                            {count === null ? "Calculating…" : `${count} recipient${count !== 1 ? "s" : ""} match filters`}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── COMPOSE ─────────────────────────────────────────────────── */}

            {/* Status banners */}
            {sendState === "success" && result && (
                <div className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl px-5 py-4">
                    <span className="text-emerald-400 text-xl shrink-0">✓</span>
                    <div>
                        <p className="text-emerald-400 font-stats font-semibold text-sm leading-none mb-1">Newsletter sent</p>
                        <p className="text-muted text-xs font-stats">
                            {result.sent} delivered{result.failed > 0 && `, ${result.failed} failed`} · {result.total} total
                        </p>
                    </div>
                </div>
            )}
            {sendState === "error" && (
                <div className="flex items-center gap-3 bg-danger/8 border border-danger/20 rounded-2xl px-5 py-4">
                    <span className="text-danger text-lg shrink-0">✕</span>
                    <p className="text-danger text-sm font-stats">{errorMsg}</p>
                </div>
            )}

            <div className="bg-surface border border-surface-3 rounded-2xl overflow-hidden">

                {/* Subject */}
                <div className="px-6 pt-6 pb-4 border-b border-surface-3">
                    <label className="block text-[10px] font-stats uppercase tracking-[0.2em] text-muted-2 mb-2">Subject</label>
                    <input
                        type="text"
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        placeholder="e.g. Exclusive weekend offer for AURUM members"
                        maxLength={150}
                        className="w-full bg-transparent text-white-soft font-stats text-sm placeholder:text-muted focus:outline-none"
                    />
                </div>

                {/* Body */}
                <div className="px-6 py-4 border-b border-surface-3">
                    <label className="block text-[10px] font-stats uppercase tracking-[0.2em] text-muted-2 mb-2">
                        Message
                        <span className="ml-2 normal-case tracking-normal text-gold/50">· use <code className="bg-gold/10 px-1 rounded text-gold/70">{"{{name}}"}</code> for personalisation</span>
                    </label>
                    <textarea
                        value={body}
                        onChange={e => setBody(e.target.value)}
                        placeholder={"Dear {{name}},\n\nWrite your message here. Use blank lines to separate paragraphs.\n\nBest regards,\nThe AURUM Team"}
                        rows={12}
                        maxLength={5000}
                        className="w-full bg-transparent text-white-soft font-body text-sm placeholder:text-muted focus:outline-none resize-none leading-relaxed"
                    />
                    <div className="flex justify-end mt-1">
                        <span className={`text-[10px] font-stats ${body.length > 4500 ? "text-amber-400" : "text-muted-2"}`}>
                            {body.length} / 5000
                        </span>
                    </div>
                </div>

                {/* Custom CTA */}
                <div className="px-6 py-4 border-b border-surface-3 grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-stats uppercase tracking-[0.2em] text-muted-2 mb-2">CTA label (optional)</label>
                        <input
                            type="text"
                            value={ctaLabel}
                            onChange={e => setCtaLabel(e.target.value)}
                            placeholder="Browse Our Fleet →"
                            maxLength={80}
                            className="w-full bg-transparent text-white-soft font-stats text-sm placeholder:text-muted focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-stats uppercase tracking-[0.2em] text-muted-2 mb-2">CTA URL (optional)</label>
                        <input
                            type="url"
                            value={ctaUrl}
                            onChange={e => setCtaUrl(e.target.value)}
                            placeholder="/cars"
                            maxLength={500}
                            className="w-full bg-transparent text-white-soft font-stats text-sm placeholder:text-muted focus:outline-none"
                        />
                    </div>
                </div>

                {/* Preview note */}
                <div className="mx-6 my-4 bg-gold/5 border border-gold/15 rounded-xl px-4 py-3">
                    <p className="text-[11px] font-stats text-gold/70 leading-relaxed">
                        ◆ The email includes a CTA button and an unsubscribe link.
                        Blank lines create new paragraphs. <code>{"{{name}}"}</code> is replaced with the recipient&apos;s name.
                    </p>
                </div>

                {/* Action buttons */}
                <div className="px-6 pb-6 flex gap-3">
                    {/* Test email */}
                    <button
                        onClick={handleTest}
                        disabled={!canTest}
                        className="shrink-0 border border-surface-3 hover:border-surface-2 disabled:opacity-40 disabled:cursor-not-allowed text-white-soft font-body text-sm px-5 py-3.5 rounded-xl transition-colors"
                    >
                        {testState === "sending" ? "Sending…"
                            : testState === "sent"    ? "✓ Sent to you"
                            : testState === "error"   ? "Error"
                            : "Send test"}
                    </button>

                    {/* Real send */}
                    <button
                        onClick={handleSend}
                        disabled={!canSend}
                        className="flex-1 bg-gold hover:bg-gold-light disabled:opacity-40 disabled:cursor-not-allowed text-dark font-body font-semibold py-3.5 rounded-xl text-sm transition-colors"
                    >
                        {sendState === "sending"
                            ? "Sending…"
                            : count !== null
                            ? `Send to ${count} recipient${count !== 1 ? "s" : ""}`
                            : "Send Newsletter"
                        }
                    </button>
                </div>
            </div>

            {/* ── HISTORY ─────────────────────────────────────────────────── */}
            {logsLoaded && (
                <div className="bg-surface border border-surface-3 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-surface-3">
                        <h2 className="font-heading text-base font-light text-white-soft">Send history</h2>
                    </div>

                    {logs.length === 0 ? (
                        <p className="px-6 py-5 text-sm font-stats text-muted">No newsletters sent yet.</p>
                    ) : (
                        <div className="divide-y divide-surface-3">
                            {logs.map(log => {
                                const parsedFilters: NewsletterFilters | null = (() => {
                                    if (!log.filters) return null
                                    try { return JSON.parse(log.filters) as NewsletterFilters } catch { return null }
                                })()
                                const date = new Date(log.createdAt).toLocaleDateString("en-GB", {
                                    day: "2-digit", month: "short", year: "numeric",
                                    hour: "2-digit", minute: "2-digit",
                                })
                                return (
                                    <div key={log.id} className="px-6 py-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <p className="text-sm font-stats text-white-soft truncate">{log.subject}</p>
                                                <p className="text-xs font-stats text-muted mt-0.5">{date}</p>
                                                {parsedFilters && (
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {parsedFilters.activity && parsedFilters.activity !== "all" && (
                                                            <span className="text-[10px] font-stats bg-surface-3 text-muted px-2 py-0.5 rounded-full">
                                                                {parsedFilters.activity === "has_bookings" ? "Has bookings" : "Never booked"}
                                                            </span>
                                                        )}
                                                        {parsedFilters.tierNames?.map((t: string) => (
                                                            <span key={t} className="text-[10px] font-stats bg-surface-3 text-muted px-2 py-0.5 rounded-full">{t}</span>
                                                        ))}
                                                        {parsedFilters.badgeSlugs?.map((s: string) => {
                                                            const b = BADGE_DEFS.find(b => b.slug === s)
                                                            return b ? (
                                                                <span key={s} className="text-[10px] font-stats bg-surface-3 text-muted px-2 py-0.5 rounded-full">{b.icon} {b.name}</span>
                                                            ) : null
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-sm font-stats text-emerald-400">{log.sentCount} sent</p>
                                                {log.failedCount > 0 && (
                                                    <p className="text-xs font-stats text-danger">{log.failedCount} failed</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

        </div>
    )
}
