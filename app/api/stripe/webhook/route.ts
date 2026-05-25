import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"
import Stripe from "stripe"
import { sendMail } from "@/lib/nodemailer"
import { kmPurchaseConfirmationHtml } from "@/lib/emails/kmPurchaseConfirmation"

export async function POST(req: NextRequest) {
    const body = await req.text()
    const sig  = req.headers.get("stripe-signature")

    if (!sig) {
        return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 })
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
        return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
    }

    let event: Stripe.Event
    try {
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
    } catch (err) {
        console.error("Webhook signature verification failed:", err)
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    if (event.type === "checkout.session.completed") {
        const session   = event.data.object as Stripe.Checkout.Session
        const bookingId = session.metadata?.bookingId
        const type      = session.metadata?.type

        if (!bookingId) {
            console.error("Webhook: no bookingId in metadata", session.id)
            return NextResponse.json({ received: true })
        }

        const booking = await prisma.transaction.findUnique({
            where: { id: bookingId },
            include: {
                user:    { select: { email: true, name: true } },
                product: { select: { brand: true, name: true, dailyKmLimit: true } },
            },
        })
        if (!booking) {
            console.error("Webhook: booking not found", bookingId)
            return NextResponse.json({ received: true })
        }

        if (type === "km_package") {
            const kmAmount  = parseInt(session.metadata?.kmAmount ?? "0", 10)
            const pricePaid = (session.amount_total ?? 0) / 100

            const alreadyProcessed = await prisma.kmPurchase.findUnique({
                where: { stripeSessionId: session.id },
            })

            if (kmAmount > 0 && booking.status === "ACTIVE" && !alreadyProcessed) {
                try {
                    await prisma.$transaction([
                        prisma.transaction.update({
                            where: { id: bookingId },
                            data:  { extraKmPurchased: { increment: kmAmount } },
                        }),
                        prisma.kmPurchase.create({
                            data: { transactionId: bookingId, kmAmount, pricePaid, stripeSessionId: session.id },
                        }),
                    ])
                } catch (err: any) {
                    // P2002 = unique constraint — concurrent webhook already processed this session
                    if (err?.code === "P2002") return NextResponse.json({ received: true })
                    throw err
                }

                const userEmail = booking.user.email
                if (userEmail) {
                    const totalKm = (booking.product.dailyKmLimit ?? 0) * booking.totalDays
                        + booking.extraKmPurchased + kmAmount
                    const appUrl  = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
                    await sendMail({
                        to:      userEmail,
                        subject: `+${kmAmount} km added to your AURUM rental`,
                        html:    kmPurchaseConfirmationHtml({
                            userName:  booking.user.name ?? "Valued Customer",
                            userEmail,
                            carBrand:  booking.product.brand,
                            carName:   booking.product.name,
                            kmAmount,
                            pricePaid,
                            totalKm,
                            bookingId,
                            appUrl,
                        }),
                    })
                }
            }
        } else {
            // Original deposit payment — only transition if still PENDING
            if (booking.status === "PENDING") {
                await prisma.transaction.update({
                    where: { id: bookingId },
                    data: {
                        status:          "CONFIRMED",
                        paymentIntentId: session.payment_intent as string ?? null,
                    },
                })
            }
        }
    }

    return NextResponse.json({ received: true })
}
