import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { getTierDiscount, getTier, getXpForRental } from "@/lib/tiers"
import { audit } from "@/lib/audit"

const SERVICE_FEE = 10
import { sendMail } from "@/lib/nodemailer"
import { bookingConfirmationHtml } from "@/lib/emails/bookingConfirmation"

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

// Prevent XSS in admin notification emails
function escHtml(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
}

// Thrown inside prisma.$transaction to signal an overlap — caught outside
class OverlapError extends Error {
    constructor() { super("OVERLAP"); this.name = "OverlapError" }
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    let body: { productId?: unknown; startDate?: unknown; endDate?: unknown }
    try {
        body = await req.json()
    } catch {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const { productId, startDate, endDate } = body

    if (!productId || !startDate || !endDate) {
        return NextResponse.json({ error: "Missing booking data" }, { status: 400 })
    }

    if (typeof startDate !== "string" || typeof endDate !== "string") {
        return NextResponse.json({ error: "Dates must be strings" }, { status: 400 })
    }

    if (!DATE_RE.test(startDate) || !DATE_RE.test(endDate)) {
        return NextResponse.json({ error: "Invalid date format — expected YYYY-MM-DD" }, { status: 400 })
    }

    const start = new Date(startDate + "T00:00:00.000Z")
    const end   = new Date(endDate   + "T00:00:00.000Z")

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
        return NextResponse.json({ error: "Invalid rental period" }, { status: 400 })
    }

