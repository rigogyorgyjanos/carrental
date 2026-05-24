"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Props { carId: string }

interface Car {
    id:                string
    name:              string
    brand:             string
    model:             string
    year:              number
    category:          string
    description:       string
    pricePerDay:       number
    deposit:           number | null
    transmission:      string
    fuelType:          string
    seats:             number
    horsepower:        number | null
    drivetrain:        string | null
    zeroToHundred:     number | null
    topSpeed:          number | null
    mileage:           number
    licensePlate:      string
    location:          string
    minimumAge:        number | null
    minimumRentalDays: number | null
    dailyKmLimit:      number | null
    excessKmFee:       number | null
    featured:          boolean
    active:            boolean
    images:            { id?: string; url: string }[]
}

const CATEGORIES    = ["Compact", "Sedan", "Sport", "SUV", "Standard", "Premium", "Luxury", "Supercar", "Hypercar"]
const TRANSMISSIONS = ["Automatic", "Manual", "Semi-Automatic"]
const FUEL_TYPES    = ["Petrol", "Diesel", "Electric", "Hybrid"]
const DRIVETRAINS   = ["", "FWD", "RWD", "AWD", "4WD"]

const INPUT  = "w-full bg-dark border border-surface-3 rounded-xl px-3 py-2.5 text-sm font-stats text-white-soft placeholder:text-muted focus:outline-none focus:border-gold/40 transition-colors"
const SELECT = "w-full bg-dark border border-surface-3 rounded-xl px-3 py-2.5 text-sm font-stats text-white-soft focus:outline-none focus:border-gold/40 transition-colors"
const LABEL  = "block text-[11px] font-stats text-muted uppercase tracking-wider mb-1"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-surface border border-surface-3 rounded-2xl p-6 space-y-4">
            <p className="text-[11px] font-stats text-gold uppercase tracking-[0.15em]">{title}</p>
            {children}
        </div>
    )
}

