import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { stripe } from "@/lib/stripe"

// GET /api/moderator/bookings/[id]/excess-status
// Checks Stripe payment status for the excess km charge and updates DB if paid.
// Regenerates the Stripe session if it has expired.
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== "MODERATOR" && session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const companyId = session.user.companyId
    if (!companyId) return NextResponse.json({ error: "No company assigned" }, { status: 400 })

    const { id } = await params

    const booking = await prisma.transaction.findUnique({
        where:   { id },
        include: { product: true },
    })

    if (!booking || booking.product.companyId !== companyId) {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    if (!booking.excessKmStripeSessionId) {
        return NextResponse.json({ hasExcess: false })
    }

    if (booking.excessKmPaid) {
        return NextResponse.json({ hasExcess: true, paid: true, charge: booking.excessKmCharge })
    }

    // Check live status from Stripe
    const stripeSession = await stripe.checkout.sessions.retrieve(booking.excessKmStripeSessionId)

    if (stripeSession.payment_status === "paid") {
        await prisma.transaction.update({
            where: { id },
            data:  { excessKmPaid: true },
        })
        return NextResponse.json({ hasExcess: true, paid: true, charge: booking.excessKmCharge })
    }

    // Session expired — regenerate a fresh Stripe checkout session
    if (stripeSession.status === "expired") {
        const charge = booking.excessKmCharge
        if (!charge || charge <= 0) {
            return NextResponse.json({ error: "Cannot regenerate session: stored charge is missing" }, { status: 500 })
        }

        const p      = booking.product
        const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000"

        const hasMileage = booking.endMileage != null && booking.startMileage != null
        let excessKm: number | null = null
        if (hasMileage) {
            const drivenKm   = booking.endMileage! - booking.startMileage!
            const purchasedKm = booking.extraKmPurchased ?? 0
            const baseAllowed = p.dailyKmLimit ? p.dailyKmLimit * booking.totalDays : null
            const allowedKm   = baseAllowed !== null ? baseAllowed + purchasedKm : null
            excessKm = allowedKm !== null ? Math.max(0, drivenKm - allowedKm) : null
        }
        const description = excessKm != null
            ? `${excessKm.toLocaleString()} km over limit × €${p.excessKmFee}/km`
            : `Excess km charge — ${p.brand} ${p.name}`

        const newSession = await stripe.checkout.sessions.create({
            mode:                 "payment",
            payment_method_types: ["card"],
            line_items: [{
                price_data: {
                    currency:     "eur",
                    product_data: {
                        name:        `Excess km — ${p.brand} ${p.name}`,
                        description,
                    },
                    unit_amount: Math.round(charge * 100),
                },
                quantity: 1,
            }],
            success_url: `${appUrl}/bookings/${id}/confirm?excess_paid=1`,
            cancel_url:  `${appUrl}/bookings/${id}/confirm`,
            metadata:    { bookingId: id, type: "excess_km", excessKm: String(excessKm ?? "") },
        })

        await prisma.transaction.update({
            where: { id },
            data:  {
                excessKmStripeSessionId: newSession.id,
                excessKmStripeUrl:       newSession.url,
            },
        })

        return NextResponse.json({
            hasExcess:  true,
            paid:       false,
            charge,
            stripeUrl:  newSession.url,
            regenerated: true,
        })
    }

    return NextResponse.json({
        hasExcess: true,
        paid:      false,
        charge:    booking.excessKmCharge,
        stripeUrl: stripeSession.url ?? booking.excessKmStripeUrl,
    })
}
