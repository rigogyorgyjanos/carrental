"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, ExternalLink, X, Plus, Search, ChevronDown } from "lucide-react"

interface UserOption {
    id:    string
    name:  string | null
    email: string
    role?: string
}

interface PenaltyRow {
    id:               string
    amount:           number
    reason:           string
    status:           "UNPAID" | "PAID" | "CANCELLED"
    stripePaymentUrl: string | null
    paidAt:           string | null
    notificationSent: boolean
    createdAt:        string
    user:     { id: string; name: string | null; email: string }
    issuedBy: { id: string; name: string | null; role: string }
    company:  { id: string; name: string } | null
}

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
    UNPAID:    { label: "Unpaid",    cls: "bg-red-500/10 text-red-400 border-red-500/25"              },
    PAID:      { label: "Paid",      cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"  },
    CANCELLED: { label: "Cancelled", cls: "bg-surface-3 text-muted border-surface-3"                  },
}

const ROLE_BADGE: Record<string, string> = {
    USER:      "bg-surface-3 text-muted",
    MODERATOR: "bg-amber-500/15 text-amber-400",
    ADMIN:     "bg-gold/15 text-gold",
}

const FILTER_TABS = ["all", "UNPAID", "PAID", "CANCELLED"] as const

interface Props {
    initialPenalties: PenaltyRow[]
    allUsers:         UserOption[]
    isAdmin:          boolean
    companyUsers?:    UserOption[]
}

