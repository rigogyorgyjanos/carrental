"use client"

import { useState, useEffect } from "react"

export default function LocationAutocomplete({
    searchParams,
    updateParam,
}: any) {
    const [query, setQuery] = useState(searchParams.get("location") || "")
    const [results, setResults] = useState<string[]>([])
    const [open, setOpen] = useState(false)

    useEffect(() => {
        if (!query) {
            setResults([])
            return
        }

        const timeout = setTimeout(async () => {
            const res = await fetch(`/api/products/locations?q=${query}`)
            const data = await res.json()
            setResults(data)
            setOpen(true)
        }, 250)

        return () => clearTimeout(timeout)
    }, [query])

    return (
        <div className="relative w-full">

            {/* INPUT */}
            <input
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value)
                }}
                onFocus={() => setOpen(true)}
                placeholder="Where to?"
                className="w-full px-4 py-2 bg-transparent focus:outline-none"
            />

            {/* DROPDOWN */}
            {open && results.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-surface border border-surface-3 rounded-2xl shadow-xl z-50 overflow-hidden">
                    {results.map((loc) => (
                        <div
                            key={loc}
                            onClick={() => {
                                setQuery(loc)
                                updateParam("location", loc)
                                setOpen(false)
                            }}
                            className="px-4 py-3 text-white-soft hover:bg-gold/15 cursor-pointer transition text-sm font-stats"
                        >
                            📍 {loc}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}