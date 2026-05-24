import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { ensureBadgesSeeded } from "@/lib/gamification"

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id: userId } = await context.params

    await ensureBadgesSeeded()

    const [allBadges, userBadges] = await Promise.all([
        prisma.badge.findMany({ orderBy: { slug: "asc" } }),
        prisma.userBadge.findMany({
            where: { userId },
            include: { badge: true },
        }),
    ])

    const earnedSlugs = new Set(userBadges.map(ub => ub.badge.slug))

    return NextResponse.json({
        earned: userBadges.map(ub => ({
            slug:      ub.badge.slug,
            name:      ub.badge.name,
            icon:      ub.badge.icon,
            awardedAt: ub.awardedAt,
        })),
        all: allBadges.map(b => ({
            slug:      b.slug,
            name:      b.name,
            icon:      b.icon,
            description: b.description,
            earned:    earnedSlugs.has(b.slug),
        })),
    })
}
