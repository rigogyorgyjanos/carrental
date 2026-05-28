// Pure tier utilities — no server imports, safe to use in client components

export const TIERS = [
    { name: "New Driver",    minXp: 0,    discount: 0,    color: "#9CA3AF" },
    { name: "Road Explorer", minXp: 200,  discount: 0.05, color: "#60A5FA" },
    { name: "Elite Driver",  minXp: 500,  discount: 0.10, color: "#A78BFA" },
    { name: "VIP Member",    minXp: 1000, discount: 0.15, color: "#F59E0B" },
    { name: "Dubai Legend",  minXp: 2000, discount: 0.20, color: "#C9A84C" },
] as const

export type Tier = typeof TIERS[number]

export function getTier(xp: number): Tier {
    for (let i = TIERS.length - 1; i >= 0; i--) {
        if (xp >= TIERS[i].minXp) return TIERS[i]
    }
    return TIERS[0]
}

export function getTierDiscount(xp: number): number {
    return getTier(xp).discount
}

export function getLevel(xp: number): number {
    return Math.floor(xp / 200) + 1
}

export function getXpPerDay(category: string): number {
    const c = category.toLowerCase()
    if (c.includes("super") || c.includes("hyper"))    return 30
    if (c.includes("luxury") || c.includes("sport"))   return 20
    if (c.includes("premium"))                          return 15
    return 10
}

export function getXpForRental(category: string, totalDays: number): number {
    return getXpPerDay(category) * totalDays
}
