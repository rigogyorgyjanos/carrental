"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Props {
    isAdmin:        boolean
    companies?:     { id: string; name: string }[]
    allCategories:  string[]
    allBrands:      string[]
    backHref:       string
    companyId?:     string   // pre-set for moderator
}

const EFFECT_TYPES = [
    { value: "DISCOUNT_PCT",      label: "% Discount",        hint: "e.g. 10 = 10% off" },
    { value: "XP_MULTIPLIER",     label: "XP Multiplier",     hint: "e.g. 2 = 2× XP" },
    { value: "EXTRA_KM_PER_DAY",  label: "Extra km / day",    hint: "e.g. 50 = +50 km/day free" },
    { value: "FREE_DAYS",         label: "Free days",         hint: "e.g. 1 = cheapest day free" },
]

export default function EventForm({ isAdmin, companies = [], allCategories, allBrands, backHref, companyId }: Props) {
    const router = useRouter()

    const [title,       setTitle]       = useState("")
    const [description, setDesc]        = useState("")
    const [startsAt,    setStartsAt]    = useState("")
    const [endsAt,      setEndsAt]      = useState("")
    const [effectType,  setEffectType]  = useState("DISCOUNT_PCT")
    const [effectValue, setEffectValue] = useState("")
    const [categories,  setCategories]  = useState<string[]>([])
    const [brands,      setBrands]      = useState<string[]>([])
    const [minDays,     setMinDays]     = useState("")
    const [selCompany,  setSelCompany]  = useState(companyId ?? "")

    const [loading, setLoading] = useState(false)
    const [error,   setError]   = useState("")

    function toggleItem(arr: string[], item: string, setter: (v: string[]) => void) {
        setter(arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item])
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError("")
        setLoading(true)

        const res = await fetch("/api/events", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({
                title,
                description: description || null,
                startsAt:    startsAt ? new Date(startsAt).toISOString() : null,
                endsAt:      endsAt   ? new Date(endsAt).toISOString()   : null,
                effectType,
                effectValue: parseFloat(effectValue),
                targetCategories: categories,
                targetBrands:     brands,
                minDays:          minDays ? parseInt(minDays) : null,
                companyId:        isAdmin ? (selCompany || null) : (companyId ?? null),
            }),
        })

        const data = await res.json().catch(() => ({}))
        setLoading(false)

        if (res.ok) {
            router.push(backHref)
            router.refresh()
        } else {
            setError(data.error ?? "Something went wrong")
        }
    }

    const hintText = EFFECT_TYPES.find(t => t.value === effectType)?.hint ?? ""

    return (
        <form onSubmit={handleSubmit} className="space-y-6">

            {/* Title */}
            <div>
                <label className="block text-xs font-stats text-muted-2 uppercase tracking-wider mb-2">Event Title *</label>
                <input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
                    placeholder="e.g. HyperCar Weekend"
                    className="w-full bg-surface border border-surface-3 focus:border-gold/40 rounded-xl px-4 py-3 text-sm font-stats text-white-soft placeholder:text-muted focus:outline-none transition-colors"
                />
            </div>

            {/* Description */}
            <div>
                <label className="block text-xs font-stats text-muted-2 uppercase tracking-wider mb-2">Description</label>
                <textarea
                    value={description}
                    onChange={e => setDesc(e.target.value)}
                    rows={3}
                    placeholder="What is this event about?"
                    className="w-full bg-surface border border-surface-3 focus:border-gold/40 rounded-xl px-4 py-3 text-sm font-stats text-white-soft placeholder:text-muted focus:outline-none transition-colors resize-none"
                />
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-stats text-muted-2 uppercase tracking-wider mb-2">Starts *</label>
                    <input
                        type="datetime-local"
                        value={startsAt}
                        onChange={e => setStartsAt(e.target.value)}
                        required
                        className="w-full bg-surface border border-surface-3 focus:border-gold/40 rounded-xl px-4 py-3 text-sm font-stats text-white-soft focus:outline-none transition-colors"
                    />
                </div>
                <div>
                    <label className="block text-xs font-stats text-muted-2 uppercase tracking-wider mb-2">Ends *</label>
                    <input
                        type="datetime-local"
                        value={endsAt}
                        onChange={e => setEndsAt(e.target.value)}
                        required
                        className="w-full bg-surface border border-surface-3 focus:border-gold/40 rounded-xl px-4 py-3 text-sm font-stats text-white-soft focus:outline-none transition-colors"
                    />
                </div>
            </div>

            {/* Effect */}
            <div>
                <label className="block text-xs font-stats text-muted-2 uppercase tracking-wider mb-2">Effect Type *</label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                    {EFFECT_TYPES.map(t => (
                        <button
                            key={t.value}
                            type="button"
                            onClick={() => setEffectType(t.value)}
                            className={`text-left px-4 py-3 rounded-xl border text-sm font-stats transition-colors ${
                                effectType === t.value
                                    ? "bg-gold/10 border-gold/40 text-gold"
                                    : "bg-surface border-surface-3 text-muted hover:border-gold/20 hover:text-white-soft"
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
                <div>
                    <label className="block text-xs font-stats text-muted-2 uppercase tracking-wider mb-2">
                        Value * <span className="text-muted normal-case tracking-normal">({hintText})</span>
                    </label>
                    <input
                        type="number"
                        value={effectValue}
                        onChange={e => setEffectValue(e.target.value)}
                        required
                        min={0}
                        step="any"
                        className="w-full bg-surface border border-surface-3 focus:border-gold/40 rounded-xl px-4 py-3 text-sm font-stats text-white-soft placeholder:text-muted focus:outline-none transition-colors"
                    />
                </div>
            </div>

            {/* Target categories */}
            {allCategories.length > 0 && (
                <div>
                    <label className="block text-xs font-stats text-muted-2 uppercase tracking-wider mb-2">
                        Target Categories <span className="normal-case tracking-normal text-muted">(empty = all)</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {allCategories.map(c => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => toggleItem(categories, c, setCategories)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-stats border transition-colors ${
                                    categories.includes(c)
                                        ? "bg-gold/10 border-gold/40 text-gold"
                                        : "bg-surface border-surface-3 text-muted hover:border-gold/20 hover:text-white-soft"
                                }`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Target brands */}
            {allBrands.length > 0 && (
                <div>
                    <label className="block text-xs font-stats text-muted-2 uppercase tracking-wider mb-2">
                        Target Brands <span className="normal-case tracking-normal text-muted">(empty = all)</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {allBrands.map(b => (
                            <button
                                key={b}
                                type="button"
                                onClick={() => toggleItem(brands, b, setBrands)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-stats border transition-colors ${
                                    brands.includes(b)
                                        ? "bg-gold/10 border-gold/40 text-gold"
                                        : "bg-surface border-surface-3 text-muted hover:border-gold/20 hover:text-white-soft"
                                }`}
                            >
                                {b}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Min days */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-stats text-muted-2 uppercase tracking-wider mb-2">
                        Min. Rental Days <span className="normal-case tracking-normal text-muted">(optional)</span>
                    </label>
                    <input
                        type="number"
                        value={minDays}
                        onChange={e => setMinDays(e.target.value)}
                        min={1}
                        placeholder="e.g. 7"
                        className="w-full bg-surface border border-surface-3 focus:border-gold/40 rounded-xl px-4 py-3 text-sm font-stats text-white-soft placeholder:text-muted focus:outline-none transition-colors"
                    />
                </div>

                {/* Company selector — admin only */}
                {isAdmin && companies.length > 0 && (
                    <div>
                        <label className="block text-xs font-stats text-muted-2 uppercase tracking-wider mb-2">
                            Company <span className="normal-case tracking-normal text-muted">(empty = global)</span>
                        </label>
                        <select
                            value={selCompany}
                            onChange={e => setSelCompany(e.target.value)}
                            className="w-full bg-surface border border-surface-3 focus:border-gold/40 rounded-xl px-4 py-3 text-sm font-stats text-white-soft focus:outline-none transition-colors"
                        >
                            <option value="">— Global event —</option>
                            {companies.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {error && (
                <p className="text-danger text-xs font-stats bg-danger/8 border border-danger/20 rounded-xl px-4 py-3">
                    {error}
                </p>
            )}

            <div className="flex gap-3 pt-2">
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gold hover:bg-gold-light disabled:opacity-50 text-dark font-semibold py-3.5 rounded-xl text-sm transition-colors"
                >
                    {loading ? "Creating…" : isAdmin ? "Create & Notify" : "Submit for Approval"}
                </button>
                <a
                    href={backHref}
                    className="px-6 py-3.5 bg-surface border border-surface-3 hover:border-gold/20 text-white-soft rounded-xl text-sm font-stats transition-colors text-center"
                >
                    Cancel
                </a>
            </div>
        </form>
    )
}
