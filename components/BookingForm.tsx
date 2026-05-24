"use client"

import { useEffect, useState, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { DayPicker } from "react-day-picker"
import "react-day-picker/dist/style.css"
import { addDays, differenceInDays, isAfter, isBefore, format, startOfDay } from "date-fns"
import { getXpPerDay, getTier } from "@/lib/tiers"

interface Props {
    carId:              string
    pricePerDay:        number
    category?:          string
    deposit?:           number | null
    minimumRentalDays?: number | null
    dailyKmLimit?:      number | null
    excessKmFee?:       number | null
}

type BookingStatus = "idle" | "loading" | "error"

const SERVICE_FEE = 10

export default function BookingForm({ carId, pricePerDay, category = "", deposit, minimumRentalDays, dailyKmLimit, excessKmFee }: Props) {
    const { data: session }                     = useSession()
    const router                                = useRouter()
    const [range, setRange]                     = useState<any>()
    const [hoverDate, setHoverDate]             = useState<Date | null>(null)
    const [bookedDates, setBookedDates]         = useState<Date[]>([])
    const [status, setStatus]                   = useState<BookingStatus>("idle")
    const [errorMsg, setErrorMsg]               = useState("")

    const userXp      = session?.user?.xp ?? 0
    const tier        = getTier(userXp)
    const discount    = tier.discount
    const xpPerDay    = getXpPerDay(category)

    // ── Fetch existing bookings ──────────────────────────────────────────
    useEffect(() => {
        if (!carId) return
        fetch(`/api/bookings?carId=${carId}`)
            .then(r => r.json())
            .then((data: { startDate: string; endDate: string }[]) => {
                const dates: Date[] = []
                data.forEach(b => {
                    // Parse as local midnight so DayPicker dates compare correctly
                    let cur = new Date(b.startDate.split("T")[0] + "T00:00:00")
                    const end = new Date(b.endDate.split("T")[0] + "T00:00:00")
                    while (cur <= end) {
                        dates.push(new Date(cur))
                        cur = addDays(cur, 1)
                    }
                })
                setBookedDates(dates)
            })
            .catch(() => {})
    }, [carId])

    // ── Derived values ───────────────────────────────────────────────────
    const previewRange = range?.from && hoverDate
        ? { from: range.from, to: hoverDate }
        : undefined

    const days = range?.from && range?.to
        ? differenceInDays(range.to, range.from) + 1
        : 0

    const subtotal     = days * pricePerDay
    const discountAmt  = discount > 0 ? subtotal * discount : 0
    const discountedSub = subtotal - discountAmt
    const serviceFee   = days > 0 ? SERVICE_FEE : 0
    const total        = discountedSub + serviceFee
    const depositAmt   = deposit ?? (total > 0 ? Math.round(total * 0.2) : null)
    const xpEarned     = days * xpPerDay

    const isBlocked = (from: Date, to: Date) => {
        const fromDay = startOfDay(from)
        const toDay   = startOfDay(to)
        return bookedDates.some(d => {
            const dDay = startOfDay(d)
            return !isBefore(dDay, fromDay) && !isAfter(dDay, toDay)
        })
    }

    // When range.from is set but range.to is not yet picked, find the earliest
    // booked date after range.from and block everything from it onward so the
    // user cannot drag the selection across a booked day.
    const disabledAfter = useMemo(() => {
        if (!range?.from || range?.to) return null
        const fromDay = startOfDay(range.from)
        const nextBooked = bookedDates
            .map(d => startOfDay(d))
            .filter(d => isAfter(d, fromDay))
            .sort((a, b) => a.getTime() - b.getTime())[0]
        return nextBooked ?? null
    }, [range?.from, range?.to, bookedDates])

    // ── Submit ───────────────────────────────────────────────────────────
    const handleBooking = async () => {
        if (!range?.from || !range?.to) { setErrorMsg("Please select check-in and check-out dates"); return }
        if (days < 1)                   { setErrorMsg("Minimum stay: 1 day"); return }
        if (minimumRentalDays && days < minimumRentalDays) {
            setErrorMsg(`Minimum rental period for this vehicle is ${minimumRentalDays} days`)
            return
        }
        if (isBlocked(range.from, range.to)) { setErrorMsg("Selected dates overlap with an existing booking"); return }

        setStatus("loading")
        setErrorMsg("")

        // Step 1 — create the booking
        const bookingRes = await fetch("/api/bookings", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ productId: carId, startDate: format(range.from, "yyyy-MM-dd"), endDate: format(range.to, "yyyy-MM-dd") }),
        })

        if (!bookingRes.ok) {
            const data = await bookingRes.json().catch(() => ({}))
            setErrorMsg(data.error || "Booking failed. Please try again.")
            setStatus("error")
            return
        }

        const booking = await bookingRes.json()

        // Step 2 — create Stripe Checkout session for deposit
        const checkoutRes = await fetch("/api/stripe/checkout", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ bookingId: booking.id }),
        })

        if (checkoutRes.ok) {
            const { url } = await checkoutRes.json()
            window.location.href = url
        } else {
            // Checkout creation failed — still navigate to confirm page so the user
            // can see their pending booking and retry payment later
            router.push(`/bookings/${booking.id}/confirm`)
        }
    }

    return (
        <div className="bg-surface border border-surface-3 rounded-2xl overflow-hidden">

            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="px-6 pt-6 pb-4 border-b border-surface-3">
                <div className="flex items-baseline gap-2">
                    <span className="text-gold font-stats font-bold text-3xl">€{pricePerDay}</span>
                    <span className="text-muted text-sm font-stats">/ day</span>
                </div>

                {/* XP per day */}
                <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-gold text-[10px]">◆</span>
                    <span className="text-gold/80 text-xs font-stats">+{xpPerDay} XP per day</span>
                </div>

                {/* Tier discount banner — shown only when logged in with a discount */}
                {session?.user && discount > 0 && (
                    <div
                        className="flex items-center gap-2 mt-3 px-3 py-2 rounded-xl border text-xs font-stats"
                        style={{
                            background:   `${tier.color}12`,
                            borderColor:  `${tier.color}30`,
                            color:        tier.color,
                        }}
                    >
                        <span className="text-[10px]">◆</span>
                        <span>
                            {tier.name} — <span className="font-semibold">{(discount * 100).toFixed(0)}% loyalty discount</span> applied
                        </span>
                    </div>
                )}
            </div>

            {/* ── Date picker ────────────────────────────────────────── */}
            <div className={`px-4 py-4 ${status === "loading" ? "pointer-events-none opacity-50" : ""}`}>
                <p className="text-muted text-xs font-stats uppercase tracking-wider mb-3 px-2">
                    Select your dates
                </p>

                <DayPicker
                    mode="range"
                    numberOfMonths={1}
                    selected={range}
                    onSelect={r => { setRange(r); if (status === "error") setStatus("idle") }}
                    disabled={[
                            ...bookedDates,
                            { before: new Date() },
                            ...(disabledAfter ? [{ after: addDays(disabledAfter, -1) }] : []),
                        ]}
                    modifiers={{
                        booked:  bookedDates,
                        preview: previewRange ?? undefined,
                    }}
                    modifiersClassNames={{
                        booked:  "opacity-30 line-through cursor-not-allowed",
                        preview: "bg-gold/15",
                    }}
                    onDayMouseEnter={d => setHoverDate(d)}
                    onDayMouseLeave={() => setHoverDate(null)}
                    className="w-full"
                />

                {(range?.from || range?.to) && (
                    <div className="flex justify-center mt-3">
                        <button
                            type="button"
                            onClick={() => { setRange(undefined); setStatus("idle"); setErrorMsg("") }}
                            className="flex items-center gap-1.5 text-xs font-stats text-muted hover:text-danger border border-surface-3 hover:border-danger/30 bg-surface-2 hover:bg-danger/5 px-4 py-1.5 rounded-full transition-all duration-200"
                        >
                            <span className="text-[10px]">✕</span>
                            Clear dates
                        </button>
                    </div>
                )}

                <p className="text-muted-2 text-[11px] font-stats text-center mt-2">
                    {minimumRentalDays && minimumRentalDays > 1
                        ? `Minimum stay: ${minimumRentalDays} days`
                        : "Minimum stay: 1 day"}
                    {dailyKmLimit != null ? ` · ${dailyKmLimit} km/day included` : ""}
                    {" · Booked dates are unavailable"}
                </p>
            </div>

            {/* ── Price breakdown + CTA ──────────────────────────────── */}
            <div className="px-6 pb-6 space-y-4 border-t border-surface-3 pt-4">

                {/* Date summary */}
                <div className="grid grid-cols-2 gap-2 text-xs font-stats">
                    <div className={`rounded-xl px-3 py-2.5 border ${range?.from ? "border-gold/30 bg-gold/5" : "border-surface-3 bg-surface-2"}`}>
                        <p className="text-muted-2 uppercase tracking-wider text-[10px] mb-0.5">From</p>
                        <p className={range?.from ? "text-white-soft font-semibold" : "text-muted"}>
                            {range?.from ? format(range.from, "MMM d, yyyy") : "—"}
                        </p>
                    </div>
                    <div className={`rounded-xl px-3 py-2.5 border ${range?.to ? "border-gold/30 bg-gold/5" : "border-surface-3 bg-surface-2"}`}>
                        <p className="text-muted-2 uppercase tracking-wider text-[10px] mb-0.5">To</p>
                        <p className={range?.to ? "text-white-soft font-semibold" : "text-muted"}>
                            {range?.to ? format(range.to, "MMM d, yyyy") : "—"}
                        </p>
                    </div>
                </div>

                {/* XP earn — shown when dates selected */}
                {days > 0 && (
                    <div className="flex items-center gap-3 bg-gold/8 border border-gold/20 rounded-xl px-4 py-3">
                        <span className="text-gold text-base shrink-0">◆</span>
                        <div>
                            <p className="text-gold text-sm font-stats font-semibold leading-tight">
                                Earn {xpEarned} XP with this rental
                            </p>
                            <p className="text-muted text-[11px] font-stats">
                                {days} day{days > 1 ? "s" : ""} × {xpPerDay} XP/day
                            </p>
                        </div>
                    </div>
                )}

                {/* Price breakdown */}
                {days > 0 && (
                    <div className="space-y-2 text-sm font-stats">
                        <div className="flex justify-between text-muted">
                            <span>€{pricePerDay} × {days} day{days > 1 ? "s" : ""}</span>
                            <span className="text-white-soft">€{subtotal}</span>
                        </div>

                        {discount > 0 && (
                            <div className="flex justify-between">
                                <span className="text-emerald-400 flex items-center gap-1 text-xs">
                                    <span className="text-[9px]">◆</span>
                                    {tier.name} ({(discount * 100).toFixed(0)}% off)
                                </span>
                                <span className="text-emerald-400">−€{discountAmt.toFixed(0)}</span>
                            </div>
                        )}

                        <div className="flex justify-between text-muted">
                            <span>Service fee</span>
                            <span className="text-white-soft">€{SERVICE_FEE}</span>
                        </div>

                        {dailyKmLimit != null && (
                            <div className="flex justify-between text-muted">
                                <span>Included km</span>
                                <span className="text-white-soft">
                                    {days * dailyKmLimit} km
                                    <span className="text-muted text-[10px] ml-1">({dailyKmLimit}/day)</span>
                                </span>
                            </div>
                        )}

                        {excessKmFee != null && dailyKmLimit != null && (
                            <div className="flex justify-between text-muted">
                                <span>Excess km fee</span>
                                <span className="text-white-soft">€{excessKmFee}/km</span>
                            </div>
                        )}

                        {depositAmt != null && (
                            <div className="flex justify-between text-muted">
                                <span>Deposit (refundable)</span>
                                <span className="text-white-soft">€{depositAmt}</span>
                            </div>
                        )}

                        <div className="flex justify-between font-bold text-white-soft border-t border-surface-3 pt-2 mt-2">
                            <span>Total</span>
                            <span className="text-gold">€{total.toFixed(0)}</span>
                        </div>
                    </div>
                )}

                {/* Error */}
                {errorMsg && (
                    <p className="text-danger text-xs font-stats text-center bg-danger/8 border border-danger/20 rounded-xl px-4 py-2">
                        {errorMsg}
                    </p>
                )}

                {/* Reserve button */}
                <button
                    onClick={handleBooking}
                    disabled={status === "loading"}
                    className="w-full bg-gold hover:bg-gold-light disabled:opacity-60 disabled:cursor-not-allowed text-dark font-body font-semibold py-4 rounded-xl transition-colors duration-200 text-sm"
                >
                    {status === "loading"
                        ? "Processing…"
                        : days > 0 && depositAmt != null
                        ? `Pay Deposit · €${depositAmt}`
                        : days > 0
                        ? `Reserve · €${total.toFixed(0)}`
                        : "Reserve"}
                </button>

                <p className="text-muted-2 text-[11px] font-stats text-center">
                    Deposit charged now · Balance due before pickup
                </p>
            </div>
        </div>
    )
}
