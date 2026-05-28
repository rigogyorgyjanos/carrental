import { prisma } from "@/lib/prisma"
import { TIERS, getTier, getTierDiscount, getLevel, getXpForRental } from "@/lib/tiers"

export { TIERS, getTier, getTierDiscount, getLevel, getXpForRental }

// ── Badge definitions ──────────────────────────────────────────────────────
export const BADGE_DEFS = [
    {
        slug: "first_ride",
        name: "First Ride",
        description: "Complete your very first rental",
        icon: "🚗",
        check: async (userId: string) => {
            const count = await prisma.transaction.count({
                where: { userId, status: "COMPLETED" },
            })
            return count >= 1
        },
    },
    {
        slug: "road_warrior_5",
        name: "Road Warrior",
        description: "Complete 5 rentals",
        icon: "🛣",
        check: async (userId: string) => {
            const count = await prisma.transaction.count({
                where: { userId, status: "COMPLETED" },
            })
            return count >= 5
        },
    },
    {
        slug: "loyal_10",
        name: "Loyal Member",
        description: "Complete 10 rentals",
        icon: "💎",
        check: async (userId: string) => {
            const count = await prisma.transaction.count({
                where: { userId, status: "COMPLETED" },
            })
            return count >= 10
        },
    },
    {
        slug: "supercar_club",
        name: "Supercar Club",
        description: "Rent a Supercar or Hypercar",
        icon: "🏎",
        check: async (userId: string) => {
            const tx = await prisma.transaction.findFirst({
                where: {
                    userId,
                    status: "COMPLETED",
                    product: { category: { contains: "super", mode: "insensitive" } },
                },
            })
            if (tx) return true
            const tx2 = await prisma.transaction.findFirst({
                where: {
                    userId,
                    status: "COMPLETED",
                    product: { category: { contains: "hyper", mode: "insensitive" } },
                },
            })
            return !!tx2
        },
    },
    {
        slug: "long_haul",
        name: "Long Haul",
        description: "Rent a car for 7 or more consecutive days",
        icon: "📅",
        check: async (userId: string) => {
            const tx = await prisma.transaction.findFirst({
                where: { userId, status: "COMPLETED", totalDays: { gte: 7 } },
            })
            return !!tx
        },
    },
    {
        slug: "road_explorer",
        name: "Road Explorer",
        description: "Reach Road Explorer tier (200 XP)",
        icon: "🗺",
        check: async (userId: string) => {
            const user = await prisma.user.findUnique({ where: { id: userId }, select: { xp: true } })
            return (user?.xp ?? 0) >= 200
        },
    },
    {
        slug: "elite_driver",
        name: "Elite Driver",
        description: "Reach Elite Driver tier (500 XP)",
        icon: "⚡",
        check: async (userId: string) => {
            const user = await prisma.user.findUnique({ where: { id: userId }, select: { xp: true } })
            return (user?.xp ?? 0) >= 500
        },
    },
    {
        slug: "vip_member",
        name: "VIP Member",
        description: "Reach VIP Member tier (1000 XP)",
        icon: "👑",
        check: async (userId: string) => {
            const user = await prisma.user.findUnique({ where: { id: userId }, select: { xp: true } })
            return (user?.xp ?? 0) >= 1000
        },
    },
    {
        slug: "dubai_legend",
        name: "Dubai Legend",
        description: "Reach Dubai Legend tier (2000 XP)",
        icon: "🌟",
        check: async (userId: string) => {
            const user = await prisma.user.findUnique({ where: { id: userId }, select: { xp: true } })
            return (user?.xp ?? 0) >= 2000
        },
    },
    {
        slug: "first_review",
        name: "Trusted Reviewer",
        description: "Leave your first review after a completed rental",
        icon: "⭐",
        check: async (userId: string) => {
            const count = await prisma.review.count({ where: { userId, approved: true } })
            return count >= 1
        },
    },
] as const

// ── Core service functions ─────────────────────────────────────────────────

