import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function POST(
    _req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await context.params

    const booking = await prisma.transaction.findUnique({ where: { id } })
    if (!booking) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    if (booking.status === "CANCELLED") {
        return NextResponse.json({ error: "Booking is already cancelled" }, { status: 409 })
    }

    // Issue Stripe refund if a payment was collected
    if (booking.paymentIntentId) {
        try {
            await stripe.refunds.create({ payment_intent: booking.paymentIntentId })
        } catch (err) {
            console.error("Stripe refund failed:", err)
            return NextResponse.json({ error: "Stripe refund failed" }, { status: 502 })
        }
    }

    const updated = await prisma.transaction.update({
        where: { id },
        data:  { status: "CANCELLED" },
    })

    return NextResponse.json({ success: true, booking: updated })
}
