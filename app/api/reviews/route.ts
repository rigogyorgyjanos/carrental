import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

// ── GET /api/reviews?carId=xxx — only approved reviews ────────────────────
export async function GET(req: NextRequest) {
    const carId = new URL(req.url).searchParams.get("carId")
    if (!carId) return NextResponse.json({ error: "Missing carId" }, { status: 400 })

    const reviews = await prisma.review.findMany({
        where:   { productId: carId, approved: true },
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(reviews)
}

// ── POST /api/reviews — submits for admin approval ────────────────────────
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

    const review = await prisma.review.create({
        data: {
            userId:    session.user.id,
            productId,
            rating,
            comment:   comment?.trim() || null,
            approved:  false,
        },
        include: { user: { select: { id: true, name: true, image: true } } },
    })

    return NextResponse.json({ review, pending: true }, { status: 201 })
}