    try {
        const product = await prisma.product.findUnique({ where: { id: String(productId) } })
        if (!product || !product.active) {
            return NextResponse.json({ error: "Car not available" }, { status: 404 })
        }

        // Inclusive day count — June 1 → June 3 = 3 days
        const totalDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

        if (product.minimumRentalDays && totalDays < product.minimumRentalDays) {
            return NextResponse.json(
                { error: `Minimum rental period for this vehicle is ${product.minimumRentalDays} days` },
                { status: 400 }
            )
        }

        const dbUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { xp: true },
        })
        const discount      = getTierDiscount(dbUser?.xp ?? 0)
        const basePrice     = totalDays * product.pricePerDay
        const totalPrice    = Math.round((basePrice * (1 - discount) + SERVICE_FEE) * 100) / 100
        const deposit       = product.deposit ?? Math.round(totalPrice * 0.2 * 100) / 100

        // ── Overlap check + create inside a Serializable transaction ─────────
        // Serializable isolation prevents two concurrent requests from both
        // passing the overlap check and creating duplicate bookings.
        let booking
        try {
            booking = await prisma.$transaction(async (tx) => {
                const overlap = await tx.transaction.findFirst({
                    where: {
                        productId: String(productId),
                        status: { in: ["PENDING", "CONFIRMED", "ACTIVE"] },
                        OR: [{ startDate: { lte: end }, endDate: { gte: start } }],
                    },
                    select: { id: true },
                })
                if (overlap) throw new OverlapError()

                return tx.transaction.create({
                    data: {
                        userId:          session.user.id,
                        productId:       product.id,
                        startDate:       start,
                        endDate:         end,
                        totalDays,
                        pricePerDay:     product.pricePerDay,
                        totalPrice,
                        deposit,
                        discountApplied: discount > 0 ? discount : null,
                        status:          "PENDING",
                    },
                })
            }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
        } catch (err) {
            if (err instanceof OverlapError) {
                return NextResponse.json({ error: "Car already booked for this period" }, { status: 409 })
            }
            // Serialization failure (P2034) — another transaction won the race
            if (
                err instanceof Prisma.PrismaClientKnownRequestError &&
                err.code === "P2034"
            ) {
                return NextResponse.json({ error: "Car already booked for this period" }, { status: 409 })
            }
            throw err
        }

        // ── Emails (non-blocking) ─────────────────────────────────────────────
        const appUrl   = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
        const tier     = getTier(dbUser?.xp ?? 0)
        const subtotal = totalDays * product.pricePerDay
        const fmt      = (d: Date) =>
            d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })

        sendMail({
            to:      session.user.email!,
            subject: `Booking Confirmed — ${product.name}`,
            html:    bookingConfirmationHtml({
                userName:       session.user.name ?? "Valued Customer",
                userEmail:      session.user.email!,
                carName:        product.name,
                carBrand:       product.brand,
                startDate:      fmt(start),
                endDate:        fmt(end),
                totalDays,
                pricePerDay:    product.pricePerDay,
                subtotal,
                discountAmount: discount > 0 ? subtotal * discount : 0,
                discountPct:    discount * 100,
                serviceFee:     10,
                totalPrice,
                deposit:        deposit ?? null,
                xpToEarn:       getXpForRental(product.category, totalDays),
                tierName:       tier.name,
                bookingId:      booking.id,
                appUrl,
            }),
        }).catch(err => console.error("Customer email failed:", err))

        const adminEmail = process.env.ADMIN_EMAIL
        if (adminEmail) {
            sendMail({
                to:      adminEmail,
                subject: `New Booking: ${product.name} — ${session.user.name ?? session.user.email}`,
                html: `
                    <div style="font-family:sans-serif;background:#0B0B0F;color:#F5F5F0;padding:32px;border-radius:12px;">
                        <p style="color:#C9A84C;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:8px;">AURUM Admin Notification</p>
                        <h2 style="margin:0 0 20px;font-size:22px;font-weight:300;">New Booking Received</h2>
                        <table style="width:100%;border-collapse:collapse;">
                            <tr><td style="padding:6px 0;color:#6B7280;font-size:13px;">Vehicle</td><td style="padding:6px 0;font-size:13px;">${escHtml(product.brand)} ${escHtml(product.name)}</td></tr>
                            <tr><td style="padding:6px 0;color:#6B7280;font-size:13px;">Customer</td><td style="padding:6px 0;font-size:13px;">${escHtml(session.user.name ?? "—")} (${escHtml(session.user.email ?? "")})</td></tr>
                            <tr><td style="padding:6px 0;color:#6B7280;font-size:13px;">Dates</td><td style="padding:6px 0;font-size:13px;">${fmt(start)} → ${fmt(end)} (${totalDays}d)</td></tr>
                            <tr><td style="padding:6px 0;color:#6B7280;font-size:13px;">Total</td><td style="padding:6px 0;font-size:13px;color:#C9A84C;font-weight:600;">€${totalPrice.toFixed(0)}</td></tr>
                            ${discount > 0 ? `<tr><td style="padding:6px 0;color:#6B7280;font-size:13px;">Discount</td><td style="padding:6px 0;font-size:13px;color:#34D399;">${(discount * 100).toFixed(0)}% loyalty</td></tr>` : ""}
                        </table>
                        <div style="margin-top:24px;">
                            <a href="${appUrl}/admin/transactions" style="display:inline-block;background:#C9A84C;color:#0B0B0F;font-size:13px;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;">
                                Review in Admin Panel →
                            </a>
                        </div>
                    </div>
                `,
            }).catch(err => console.error("Admin email failed:", err))
        }

        audit({
            action:    "booking.created",
            entity:    "booking",
            entityId:  booking.id,
            userId:    session.user.id,
            userEmail: session.user.email,
            userRole:  session.user.role,
            metadata:  {
                car:        `${product.brand} ${product.name}`,
                dates:      `${startDate} → ${endDate}`,
                totalDays,
                totalPrice,
                discount:   discount > 0 ? `${(discount * 100).toFixed(0)}%` : null,
            },
        })

        return NextResponse.json({ ...booking, discountApplied: discount }, { status: 201 })
    } catch (error) {
        console.error("Booking creation error:", error)
        return NextResponse.json({ error: "Booking failed" }, { status: 500 })
    }
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const carId = searchParams.get("carId")

    if (!carId) {
        return NextResponse.json({ error: "Missing carId" }, { status: 400 })
    }

    try {
        const bookings = await prisma.transaction.findMany({
            where: {
                productId: carId,
                status: { in: ["PENDING", "CONFIRMED", "ACTIVE"] },
            },
            select: {
                startDate: true,
                endDate:   true,
            },
        })

        return NextResponse.json(bookings)
    } catch (error) {
        console.error("Fetch bookings error:", error)
        return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 })
    }
}
