"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { MapPin, Star, Gem, ArrowRight } from "lucide-react"
import { Car } from "@/types/types"
import { getXpPerDay } from "@/lib/tiers"
import { effectLabel, effectColor } from "@/lib/eventUtils"
import { EventEffectType } from "@prisma/client"

interface ActiveEvent {
    title:       string
    effectType:  EventEffectType
    effectValue: number
}

interface Props {
    initialCars:  Car[]
    carEventMap?: Record<string, ActiveEvent>
}

export default function CarsGrid({ initialCars, carEventMap = {} }: Props) {
    const [cars, setCars] = useState<Car[]>(initialCars)
    const searchParams    = useSearchParams()
    const from = searchParams.get("from")
    const to   = searchParams.get("to")

    // Small debounce so filter transitions don't flash stale results
    useEffect(() => {
        const t = setTimeout(() => setCars(initialCars), 150)
        return () => clearTimeout(t)
    }, [initialCars])

    if (!cars.length) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-center">
                <p className="text-4xl text-muted mb-4">◎</p>
                <h3 className="font-heading text-2xl text-white-soft mb-2">No vehicles found</h3>
                <p className="text-muted text-sm font-body">Try adjusting your filters or broadening your search.</p>
            </div>
        )
    }

    return (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {cars.map(car => {
                const xp = getXpPerDay(car.category)
                const rawUrl   = car.images[0]?.url
                const imageUrl = rawUrl?.startsWith("http") ? rawUrl : null

                const activeEvent = carEventMap[car.id] ?? null
                const evClr = activeEvent ? effectColor(activeEvent.effectType) : null

                return (
                    <Link
                        key={car.id}
                        href={`/cars/${car.id}${from || to ? `?${new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) })}` : ""}`}
                        className="group relative bg-surface rounded-2xl overflow-hidden h-90 border border-surface-3 hover:border-gold/25 transition-all duration-300 card-glow cursor-pointer"
                    >
                        {/* Full-bleed image */}
                        {imageUrl && (
                            <Image
                                src={imageUrl}
                                alt={car.name}
                                fill
                                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                        )}

                        {/* Always-on bottom gradient */}
                        <div className="absolute inset-0 bg-linear-to-t from-dark/95 via-dark/20 to-transparent" />

                        {/* Event badge — top left */}
                        {activeEvent && evClr && (
                            <div
                                className="absolute top-3 left-3 z-10 text-[10px] font-stats font-bold px-2.5 py-1 rounded-full border backdrop-blur-sm"
                                style={{ color: evClr.text, background: evClr.bg + "cc", borderColor: evClr.border }}
                            >
                                {effectLabel(activeEvent.effectType, activeEvent.effectValue)}
                            </div>
                        )}

                        {/* XP chip — top right, always visible */}
                        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-dark/80 backdrop-blur-sm border border-gold/35 text-gold text-[10px] font-stats font-bold px-2.5 py-1 rounded-full">
                            <Gem className="w-2.5 h-2.5" />
                            +{xp} XP/day
                        </div>

                        {/* Default state: brand + name at bottom */}
                        <div className="absolute bottom-5 left-5 right-14 z-10 transition-opacity duration-200 group-hover:opacity-0">
                            <p className="text-muted-2 text-[10px] font-stats uppercase tracking-widest mb-1">
                                {car.brand}
                            </p>
                            <h3 className="text-white-soft font-heading text-xl font-semibold leading-tight">
                                {car.name}
                            </h3>
                        </div>

                        {/* ── Hover reveal panel ── */}
                        <div className="absolute bottom-0 inset-x-0 z-20 bg-dark/95 backdrop-blur-sm px-5 pt-4 pb-5 translate-y-full group-hover:translate-y-0 transition-transform duration-350 ease-out">

                            {/* Brand + Name */}
                            <p className="text-muted-2 text-[10px] font-stats uppercase tracking-widest mb-0.5">
                                {car.brand}
                            </p>
                            <h3 className="text-white-soft font-heading text-lg font-semibold leading-tight mb-3">
                                {car.name}
                            </h3>

                            {/* Price row */}
                            <div className="flex items-baseline justify-between mb-3">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-gold font-stats font-bold text-2xl">
                                        €{car.pricePerDay}
                                    </span>
                                    <span className="text-muted text-xs font-stats">/day</span>
                                </div>
                                <span className="flex items-center gap-1 text-[10px] font-stats text-gold/60">
                                    <Gem className="w-2.5 h-2.5" /> Earn {xp}+ XP
                                </span>
                            </div>

                            {/* Specs */}
                            <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-[10px] font-stats text-muted mb-3">
                                <span>{car.category}</span>
                                <span className="text-surface-3">·</span>
                                <span>{car.transmission}</span>
                                <span className="text-surface-3">·</span>
                                <span>{car.seats} seats</span>
                                {car.rating > 0 && (
                                    <>
                                        <span className="text-surface-3">·</span>
                                        <span className="flex items-center gap-0.5 text-gold/70">
                                            <Star className="w-2.5 h-2.5 fill-current" /> {car.rating}
                                        </span>
                                    </>
                                )}
                            </div>

                            {/* Location + CTA */}
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1 text-muted text-[10px] font-stats truncate mr-2">
                                    <MapPin className="w-3 h-3 shrink-0" /> {car.location}
                                </span>
                                <div className="shrink-0 flex items-center gap-1 bg-gold text-dark text-[11px] font-semibold px-3.5 py-2 rounded-lg transition-colors group-hover:bg-gold-light">
                                    View
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </div>
                            </div>

                        </div>
                    </Link>
                )
            })}
        </div>
    )
}
