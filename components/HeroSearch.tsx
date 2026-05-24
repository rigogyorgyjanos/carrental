"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function HeroSearch() {
    const router = useRouter()
    const [location, setLocation] = useState("")
    const [from, setFrom] = useState("")
    const [to, setTo] = useState("")

    const handleSearch = () => {
        const params = new URLSearchParams()
        if (location.trim()) params.set("location", location.trim())
        if (from) params.set("from", new Date(from).toISOString())
        if (to)   params.set("to",   new Date(to).toISOString())
        router.push(`/cars?${params.toString()}`)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSearch()
    }

    return (
        <div className="glass rounded-2xl p-2 w-full max-w-3xl">
            <div className="flex flex-col md:flex-row gap-1">

                {/* Location */}
                <div className="flex items-center gap-3 flex-1 bg-surface-2/60 rounded-xl px-4 py-3 group focus-within:bg-surface-2">
                    <span className="text-gold text-base shrink-0" aria-hidden>◎</span>
                    <input
                        type="text"
                        placeholder="Where to?"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="bg-transparent text-white-soft placeholder:text-muted text-sm w-full focus:outline-none"
                    />
                </div>

                <div className="hidden md:block w-px bg-surface-3 self-center h-8" aria-hidden />

                {/* From date */}
                <div className="flex items-center gap-3 bg-surface-2/60 rounded-xl px-4 py-3 focus-within:bg-surface-2 group md:w-40">
                    <span className="text-muted text-sm shrink-0" aria-hidden>From</span>
                    <input
                        type="date"
                        value={from}
                        onChange={e => setFrom(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        className="bg-transparent text-white-soft text-sm w-full focus:outline-none [color-scheme:dark] cursor-pointer"
                    />
                </div>

                <div className="hidden md:block w-px bg-surface-3 self-center h-8" aria-hidden />

                {/* To date */}
                <div className="flex items-center gap-3 bg-surface-2/60 rounded-xl px-4 py-3 focus-within:bg-surface-2 group md:w-40">
                    <span className="text-muted text-sm shrink-0" aria-hidden>To</span>
                    <input
                        type="date"
                        value={to}
                        onChange={e => setTo(e.target.value)}
                        min={from || new Date().toISOString().split("T")[0]}
                        className="bg-transparent text-white-soft text-sm w-full focus:outline-none [color-scheme:dark] cursor-pointer"
                    />
                </div>

                {/* CTA */}
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
