"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Moderator {
    id: string; name: string | null; email: string; role: string; createdAt: string
}
interface CompanyProduct {
    id: string; name: string; brand: string; active: boolean; approvalStatus: string; pricePerDay: number
}
interface Company {
    id: string; name: string; slug: string; description: string | null
    logoUrl: string | null; website: string | null; address: string | null
    status: string; createdAt: string
    users:    Moderator[]
    products: CompanyProduct[]
}

export default function AdminCompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router  = useRouter()

    const [company,    setCompany]    = useState<Company | null>(null)
    const [loading,    setLoading]    = useState(true)
    const [tab,        setTab]        = useState<"moderators" | "cars">("moderators")
    const [showMod,    setShowMod]    = useState(false)
    const [modForm,    setModForm]    = useState({ name: "", email: "", password: "" })
    const [modSaving,  setModSaving]  = useState(false)
    const [modError,   setModError]   = useState("")
    const [editMode,   setEditMode]   = useState(false)
    const [editForm,   setEditForm]   = useState({ name: "", description: "", website: "", address: "", logoUrl: "", status: "ACTIVE" })
    const [editSaving, setEditSaving] = useState(false)

    const load = () => {
        setLoading(true)
        fetch(`/api/admin/companies/${id}`)
            .then(r => r.json())
            .then(data => {
                setCompany(data)
                setEditForm({
                    name:        data.name        ?? "",
                    description: data.description ?? "",
                    website:     data.website     ?? "",
                    address:     data.address     ?? "",
                    logoUrl:     data.logoUrl     ?? "",
                    status:      data.status      ?? "ACTIVE",
                })
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }

    useEffect(() => { load() }, [id])

    const handleAddModerator = async (e: React.FormEvent) => {
        e.preventDefault()
        setModSaving(true); setModError("")
        const res = await fetch(`/api/admin/companies/${id}/moderators`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify(modForm),
        })
        if (res.ok) {
            setShowMod(false)
            setModForm({ name: "", email: "", password: "" })
            load()
        } else {
            const d = await res.json()
            setModError(d.error ?? "Failed to add moderator")
        }
        setModSaving(false)
    }

    const handleRemoveModerator = async (userId: string) => {
        if (!confirm("Remove this moderator from the company?")) return
        await fetch(`/api/admin/companies/${id}/moderators?userId=${userId}`, { method: "DELETE" })
        load()
    }

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault()
        setEditSaving(true)
        await fetch(`/api/admin/companies/${id}`, {
            method:  "PATCH",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify(editForm),
        })
        setEditMode(false)
        setEditSaving(false)
        load()
    }

    const handleDelete = async () => {
        if (!confirm(`Delete company "${company?.name}"? This will unlink all moderators and cars.`)) return
        await fetch(`/api/admin/companies/${id}`, { method: "DELETE" })
        router.push("/admin/companies")
    }

    const APPROVAL_STYLE: Record<string, string> = {
        PENDING:  "bg-amber-500/10 text-amber-400 border-amber-500/25",
        APPROVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
        REJECTED: "bg-danger/10 text-danger border-danger/25",
    }

    if (loading) return <div className="text-center py-16 text-muted font-stats">Loading…</div>
    if (!company) return <div className="text-center py-16 text-muted font-stats">Company not found.</div>

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <Link href="/admin/companies" className="text-muted text-xs font-stats hover:text-white-soft transition-colors">
                        ← Companies
                    </Link>
                    <h1 className="font-heading text-3xl text-white-soft mt-2">{company.name}</h1>
                    <p className="text-muted text-sm font-stats mt-1">/companies/{company.slug}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setEditMode(true)}
                        className="text-xs font-stats px-4 py-2 rounded-xl border border-surface-3 text-muted hover:text-white-soft hover:border-gold/30 transition-all"
                    >
                        Edit
                    </button>
                    <button
                        onClick={handleDelete}
                        className="text-xs font-stats px-4 py-2 rounded-xl border border-danger/20 text-danger/80 hover:bg-danger/10 transition-all"
                    >
                        Delete
                    </button>
                </div>
            </div>

            {/* Edit form */}
            {editMode && (
                <div className="bg-surface border border-surface-3 rounded-2xl p-6">
                    <h2 className="font-heading text-xl text-white-soft mb-5">Edit Company</h2>
                    <form onSubmit={handleSaveEdit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                { key: "name",        label: "Name *"      },
                                { key: "website",     label: "Website"     },
                                { key: "address",     label: "Address"     },
                                { key: "logoUrl",     label: "Logo URL"    },
                            ].map(({ key, label }) => (
                                <div key={key}>
                                    <label className="block text-xs font-stats text-muted uppercase tracking-wider mb-1.5">{label}</label>
                                    <input
                                        value={(editForm as any)[key]}
                                        onChange={e => setEditForm(p => ({ ...p, [key]: e.target.value }))}
                                        className="w-full bg-surface-2 border border-surface-3 rounded-xl px-4 py-2.5 text-sm text-white-soft font-stats focus:outline-none focus:border-gold/50"
                                    />
                                </div>
                            ))}
                            <div>
                                <label className="block text-xs font-stats text-muted uppercase tracking-wider mb-1.5">Status</label>
                                <select
                                    value={editForm.status}
                                    onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}
                                    className="w-full bg-surface-2 border border-surface-3 rounded-xl px-4 py-2.5 text-sm text-white-soft font-stats focus:outline-none focus:border-gold/50"
                                >
                                    <option value="ACTIVE">ACTIVE</option>
                                    <option value="SUSPENDED">SUSPENDED</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-stats text-muted uppercase tracking-wider mb-1.5">Description</label>
                            <textarea
                                value={editForm.description}
                                onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                                rows={3}
                                className="w-full bg-surface-2 border border-surface-3 rounded-xl px-4 py-2.5 text-sm text-white-soft font-stats focus:outline-none focus:border-gold/50 resize-none"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button type="submit" disabled={editSaving} className="bg-gold hover:bg-gold-light disabled:opacity-50 text-dark font-body font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors">
                                {editSaving ? "Saving…" : "Save"}
                            </button>
                            <button type="button" onClick={() => setEditMode(false)} className="px-6 py-2.5 rounded-xl border border-surface-3 text-muted hover:text-white-soft text-sm font-stats transition-colors">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 border-b border-surface-3 pb-0">
                {(["moderators", "cars"] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-4 py-2 text-xs font-stats uppercase tracking-wider transition-colors border-b-2 -mb-px ${
                            tab === t
                                ? "border-gold text-gold"
                                : "border-transparent text-muted hover:text-white-soft"
                        }`}
                    >
                        {t === "moderators" ? `Moderators (${company.users.length})` : `Cars (${company.products.length})`}
                    </button>
                ))}
            </div>

            {/* Moderators tab */}
            {tab === "moderators" && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <p className="text-muted text-sm font-stats">Moderators can manage this company's fleet and bookings.</p>
                        <button
                            onClick={() => { setShowMod(true); setModError("") }}
                            className="text-xs font-stats px-4 py-2 rounded-xl bg-gold hover:bg-gold-light text-dark font-semibold transition-colors"
                        >
                            + Add Moderator
                        </button>
                    </div>

                    {showMod && (
                        <div className="bg-surface-2 border border-surface-3 rounded-2xl p-5">
                            <h3 className="font-heading text-lg text-white-soft mb-4">New Moderator Account</h3>
                            <form onSubmit={handleAddModerator} className="space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {[
                                        { key: "name",     label: "Full Name *",  type: "text"     },
                                        { key: "email",    label: "Email *",      type: "email"    },
                                        { key: "password", label: "Password *",   type: "password" },
                                    ].map(({ key, label, type }) => (
                                        <div key={key}>
                                            <label className="block text-xs font-stats text-muted uppercase tracking-wider mb-1.5">{label}</label>
                                            <input
                                                type={type}
                                                value={(modForm as any)[key]}
                                                onChange={e => setModForm(p => ({ ...p, [key]: e.target.value }))}
                                                className="w-full bg-surface border border-surface-3 rounded-xl px-3 py-2.5 text-sm text-white-soft font-stats focus:outline-none focus:border-gold/50"
                                            />
                                        </div>
                                    ))}
                                </div>
                                {modError && <p className="text-danger text-xs font-stats bg-danger/8 border border-danger/20 rounded-xl px-4 py-2">{modError}</p>}
                                <div className="flex gap-3">
                                    <button type="submit" disabled={modSaving} className="bg-gold hover:bg-gold-light disabled:opacity-50 text-dark font-body font-semibold px-5 py-2 rounded-xl text-sm transition-colors">
                                        {modSaving ? "Creating…" : "Create Account"}
                                    </button>
                                    <button type="button" onClick={() => setShowMod(false)} className="px-5 py-2 rounded-xl border border-surface-3 text-muted hover:text-white-soft text-sm font-stats transition-colors">
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {company.users.length === 0 ? (
                        <p className="text-muted text-sm font-stats text-center py-8">No moderators assigned yet.</p>
                    ) : (
                        <div className="space-y-2">
                            {company.users.map(u => (
                                <div key={u.id} className="flex items-center justify-between bg-surface border border-surface-3 rounded-xl px-5 py-3">
                                    <div>
                                        <p className="text-white-soft text-sm font-stats font-semibold">{u.name ?? "—"}</p>
                                        <p className="text-muted text-xs font-stats">{u.email}</p>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveModerator(u.id)}
                                        className="text-xs font-stats px-3 py-1.5 rounded-lg border border-danger/20 text-danger/70 hover:bg-danger/10 transition-all"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Cars tab */}
            {tab === "cars" && (
                <div className="space-y-2">
                    {company.products.length === 0 ? (
                        <p className="text-muted text-sm font-stats text-center py-8">No cars added by this company yet.</p>
                    ) : (
                        company.products.map(p => (
                            <div key={p.id} className="flex items-center justify-between bg-surface border border-surface-3 rounded-xl px-5 py-3">
                                <div>
                                    <p className="text-white-soft text-sm font-stats font-semibold">{p.brand} {p.name}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className={`text-[10px] font-stats px-2 py-0.5 rounded-full border ${APPROVAL_STYLE[p.approvalStatus] ?? "bg-surface-3 text-muted border-surface-3"}`}>
                                            {p.approvalStatus}
                                        </span>
                                        {!p.active && <span className="text-[10px] font-stats text-muted">inactive</span>}
                                        <span className="text-muted text-xs font-stats">€{p.pricePerDay}/day</span>
                                    </div>
                                </div>
                                <Link href={`/admin/cars/${p.id}/edit`} className="text-xs font-stats px-3 py-1.5 rounded-lg border border-surface-3 text-muted hover:text-white-soft hover:border-gold/30 transition-all">
                                    Edit
                                </Link>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}
