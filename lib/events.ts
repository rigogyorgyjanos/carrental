import { prisma } from "@/lib/prisma"
import { EventEffectType } from "@prisma/client"
export { effectLabel, effectColor } from "@/lib/eventUtils"

export interface EventEffect {
    eventId:           string
    title:             string
    effectType:        EventEffectType
    effectValue:       number
    discountPct:       number   // 0–1, only set for DISCOUNT_PCT
    xpMultiplier:      number   // ≥1, only set for XP_MULTIPLIER
    extraKmPerDay:     number   // only set for EXTRA_KM_PER_DAY
    freeDays:          number   // only set for FREE_DAYS
}

export interface CombinedEventEffect {
    totalDiscountPct:  number   // 0–1, additive across all matching events
    xpMultiplier:      number   // product of all XP multipliers
    extraKmPerDay:     number   // sum of all extra km
    freeDays:          number   // sum of all free days
    appliedEvents:     { id: string; title: string; effectType: EventEffectType; effectValue: number }[]
}

export async function getActiveEventsForProduct(
    productCategory: string,
    productBrand:    string,
    rentalStart:     Date,
    rentalEnd:       Date,
    totalDays:       number,
): Promise<CombinedEventEffect> {
    const now = new Date()

    const events = await prisma.event.findMany({
        where: {
            status:   "APPROVED",
            startsAt: { lte: rentalEnd },
            endsAt:   { gte: rentalStart },
        },
    })

    const matching = events.filter(ev => {
        if (ev.minDays && totalDays < ev.minDays) return false
        if (ev.targetCategories.length > 0 &&
            !ev.targetCategories.map(c => c.toLowerCase()).includes(productCategory.toLowerCase())) return false
        if (ev.targetBrands.length > 0 &&
            !ev.targetBrands.map(b => b.toLowerCase()).includes(productBrand.toLowerCase())) return false
        return true
    })

    const result: CombinedEventEffect = {
        totalDiscountPct: 0,
        xpMultiplier:     1,
        extraKmPerDay:    0,
        freeDays:         0,
        appliedEvents:    [],
    }

    for (const ev of matching) {
        result.appliedEvents.push({ id: ev.id, title: ev.title, effectType: ev.effectType, effectValue: ev.effectValue })
        switch (ev.effectType) {
            case "DISCOUNT_PCT":
                result.totalDiscountPct += ev.effectValue / 100
                break
            case "XP_MULTIPLIER":
                result.xpMultiplier *= ev.effectValue
                break
            case "EXTRA_KM_PER_DAY":
                result.extraKmPerDay += ev.effectValue
                break
            case "FREE_DAYS":
                result.freeDays += ev.effectValue
                break
        }
    }

    return result
}

export async function sendEventNotifications(eventId: string): Promise<number> {
    const { sendMail }          = await import("@/lib/nodemailer")
    const { eventAnnouncementHtml } = await import("@/lib/emails/eventAnnouncement")

    const event = await prisma.event.findUnique({
        where:   { id: eventId },
        include: { company: true },
    })
    if (!event) return 0

    const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000"

    let recipients: { email: string; name: string | null }[] = []

    if (event.companyId) {
        const users = await prisma.user.findMany({
            where: {
                transactions: {
                    some: { product: { companyId: event.companyId } },
                },
            },
            select: { email: true, name: true },
        })
        recipients = users
    } else {
        const users = await prisma.user.findMany({
            where:  { receivePromotionalEmails: true },
            select: { email: true, name: true },
        })
        recipients = users
    }

    let sent = 0
    for (const r of recipients) {
        try {
            await sendMail({
                to:      r.email,
                subject: `New Event: ${event.title} — AURUM`,
                html:    eventAnnouncementHtml({
                    eventTitle:       event.title,
                    eventDescription: event.description ?? "",
                    effectType:       event.effectType,
                    effectValue:      event.effectValue,
                    targetCategories: event.targetCategories,
                    targetBrands:     event.targetBrands,
                    startsAt:         event.startsAt,
                    endsAt:           event.endsAt,
                    companyName:      event.company?.name ?? null,
                    recipientName:    r.name,
                    appUrl,
                }),
            })
            sent++
        } catch {
            // continue sending to remaining recipients
        }
    }

    await prisma.event.update({
        where: { id: eventId },
        data:  { notificationSent: true },
    })

    return sent
}
