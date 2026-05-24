"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useTransition, useState, useEffect } from "react"
import { DayPicker } from "react-day-picker"
import PriceRangeSlider from "@/components/PriceRangeSlider"
import "react-day-picker/dist/style.css"
import LocationAutocomplete from "@/components/LocationAutoComplete"

// ─── Sort options ──────────────────────────────────────────────────────────
const SORT_OPTIONS = [
    { value: "",             label: "Recommended" },
    { value: "price_asc",   label: "Price: Low → High" },
    { value: "price_desc",  label: "Price: High → Low" },
    { value: "rating_desc", label: "Top Rated" },
    { value: "mileage_asc", label: "Lowest Mileage" },
    { value: "newest",      label: "Newest First" },
]

function formatDate(date?: Date) {
    if (!date) return ""
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export default function Filters({ maxPrice = 500 }: { maxPrice?: number }) {
    const router       = useRouter()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()

    const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null)
    const [drawerOpen,  setDrawerOpen]  = useState(false)
    const [calendarOpen, setCalendarOpen] = useState(false)
    const [sortOpen,    setSortOpen]    = useState(false)

    const [range, setRange] = useState<any>({
        from: searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined,
        to:   searchParams.get("to")   ? new Date(searchParams.get("to")!)   : undefined,
    })
    const [draftRange, setDraftRange] = useState(range)

    // ── URL param helpers ────────────────────────────────────────────────
    function updateParam(key: string, value: string) {
        const params = new URLSearchParams(searchParams.toString())
        if (value) params.set(key, value)
        else       params.delete(key)
        params.delete("page")

        if (debounceTimeout) clearTimeout(debounceTimeout)
        const t = setTimeout(() => {
            startTransition(() => router.push(`/cars?${params.toString()}`))
        }, 250)
        setDebounceTimeout(t)
    }

    function removeParam(key: string) {
        updateParam(key, "")
    }

    // ── Active filter chips (exclude location, dates, page, sort) ───────
    const activeFilters = Array.from(searchParams.entries()).filter(
        ([key]) => !["location", "from", "to", "page", "sort"].includes(key)
    )

    const currentSort      = searchParams.get("sort") || ""
    const currentSortLabel = SORT_OPTIONS.find(o => o.value === currentSort)?.label ?? "Sort"

    // ── Click-outside handlers ───────────────────────────────────────────
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (!(e.target as Element).closest(".calendar-wrapper")) setCalendarOpen(false)
            if (!(e.target as Element).closest(".sort-wrapper"))    setSortOpen(false)
        }
        document.addEventListener("click", handleClick)
        return () => document.removeEventListener("click", handleClick)
    }, [])

    return (
        <>
            {/* ── FLOATING BAR ─────────────────────────────────────── */}
            <div className="flex justify-center mb-6">
                <div className="flex items-center gap-1 glass border border-surface-3 shadow-2xl rounded-xl px-2 py-1.5">

                    {/* Location */}
                    <LocationAutocomplete
                        searchParams={searchParams}
                        updateParam={updateParam}
                    />

                    <div className="h-5 w-px bg-surface-3 mx-1" />

                    {/* Date range picker */}
                    <div className="relative calendar-wrapper">
                        <button
                            onClick={() => { setDraftRange(range); setCalendarOpen(prev => !prev) }}
                            className="flex items-center gap-2 px-4 py-2 text-muted hover:text-white-soft text-sm font-stats transition-colors whitespace-nowrap"
                        >
                            <span className="text-gold text-xs">📅</span>
                            {range?.from ? (
                                range.to
                                    ? `${formatDate(range.from)} – ${formatDate(range.to)}`
                                    : formatDate(range.from)
                            ) : (
                                "Add dates"
                            )}
                        </button>

                        {calendarOpen && (
                            <div className="absolute top-full mt-3 left-0 bg-surface-2 border border-surface-3 rounded-2xl shadow-2xl z-50 p-4">
                                <DayPicker
                                    mode="range"
                                    selected={draftRange}
                                    onSelect={setDraftRange}
                                    numberOfMonths={2}
                                />
                                <div className="flex justify-between mt-3 pt-3 border-t border-surface-3">
                                    <button
                                        onClick={() => setDraftRange({ from: undefined, to: undefined })}
                                        className="text-xs font-stats text-muted hover:text-white-soft transition-colors"
                                    >
                                        Clear
                                    </button>
                                    <button
                                        onClick={() => {
                                            setRange(draftRange)
                                            updateParam("from", draftRange?.from ? draftRange.from.toISOString() : "")
                                            updateParam("to",   draftRange?.to   ? draftRange.to.toISOString()   : "")
                                            setCalendarOpen(false)
                                        }}
                                        className="text-xs font-stats font-semibold bg-gold text-dark px-4 py-1.5 rounded-lg hover:bg-gold-light transition-colors"
                                    >
                                        Apply
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="h-5 w-px bg-surface-3 mx-1" />

                    {/* Sort dropdown */}
                    <div className="relative sort-wrapper">
                        <button
                            onClick={() => setSortOpen(prev => !prev)}
                            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-stats transition-colors whitespace-nowrap ${
                                currentSort ? "text-gold" : "text-muted hover:text-white-soft"
                            }`}
                        >
                            <span className="text-xs">↕</span>
                            <span>{currentSort ? currentSortLabel : "Sort"}</span>
                            <span className="text-[9px] opacity-50">▾</span>
                        </button>

                        {sortOpen && (
                            <div className="absolute top-full mt-3 right-0 bg-surface-2 border border-surface-3 rounded-xl shadow-2xl py-1.5 z-50 min-w-45">
                                {SORT_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => {
                                            updateParam("sort", opt.value)
                                            setSortOpen(false)
                                        }}
                                        className={`w-full text-left px-4 py-2.5 text-xs font-stats transition-colors ${
                                            currentSort === opt.value
                                                ? "text-gold bg-surface-3/50"
                                                : "text-muted hover:text-white-soft hover:bg-surface-3/40"
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="h-5 w-px bg-surface-3 mx-1" />

                    {/* Filters drawer button */}
                    <button
                        onClick={() => setDrawerOpen(true)}
                        className={`flex items-center gap-1.5 px-4 py-2 text-sm font-stats transition-colors ${
                            activeFilters.length > 0
                                ? "text-gold"
                                : "text-muted hover:text-white-soft"
                        }`}
                    >
                        <span className="text-xs">⚙</span>
                        <span>Filters</span>
                        {activeFilters.length > 0 && (
                            <span className="bg-gold text-dark text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                                {activeFilters.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* ── ACTIVE FILTER CHIPS ──────────────────────────────── */}
            {activeFilters.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6 justify-center">
                    {activeFilters.map(([key, value]) => (
                        <div
                            key={key}
                            className="flex items-center gap-2 bg-surface border border-gold/20 text-muted text-xs font-stats px-3 py-1.5 rounded-full"
                        >
                            <span className="text-gold/70">{key}:</span>
                            <span>{value}</span>
                            <button
                                onClick={() => removeParam(key)}
                                className="text-muted-2 hover:text-white-soft ml-0.5 transition-colors"
                                aria-label={`Remove ${key} filter`}
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={() => {
                            const params = new URLSearchParams()
                            const loc  = searchParams.get("location")
                            const from = searchParams.get("from")
                            const to   = searchParams.get("to")
                            const sort = searchParams.get("sort")
                            if (loc)  params.set("location", loc)
                            if (from) params.set("from", from)
                            if (to)   params.set("to", to)
                            if (sort) params.set("sort", sort)
                            startTransition(() => router.push(`/cars?${params.toString()}`))
                        }}
                        className="text-xs font-stats text-muted-2 hover:text-danger transition-colors px-2 py-1.5"
                    >
                        Clear all
                    </button>
                </div>
            )}

            {/* ── FILTER DRAWER ────────────────────────────────────── */}
            <div className={`fixed inset-0 z-50 transition-all ${drawerOpen ? "visible" : "invisible"}`}>

                {/* Backdrop */}
                <div
                    onClick={() => setDrawerOpen(false)}
                    className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity ${
                        drawerOpen ? "opacity-100" : "opacity-0"
                    }`}
                />

                {/* Panel */}
                <div
                    className={`absolute right-0 top-0 h-full w-full max-w-md bg-surface border-l border-surface-3 shadow-2xl overflow-y-auto transform transition-transform duration-300 ${
                        drawerOpen ? "translate-x-0" : "translate-x-full"
                    }`}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-surface-3 sticky top-0 bg-surface z-10">
                        <h2 className="font-heading text-2xl font-semibold text-white-soft">Filters</h2>
                        <button
                            onClick={() => setDrawerOpen(false)}
                            className="text-muted hover:text-white-soft transition-colors text-xl leading-none"
                            aria-label="Close filters"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="px-6 py-6 space-y-5">

                        {/* ── Section: Vehicle ── */}
                        <DrawerSection label="Vehicle">
                            <FilterInput label="Brand"    param="brand"    searchParams={searchParams} updateParam={updateParam} />
                            <FilterInput label="Category" param="category" searchParams={searchParams} updateParam={updateParam} />
                        </DrawerSection>

                        {/* ── Section: Engine ── */}
                        <DrawerSection label="Engine & Drive">
                            <FilterInput label="Fuel type" param="fuelType" searchParams={searchParams} updateParam={updateParam} />
                            <div className="grid grid-cols-2 gap-3">
                                <FilterNumber label="Min year"  param="year"  searchParams={searchParams} updateParam={updateParam} />
                                <FilterNumber label="Seats"     param="seats" searchParams={searchParams} updateParam={updateParam} />
                            </div>
                            <div>
                                <label className="text-xs font-stats text-muted uppercase tracking-wider block mb-2">Transmission</label>
                                <select
                                    defaultValue={searchParams.get("transmission") || ""}
                                    onChange={e => updateParam("transmission", e.target.value)}
                                    className="w-full bg-surface-2 border border-surface-3 text-white-soft text-sm font-body rounded-xl px-4 py-3 focus:outline-none focus:border-gold/40 appearance-none cursor-pointer"
                                >
                                    <option value="">Any</option>
                                    <option value="automatic">Automatic</option>
                                    <option value="manual">Manual</option>
                                </select>
                            </div>
                        </DrawerSection>

                        {/* ── Section: Price ── */}
                        <DrawerSection label="Price">
                            <PriceRangeSlider searchParams={searchParams} updateParam={updateParam} maxPrice={maxPrice} />
                        </DrawerSection>

                        {/* ── Section: Quality ── */}
                        <DrawerSection label="Quality">
                            <div className="grid grid-cols-2 gap-3">
                                <FilterNumber label="Min rating" param="minRating"  searchParams={searchParams} updateParam={updateParam} />
                                <FilterNumber label="Min reviews" param="reviews" searchParams={searchParams} updateParam={updateParam} />
                            </div>
                        </DrawerSection>

                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 bg-surface border-t border-surface-3 px-6 py-4">
                        <button
                            onClick={() => setDrawerOpen(false)}
                            className="w-full bg-gold hover:bg-gold-light text-dark text-sm font-body font-semibold py-3 rounded-xl transition-colors duration-200"
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Loading indicator */}
            {isPending && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-surface border border-gold/30 text-gold text-xs font-stats px-4 py-2 rounded-full shadow-lg">
                    Searching...
                </div>
            )}
        </>
    )
}

// ─── Sub-components ────────────────────────────────────────────────────────

function DrawerSection({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <p className="text-[10px] font-stats text-gold/70 uppercase tracking-[0.2em] mb-3 pb-2 border-b border-surface-3">
                {label}
            </p>
            <div className="space-y-3">{children}</div>
        </div>
    )
}

function FilterInput({ label, param, searchParams, updateParam }: any) {
    return (
        <input
            placeholder={label}
            defaultValue={searchParams.get(param) || ""}
            onChange={e => updateParam(param, e.target.value)}
            className="w-full bg-surface-2 border border-surface-3 text-white-soft text-sm font-body placeholder:text-muted rounded-xl px-4 py-3 focus:outline-none focus:border-gold/40 transition-colors"
        />
    )
}

function FilterNumber({ label, param, searchParams, updateParam }: any) {
    return (
        <input
            type="number"
            placeholder={label}
            defaultValue={searchParams.get(param) || ""}
            onChange={e => updateParam(param, e.target.value)}
            className="w-full bg-surface-2 border border-surface-3 text-white-soft text-sm font-body placeholder:text-muted rounded-xl px-4 py-3 focus:outline-none focus:border-gold/40 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
    )
}
