import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { awardXP, checkAllBadges } from "@/lib/gamification"
import { audit } from "@/lib/audit"

// GET — validate token and return car/booking info for the review form
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    const { token } = await params

    const request = await prisma.reviewRequest.findUnique({
        where: { token },
    })

    if (!request) {
        return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 })
    }
    if (request.usedAt) {
        return NextResponse.json({ error: "This review link has already been used" }, { status: 409 })
    }
    if (request.expiresAt < new Date()) {
        return NextResponse.json({ error: "This review link has expired" }, { status: 410 })
    }

    // Check if user already has a review for this product
    const existing = await prisma.review.findUnique({
        where: { userId_productId: { userId: request.userId, productId: request.productId } },
    })
    if (existing) {
        return NextResponse.json({ error: "You have already submitted a review for this vehicle" }, { status: 409 })
    }

    const product = await prisma.product.findUnique({
        where:  { id: request.productId },
        select: { id: true, brand: true, name: true, category: true, images: { take: 1, select: { url: true } } },
    })

    return NextResponse.json({
        productId:  request.productId,
        carBrand:   product?.brand ?? "",
        carName:    product?.name  ?? "",
        carImage:   product?.images[0]?.url ?? null,
        expiresAt:  request.expiresAt,
    })
}

// POST — submit the review
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    const { token } = await params

    const request = await prisma.reviewRequest.findUnique({ where: { token } })

    if (!request) {
        return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 })
    }
    if (request.usedAt) {
        return NextResponse.json({ error: "This review link has already been used" }, { status: 409 })
    }
    if (request.expiresAt < new Date()) {
        return NextResponse.json({ error: "This review link has expired" }, { status: 410 })
    }

    const { rating, comment } = await req.json()

    if (typeof rating !== "number" || rating < 1 || rating > 5) {
        return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
    }

    // Idempotency: check for existing review
    const existing = await prisma.review.findUnique({
        where: { userId_productId: { userId: request.userId, productId: request.productId } },
    })
    if (existing) {
        await prisma.reviewRequest.update({ where: { token }, data: { usedAt: new Date() } })
        return NextResponse.json({ error: "You have already submitted a review for this vehicle" }, { status: 409 })
    }

    // Create review + mark token used + update product rating in one transaction.
    // If two concurrent requests race past the existing check, the @@unique on
    // (userId, productId) will throw P2002 on the second — catch it and treat as
    // success so the user sees the "thank you" screen rather than an error.
    try {
        await prisma.$transaction(async tx => {
            await tx.review.create({
                data: {
                    userId:    request.userId,
                    productId: request.productId,
                    rating,
                    comment:   comment?.trim() || null,
                    approved:  true,
                },
            })
            await tx.reviewRequest.update({
                where: { token },
                data:  { usedAt: new Date() },
            })
            const agg = await tx.review.aggregate({
                where:   { productId: request.productId, approved: true },
                _avg:    { rating: true },
                _count:  { rating: true },
            })
            await tx.product.update({
                where: { id: request.productId },
                data:  {
                    rating:      agg._avg.rating ?? null,
                    reviewCount: agg._count.rating,
                },
            })
        })
    } catch (err: any) {
        // P2002 = unique constraint — concurrent request already submitted this review
        if (err?.code === "P2002") return NextResponse.json({ success: true })
        throw err
    }

    // Award 1 XP (fire-and-forget)
    awardXP(request.userId, 1, request.transactionId)
        .then(() => checkAllBadges(request.userId))
        .catch(err => console.error("[review-xp] failed:", err))

    audit({
        action:   "review.submitted",
        entity:   "review",
        entityId: request.productId,
        userId:   request.userId,
        metadata: { rating, via: "email_token" },
    })

    return NextResponse.json({ success: true })
}
