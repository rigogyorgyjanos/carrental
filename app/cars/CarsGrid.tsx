"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Car } from "@/types/types"

function getXpPerDay(category: string): number {
    const c = category.toLowerCase()
    if (c.includes("super") || c.includes("hyper")) return 30
    if (c.includes("luxury") || c.includes("sport")) return 20
    if (c.includes("premium"))                        return 15
    return 10
}

interface Props {
    initialCars: Car[]
}

export default function CarsGrid({ initialCars }: Props) {
    const [cars, setCars] = useState<Car[]>(initialCars)

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
                const imageUrl = car.images[0]?.url || "/placeholder.png"

                return (
                    <Link
                        key={car.id}
                        href={`/cars/${car.id}`}
                        className="group relative bg-surface rounded-2xl overflow-hidden h-90 border border-surface-3 hover:border-gold/25 transition-all duration-300 card-glow cursor-pointer"
                    >
                        {/* Full-bleed image */}
                        <img
                            src={imageUrl}
                            alt={car.name}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />

                        {/* Always-on bottom gradient */}
                        <div className="absolute inset-0 bg-linear-to-t from-dark/95 via-dark/20 to-transparent" />

                        {/* XP chip — top right, always visible */}
                        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-dark/80 backdrop-blur-sm border border-gold/35 text-gold text-[10px] font-stats font-bold px-2.5 py-1 rounded-full">
                            <span className="text-[8px]">◆</span>
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
                                <span className="text-[10px] font-stats text-gold/60">
                                    ◆ Earn {xp}+ XP
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
                                        <span className="text-gold/70">★ {car.rating}</span>
                                    </>
                                )}
                            </div>

                            {/* Location + CTA */}
                            <div className="flex items-center justify-between">
                                <span className="text-muted text-[10px] font-stats truncate mr-2">
                                    📍 {car.location}
                                </span>
                                <div className="shrink-0 flex items-center gap-1 bg-gold text-dark text-[11px] font-semibold px-3.5 py-2 rounded-lg transition-colors group-hover:bg-gold-light">
                                    View
                                    <span>→</span>
                                </div>
                            </div>

                        </div>
                    </Link>
                )
            })}
        </div>
    )
}