export async function awardXP(userId: string, xpAmount: number, transactionId?: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { xp: true } })
    if (!user) return

    // Use increment for xp to be atomic under concurrent calls.
    // Level is calculated from estimated new total — minor race on level is acceptable.
    const newLevel = getLevel(user.xp + xpAmount)

    await prisma.$transaction([
        prisma.user.update({
            where: { id: userId },
            data: { xp: { increment: xpAmount }, level: newLevel },
        }),
        prisma.xpTransaction.create({
            data: { userId, xpAmount, transactionId },
        }),
    ])
}

export async function awardBadge(userId: string, badgeSlug: string): Promise<boolean> {
    const badge = await prisma.badge.findUnique({ where: { slug: badgeSlug } })
    if (!badge) return false

    const existing = await prisma.userBadge.findUnique({
        where: { userId_badgeId: { userId, badgeId: badge.id } },
    })
    if (existing) return false

    await prisma.userBadge.create({ data: { userId, badgeId: badge.id } })
    return true
}

export async function checkAllBadges(userId: string): Promise<string[]> {
    const newBadges: string[] = []

    for (const def of BADGE_DEFS) {
        const earned = await def.check(userId)
        if (!earned) continue
        const awarded = await awardBadge(userId, def.slug)
        if (awarded) newBadges.push(def.slug)
    }

    return newBadges
}

// ── Seed badges into DB (idempotent, runs once per process) ───────────────
let _badgesSeeded = false

export async function ensureBadgesSeeded() {
    if (_badgesSeeded) return
    for (const def of BADGE_DEFS) {
        await prisma.badge.upsert({
            where: { slug: def.slug },
            update: { name: def.name, description: def.description, icon: def.icon },
            create: { slug: def.slug, name: def.name, description: def.description, icon: def.icon },
        })
    }
    _badgesSeeded = true
}

// ── Complete a booking: award XP + check badges ───────────────────────────
export async function completeBooking(
    bookingId: string,
    extraData?: Record<string, unknown>,
): Promise<{
    xpAwarded: number
    newBadges: string[]
    error?: string
}> {
    const booking = await prisma.transaction.findUnique({
        where: { id: bookingId },
        include: { product: true },
    })

    if (!booking)                         return { xpAwarded: 0, newBadges: [], error: "Booking not found" }
    if (!booking.product)                 return { xpAwarded: 0, newBadges: [], error: "Booking product not found" }
    if (booking.status === "CANCELLED")   return { xpAwarded: 0, newBadges: [], error: "Booking is cancelled" }
    if (booking.status === "COMPLETED")   return { xpAwarded: 0, newBadges: [], error: "Already completed" }
    if (booking.status !== "ACTIVE")      return { xpAwarded: 0, newBadges: [], error: "Booking must be ACTIVE to complete" }

    const xpAmount = getXpForRental(booking.product.category, booking.totalDays)

    // Read current XP for level calculation before the transaction (minor level race
    // is acceptable; XP increment itself is atomic via { increment }).
    const currentUser = await prisma.user.findUnique({
        where:  { id: booking.userId },
        select: { xp: true },
    })
    const newLevel = getLevel((currentUser?.xp ?? 0) + xpAmount)

    // Single atomic transaction: mark COMPLETED + award XP.
    // If the server crashes between the two writes no longer possible.
    let alreadyCompleted = false
    await prisma.$transaction(async (tx) => {
        const updated = await tx.transaction.updateMany({
            where: { id: bookingId, status: { notIn: ["COMPLETED", "CANCELLED"] } },
            data:  { status: "COMPLETED", xpAwarded: xpAmount, ...extraData },
        })

        if (updated.count === 0) {
            alreadyCompleted = true
            return
        }

        await tx.user.update({
            where: { id: booking.userId },
            data:  { xp: { increment: xpAmount }, level: newLevel },
        })
        await tx.xpTransaction.create({
            data: { userId: booking.userId, xpAmount, transactionId: bookingId },
        })
    })

    if (alreadyCompleted) {
        return { xpAwarded: 0, newBadges: [], error: "Already completed" }
    }

    const newBadges = await checkAllBadges(booking.userId)
    return { xpAwarded: xpAmount, newBadges }
}
