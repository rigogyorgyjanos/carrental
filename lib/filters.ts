// lib/filters.ts

import { Prisma } from "@prisma/client"

type RawParams = Record<string, string | string[] | undefined>

function toString(value: string | string[] | undefined): string | undefined {
    if (!value) return undefined
    return Array.isArray(value) ? value[0] : value
}

function toNumber(value: string | string[] | undefined): number | undefined {
    const v = toString(value)
    if (!v) return undefined
    const n = Number(v)
    return isNaN(n) ? undefined : n
}

function toDate(value: string | string[] | undefined): Date | undefined {
    const v = toString(value)
    if (!v) return undefined
    const d = new Date(v)
    return isNaN(d.getTime()) ? undefined : d
}

// ----------------------
// WHERE BUILDER
// ----------------------

export function buildWhere(params: RawParams): Prisma.ProductWhereInput {
    const AND: Prisma.ProductWhereInput[] = []

    const search = toString(params.search)
    const brand = toString(params.brand)
    const location = toString(params.location)
    const transmission = toString(params.transmission)
    const fuelType = toString(params.fuelType)

    const minPrice = toNumber(params.minPrice)
    const maxPrice = toNumber(params.maxPrice)

    const minMileage = toNumber(params.minMileage)
    const maxMileage = toNumber(params.maxMileage)

    const minRating = toNumber(params.minRating)

    const startDate = toDate(params.from)
    const endDate = toDate(params.to)

    // 🔍 SEARCH (multi-field)
    if (search) {
        AND.push({
            OR: [
                { name: { contains: search, mode: "insensitive" } },
                { brand: { contains: search, mode: "insensitive" } },
                { model: { contains: search, mode: "insensitive" } },
                { location: { contains: search, mode: "insensitive" } }
            ]
        })
    }

    if (brand) {
        AND.push({ brand })
    }

    if (location) {
        AND.push({
            location: { startsWith: location, mode: "insensitive" }
        })
    }

    if (transmission) {
        AND.push({ transmission })
    }

    if (fuelType) {
        AND.push({ fuelType })
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
        AND.push({
            pricePerDay: {
                ...(minPrice !== undefined && { gte: minPrice }),
                ...(maxPrice !== undefined && { lte: maxPrice })
            }
        })
    }

    if (minMileage !== undefined || maxMileage !== undefined) {
        AND.push({
            mileage: {
                ...(minMileage !== undefined && { gte: minMileage }),
                ...(maxMileage !== undefined && { lte: maxMileage })
            }
        })
    }

    if (minRating !== undefined) {
        AND.push({
            rating: {
                gte: minRating
            }
        })
    }

    if (startDate && endDate && startDate <= endDate) {
        AND.push({
            transactions: {
                none: {
                    status:    { in: ["PENDING", "CONFIRMED", "ACTIVE"] },
                    startDate: { lte: endDate },
                    endDate:   { gte: startDate },
                }
            }
        })
    }

    return {
        active:         true,
        approvalStatus: "APPROVED",
        ...(AND.length > 0 && { AND })
    }
}

// ----------------------
// ORDER BUILDER
// ----------------------

export function buildOrder(sort?: string): Prisma.ProductOrderByWithRelationInput | undefined {
    switch (sort) {
        case "price_asc":
            return { pricePerDay: "asc" }

        case "price_desc":
            return { pricePerDay: "desc" }

        case "rating_desc":
            return { rating: "desc" }

        case "mileage_asc":
            return { mileage: "asc" }

        case "newest":
            return { createdAt: "desc" }

        default:
            return undefined
    }
}