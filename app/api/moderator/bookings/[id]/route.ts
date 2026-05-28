import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { completeBooking, ensureBadgesSeeded } from "@/lib/gamification"
import { stripe } from "@/lib/stripe"
import { audit } from "@/lib/audit"
import { sendMail } from "@/lib/nodemailer"
import { reviewRequestHtml } from "@/lib/emails/reviewRequest"
import crypto from "crypto"

const VALID_TRANSITIONS: Record<string, string[]> = {
    PENDING:   ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["ACTIVE",    "CANCELLED"],
    ACTIVE:    ["COMPLETED"],
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== "MODERATOR" && session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const companyId = session.user.companyId
    if (!companyId) return NextResponse.json({ error: "No company assigned" }, { status: 400 })

    const { id } = await params
    const {
        status: newStatus, notes, startMileage, endMileage,
        inspection, damageCharge, damageDescription,
    } = await req.json()

    const booking = await prisma.transaction.findUnique({
        where:   { id },
        include: { product: true },
    })

    if (!booking || booking.product.companyId !== companyId) {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const allowed = VALID_TRANSITIONS[booking.status] ?? []
    if (!allowed.includes(newStatus)) {
        return NextResponse.json(
            { error: `Cannot transition from ${booking.status} to ${newStatus}` },
            { status: 409 }
        )
    }

    // ── CONFIRMED → ACTIVE ───────────────────────────────────────────────────
    if (newStatus === "ACTIVE") {
        if (startMileage == null || startMileage === "") {
            return NextResponse.json({ error: "Start odometer is required to activate a booking." }, { status: 400 })
        }
        if (Number(startMileage) < 0) {
            return NextResponse.json({ error: "Start odometer cannot be negative." }, { status: 400 })
        }
        const updated = await prisma.transaction.update({
            where: { id },
            data:  { status: "ACTIVE", startMileage: Number(startMileage) },
        })
        audit({
            action:    "booking.activated",
            entity:    "booking",
            entityId:  id,
            userId:    session.user.id,
            userEmail: session.user.email,
            userRole:  session.user.role,
            metadata:  { startMileage: Number(startMileage) },
        })
        return NextResponse.json(updated)
    }

    // ── ACTIVE → COMPLETED ───────────────────────────────────────────────────
    if (newStatus === "COMPLETED") {
        if (endMileage == null || endMileage === "") {
            return NextResponse.json({ error: "End odometer is required to complete a booking." }, { status: 400 })
        }

        const endKm = Number(endMileage)

        if (endKm < 0) {
            return NextResponse.json({ error: "End odometer cannot be negative." }, { status: 400 })
        }

        if (booking.startMileage == null) {
            return NextResponse.json(
                { error: "Start odometer was never recorded. Cannot calculate driven km." },
                { status: 400 }
            )
        }

        const startKm  = booking.startMileage
        const drivenKm = endKm - startKm

        if (drivenKm < 0) {
            return NextResponse.json(
                { error: "End odometer cannot be less than start odometer." },
                { status: 400 }
            )
        }
        const p            = booking.product
        const purchasedKm  = booking.extraKmPurchased ?? 0

        // Allowed = (daily limit × days) + purchased km packages
        const baseAllowed  = p.dailyKmLimit ? p.dailyKmLimit * booking.totalDays : null
        const allowedKm    = baseAllowed !== null ? baseAllowed + purchasedKm : null

        let excessPayload: {
            drivenKm: number; allowedKm: number; purchasedKm: number
            excessKm: number; charge: number; stripeUrl: string
        } | null = null

        // Build extra DB fields to write atomically alongside COMPLETED + XP
        const extraData: Record<string, unknown> = { endMileage: endKm }
        const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000"

        if (
            allowedKm !== null &&
            drivenKm > allowedKm &&
            p.excessKmFee &&
            p.excessKmFee > 0
        ) {
            const excessKm = drivenKm - allowedKm
            const charge   = Math.round(excessKm * p.excessKmFee * 100) / 100

            const checkoutSession = await stripe.checkout.sessions.create({
                mode:                 "payment",
                payment_method_types: ["card"],
                line_items: [{
                    price_data: {
                        currency:     "eur",
                        product_data: {
                            name:        `Excess km — ${p.brand} ${p.name}`,
                            description: `${excessKm.toLocaleString()} km over limit × €${p.excessKmFee}/km`,
                        },
                        unit_amount: Math.round(charge * 100),
                    },
                    quantity: 1,
                }],
                success_url: `${appUrl}/bookings/${id}/confirm?excess_paid=1`,
                cancel_url:  `${appUrl}/bookings/${id}/confirm`,
                metadata:    { bookingId: id, type: "excess_km", excessKm: String(excessKm) },
            })

            excessPayload = {
                drivenKm, allowedKm, purchasedKm,
                excessKm, charge,
                stripeUrl: checkoutSession.url!,
            }

            extraData.excessKmCharge          = charge
            extraData.excessKmStripeSessionId = checkoutSession.id
            extraData.excessKmStripeUrl       = checkoutSession.url
            extraData.excessKmPaid            = false
        }

        // ── Inspection report ────────────────────────────────────────────────
        if (inspection && typeof inspection === "object") {
            extraData.inspectionReport = inspection
        }

        // ── Damage charge ────────────────────────────────────────────────────
        let damageStripeUrl: string | null = null
        const parsedDamage = damageCharge ? Math.round(Number(damageCharge) * 100) / 100 : 0
        if (parsedDamage > 0) {
            const desc = damageDescription?.trim() || "Vehicle damage assessed at return"
            const damageSess = await stripe.checkout.sessions.create({
                mode:                 "payment",
                payment_method_types: ["card"],
                line_items: [{
                    price_data: {
                        currency:     "eur",
                        product_data: {
                            name:        `Damage charge — ${p.brand} ${p.name}`,
                            description: desc,
                        },
                        unit_amount: Math.round(parsedDamage * 100),
                    },
                    quantity: 1,
                }],
                success_url: `${appUrl}/bookings/${id}/confirm?damage_paid=1`,
                cancel_url:  `${appUrl}/bookings/${id}/confirm`,
                metadata:    { bookingId: id, type: "damage" },
            })
            damageStripeUrl                 = damageSess.url
            extraData.damageCharge          = parsedDamage
            extraData.damageStripeSessionId = damageSess.id
            extraData.damageStripeUrl       = damageSess.url
            extraData.damagePaid            = false
        }

        // completeBooking writes status=COMPLETED + XP + extraData in one atomic transaction
        await ensureBadgesSeeded()
        const result = await completeBooking(id, extraData)
        if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })

        audit({
            action:    "booking.completed",
            entity:    "booking",
            entityId:  id,
            userId:    session.user.id,
            userEmail: session.user.email,
            userRole:  session.user.role,
            metadata:  {
                startMileage:  startKm,
                endMileage:    endKm,
                drivenKm,
                xpAwarded:     result.xpAwarded,
                excessKm:      excessPayload?.excessKm ?? null,
                excessCharge:  excessPayload?.charge   ?? null,
                damageCharge:  parsedDamage || null,
                hasInspection: !!inspection,
            },
        })

        // Send review request email (fire-and-forget)
        const token    = crypto.randomBytes(32).toString("hex")
        const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 2 weeks
        prisma.reviewRequest.create({
            data: { token, transactionId: id, productId: booking.productId, userId: booking.userId, expiresAt },
        }).then(async () => {
            const freshBooking = await prisma.transaction.findUnique({
                where:   { id },
                include: { user: { select: { email: true, name: true } } },
            })
            if (freshBooking?.user.email) {
                await sendMail({
                    to:      freshBooking.user.email,
                    subject: `How was your ${booking.product.brand} ${booking.product.name}? Leave a review`,
                    html:    reviewRequestHtml({
                        userName:  freshBooking.user.name ?? "Valued Customer",
                        carBrand:  booking.product.brand,
                        carName:   booking.product.name,
                        reviewUrl: `${appUrl}/review/${token}`,
                        expiresAt,
                        appUrl,
                    }),
                })
            }
        }).catch(err => console.error("[review-request] failed:", err))

        return NextResponse.json({
            success:         true,
            xpAwarded:       result.xpAwarded,
            excess:          excessPayload,
            damageCharge:    parsedDamage || null,
            damageStripeUrl: damageStripeUrl,
        })
    }

    // ── Other transitions ────────────────────────────────────────────────────
    const updated = await prisma.transaction.update({
        where: { id },
        data:  { status: newStatus as any, ...(notes !== undefined ? { notes } : {}) },
    })

    audit({
        action:    "booking.status_changed",
        entity:    "booking",
        entityId:  id,
        userId:    session.user.id,
        userEmail: session.user.email,
        userRole:  session.user.role,
        metadata:  { from: booking.status, to: newStatus },
    })

    return NextResponse.json(updated)
}
