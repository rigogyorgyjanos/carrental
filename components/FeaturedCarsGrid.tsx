"use client"

import Link from "next/link"
import Image from "next/image"
import { Car } from "@/types/types"
import { getXpPerDay } from "@/lib/tiers"

interface Props {
    initialCars: Car[]
}

export default function FeaturedCarsGrid({ initialCars }: Props) {
    if (!initialCars || initialCars.length === 0) {
        return (
            <p className="text-center text-muted py-16">
                No featured vehicles available.
            </p>
        )
    }

    return (
        <div className="grid md:grid-cols-3 gap-6">
            {initialCars.map(car => {
                const xp = getXpPerDay(car.category)
                const rawUrl   = car.images[0]?.url
                const imageUrl = rawUrl?.startsWith("http") ? rawUrl : null

                return (
                    <Link
                        key={car.id}
                        href={`/cars/${car.id}`}
                        className="group relative bg-surface border border-surface-3 rounded-2xl overflow-hidden transition-all duration-400 hover:-translate-y-1 hover:border-gold/25 card-glow"
                    >
                        {/* Image */}
                        <div className="relative h-56 overflow-hidden bg-surface-2">
                            {imageUrl ? (
                                <Image
                                    src={imageUrl}
                                    alt={car.name}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 33vw"
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <span className="text-muted text-4xl">🚗</span>
                                </div>
                            )}

                            {/* Bottom gradient */}
                            <div className="absolute inset-0 bg-linear-to-t from-surface via-surface/20 to-transparent" />

                            {/* XP badge — top right */}
                            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-dark/75 backdrop-blur-sm border border-gold/30 text-gold text-[11px] font-stats font-bold px-3 py-1 rounded-full">
                                <span className="text-[9px]">◆</span>
                                +{xp} XP/day
                            </div>

                            {/* Category — top left */}
                            <div className="absolute top-3 left-3 bg-dark/75 backdrop-blur-sm text-muted text-[11px] font-stats uppercase tracking-wider px-3 py-1 rounded-full">
                                {car.category}
                            </div>
                        </div>

                        {/* Info */}
                        <div className="p-5">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <p className="text-muted text-[11px] font-stats uppercase tracking-widest mb-1">
                                        {car.brand}
                                    </p>
                                    <h3 className="text-white-soft font-heading text-xl font-semibold leading-tight group-hover:text-gold transition-colors duration-300">
                                        {car.name}
                                    </h3>
                                </div>
                                <div className="text-right shrink-0 ml-3">
                                    <p className="text-gold font-stats font-bold text-xl leading-tight">
                                        €{car.pricePerDay}
                                    </p>
                                    <p className="text-muted text-[11px] font-stats">/ day</p>
                                </div>
                            </div>

                            {/* Specs row */}
                            <div className="flex items-center gap-2 text-muted text-[11px] font-stats border-t border-surface-3 pt-4 mb-4">
                                <span>{car.transmission}</span>
                                <span className="text-surface-3">·</span>
                                <span>{car.seats} seats</span>
                                <span className="text-surface-3">·</span>
                                <span className="truncate">{car.location}</span>
                            </div>

                            {/* View button */}
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted group-hover:text-gold font-body transition-colors duration-300">
                                    View Details
                                </span>
                                <span className="text-gold opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-0 group-hover:translate-x-1">
                                    →
                                </span>
                            </div>
                        </div>
                    </Link>
                )
            })}
        </div>
    )
}
