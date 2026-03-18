"use client"

import { useEffect, useState } from "react"
import { DayPicker } from "react-day-picker"
import "react-day-picker/dist/style.css"
import {
    addDays,
    differenceInDays,
    isAfter,
    isBefore,
    format,
} from "date-fns"

export default function BookingForm({ carId, pricePerDay }: any) {
    const [range, setRange] = useState<any>()
    const [hoverDate, setHoverDate] = useState<Date | null>(null)
    const [bookedDates, setBookedDates] = useState<Date[]>([])
    const [message, setMessage] = useState("")
    const [hoveredDate, setHoveredDate] = useState<Date | null>(null)
    const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)

    const MIN_DAYS = 1
    const SERVICE_FEE = 10

    // --- Fetch bookings ---
    useEffect(() => {
        if (!carId) return

        const fetchBookings = async () => {
            const res = await fetch(`/api/bookings?carId=${carId}`)
            const data = await res.json()

            const dates: Date[] = []

            data.forEach((range: any) => {
                let current = new Date(range.startDate)
                const end = new Date(range.endDate)

                while (current <= end) {
                    dates.push(new Date(current))
                    current = addDays(current, 1)
                }
            })

            setBookedDates(dates)
        }

        fetchBookings()
    }, [carId])

    // --- Hover preview ---
    const previewRange =
        range?.from && hoverDate
            ? { from: range.from, to: hoverDate }
            : undefined

    // --- Check overlap ---
    const isBlocked = (from: Date, to: Date) => {
        return bookedDates.some(date =>
            (isAfter(date, from) && isBefore(date, to)) ||
            date.toDateString() === from.toDateString() ||
            date.toDateString() === to.toDateString()
        )
    }

    // --- Pricing ---
    const days =
        range?.from && range?.to
            ? differenceInDays(range.to, range.from) + 1
            : 0

    const subtotal = days * pricePerDay
    const total = subtotal + SERVICE_FEE

    const handleBooking = async () => {
        if (!range?.from || !range?.to) {
            setMessage("Select dates")
            return
        }

        if (days < MIN_DAYS) {
            setMessage(`Minimum ${MIN_DAYS} days`)
            return
        }

        if (isBlocked(range.from, range.to)) {
            setMessage("Dates not available")
            return
        }

        const res = await fetch("/api/bookings", {
            method: "POST",
            body: JSON.stringify({
                productId: carId,
                startDate: range.from,
                endDate: range.to,
            }),
        })

        if (!res.ok) {
            const data = await res.json()
            setMessage(data.error)
        } else {
            setMessage("Booked 🎉")
        }
    }

    return (
        <div className="grid md:grid-cols-2 gap-10">

            {/* LEFT: CALENDAR */}
            <div className="bg-white rounded-3xl shadow-xl p-6">
                <h2 className="text-xl font-semibold mb-4">
                    Select your dates
                </h2>

                <DayPicker
                    mode="range"
                    numberOfMonths={2}
                    selected={range}
                    onSelect={setRange}
                    disabled={bookedDates}
                    modifiers={{
                        booked: bookedDates,
                        preview: previewRange,
                    }}
                    modifiersClassNames={{
                        booked: "bg-red-500 text-white line-through",
                        preview: "bg-gray-200",
                    }}
                    onDayMouseEnter={(d) => setHoverDate(d)}
                    onDayMouseLeave={() => setHoverDate(null)}
                />

                <p className="text-sm text-gray-400 mt-4">
                    Minimum stay: {MIN_DAYS} days
                </p>
            </div>

            {/* RIGHT: PRICE CARD */}
            <div className="sticky top-24 h-fit">
                <div className="bg-white rounded-3xl shadow-xl p-6 border">

                    <div className="text-2xl font-bold mb-4">
                        €{pricePerDay}{" "}
                        <span className="text-sm text-gray-500 font-normal">
                            / day
                        </span>
                    </div>

                    {/* Selected dates */}
                    <div className="border rounded-xl p-3 mb-4 text-sm">
                        <div>
                            <strong>From:</strong>{" "}
                            {range?.from ? format(range.from, "MMM d") : "--"}
                        </div>
                        <div>
                            <strong>To:</strong>{" "}
                            {range?.to ? format(range.to, "MMM d") : "--"}
                        </div>
                    </div>

                    {/* Price breakdown */}
                    {days > 0 && (
                        <div className="space-y-2 text-sm mb-4">
                            <div className="flex justify-between">
                                <span>€{pricePerDay} × {days} days</span>
                                <span>€{subtotal}</span>
                            </div>

                            <div className="flex justify-between">
                                <span>Service fee</span>
                                <span>€{SERVICE_FEE}</span>
                            </div>

                            <div className="border-t pt-2 flex justify-between font-semibold">
                                <span>Total</span>
                                <span>€{total}</span>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleBooking}
                        className="w-full bg-black text-white py-3 rounded-xl hover:bg-black/90 transition"
                    >
                        Reserve
                    </button>

                    {message && (
                        <p className="text-red-500 text-sm mt-3">{message}</p>
                    )}
                </div>
            </div>
        </div>
    )
}