"use client"

import { useEffect, useRef, useState, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import ImageUploader, { type ImageUploaderHandle } from "@/components/ImageUploader"

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

export default function ModeratorEditCarPage({ params }: { params: Promise<{ id: string }> }) {
    const { id }      = use(params)
    const router      = useRouter()
    const uploaderRef = useRef<ImageUploaderHandle>(null)

    const [loading,           setLoading]           = useState(true)
    const [approvalStatus,    setApprovalStatus]    = useState("")
    const [adminNote,         setAdminNote]         = useState<string | null>(null)
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
    const [location,          setLocation]          = useState("")
    const [minimumAge,        setMinimumAge]        = useState<number | "">("")
    const [minimumRentalDays, setMinimumRentalDays] = useState<number | "">("")
    const [dailyKmLimit,      setDailyKmLimit]      = useState<number | "">("")
    const [excessKmFee,       setExcessKmFee]       = useState<number | "">("")
    const [initialImageUrls,  setInitialImageUrls]  = useState<string[]>([])
    const [saving,            setSaving]            = useState(false)
    const [errorMsg,          setErrorMsg]          = useState("")

    useEffect(() => {
        fetch(`/api/moderator/fleet/${id}`)
            .then(r => r.json())
            .then((car: any) => {
                setApprovalStatus(car.approvalStatus ?? "")
                setAdminNote(car.adminNote ?? null)
                setName(car.name ?? "")
                setBrand(car.brand ?? "")
                setModel(car.model ?? "")
                setYear(car.year ?? 2024)
                setCategory(car.category ?? "Sedan")
                setDescription(car.description ?? "")
                setPricePerDay(car.pricePerDay ?? "")
                setDeposit(car.deposit ?? "")
                setTransmission(car.transmission ?? "Automatic")
                setFuelType(car.fuelType ?? "Petrol")
                setSeats(car.seats ?? 4)
                setHorsepower(car.horsepower ?? "")
                setDrivetrain(car.drivetrain ?? "")
                setZeroToHundred(car.zeroToHundred ?? "")
                setTopSpeed(car.topSpeed ?? "")
                setMileage(car.mileage ?? 0)
                setLicensePlate(car.licensePlate ?? "")
                setLocation(car.location ?? "")
                setMinimumAge(car.minimumAge ?? "")
                setMinimumRentalDays(car.minimumRentalDays ?? "")
                setDailyKmLimit(car.dailyKmLimit ?? "")
                setExcessKmFee(car.excessKmFee ?? "")
                setInitialImageUrls(car.images?.length ? car.images.map((i: any) => i.url) : [])
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [id])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setErrorMsg("")
        try {
            const imageUrls = await uploaderRef.current?.uploadAll() ?? []

            const res = await fetch(`/api/moderator/fleet/${id}`, {
                method:  "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name, brand, model: model || "Unknown", year, category, description,
                    pricePerDay,
                    deposit:           deposit           !== "" ? deposit           : null,
                    transmission, fuelType, seats,
                    horsepower:        horsepower        !== "" ? horsepower        : null,
                    drivetrain:        drivetrain        || null,
                    zeroToHundred:     zeroToHundred     !== "" ? zeroToHundred     : null,
                    topSpeed:          topSpeed          !== "" ? topSpeed          : null,
                    mileage, licensePlate: licensePlate || "UNKNOWN", location,
                    minimumAge:        minimumAge        !== "" ? minimumAge        : null,
                    minimumRentalDays: minimumRentalDays !== "" ? minimumRentalDays : null,
                    dailyKmLimit:      dailyKmLimit      !== "" ? dailyKmLimit      : null,
                    excessKmFee:       excessKmFee       !== "" ? excessKmFee       : null,
                    images: imageUrls,
                }),
            })
            if (res.ok) {
                router.push("/moderator/fleet")
            } else {
                const data = await res.json().catch(() => ({}))
                setErrorMsg(data.error ?? "Failed to save.")
            }
        } catch (err: any) {
            setErrorMsg(err?.message ?? "Network error.")
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="text-center py-16 text-muted font-stats">Loading…</div>

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <Link href="/moderator/fleet" className="text-muted text-xs font-stats hover:text-gold transition-colors">← Fleet</Link>
                <div className="mt-2">
                    <p className="text-gold text-[11px] font-stats uppercase tracking-[0.2em] mb-1">Fleet Portal</p>
                    <h1 className="font-heading text-3xl font-light text-white-soft">Edit Car</h1>
                </div>

                {approvalStatus === "REJECTED" && adminNote && (
                    <div className="mt-3 bg-danger/8 border border-danger/20 rounded-xl px-4 py-3">
                        <p className="text-danger text-xs font-stats">
                            <span className="font-semibold">Rejected — Admin feedback:</span> {adminNote}
                        </p>
                        <p className="text-danger/60 text-[11px] font-stats mt-1">Edit and save to resubmit for review.</p>
                    </div>
                )}
                {approvalStatus === "PENDING" && (
                    <div className="mt-3 bg-amber-500/8 border border-amber-500/20 rounded-xl px-4 py-2.5">
                        <p className="text-amber-400/90 text-xs font-stats">This car is pending admin review. Saving will keep it in review.</p>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <Section title="Basic Info">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className={LABEL}>Car Name *</label><input value={name} onChange={e => setName(e.target.value)} required className={INPUT} /></div>
                        <div><label className={LABEL}>Brand *</label><input value={brand} onChange={e => setBrand(e.target.value)} required className={INPUT} /></div>
                        <div><label className={LABEL}>Model</label><input value={model} onChange={e => setModel(e.target.value)} className={INPUT} /></div>
                        <div><label className={LABEL}>Year</label><input type="number" value={year} min={1990} max={2030} onChange={e => setYear(Number(e.target.value))} className={INPUT} /></div>
                        <div>
                            <label className={LABEL}>Category</label>
                            <select value={category} onChange={e => setCategory(e.target.value)} className={SELECT}>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                    <div><label className={LABEL}>Description *</label><textarea value={description} onChange={e => setDescription(e.target.value)} required rows={3} className={INPUT + " resize-none"} /></div>
                </Section>

                <Section title="Pricing">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className={LABEL}>Price per Day (€) *</label><input type="number" value={pricePerDay} min={1} onChange={e => setPricePerDay(Number(e.target.value))} required className={INPUT} /></div>
                        <div><label className={LABEL}>Deposit (€)</label><input type="number" value={deposit} min={0} onChange={e => setDeposit(e.target.value === "" ? "" : Number(e.target.value))} placeholder="Auto: 20% of total" className={INPUT} /></div>
                        <div><label className={LABEL}>Daily km limit</label><input type="number" value={dailyKmLimit} min={1} onChange={e => setDailyKmLimit(e.target.value === "" ? "" : Number(e.target.value))} placeholder="Empty = unlimited" className={INPUT} /></div>
                        <div><label className={LABEL}>Excess km fee (€/km)</label><input type="number" value={excessKmFee} min={0} step="0.01" onChange={e => setExcessKmFee(e.target.value === "" ? "" : Number(e.target.value))} className={INPUT} /></div>
                    </div>
                </Section>

                <Section title="Technical Specs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className={LABEL}>Transmission</label><select value={transmission} onChange={e => setTransmission(e.target.value)} className={SELECT}>{TRANSMISSIONS.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                        <div><label className={LABEL}>Fuel Type</label><select value={fuelType} onChange={e => setFuelType(e.target.value)} className={SELECT}>{FUEL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
                        <div><label className={LABEL}>Seats</label><input type="number" value={seats} min={1} max={12} onChange={e => setSeats(Number(e.target.value))} className={INPUT} /></div>
                        <div><label className={LABEL}>Drivetrain</label><select value={drivetrain} onChange={e => setDrivetrain(e.target.value)} className={SELECT}>{DRIVETRAINS.map(d => <option key={d} value={d}>{d || "—"}</option>)}</select></div>
                        <div><label className={LABEL}>Horsepower (hp)</label><input type="number" value={horsepower} min={0} onChange={e => setHorsepower(e.target.value === "" ? "" : Number(e.target.value))} className={INPUT} /></div>
                        <div><label className={LABEL}>0–100 km/h (s)</label><input type="number" value={zeroToHundred} step="0.1" min={0} onChange={e => setZeroToHundred(e.target.value === "" ? "" : Number(e.target.value))} className={INPUT} /></div>
                        <div><label className={LABEL}>Top Speed (km/h)</label><input type="number" value={topSpeed} min={0} onChange={e => setTopSpeed(e.target.value === "" ? "" : Number(e.target.value))} className={INPUT} /></div>
                        <div><label className={LABEL}>Mileage (km)</label><input type="number" value={mileage} min={0} onChange={e => setMileage(Number(e.target.value))} className={INPUT} /></div>
                    </div>
                </Section>

                <Section title="Location & Restrictions">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className={LABEL}>Location</label><input value={location} onChange={e => setLocation(e.target.value)} className={INPUT} /></div>
                        <div><label className={LABEL}>License Plate</label><input value={licensePlate} onChange={e => setLicensePlate(e.target.value)} className={INPUT} /></div>
                        <div><label className={LABEL}>Minimum Age</label><input type="number" value={minimumAge} min={18} onChange={e => setMinimumAge(e.target.value === "" ? "" : Number(e.target.value))} className={INPUT} /></div>
                        <div><label className={LABEL}>Minimum Rental Days</label><input type="number" value={minimumRentalDays} min={1} onChange={e => setMinimumRentalDays(e.target.value === "" ? "" : Number(e.target.value))} className={INPUT} /></div>
                    </div>
                </Section>

                <Section title="Images">
                    {!loading && (
                        <ImageUploader ref={uploaderRef} initialUrls={initialImageUrls} />
                    )}
                </Section>

                {errorMsg && <p className="text-danger text-xs font-stats bg-danger/8 border border-danger/20 rounded-xl px-4 py-2">{errorMsg}</p>}

                <button type="submit" disabled={saving}
                    className="w-full bg-gold hover:bg-gold-light disabled:opacity-60 text-dark font-body font-semibold py-4 rounded-xl transition-colors text-sm">
                    {saving ? "Uploading & Saving…" : approvalStatus === "REJECTED" ? "Save & Resubmit" : "Save Changes"}
                </button>
            </form>
        </div>
    )
}
