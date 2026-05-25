import { Prisma } from "@prisma/client"
import { TIERS } from "@/lib/tiers"

export type BookingActivity = "all" | "has_bookings" | "never_booked"

export type NewsletterFilters = {
    activity?:  BookingActivity
    tierNames?: string[]   // tier.name values
    badgeSlugs?: string[]  // badge slug values
}

export function buildRecipientWhere(filters: NewsletterFilters): Prisma.UserWhereInput {
    const AND: Prisma.UserWhereInput[] = [
        { receivePromotionalEmails: true },
        { role: { not: "ADMIN" } },
    ]

    // Booking activity filter
    if (filters.activity === "has_bookings") {
        AND.push({ transactions: { some: {} } })
    } else if (filters.activity === "never_booked") {
        AND.push({ transactions: { none: {} } })
    }

    // Tier filter — map tier names to XP ranges
    if (filters.tierNames && filters.tierNames.length > 0) {
        const tierConditions: Prisma.UserWhereInput[] = filters.tierNames.flatMap(name => {
            const idx  = TIERS.findIndex(t => t.name === name)
            if (idx === -1) return []
            const tier = TIERS[idx]
            const next = TIERS[idx + 1] ?? null
            return [{ xp: { gte: tier.minXp, ...(next ? { lt: next.minXp } : {}) } }]
        })
        if (tierConditions.length > 0) {
            AND.push({ OR: tierConditions })
        }
    }

    // Badge filter
    if (filters.badgeSlugs && filters.badgeSlugs.length > 0) {
        AND.push({
            badges: {
                some: {
                    badge: { slug: { in: filters.badgeSlugs } },
                },
            },
        })
    }

    return { AND }
}
