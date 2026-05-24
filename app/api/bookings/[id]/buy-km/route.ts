import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

const VALID_PACKAGES = [50, 100, 200] as const
const DISCOUNT = 0.70 // 30% cheaper than the excess fee penalty rate

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id: bookingId } = await params
    const { kmPackage } = await req.json()

    if (!VALID_PACKAGES.includes(kmPackage)) {
        return NextResponse.json({ error: "Invalid package. Choose 50, 100, or 200 km." }, { status: 400 })
    }

    const booking = await prisma.transaction.findUnique({
        where: { id: bookingId },
        include: { product: { select: { brand: true, name: true, excessKmFee: true, dailyKmLimit: true } } },
    })

    if (!booking || booking.userId !== session.user.id) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    if (booking.status !== "ACTIVE") {
        return NextResponse.json({ error: "Extra km can only be purchased for active rentals" }, { status: 409 })
    }

    if (!booking.product.dailyKmLimit || !booking.product.excessKmFee) {
        return NextResponse.json({ error: "This car has no km limit" }, { status: 400 })
    }

    const pricePerKm   = booking.product.excessKmFee * DISCOUNT
    const packagePrice = Math.round(kmPackage * pricePerKm * 100) // cents

    const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000"

    const checkoutSession = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: [
            {
                price_data: {
                    currency: "eur",
                    product_data: {
                        name:        `+${kmPackage} km Extra Package — ${booking.product.brand} ${booking.product.name}`,
                        description: `€${(pricePerKm).toFixed(2)}/km (30% off vs. excess rate of €${booking.product.excessKmFee}/km)`,
                    },
                    unit_amount: packagePrice,
                },
                quantity: 1,
            },
        ],
        success_url: `${appUrl}/bookings/${bookingId}/km-success?payment=success&km=${kmPackage}`,
        cancel_url:  `${appUrl}/bookings/${bookingId}/confirm`,
        metadata: {
            type:      "km_package",
            bookingId,
            kmAmount:  kmPackage.toString(),
        },
    })

    return NextResponse.json({ url: checkoutSession.url })
}
