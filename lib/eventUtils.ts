import { EventEffectType } from "@prisma/client"

export function effectLabel(effectType: EventEffectType, effectValue: number): string {
    switch (effectType) {
        case "DISCOUNT_PCT":      return `${effectValue}% OFF`
        case "XP_MULTIPLIER":    return `${effectValue}× XP`
        case "EXTRA_KM_PER_DAY": return `+${effectValue} km/day`
        case "FREE_DAYS":        return `${effectValue} day${effectValue > 1 ? "s" : ""} free`
        default:                 return ""
    }
}

export function effectColor(effectType: EventEffectType): { text: string; bg: string; border: string } {
    switch (effectType) {
        case "DISCOUNT_PCT":      return { text: "#34D399", bg: "#34D39912", border: "#34D39930" }
        case "XP_MULTIPLIER":    return { text: "#C9A84C", bg: "#C9A84C12", border: "#C9A84C30" }
        case "EXTRA_KM_PER_DAY": return { text: "#60A5FA", bg: "#60A5FA12", border: "#60A5FA30" }
        case "FREE_DAYS":        return { text: "#A78BFA", bg: "#A78BFA12", border: "#A78BFA30" }
        default:                 return { text: "#6B7280", bg: "#6B728012", border: "#6B728030" }
    }
}
