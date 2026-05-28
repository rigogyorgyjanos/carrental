import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { awardXP, checkAllBadges, ensureBadgesSeeded } from "@/lib/gamification"
import { audit } from "@/lib/audit"

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
    const adminSession = await requireAdmin()
    if (!adminSession) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await context.params

    const review = await prisma.review.findUnique({ where: { id } })
    if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 })
    if (review.approved) return NextResponse.json({ error: "Already approved" }, { status: 409 })

    // Approve + recalculate product rating atomically
    await prisma.$transaction(async tx => {
        await tx.review.update({ where: { id }, data: { approved: true } })

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
    })

    // Award XP via awardXP which uses atomic increment (no stale-read level race)
    await awardXP(review.userId, REVIEW_XP)
    await ensureBadgesSeeded()
    await checkAllBadges(review.userId)

    audit({
        action:    "review.approved",
        entity:    "review",
        entityId:  id,
        userId:    adminSession.user.id,
        userEmail: adminSession.user.email,
        userRole:  adminSession.user.role,
        metadata:  { reviewUserId: review.userId, productId: review.productId, rating: review.rating },
    })

    return NextResponse.json({ success: true, xpAwarded: REVIEW_XP })
}

// DELETE /api/admin/reviews/[id] — reject a review (soft-delete: set approved=false)
// Soft-delete preserves the @@unique(userId, productId) constraint, preventing
// XP farming via submit → approve → delete → re-submit cycles.
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

    // Soft-reject: mark as not approved so it's hidden but constraint is preserved
    await prisma.$transaction(async tx => {
        await tx.review.update({ where: { id }, data: { approved: false } })

        // Recalculate product rating without this review
        const agg = await tx.review.aggregate({
            where:  { productId: review.productId, approved: true },
            _avg:   { rating: true },
            _count: { rating: true },
        })
        await tx.product.update({
            where: { id: review.productId },
            data:  {
                rating:      agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : null,
                reviewCount: agg._count.rating,
            },
        })
    })

    const adminSession = await getServerSession(authOptions)
    audit({
        action:    "review.rejected",
        entity:    "review",
        entityId:  id,
        userId:    adminSession?.user?.id,
        userEmail: adminSession?.user?.email,
        userRole:  adminSession?.user?.role,
        metadata:  { reviewUserId: review.userId, productId: review.productId },
    })

    return NextResponse.json({ success: true })
}
