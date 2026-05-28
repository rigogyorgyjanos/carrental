"use client"

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { DayPicker } from "react-day-picker"
import "react-day-picker/dist/style.css"
import { format, startOfDay } from "date-fns"
import type { DateRange } from "react-day-picker"
import { Calendar } from "lucide-react"

export default function HeroSearch() {
    const router = useRouter()
    const [location, setLocation] = useState("")
    const [range, setRange]       = useState<DateRange | undefined>()
    const [calOpen, setCalOpen] = useState(false)
    const [dropPos, setDropPos] = useState({ top: 0, right: 0 })

    const buttonRef = useRef<HTMLButtonElement>(null)
    const portalRef = useRef<HTMLDivElement>(null)

    // Close when clicking outside button or portal
    useEffect(() => {
        if (!calOpen) return
        const onDown = (e: MouseEvent) => {
            const target = e.target as Node
            if (!buttonRef.current?.contains(target) && !portalRef.current?.contains(target)) {
                setCalOpen(false)
            }
        }
        document.addEventListener("mousedown", onDown)
        return () => document.removeEventListener("mousedown", onDown)
    }, [calOpen])

    // Keep dropdown anchored to button while scrolling
    useEffect(() => {
        if (!calOpen) return
        const onScroll = () => {
            if (buttonRef.current) {
                const rect = buttonRef.current.getBoundingClientRect()
                setDropPos({
                    top:   rect.bottom + 8,
                    right: window.innerWidth - rect.right,
                })
            }
        }
        window.addEventListener("scroll", onScroll, { passive: true })
        return () => window.removeEventListener("scroll", onScroll)
    }, [calOpen])

    const today = startOfDay(new Date())

    const openCalendar = () => {
        if (!calOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect()
            setDropPos({
                top:   rect.bottom + 8,
                right: window.innerWidth - rect.right,
            })
        }
        setCalOpen(v => !v)
    }

    const handleSearch = () => {
        const params = new URLSearchParams()
        if (location.trim()) params.set("location", location.trim())
        if (range?.from)     params.set("from", format(range.from, "yyyy-MM-dd"))
        if (range?.to)       params.set("to",   format(range.to,   "yyyy-MM-dd"))
        router.push(`/cars?${params.toString()}`)
    }

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
                <div className="relative">
                    <button
                        ref={buttonRef}
                        type="button"
                        onClick={openCalendar}
                        aria-label="Select rental dates"
                        aria-expanded={calOpen}
                        className={`flex items-center gap-2.5 rounded-xl px-4 py-3 w-full md:w-auto text-sm transition-colors ${
                            calOpen
                                ? "bg-surface-2"
                                : "bg-surface-2/60 hover:bg-surface-2/80"
                        }`}
                    >
                        <Calendar size={16} className="text-muted shrink-0" aria-hidden />
                        {dateLabel ? (
                            <>
                                <span className="text-white-soft whitespace-nowrap font-stats">{dateLabel}</span>
                                <span
                                    role="button"
                                    tabIndex={0}
                                    aria-label="Clear dates"
                                    onClick={e => { e.stopPropagation(); setRange(undefined) }}
                                    onKeyDown={e => { if (e.key === "Enter") setRange(undefined) }}
                                    className="ml-auto text-muted-2 hover:text-danger text-[11px] cursor-pointer pl-2"
                                >
                                    ✕
                                </span>
                            </>
                        ) : (
                            <span className="text-muted whitespace-nowrap">Select dates</span>
                        )}
                    </button>
                </div>

                {/* ── Search CTA ──────────────────────────────────── */}
                <button
                    onClick={handleSearch}
                    className="bg-gold hover:bg-gold-light text-dark text-sm font-body font-semibold px-6 py-3 rounded-xl transition-colors duration-200 shrink-0 whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 focus-visible:ring-offset-2 focus-visible:ring-offset-dark"
                >
                    Find Cars →
                </button>

            </div>

            {/* ── Calendar — portalled to body to escape overflow:hidden parents ── */}
            {calOpen && typeof window !== "undefined" && createPortal(
                <div
                    ref={portalRef}
                    style={{ position: "fixed", top: dropPos.top, right: dropPos.right, zIndex: 9999 }}
                    className="bg-surface border border-surface-3 rounded-2xl shadow-2xl overflow-hidden"
                >
                    <DayPicker
                        mode="range"
                        numberOfMonths={2}
                        selected={range}
                        onSelect={setRange}
                        disabled={{ before: today }}
                        startMonth={today}
                    />
                    <div className="px-4 pb-4 flex justify-between items-center border-t border-surface-3 pt-3">
                        <button
                            type="button"
                            onClick={() => setRange(undefined)}
                            className="text-xs font-stats text-muted-2 hover:text-danger transition-colors px-3 py-1.5 rounded-lg hover:bg-surface-2"
                        >
                            Clear
                        </button>
                        <button
                            type="button"
                            onClick={() => setCalOpen(false)}
                            className="text-xs font-stats font-semibold bg-gold hover:bg-gold-light text-dark px-4 py-1.5 rounded-lg transition-colors"
                        >
                            Apply
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </div>
    )
}
