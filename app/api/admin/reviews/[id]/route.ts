import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { checkAllBadges, ensureBadgesSeeded } from "@/lib/gamification"
import { getLevel } from "@/lib/tiers"

const REVIEW_XP = 1

async function requireAdmin() {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") return null
    return session
}

// PATCH /api/admin/reviews/[id] — approve a review
export async function PATCH(
    _req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    if (!await requireAdmin()) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await context.params

    const review = await prisma.review.findUnique({
        where: { id },
        include: { user: { select: { xp: true } } },
    })
    if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 })
    if (review.approved) return NextResponse.json({ error: "Already approved" }, { status: 409 })

    const newLevel = getLevel((review.user.xp ?? 0) + REVIEW_XP)

    await prisma.$transaction(async tx => {
        // Approve the review
        await tx.review.update({ where: { id }, data: { approved: true } })

        // Recalculate product rating from approved reviews only
        const agg = await tx.review.aggregate({
            where:  { productId: review.productId, approved: true },
            _avg:   { rating: true },
            _count: { rating: true },
        })
        await tx.product.update({
            where: { id: review.productId },
            data:  {
                rating:      Math.round((agg._avg.rating ?? review.rating) * 10) / 10,
                reviewCount: agg._count.rating,
            },
        })

        // Award XP to reviewer
        await tx.user.update({
            where: { id: review.userId },
            data:  { xp: { increment: REVIEW_XP }, level: newLevel },
        })
        await tx.xpTransaction.create({
            data: { userId: review.userId, xpAmount: REVIEW_XP },
        })
    })

    await ensureBadgesSeeded()
    await checkAllBadges(review.userId)

    return NextResponse.json({ success: true, xpAwarded: REVIEW_XP })
}

// DELETE /api/admin/reviews/[id] — reject (delete) a review
export async function DELETE(
    _req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    if (!await requireAdmin()) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await context.params

    const review = await prisma.review.findUnique({ where: { id } })
    if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 })

    await prisma.review.delete({ where: { id } })

    return NextResponse.json({ success: true })
}
