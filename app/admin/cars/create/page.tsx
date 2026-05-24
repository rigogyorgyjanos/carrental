"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

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

export default function CreateCarPage() {
    const router = useRouter()

    const [name,              setName]              = useState("")
    const [brand,             setBrand]             = useState("")
    const [model,             setModel]             = useState("")
    const [year,              setYear]              = useState(2024)
    const [category,          setCategory]          = useState("Sedan")
    const [description,       setDescription]       = useState("")
    const [pricePerDay,       setPricePerDay]       = useState<number | "">("")
    const [deposit,           setDeposit]           = useState<number | "">("")
    const [transmission,      setTransmission]      = useState("Automatic")
    const [fuelType,          setFuelType]          = useState("Petrol")
    const [seats,             setSeats]             = useState(4)
    const [horsepower,        setHorsepower]        = useState<number | "">("")
    const [drivetrain,        setDrivetrain]        = useState("")
    const [zeroToHundred,     setZeroToHundred]     = useState<number | "">("")
    const [topSpeed,          setTopSpeed]          = useState<number | "">("")
    const [mileage,           setMileage]           = useState(0)
    const [licensePlate,      setLicensePlate]      = useState("")
    const [location,          setLocation]          = useState("Budapest")
    const [minimumAge,        setMinimumAge]        = useState<number | "">("")
    const [minimumRentalDays, setMinimumRentalDays] = useState<number | "">("")
    const [dailyKmLimit,      setDailyKmLimit]      = useState<number | "">("")
    const [excessKmFee,       setExcessKmFee]       = useState<number | "">("")
    const [featured,          setFeatured]          = useState(false)
    const [active,            setActive]            = useState(true)
    const [images,            setImages]            = useState<string[]>([""])
    const [saving,            setSaving]            = useState(false)
    const [errorMsg,          setErrorMsg]          = useState("")

    const handleImageChange = (i: number, val: string) =>
        setImages(prev => prev.map((v, idx) => idx === i ? val : v))

    const handleSubmit = async (e: { preventDefault(): void }) => {
        e.preventDefault()
        if (!pricePerDay) { setErrorMsg("Price per day is required."); return }

        setSaving(true)
        setErrorMsg("")

        try {
            const res = await fetch("/api/admin/cars", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name, brand, model: model || "Unknown", year, category, description,
                    pricePerDay,
                    deposit:           deposit           !== "" ? deposit           : undefined,
                    transmission, fuelType, seats,
                    horsepower:        horsepower        !== "" ? horsepower        : undefined,
                    drivetrain:        drivetrain        || undefined,
                    zeroToHundred:     zeroToHundred     !== "" ? zeroToHundred     : undefined,
                    topSpeed:          topSpeed          !== "" ? topSpeed          : undefined,
                    mileage, licensePlate: licensePlate || "UNKNOWN", location,
                    minimumAge:        minimumAge        !== "" ? minimumAge        : undefined,
                    minimumRentalDays: minimumRentalDays !== "" ? minimumRentalDays : undefined,
                    dailyKmLimit:      dailyKmLimit      !== "" ? dailyKmLimit      : undefined,
                    excessKmFee:       excessKmFee       !== "" ? excessKmFee       : undefined,
                    featured, active,
                    images: images.filter(u => u.trim()),
                }),
            })
            if (res.ok) {
                router.push("/admin/cars")
            } else {
                const data = await res.json().catch(() => ({}))
                setErrorMsg(data.error ?? "Failed to create car.")
            }
        } catch {
            setErrorMsg("Network error. Please try again.")
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">

            {/* Header */}
            <div>
                <Link href="/admin/cars" className="text-muted text-xs font-stats hover:text-gold transition-colors">
                    ← Fleet
                </Link>
                <div className="mt-2">
                    <p className="text-gold text-[11px] font-stats uppercase tracking-[0.2em] mb-1">AURUM Admin</p>
                    <h1 className="font-heading text-3xl font-light text-white-soft">Add New Car</h1>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

                {/* Basic Info */}
                <Section title="Basic Info">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={LABEL}>Car Name *</label>
                            <input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. 911 Turbo S" className={INPUT} />
                        </div>
                        <div>
                            <label className={LABEL}>Brand *</label>
                            <input value={brand} onChange={e => setBrand(e.target.value)} required placeholder="e.g. Porsche" className={INPUT} />
                        </div>
                        <div>
                            <label className={LABEL}>Model</label>
                            <input value={model} onChange={e => setModel(e.target.value)} placeholder="e.g. 911" className={INPUT} />
                        </div>
                        <div>
                            <label className={LABEL}>Year</label>
                            <input type="number" value={year} min={1990} max={2030} onChange={e => setYear(Number(e.target.value))} className={INPUT} />
                        </div>
                        <div>
                            <label className={LABEL}>Category *</label>
                            <select value={category} onChange={e => setCategory(e.target.value)} className={SELECT}>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className={LABEL}>Description *</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} required rows={3} placeholder="Describe the car…" className={INPUT + " resize-none"} />
                    </div>
                </Section>

                {/* Pricing */}
                <Section title="Pricing">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={LABEL}>Price per Day (€) *</label>
                            <input type="number" value={pricePerDay} min={1} onChange={e => setPricePerDay(Number(e.target.value))} required className={INPUT} />
                        </div>
                        <div>
                            <label className={LABEL}>Deposit (€)</label>
                            <input type="number" value={deposit} min={0} onChange={e => setDeposit(e.target.value === "" ? "" : Number(e.target.value))} placeholder="Auto: 20% of total" className={INPUT} />
                        </div>
                        <div>
                            <label className={LABEL}>Daily km limit</label>
                            <input type="number" value={dailyKmLimit} min={1} onChange={e => setDailyKmLimit(e.target.value === "" ? "" : Number(e.target.value))} placeholder="Empty = unlimited" className={INPUT} />
                        </div>
                        <div>
                            <label className={LABEL}>Excess km fee (€/km)</label>
                            <input type="number" value={excessKmFee} min={0} step="0.01" onChange={e => setExcessKmFee(e.target.value === "" ? "" : Number(e.target.value))} placeholder="e.g. 0.50" className={INPUT} />
                        </div>
                    </div>
                </Section>

                {/* Technical */}
                <Section title="Technical Specs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={LABEL}>Transmission</label>
                            <select value={transmission} onChange={e => setTransmission(e.target.value)} className={SELECT}>
                                {TRANSMISSIONS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={LABEL}>Fuel Type</label>
                            <select value={fuelType} onChange={e => setFuelType(e.target.value)} className={SELECT}>
                                {FUEL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={LABEL}>Seats</label>
                            <input type="number" value={seats} min={1} max={12} onChange={e => setSeats(Number(e.target.value))} className={INPUT} />
                        </div>
                        <div>
                            <label className={LABEL}>Drivetrain</label>
                            <select value={drivetrain} onChange={e => setDrivetrain(e.target.value)} className={SELECT}>
                                {DRIVETRAINS.map(d => <option key={d} value={d}>{d || "—"}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={LABEL}>Horsepower (hp)</label>
                            <input type="number" value={horsepower} min={0} onChange={e => setHorsepower(e.target.value === "" ? "" : Number(e.target.value))} placeholder="e.g. 650" className={INPUT} />
                        </div>
                        <div>
                            <label className={LABEL}>0–100 km/h (s)</label>
                            <input type="number" value={zeroToHundred} step="0.1" min={0} onChange={e => setZeroToHundred(e.target.value === "" ? "" : Number(e.target.value))} placeholder="e.g. 3.2" className={INPUT} />
                        </div>
                        <div>
                            <label className={LABEL}>Top Speed (km/h)</label>
                            <input type="number" value={topSpeed} min={0} onChange={e => setTopSpeed(e.target.value === "" ? "" : Number(e.target.value))} placeholder="e.g. 330" className={INPUT} />
                        </div>
                        <div>
                            <label className={LABEL}>Mileage (km)</label>
                            <input type="number" value={mileage} min={0} onChange={e => setMileage(Number(e.target.value))} className={INPUT} />
                        </div>
                    </div>
                </Section>

                {/* Location */}
                <Section title="Location & Restrictions">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={LABEL}>Location</label>
                            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Budapest" className={INPUT} />
                        </div>
                        <div>
                            <label className={LABEL}>License Plate</label>
                            <input value={licensePlate} onChange={e => setLicensePlate(e.target.value)} placeholder="e.g. ABC-123" className={INPUT} />
                        </div>
                        <div>
                            <label className={LABEL}>Minimum Age</label>
                            <input type="number" value={minimumAge} min={18} max={99} onChange={e => setMinimumAge(e.target.value === "" ? "" : Number(e.target.value))} placeholder="e.g. 25" className={INPUT} />
                        </div>
                        <div>
                            <label className={LABEL}>Minimum Rental Days</label>
                            <input type="number" value={minimumRentalDays} min={1} onChange={e => setMinimumRentalDays(e.target.value === "" ? "" : Number(e.target.value))} placeholder="e.g. 3" className={INPUT} />
                        </div>
                    </div>
                </Section>

                {/* Status */}
                <Section title="Status">
                    <div className="flex flex-wrap gap-3">
                        <ToggleBtn label="Active"   value={active}   onChange={setActive} />
                        <ToggleBtn label="Featured" value={featured} onChange={setFeatured} />
                    </div>
                </Section>

                {/* Images */}
                <Section title="Images (URLs)">
                    <div className="space-y-2">
                        {images.map((url, i) => (
                            <div key={i} className="flex gap-2 items-center">
                                <input
                                    type="url"
                                    value={url}
                                    onChange={e => handleImageChange(i, e.target.value)}
                                    placeholder="https://…"
                                    className={INPUT + " flex-1"}
                                />
                                {url && (
                                    <img src={url} alt="" className="h-10 w-16 object-cover rounded-lg border border-surface-3 shrink-0" />
                                )}
                                {images.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                                        className="text-danger/70 hover:text-danger text-xs font-stats px-2 py-1 rounded-lg border border-danger/20 hover:bg-danger/10 transition-colors shrink-0"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => setImages(prev => [...prev, ""])}
                            className="text-[11px] font-stats text-muted hover:text-gold border border-surface-3 hover:border-gold/20 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            + Add Image
                        </button>
                    </div>
                </Section>

                {/* Error */}
                {errorMsg && (
                    <p className="text-danger text-xs font-stats bg-danger/8 border border-danger/20 rounded-xl px-4 py-2">
                        {errorMsg}
                    </p>
                )}

                {/* Submit */}
                <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-gold hover:bg-gold-light disabled:opacity-60 disabled:cursor-not-allowed text-dark font-body font-semibold py-4 rounded-xl transition-colors text-sm"
                >
                    {saving ? "Creating…" : "Add Car"}
                </button>
            </form>
        </div>
    )
}
