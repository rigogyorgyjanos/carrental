"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DayPicker } from "react-day-picker"
import "react-day-picker/dist/style.css"
import { format, startOfDay } from "date-fns"
import type { DateRange } from "react-day-picker"

export default function HeroSearch() {
    const router = useRouter()
    const [location, setLocation] = useState("")
    const [range, setRange]       = useState<DateRange | undefined>()
    const [calOpen, setCalOpen]   = useState(false)
    const wrapRef = useRef<HTMLDivElement>(null)

    // Close calendar when clicking outside
    useEffect(() => {
        if (!calOpen) return
        const onDown = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
                setCalOpen(false)
            }
        }
        document.addEventListener("mousedown", onDown)
        return () => document.removeEventListener("mousedown", onDown)
    }, [calOpen])

    const today = startOfDay(new Date())

    const handleSearch = () => {
        const params = new URLSearchParams()
        if (location.trim()) params.set("location", location.trim())
        if (range?.from)     params.set("from", format(range.from, "yyyy-MM-dd"))
        if (range?.to)       params.set("to",   format(range.to,   "yyyy-MM-dd"))
        router.push(`/cars?${params.toString()}`)
    }

    // Date button label
    const dateLabel = (() => {
        if (range?.from && range?.to) {
            const nights = Math.round(
                (range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24)
            )
            return `${format(range.from, "MMM d")} → ${format(range.to, "MMM d")}  ·  ${nights}n`
        }
        if (range?.from) return `${format(range.from, "MMM d")} → ?`
        return null
    })()

    return (
        <div className="glass rounded-2xl p-2 w-full max-w-3xl">
            <div className="flex flex-col md:flex-row gap-1">

                {/* ── Pickup location ─────────────────────────────── */}
                <label className="sr-only" htmlFor="hero-location">Pickup location</label>
                <div className="flex items-center gap-3 flex-1 bg-surface-2/60 rounded-xl px-4 py-3 focus-within:bg-surface-2 transition-colors">
                    <span className="text-gold text-base shrink-0" aria-hidden>◎</span>
                    <input
                        id="hero-location"
                        type="text"
                        placeholder="Pickup location"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") handleSearch() }}
                        className="bg-transparent text-white-soft placeholder:text-muted text-sm w-full focus:outline-none"
                    />
                </div>

                <div className="hidden md:block w-px bg-surface-3 self-center h-8" aria-hidden />

                {/* ── Date range picker ────────────────────────────── */}
                <div ref={wrapRef} className="relative">
                    <button
                        type="button"
                        onClick={() => setCalOpen(v => !v)}
                        aria-label="Select rental dates"
                        aria-expanded={calOpen}
                        className={`flex items-center gap-2.5 rounded-xl px-4 py-3 w-full md:w-auto text-sm transition-colors ${
                            calOpen
                                ? "bg-surface-2"
                                : "bg-surface-2/60 hover:bg-surface-2/80"
                        }`}
                    >
                        <span className="text-muted text-sm shrink-0" aria-hidden>📅</span>
                        {dateLabel ? (
                            <>
                                <span className="text-white-soft whitespace-nowrap font-stats">{dateLabel}</span>
                                <span
                                    role="button"
                                    tabIndex={0}
                                    aria-label="Clear dates"
                                    onClick={e => { e.stopPropagation(); setRange(undefined) }}
                                    onKeyDown={e => { if (e.key === "Enter") { setRange(undefined) } }}
                                    className="ml-auto text-muted-2 hover:text-danger text-[11px] cursor-pointer pl-2"
                                >
                                    ✕
                                </span>
                            </>
                        ) : (
                            <span className="text-muted whitespace-nowrap">Select dates</span>
                        )}
                    </button>

                    {/* Dropdown calendar */}
                    {calOpen && (
                        <div className="absolute top-full mt-2 right-0 z-50 bg-surface border border-surface-3 rounded-2xl shadow-2xl overflow-hidden">
                            <DayPicker
                                mode="range"
                                numberOfMonths={2}
                                selected={range}
                                onSelect={r => {
                                    setRange(r)
                                    if (r?.from && r?.to) setCalOpen(false)
                                }}
                                disabled={{ before: today }}
                                fromDate={today}
                            />
                        </div>
                    )}
                </div>

                {/* ── Search CTA ──────────────────────────────────── */}
                <button
                    onClick={handleSearch}
                    className="bg-gold hover:bg-gold-light text-dark text-sm font-body font-semibold px-6 py-3 rounded-xl transition-colors duration-200 shrink-0 whitespace-nowrap"
                >
                    Find Cars →
                </button>

            </div>
        </div>
    )
}