// ── Searchable user combobox ─────────────────────────────────────────────────
function UserPicker({
    options,
    value,
    onChange,
}: {
    options:  UserOption[]
    value:    UserOption | null
    onChange: (u: UserOption | null) => void
}) {
    const [query,  setQuery]  = useState("")
    const [open,   setOpen]   = useState(false)
    const containerRef        = useRef<HTMLDivElement>(null)

    // Close on outside click
    useEffect(() => {
        function handler(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [])

    const filtered = query.trim().length === 0
        ? []
        : options.filter(u => {
            const q = query.trim().toLowerCase()
            return (
                u.name?.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q)
            )
        }).slice(0, 8)

    function select(u: UserOption) {
        onChange(u)
        setQuery("")
        setOpen(false)
    }

    function clear() {
        onChange(null)
        setQuery("")
        setOpen(false)
    }

    // If a user is selected, show chip
    if (value) {
        return (
            <div className="flex items-center gap-2 bg-dark border border-gold/30 rounded-xl px-4 py-2.5">
                <div className="flex-1 min-w-0">
                    <p className="text-white-soft text-sm font-stats font-semibold truncate">
                        {value.name ?? value.email}
                    </p>
                    <p className="text-muted text-xs font-stats truncate">{value.email}</p>
                </div>
                {value.role && value.role !== "USER" && (
                    <span className={`text-[10px] font-stats px-2 py-0.5 rounded-full ${ROLE_BADGE[value.role] ?? ROLE_BADGE.USER}`}>
                        {value.role}
                    </span>
                )}
                <button
                    type="button"
                    onClick={clear}
                    className="shrink-0 text-muted hover:text-white-soft transition-colors cursor-pointer"
                    aria-label="Clear selection"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        )
    }

    return (
        <div ref={containerRef} className="relative">
            <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
                <input
                    type="text"
                    value={query}
                    onChange={e => { setQuery(e.target.value); setOpen(true) }}
                    onFocus={() => setOpen(true)}
                    placeholder="Search by name or email…"
                    className="w-full bg-dark border border-surface-3 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white-soft font-stats placeholder:text-muted focus:outline-none focus:border-gold/50 focus-visible:ring-2 focus-visible:ring-gold/30 transition-colors"
                />
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
            </div>

            {open && query.trim().length > 0 && (
                <div className="absolute z-30 top-full mt-1.5 left-0 right-0 bg-surface border border-surface-3 rounded-xl shadow-xl overflow-hidden">
                    {filtered.length === 0 ? (
                        <p className="px-4 py-3 text-sm text-muted font-stats">No users found for "{query}"</p>
                    ) : (
                        filtered.map(u => (
                            <button
                                key={u.id}
                                type="button"
                                onMouseDown={() => select(u)}
                                className="w-full text-left px-4 py-2.5 hover:bg-surface-2 transition-colors flex items-center gap-3 cursor-pointer"
                            >
                                <div className="w-8 h-8 rounded-full bg-surface-3 flex items-center justify-center text-muted text-xs font-stats font-semibold shrink-0">
                                    {(u.name ?? u.email)[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white-soft text-sm font-stats font-semibold truncate">
                                        {u.name ?? "—"}
                                    </p>
                                    <p className="text-muted text-xs font-stats truncate">{u.email}</p>
                                </div>
                                {u.role && u.role !== "USER" && (
                                    <span className={`text-[10px] font-stats px-2 py-0.5 rounded-full shrink-0 ${ROLE_BADGE[u.role] ?? ROLE_BADGE.USER}`}>
                                        {u.role}
                                    </span>
                                )}
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}

// ── Main component ───────────────────────────────────────────────────────────
export default function PenaltiesClient({ initialPenalties, allUsers, isAdmin, companyUsers }: Props) {
    const router = useRouter()

    const [tab,           setTab]           = useState<string>("all")
    const [showForm,      setShowForm]      = useState(false)
    const [selectedUser,  setSelectedUser]  = useState<UserOption | null>(null)
    const [reason,        setReason]        = useState("")
    const [amount,        setAmount]        = useState("")
    const [saving,        setSaving]        = useState(false)
    const [formErr,       setFormErr]       = useState("")
    const [cancelling,    setCancelling]    = useState<string | null>(null)
    const [listSearch,    setListSearch]    = useState("")

    const userOptions = isAdmin ? allUsers : (companyUsers ?? [])

    const visible = (tab === "all" ? initialPenalties : initialPenalties.filter(p => p.status === tab))
        .filter(p => {
            if (!listSearch.trim()) return true
            const q = listSearch.trim().toLowerCase()
            return (
                p.user.name?.toLowerCase().includes(q) ||
                p.user.email.toLowerCase().includes(q) ||
                p.reason.toLowerCase().includes(q)
            )
        })

    const counts: Record<string, number> = {
        all:       initialPenalties.length,
        UNPAID:    initialPenalties.filter(p => p.status === "UNPAID").length,
        PAID:      initialPenalties.filter(p => p.status === "PAID").length,
        CANCELLED: initialPenalties.filter(p => p.status === "CANCELLED").length,
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setFormErr("")
        const amt = parseFloat(amount)
        if (!selectedUser)              { setFormErr("Select a user"); return }
        if (!reason.trim())             { setFormErr("Reason is required"); return }
        if (reason.trim().length < 5)   { setFormErr("Reason must be at least 5 characters"); return }
        if (isNaN(amt) || amt <= 0)     { setFormErr("Amount must be a positive number"); return }

        setSaving(true)
        const res = await fetch("/api/penalties", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ userId: selectedUser.id, reason: reason.trim(), amount: amt }),
        })
        const data = await res.json()
        setSaving(false)

        if (!res.ok) { setFormErr(data.error ?? "Failed to issue penalty"); return }

        setShowForm(false)
        setSelectedUser(null)
        setReason("")
        setAmount("")
        router.refresh()
    }

    const handleCancel = async (id: string) => {
        if (!confirm("Cancel this penalty? The user will no longer be able to pay it.")) return
        setCancelling(id)
        await fetch(`/api/penalties/${id}`, {
            method:  "PATCH",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ action: "cancel" }),
        })
        setCancelling(null)
        router.refresh()
    }

    const fmt = (iso: string) =>
        new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })

    return (
        <div className="space-y-5">

            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="font-heading text-3xl text-white-soft">Penalties</h1>
                    <p className="text-muted text-sm font-stats mt-1">Issue and manage fines for users</p>
                </div>
                <button
                    onClick={() => { setShowForm(true); setFormErr("") }}
                    className="flex items-center gap-2 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 text-xs font-stats font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-red-500/50 focus-visible:outline-none"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Issue Penalty
                </button>
            </div>

            {/* Issue penalty form */}
            {showForm && (
                <div className="bg-surface border border-red-500/20 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-5">
                        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                        <h2 className="font-heading text-xl text-white-soft">Issue Penalty</h2>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* User picker */}
                        <div>
                            <label className="block text-xs font-stats text-muted uppercase tracking-wider mb-1.5">
                                User *
                                {isAdmin && <span className="ml-2 normal-case tracking-normal text-muted/60">(users &amp; moderators)</span>}
                            </label>
                            <UserPicker
                                options={userOptions}
                                value={selectedUser}
                                onChange={setSelectedUser}
                            />
                        </div>

                        {/* Amount */}
                        <div>
                            <label className="block text-xs font-stats text-muted uppercase tracking-wider mb-1.5">Amount (€) *</label>
                            <input
                                type="number"
                                min="1"
                                step="0.01"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                placeholder="e.g. 150.00"
                                className="w-full bg-dark border border-surface-3 rounded-xl px-4 py-2.5 text-sm text-white-soft font-stats focus:outline-none focus:border-gold/50 focus-visible:ring-2 focus-visible:ring-gold/30"
                            />
                        </div>

                        {/* Reason */}
                        <div>
                            <label className="block text-xs font-stats text-muted uppercase tracking-wider mb-1.5">Reason *</label>
                            <textarea
                                rows={3}
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                placeholder="Describe the reason for this fine in detail. This will appear verbatim in the email sent to the user."
                                className="w-full bg-dark border border-surface-3 rounded-xl px-4 py-2.5 text-sm text-white-soft font-stats focus:outline-none focus:border-gold/50 focus-visible:ring-2 focus-visible:ring-gold/30 resize-none"
                            />
                        </div>

                        {formErr && (
                            <p className="text-red-400 text-xs font-stats bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-2">{formErr}</p>
                        )}

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-body font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-red-500/50 focus-visible:outline-none"
                            >
                                <AlertTriangle className="w-3.5 h-3.5" />
                                {saving ? "Issuing…" : "Issue Penalty & Send Email"}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setShowForm(false); setSelectedUser(null); setReason(""); setAmount("") }}
                                className="px-6 py-2.5 rounded-xl border border-surface-3 text-muted hover:text-white-soft text-sm font-stats transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filter tabs */}
            <div className="flex items-center gap-2 flex-wrap">
                {FILTER_TABS.map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-stats transition-colors cursor-pointer ${
                            tab === t
                                ? "bg-gold/15 text-gold border border-gold/25"
                                : "text-muted hover:text-white-soft hover:bg-surface border border-transparent"
                        }`}
                    >
                        {t === "all" ? "All" : STATUS_STYLE[t]?.label ?? t}
                        {counts[t] > 0 && (
                            <span className="ml-1.5 bg-surface-3 text-muted-2 px-1.5 py-0.5 rounded-full text-[10px]">
                                {counts[t]}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* List search */}
            <input
                type="text"
                placeholder="Search penalties by user name, email or reason…"
                value={listSearch}
                onChange={e => setListSearch(e.target.value)}
                className="w-full bg-dark border border-surface-3 rounded-xl px-4 py-2.5 text-sm font-stats text-white-soft placeholder:text-muted focus:outline-none focus:border-gold/40 transition-colors"
            />

            {visible.length === 0 && (
                <div className="text-center py-16 text-muted font-stats text-sm">No penalties found</div>
            )}

            <div className="space-y-3">
                {visible.map(p => {
                    const st = STATUS_STYLE[p.status] ?? STATUS_STYLE.CANCELLED
                    return (
                        <div key={p.id} className="bg-surface border border-surface-3 rounded-2xl overflow-hidden">
                            <div className="px-6 py-5">
                                <div className="flex items-start justify-between gap-4 flex-wrap">

                                    {/* Left: user + details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                                            <p className="text-white-soft font-stats font-semibold text-sm">
                                                {p.user.name ?? "—"}
                                                <span className="text-muted font-normal"> ({p.user.email})</span>
                                            </p>
                                            <span className={`text-[10px] font-stats px-2 py-0.5 rounded-full border ${st.cls}`}>
                                                {st.label}
                                            </span>
                                        </div>
                                        <p className="text-muted text-xs font-stats mb-2">
                                            Issued by {p.issuedBy.name ?? "—"}{" "}
                                            {p.company ? `(${p.company.name})` : "(Admin)"} · {fmt(p.createdAt)}
                                            {p.paidAt && ` · Paid ${fmt(p.paidAt)}`}
                                        </p>
                                        <p className="text-white-soft/80 text-sm font-stats leading-relaxed bg-surface-2 border border-surface-3 rounded-xl px-4 py-2.5">
                                            {p.reason}
                                        </p>
                                    </div>

                                    {/* Right: amount + actions */}
                                    <div className="flex flex-col items-end gap-3 shrink-0">
                                        <p className="text-red-400 font-stats font-bold text-2xl">
                                            €{p.amount.toFixed(2)}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            {p.status === "UNPAID" && p.stripePaymentUrl && (
                                                <a
                                                    href={p.stripePaymentUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-[11px] font-stats px-3 py-1.5 rounded-lg border border-surface-3 text-muted hover:text-white-soft hover:border-gold/30 transition-all"
                                                >
                                                    <ExternalLink className="w-3 h-3" /> Payment link
                                                </a>
                                            )}
                                            {p.status === "UNPAID" && (
                                                <button
                                                    onClick={() => handleCancel(p.id)}
                                                    disabled={cancelling === p.id}
                                                    className="flex items-center gap-1 text-[11px] font-stats px-3 py-1.5 rounded-lg border border-danger/20 text-danger/70 hover:bg-danger/10 transition-all disabled:opacity-50 cursor-pointer"
                                                >
                                                    <X className="w-3 h-3" />
                                                    {cancelling === p.id ? "Cancelling…" : "Cancel"}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

        </div>
    )
}
