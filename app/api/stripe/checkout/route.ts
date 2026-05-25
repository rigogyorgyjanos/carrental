import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { bookingId } = await req.json()
    if (!bookingId) {
        return NextResponse.json({ error: "Missing bookingId" }, { status: 400 })
    }

    const booking = await prisma.transaction.findUnique({
        where: { id: bookingId },
        include: { product: true },
    })

    if (!booking || booking.userId !== session.user.id) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    if (booking.status !== "PENDING") {
        return NextResponse.json({ error: "Booking is no longer pending" }, { status: 409 })
    }

    const depositAmount = booking.deposit ?? Math.round(booking.totalPrice * 0.2)
    const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000"

    const fmt = (d: Date) =>
        d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })

    const checkoutSession = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: [
            {
                price_data: {
                    currency: "eur",
                    product_data: {
                        name:        `Deposit — ${booking.product.brand} ${booking.product.name}`,
                        description: `${booking.totalDays} day rental · ${fmt(booking.startDate)} → ${fmt(booking.endDate)}`,
                    },
                    unit_amount: Math.round(depositAmount * 100),
                },
                quantity: 1,
            },
        ],
        success_url: `${appUrl}/bookings/${bookingId}/confirm?payment=success`,
        cancel_url:  `${appUrl}/bookings/${bookingId}/payment-cancel`,
        metadata: { bookingId, type: "deposit" },
    })

    // Store the session ID on the booking
    await prisma.transaction.update({
        where: { id: bookingId },
        data:  { stripeSessionId: checkoutSession.id },
    })

    return NextResponse.json({ url: checkoutSession.url })
}
