"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Company {
    id:          string
    name:        string
    slug:        string
    status:      string
    createdAt:   string
    _count:      { users: number; products: number }
}

export default function CompaniesClient({ initialCompanies }: { initialCompanies: Company[] }) {
    const router = useRouter()
    const [showForm, setShowForm]   = useState(false)
    const [form,     setForm]       = useState({ name: "", description: "", website: "", address: "", logoUrl: "" })
    const [saving,   setSaving]     = useState(false)
    const [error,    setError]      = useState("")

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.name.trim()) { setError("Company name is required"); return }
        setSaving(true); setError("")
        const res = await fetch("/api/admin/companies", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify(form),
        })
        if (res.ok) {
            setShowForm(false)
            setForm({ name: "", description: "", website: "", address: "", logoUrl: "" })
            router.refresh()
        } else {
            const d = await res.json()
            setError(d.error ?? "Failed to create company")
        }
        setSaving(false)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-heading text-3xl text-white-soft">Companies</h1>
                    <p className="text-muted text-sm font-stats mt-1">Manage fleet operators on the platform</p>
                </div>
                <button
                    onClick={() => { setShowForm(true); setError("") }}
                    className="bg-gold hover:bg-gold-light text-dark font-body font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors cursor-pointer"
                >
                    + New Company
                </button>
            </div>

            {showForm && (
                <div className="bg-surface border border-surface-3 rounded-2xl p-6">
                    <h2 className="font-heading text-xl text-white-soft mb-5">Create Company</h2>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-stats text-muted uppercase tracking-wider mb-1.5">Company Name *</label>
                                <input
                                    value={form.name}
                                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                    placeholder="e.g. Ferrari Budapest Kft."
                                    className="w-full bg-surface-2 border border-surface-3 rounded-xl px-4 py-2.5 text-sm text-white-soft font-stats focus:outline-none focus:border-gold/50 focus-visible:ring-2 focus-visible:ring-gold/30"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-stats text-muted uppercase tracking-wider mb-1.5">Website</label>
                                <input
                                    value={form.website}
                                    onChange={e => setForm(p => ({ ...p, website: e.target.value }))}
                                    placeholder="https://example.com"
                                    className="w-full bg-surface-2 border border-surface-3 rounded-xl px-4 py-2.5 text-sm text-white-soft font-stats focus:outline-none focus:border-gold/50 focus-visible:ring-2 focus-visible:ring-gold/30"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-stats text-muted uppercase tracking-wider mb-1.5">Address</label>
                                <input
                                    value={form.address}
                                    onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                                    placeholder="Budapest, Andrássy út 1."
                                    className="w-full bg-surface-2 border border-surface-3 rounded-xl px-4 py-2.5 text-sm text-white-soft font-stats focus:outline-none focus:border-gold/50 focus-visible:ring-2 focus-visible:ring-gold/30"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-stats text-muted uppercase tracking-wider mb-1.5">Logo URL</label>
                                <input
                                    value={form.logoUrl}
                                    onChange={e => setForm(p => ({ ...p, logoUrl: e.target.value }))}
                                    placeholder="https://..."
                                    className="w-full bg-surface-2 border border-surface-3 rounded-xl px-4 py-2.5 text-sm text-white-soft font-stats focus:outline-none focus:border-gold/50 focus-visible:ring-2 focus-visible:ring-gold/30"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-stats text-muted uppercase tracking-wider mb-1.5">Description</label>
                            <textarea
                                value={form.description}
                                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                rows={3}
                                placeholder="Short company description..."
                                className="w-full bg-surface-2 border border-surface-3 rounded-xl px-4 py-2.5 text-sm text-white-soft font-stats focus:outline-none focus:border-gold/50 focus-visible:ring-2 focus-visible:ring-gold/30 resize-none"
                            />
                        </div>
                        {error && <p className="text-danger text-xs font-stats bg-danger/8 border border-danger/20 rounded-xl px-4 py-2">{error}</p>}
                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={saving}
                                className="bg-gold hover:bg-gold-light disabled:opacity-50 text-dark font-body font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-gold/50"
                            >
                                {saving ? "Creating…" : "Create Company"}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-6 py-2.5 rounded-xl border border-surface-3 text-muted hover:text-white-soft text-sm font-stats transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-gold/30"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {initialCompanies.length === 0 ? (
                <div className="bg-surface border border-surface-3 rounded-2xl px-6 py-14 text-center">
                    <p className="text-muted text-4xl mb-4">◎</p>
                    <p className="text-white-soft font-heading text-xl mb-2">No companies yet</p>
                    <p className="text-muted text-sm font-stats">Create the first fleet operator above.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {initialCompanies.map(c => (
                        <div key={c.id} className="bg-surface border border-surface-3 rounded-2xl p-5 flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="font-heading text-lg text-white-soft">{c.name}</h3>
                                    <span className={`text-[10px] font-stats px-2 py-0.5 rounded-full border ${
                                        c.status === "ACTIVE"
                                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                                            : "bg-surface-3 text-muted border-surface-3"
                                    }`}>
                                        {c.status}
                                    </span>
                                </div>
                                <p className="text-muted text-xs font-stats">
                                    /companies/{c.slug} · {c._count.users} moderator{c._count.users !== 1 ? "s" : ""} · {c._count.products} car{c._count.products !== 1 ? "s" : ""}
                                </p>
                            </div>
                            <Link
                                href={`/admin/companies/${c.id}`}
                                className="shrink-0 text-xs font-stats px-4 py-2 rounded-xl border border-surface-3 text-muted hover:text-white-soft hover:border-gold/30 transition-all focus-visible:ring-2 focus-visible:ring-gold/30"
                            >
                                Manage →
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