function ToggleBtn({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!value)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-stats transition-colors ${
                value
                    ? "bg-gold/15 border-gold/30 text-gold"
                    : "bg-surface-2 border-surface-3 text-muted"
            }`}
        >
            <span className={`w-3 h-3 rounded-full border ${value ? "bg-gold border-gold" : "border-muted"}`} />
            {label}
        </button>
    )
}

export default function CarEditForm({ carId }: Props) {
    const router  = useRouter()
    const [car,        setCar]        = useState<Car | null>(null)
    const [saving,     setSaving]     = useState(false)
    const [successMsg, setSuccessMsg] = useState("")
    const [errorMsg,   setErrorMsg]   = useState("")

    useEffect(() => {
        fetch(`/api/admin/cars/${carId}`)
            .then(r => r.json())
            .then((data: Car) => setCar({
                ...data,
                images: data.images ?? [],
            }))
            .catch(() => setErrorMsg("Failed to load car data."))
    }, [carId])

    const set = <K extends keyof Car>(key: K, val: Car[K]) =>
        setCar(prev => prev ? { ...prev, [key]: val } : prev)

    const handleSubmit = async (e: { preventDefault(): void }) => {
        e.preventDefault()
        if (!car) return

        setSaving(true)
        setSuccessMsg("")
        setErrorMsg("")

        try {
            const res = await fetch(`/api/admin/cars/${carId}`, {
                method:  "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...car,
                    images: car.images.map(i => i.url).filter(u => u.trim()),
                }),
            })
            if (res.ok) {
                setSuccessMsg("Changes saved.")
                setTimeout(() => router.push("/admin/cars"), 1200)
            } else {
                const data = await res.json().catch(() => ({}))
                setErrorMsg(data.error ?? "Save failed.")
            }
        } catch {
            setErrorMsg("Network error. Please try again.")
        } finally {
            setSaving(false)
        }
    }

    if (!car && !errorMsg) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="w-6 h-6 border-2 border-surface-3 border-t-gold rounded-full animate-spin" />
            </div>
        )
    }

    if (errorMsg && !car) {
        return (
            <div className="text-center py-24 space-y-3">
                <p className="text-danger font-stats text-sm">{errorMsg}</p>
                <Link href="/admin/cars" className="text-gold text-xs font-stats hover:underline">← Fleet</Link>
            </div>
        )
    }

    if (!car) return null

    return (
        <div className="max-w-3xl mx-auto space-y-6">

            {/* Header */}
            <div>
                <Link href="/admin/cars" className="text-muted text-xs font-stats hover:text-gold transition-colors">
                    ← Fleet
                </Link>
                <div className="mt-2">
                    <p className="text-gold text-[11px] font-stats uppercase tracking-[0.2em] mb-1">AURUM Admin</p>
                    <h1 className="font-heading text-3xl font-light text-white-soft">
                        {car.brand} {car.name}
                    </h1>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

                {/* Basic Info */}
                <Section title="Basic Info">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={LABEL}>Car Name *</label>
                            <input value={car.name} onChange={e => set("name", e.target.value)} required className={INPUT} />
                        </div>
                        <div>
                            <label className={LABEL}>Brand *</label>
                            <input value={car.brand} onChange={e => set("brand", e.target.value)} required className={INPUT} />
                        </div>
                        <div>
                            <label className={LABEL}>Model</label>
                            <input value={car.model} onChange={e => set("model", e.target.value)} className={INPUT} />
                        </div>
                        <div>
                            <label className={LABEL}>Year</label>
                            <input type="number" value={car.year} min={1990} max={2030} onChange={e => set("year", Number(e.target.value))} className={INPUT} />
                        </div>
                        <div>
                            <label className={LABEL}>Category *</label>
                            <select value={car.category} onChange={e => set("category", e.target.value)} className={SELECT}>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className={LABEL}>Description *</label>
                        <textarea value={car.description} onChange={e => set("description", e.target.value)} required rows={3} className={INPUT + " resize-none"} />
                    </div>
                </Section>

                {/* Pricing */}
                <Section title="Pricing">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={LABEL}>Price per Day (€) *</label>
                            <input type="number" value={car.pricePerDay} min={1} onChange={e => set("pricePerDay", Number(e.target.value))} required className={INPUT} />
                        </div>
                        <div>
                            <label className={LABEL}>Deposit (€)</label>
                            <input type="number" value={car.deposit ?? ""} min={0} onChange={e => set("deposit", e.target.value === "" ? null : Number(e.target.value))} placeholder="Auto: 20% of total" className={INPUT} />
                        </div>
                        <div>
                            <label className={LABEL}>Daily km limit</label>
                            <input type="number" value={car.dailyKmLimit ?? ""} min={1} onChange={e => set("dailyKmLimit", e.target.value === "" ? null : Number(e.target.value))} placeholder="Empty = unlimited" className={INPUT} />
                        </div>
                        <div>
                            <label className={LABEL}>Excess km fee (€/km)</label>
                            <input type="number" value={car.excessKmFee ?? ""} min={0} step="0.01" onChange={e => set("excessKmFee", e.target.value === "" ? null : Number(e.target.value))} placeholder="e.g. 0.50" className={INPUT} />
                        </div>
                    </div>
                </Section>

                {/* Technical */}
                <Section title="Technical Specs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={LABEL}>Transmission</label>
                            <select value={car.transmission} onChange={e => set("transmission", e.target.value)} className={SELECT}>
                                {TRANSMISSIONS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={LABEL}>Fuel Type</label>
                            <select value={car.fuelType} onChange={e => set("fuelType", e.target.value)} className={SELECT}>
                                {FUEL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={LABEL}>Seats</label>
                            <input type="number" value={car.seats} min={1} max={12} onChange={e => set("seats", Number(e.target.value))} className={INPUT} />
                        </div>
                        <div>
                            <label className={LABEL}>Drivetrain</label>
                            <select value={car.drivetrain ?? ""} onChange={e => set("drivetrain", e.target.value || null)} className={SELECT}>
                                {DRIVETRAINS.map(d => <option key={d} value={d}>{d || "—"}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={LABEL}>Horsepower (hp)</label>
                            <input type="number" value={car.horsepower ?? ""} min={0} onChange={e => set("horsepower", e.target.value === "" ? null : Number(e.target.value))} placeholder="e.g. 650" className={INPUT} />
                        </div>
                        <div>
                            <label className={LABEL}>0–100 km/h (s)</label>
                            <input type="number" value={car.zeroToHundred ?? ""} step="0.1" min={0} onChange={e => set("zeroToHundred", e.target.value === "" ? null : Number(e.target.value))} placeholder="e.g. 3.2" className={INPUT} />
                        </div>
                        <div>
                            <label className={LABEL}>Top Speed (km/h)</label>
                            <input type="number" value={car.topSpeed ?? ""} min={0} onChange={e => set("topSpeed", e.target.value === "" ? null : Number(e.target.value))} placeholder="e.g. 330" className={INPUT} />
                        </div>
                        <div>
                            <label className={LABEL}>Mileage (km)</label>
                            <input type="number" value={car.mileage} min={0} onChange={e => set("mileage", Number(e.target.value))} className={INPUT} />
                        </div>
                    </div>
                </Section>

                {/* Location */}
                <Section title="Location & Restrictions">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={LABEL}>Location</label>
                            <input value={car.location} onChange={e => set("location", e.target.value)} className={INPUT} />
                        </div>
                        <div>
                            <label className={LABEL}>License Plate</label>
                            <input value={car.licensePlate} onChange={e => set("licensePlate", e.target.value)} className={INPUT} />
                        </div>
                        <div>
                            <label className={LABEL}>Minimum Age</label>
                            <input type="number" value={car.minimumAge ?? ""} min={18} max={99} onChange={e => set("minimumAge", e.target.value === "" ? null : Number(e.target.value))} placeholder="e.g. 25" className={INPUT} />
                        </div>
                        <div>
                            <label className={LABEL}>Minimum Rental Days</label>
                            <input type="number" value={car.minimumRentalDays ?? ""} min={1} onChange={e => set("minimumRentalDays", e.target.value === "" ? null : Number(e.target.value))} placeholder="e.g. 3" className={INPUT} />
                        </div>
                    </div>
                </Section>

                {/* Status */}
                <Section title="Status">
                    <div className="flex flex-wrap gap-3">
                        <ToggleBtn label="Active"   value={car.active}   onChange={v => set("active",   v)} />
                        <ToggleBtn label="Featured" value={car.featured} onChange={v => set("featured", v)} />
                    </div>
                </Section>

                {/* Images */}
                <Section title="Images (URLs)">
                    <div className="space-y-2">
                        {car.images.map((img, i) => (
                            <div key={i} className="flex gap-2 items-center">
                                <input
                                    type="url"
                                    value={img.url}
                                    onChange={e => set("images", car.images.map((im, idx) =>
                                        idx === i ? { ...im, url: e.target.value } : im
                                    ))}
                                    placeholder="https://…"
                                    className={INPUT + " flex-1"}
                                />
                                {img.url && (
                                    <img src={img.url} alt="" className="h-10 w-16 object-cover rounded-lg border border-surface-3 shrink-0" />
                                )}
                                <button
                                    type="button"
                                    onClick={() => set("images", car.images.filter((_, idx) => idx !== i))}
                                    className="text-danger/70 hover:text-danger text-xs font-stats px-2 py-1 rounded-lg border border-danger/20 hover:bg-danger/10 transition-colors shrink-0"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => set("images", [...car.images, { url: "" }])}
                            className="text-[11px] font-stats text-muted hover:text-gold border border-surface-3 hover:border-gold/20 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            + Add Image
                        </button>
                    </div>
                </Section>

                {/* Feedback */}
                {errorMsg && (
                    <p className="text-danger text-xs font-stats bg-danger/8 border border-danger/20 rounded-xl px-4 py-2">
                        {errorMsg}
                    </p>
                )}
                {successMsg && (
                    <p className="text-emerald-400 text-xs font-stats bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-4 py-2">
                        {successMsg}
                    </p>
                )}

                {/* Submit */}
                <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-gold hover:bg-gold-light disabled:opacity-60 disabled:cursor-not-allowed text-dark font-body font-semibold py-4 rounded-xl transition-colors text-sm"
                >
                    {saving ? "Saving…" : "Save Changes"}
                </button>
            </form>
        </div>
    )
}
