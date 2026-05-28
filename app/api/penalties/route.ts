import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { stripe } from "@/lib/stripe"
import { sendMail } from "@/lib/nodemailer"
import { penaltyNotificationHtml } from "@/lib/emails/penaltyNotification"
import { audit } from "@/lib/audit"

// GET /api/penalties — list penalties
// Admin: all penalties | Moderator: own company's penalties only
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status") // "UNPAID" | "PAID" | "CANCELLED" | null

    const where: Record<string, unknown> = {}
    if (status) where.status = status

    if (session.user.role === "MODERATOR") {
        const companyId = session.user.companyId
        if (!companyId) return NextResponse.json({ error: "No company assigned" }, { status: 400 })
        where.companyId = companyId
    }

    const penalties = await prisma.penalty.findMany({
        where: where as any,
        include: {
            user:     { select: { id: true, name: true, email: true, image: true } },
            issuedBy: { select: { id: true, name: true, role: true } },
            company:  { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(penalties)
}

// POST /api/penalties — issue a penalty
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    let body: Record<string, unknown>
    try {
        body = await req.json()
    } catch {
        return NextResponse.json({ error: "Invalid body" }, { status: 400 })
    }

    const { userId, reason, amount } = body

    if (!userId || !reason || amount == null) {
        return NextResponse.json({ error: "userId, reason and amount are required" }, { status: 400 })
    }
    if (typeof amount !== "number" || amount <= 0) {
        return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 })
    }
    if (amount > 5000) {
        return NextResponse.json({ error: "Penalty amount cannot exceed €5,000" }, { status: 400 })
    }
    if (typeof reason !== "string" || reason.trim().length < 5) {
        return NextResponse.json({ error: "Reason must be at least 5 characters" }, { status: 400 })
    }

    // Verify target user exists
    const targetUser = await prisma.user.findUnique({
        where:  { id: String(userId) },
        select: { id: true, name: true, email: true },
    })
    if (!targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const isAdmin     = session.user.role === "ADMIN"
    const companyId   = session.user.companyId ?? null

    // Moderators can only fine users who have booked from their company
    if (!isAdmin) {
        if (!companyId) return NextResponse.json({ error: "No company assigned" }, { status: 400 })
        const hasBooking = await prisma.transaction.findFirst({
            where: {
                userId:  String(userId),
                product: { companyId },
            },
            select: { id: true },
        })
        if (!hasBooking) {
            return NextResponse.json(
                { error: "You can only issue fines to users who have booked from your company" },
                { status: 403 }
            )
        }
    }

    // Issuer label for the email
    let issuedByLabel = "AURUM Admin"
    if (companyId) {
        const company = await prisma.company.findUnique({ where: { id: companyId }, select: { name: true } })
        if (company) issuedByLabel = company.name
    }

    const appUrl      = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
    const roundedAmt  = Math.round(amount * 100) / 100

    // Create Stripe Checkout session for the fine payment
    const checkoutSession = await stripe.checkout.sessions.create({
        mode:                 "payment",
        payment_method_types: ["card"],
        line_items: [{
            price_data: {
                currency:     "eur",
                product_data: {
                    name:        `AURUM Penalty — ${issuedByLabel}`,
                    description: reason.trim(),
                },
                unit_amount: Math.round(roundedAmt * 100),
            },
            quantity: 1,
        }],
        success_url: `${appUrl}/dashboard?penalty_paid=1`,
        cancel_url:  `${appUrl}/dashboard`,
        metadata: {
            type:      "penalty",
            userId:    targetUser.id,
            issuedBy:  session.user.id,
            companyId: companyId ?? "",
        },
        customer_email: targetUser.email ?? undefined,
    })

    const penalty = await prisma.penalty.create({
        data: {
            userId:          targetUser.id,
            issuedById:      session.user.id,
            companyId:       companyId ?? null,
            reason:          reason.trim(),
            amount:          roundedAmt,
            status:          "UNPAID",
            stripeSessionId: checkoutSession.id,
            stripePaymentUrl: checkoutSession.url,
        },
    })

    audit({
        action:    "penalty.issued",
        entity:    "penalty",
        entityId:  penalty.id,
        userId:    session.user.id,
        userEmail: session.user.email,
        userRole:  session.user.role,
        level:     "WARN",
        metadata:  {
            targetUserId:    targetUser.id,
            targetUserEmail: targetUser.email,
            amount:          roundedAmt,
            reason:          reason.trim(),
            companyId,
        },
    })

    // Send notification email and track success
    let notificationSent = false
    if (targetUser.email) {
        try {
            await sendMail({
                to:      targetUser.email,
                subject: `Penalty Notice — €${roundedAmt.toFixed(2)} from ${issuedByLabel}`,
                html:    penaltyNotificationHtml({
                    recipientName:  targetUser.name,
                    recipientEmail: targetUser.email,
                    issuedBy:       issuedByLabel,
                    reason:         reason.trim(),
                    amount:         roundedAmt,
                    paymentUrl:     checkoutSession.url!,
                    appUrl,
                }),
            })
            notificationSent = true
        } catch (err) {
            console.error("[penalty] Email send failed:", err)
        }
    }

    await prisma.penalty.update({
        where: { id: penalty.id },
        data:  { notificationSent },
    })

    return NextResponse.json(penalty, { status: 201 })
}
