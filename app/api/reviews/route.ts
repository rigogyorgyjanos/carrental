import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { awardXP, checkAllBadges, ensureBadgesSeeded } from "@/lib/gamification"

const REVIEW_XP = 25

// ── GET /api/reviews?carId=xxx ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
    const carId = new URL(req.url).searchParams.get("carId")
    if (!carId) return NextResponse.json({ error: "Missing carId" }, { status: 400 })

    const reviews = await prisma.review.findMany({
        where:   { productId: carId },
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(reviews)
}

// ── POST /api/reviews ──────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const { productId, rating, comment } = await req.json()

    if (!productId || typeof rating !== "number" || rating < 1 || rating > 5) {
        return NextResponse.json({ error: "Invalid review data" }, { status: 400 })
    }

    // Must have a COMPLETED booking for this car
    const completedBooking = await prisma.transaction.findFirst({
        where: { userId: session.user.id, productId, status: "COMPLETED" },
    })
    if (!completedBooking) {
        return NextResponse.json({ error: "You can only review cars you have rented" }, { status: 403 })
    }

    // One review per user per car
    const existing = await prisma.review.findUnique({
        where: { userId_productId: { userId: session.user.id, productId } },
    })
    if (existing) {
        return NextResponse.json({ error: "You have already reviewed this vehicle" }, { status: 409 })
    }

    // Create review + recalculate product rating in one transaction
    const review = await prisma.$transaction(async tx => {
        const created = await tx.review.create({
            data: {
                userId:    session.user.id,
                productId,
                rating,
                comment:   comment?.trim() || null,
            },
            include: { user: { select: { id: true, name: true, image: true } } },
        })

        const agg = await tx.review.aggregate({
            where:   { productId },
            _avg:    { rating: true },
            _count:  { rating: true },
        })

        await tx.product.update({
            where: { id: productId },
            data:  {
                rating:      Math.round((agg._avg.rating ?? rating) * 10) / 10,
                reviewCount: agg._count.rating,
            },
        })

        return created
    })

    // Award XP + check badges (non-blocking)
    await ensureBadgesSeeded()
    await awardXP(session.user.id, REVIEW_XP)
    await checkAllBadges(session.user.id)

    return NextResponse.json({ review, xpAwarded: REVIEW_XP }, { status: 201 })
}
