import { prisma } from "@/lib/prisma"
import CarsGrid from "./CarsGrid"
import Filters from "./Filters"
import Link from "next/link"
import { Car } from "@/types/types"
import { buildWhere, buildOrder } from "@/lib/filters"

export const dynamic = "force-dynamic"

interface Props {
    searchParams: Promise<{
        search?: string
        brand?: string
        sort?: string
        page?: string
        [key: string]: string | undefined
    }>
}

export default async function CarsPage({ searchParams }: Props) {
    const params   = await searchParams
    const page     = Number(params.page || 1)
    const pageSize = 50
    const skip     = (page - 1) * pageSize

    const where   = buildWhere(params)
    const orderBy = buildOrder(params.sort)

    const [carsRaw, totalCars, maxPriceAgg] = await Promise.all([
        prisma.product.findMany({
            where,
            take: pageSize,
            skip,
            orderBy,
            include: { images: true },
        }),
        prisma.product.count({ where }),
        prisma.product.aggregate({ where: { active: true }, _max: { pricePerDay: true } }),
    ])

    const rawMax   = maxPriceAgg._max.pricePerDay ?? 500
    const maxPrice = Math.ceil(rawMax / 100) * 100

    const cars: Car[] = carsRaw.map(c => ({
        id:           c.id,
        name:         c.name,
        brand:        c.brand,
        model:        c.model,
        year:         c.year,
        category:     c.category,
        transmission: c.transmission,
        fuelType:     c.fuelType,
        seats:        c.seats,
        mileage:      c.mileage,
        licensePlate: c.licensePlate,
        location:     c.location,
        pricePerDay:  c.pricePerDay,
        deposit:      c.deposit ?? undefined,
        rating:       c.rating ?? 0,
        reviewCount:  c.reviewCount ?? 0,
        images:       c.images.map(img => ({ id: img.id, productId: img.productId, url: img.url })),
    }))

    const totalPages = Math.ceil(totalCars / pageSize)

    return (
        <div className="max-w-7xl mx-auto px-6 py-8">

            {/* ── Page header ─────────────────────────────────── */}
            <div className="mb-8">
                <h1 className="font-heading text-4xl md:text-5xl font-light text-white-soft">
                    Browse Vehicles
                </h1>
                <p className="text-muted text-sm font-stats mt-1">
                    {totalCars} {totalCars === 1 ? "vehicle" : "vehicles"} available
                </p>
            </div>

            {/* ── Filters bar ─────────────────────────────────── */}
            <Filters maxPrice={maxPrice} />

            {/* ── Cars grid ───────────────────────────────────── */}
            <CarsGrid initialCars={cars} />

            {/* ── Pagination ──────────────────────────────────── */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-16">
                    {Array.from({ length: totalPages }).map((_, i) => {
                        const pageNumber = i + 1
                        const href = `/cars?${(() => {
                            const q = new URLSearchParams(params as Record<string, string>)
                            q.set("page", pageNumber.toString())
                            return q.toString()
                        })()}`

                        return (
                            <Link
                                key={pageNumber}
                                href={href}
                                className={`min-w-10 h-10 flex items-center justify-center rounded-xl text-sm font-stats transition-all duration-200 ${
                                    pageNumber === page
                                        ? "bg-gold text-dark font-bold shadow-lg"
                                        : "bg-surface border border-surface-3 text-muted hover:border-gold/30 hover:text-white-soft"
                                }`}
                            >
                                {pageNumber}
                            </Link>
                        )
                    })}
                </div>
            )}

        </div>
    )
}
