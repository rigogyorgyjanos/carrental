import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { getXpForRental, getTier } from "@/lib/tiers"
import PayDepositButton from "./PayDepositButton"

export const dynamic = "force-dynamic"

const SERVICE_FEE = 10

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string; border: string }> = {
    PENDING:   { label: "Awaiting payment",      color: "#F59E0B", bg: "#F59E0B15", border: "#F59E0B30" },
    CONFIRMED: { label: "Confirmed",             color: "#60A5FA", bg: "#60A5FA15", border: "#60A5FA30" },
    ACTIVE:    { label: "Active rental",         color: "#34D399", bg: "#34D39915", border: "#34D39930" },
    COMPLETED: { label: "Completed",             color: "#C9A84C", bg: "#C9A84C15", border: "#C9A84C30" },
    CANCELLED: { label: "Cancelled",             color: "#6B7280", bg: "#6B728015", border: "#6B728030" },
}

interface Props {
    params:       Promise<{ id: string }>
    searchParams: Promise<{ payment?: string; damage_paid?: string; excess_paid?: string }>
}

export default async function BookingConfirmPage({ params, searchParams }: Props) {
    const session = await getServerSession(authOptions)
    if (!session?.user) redirect("/api/auth/signin")

    const { id }                             = await params
    const { payment, damage_paid, excess_paid } = await searchParams
    const paymentSuccess = payment    === "success"
    const damagePaid     = damage_paid  === "1"
    const excessPaid     = excess_paid  === "1"

    const booking = await prisma.transaction.findUnique({
        where: { id },
        include: {
            product: { include: { images: true } },
            user:    true,
        },
    })

    if (!booking || booking.userId !== session.user.id) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-dark">
                <p className="text-muted text-5xl">◎</p>
                <h1 className="font-heading text-2xl text-white-soft">Booking not found</h1>
                <Link href="/profile" className="text-gold text-sm font-stats hover:underline">
                    ← Back to profile
                </Link>
            </div>
        )
    }

    const subtotal      = booking.totalDays * booking.pricePerDay
    const discountPct   = booking.discountApplied ?? 0
    const discountAmt   = discountPct > 0 ? subtotal * discountPct : 0
    const xpToEarn      = booking.xpAwarded ?? getXpForRental(booking.product.category, booking.totalDays)
    const tier          = getTier(booking.user.xp)
    const statusStyle   = STATUS_STYLES[booking.status] ?? STATUS_STYLES.PENDING
    const coverImage    = booking.product.images[0]?.url ?? null
    const isPending     = booking.status === "PENDING"

    const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })

    return (
        <div className="min-h-screen bg-dark">
            <div className="max-w-2xl mx-auto px-6 py-16">

                {/* ── Hero ─────────────────────────────────────────── */}
                <div className="text-center mb-12">
                    <div
                        className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 text-4xl"
                        style={{ background: `${statusStyle.color}18`, border: `2px solid ${statusStyle.color}40` }}
                    >
                        {booking.status === "COMPLETED" ? "✓"  :
                         booking.status === "CANCELLED" ? "✕"  :
                         booking.status === "PENDING"   ? "⏳" : "🎉"}
                    </div>
                    <h1 className="font-heading text-4xl font-light text-white-soft mb-2">
                        {booking.status === "COMPLETED" ? "Rental Completed"      :
                         booking.status === "CANCELLED" ? "Booking Cancelled"     :
                         booking.status === "PENDING"   ? "Complete Your Payment" :
                         "Booking Confirmed!"}
                    </h1>
                    <p className="text-muted text-sm font-stats">
                        {booking.status === "PENDING"
                            ? "Your dates are reserved — pay the deposit to confirm your booking."
                            : booking.status === "CONFIRMED"
                            ? "Your reservation is confirmed. Enjoy your drive!"
                            : ""}
                    </p>
                </div>

                {/* ── Banners ──────────────────────────────────────── */}

                {/* Deposit success */}
                {paymentSuccess && (
                    <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl px-5 py-4 mb-6">
                        <span className="text-emerald-400 text-xl shrink-0">✓</span>
                        <div>
                            <p className="text-emerald-400 font-stats font-semibold text-sm leading-none mb-0.5">
                                Deposit payment received
                            </p>
                            <p className="text-muted text-[12px] font-stats">
                                Your booking is now confirmed. A confirmation email has been sent.
                            </p>
                        </div>
                    </div>
                )}

                {/* Excess km paid */}
                {excessPaid && (
                    <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl px-5 py-4 mb-6">
                        <span className="text-emerald-400 text-xl shrink-0">✓</span>
                        <div>
                            <p className="text-emerald-400 font-stats font-semibold text-sm leading-none mb-0.5">
                                Excess km charge paid
                            </p>
                            <p className="text-muted text-[12px] font-stats">
                                Thank you — the excess km charge has been settled.
                            </p>
                        </div>
                    </div>
                )}

                {/* Damage paid */}
                {damagePaid && (
                    <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl px-5 py-4 mb-6">
                        <span className="text-emerald-400 text-xl shrink-0">✓</span>
                        <div>
                            <p className="text-emerald-400 font-stats font-semibold text-sm leading-none mb-0.5">
                                Damage charge paid
                            </p>
                            <p className="text-muted text-[12px] font-stats">
                                Thank you — the damage charge has been settled.
                            </p>
                        </div>
                    </div>
                )}

                {/* Pending payment warning */}
                {isPending && !paymentSuccess && (
                    <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/25 rounded-2xl px-5 py-4 mb-6">
                        <span className="text-amber-400 text-xl shrink-0 mt-0.5">⚠</span>
                        <div>
                            <p className="text-amber-400 font-stats font-semibold text-sm leading-none mb-1">
                                Payment required
                            </p>
                            <p className="text-muted text-[12px] font-stats">
                                Your booking is not yet confirmed. Complete the deposit payment below to secure your dates.
                            </p>
                        </div>
                    </div>
                )}

                {/* ── Car card ──────────────────────────────────────── */}
                <div className="bg-surface border border-surface-3 rounded-2xl overflow-hidden mb-5">
                    {coverImage && (
                        <div className="relative h-52 overflow-hidden">
                            <Image
                                src={coverImage}
                                alt={booking.product.name}
                                fill
                                sizes="(max-width: 672px) 100vw, 672px"
                                className="object-cover"
                            />
                        </div>
                    )}
                    <div className="px-6 py-5">
                        <p className="text-gold text-[11px] font-stats uppercase tracking-[0.2em] mb-1">
                            {booking.product.brand}
                        </p>
                        <div className="flex items-start justify-between gap-4">
                            <h2 className="font-heading text-2xl font-light text-white-soft">
                                {booking.product.name}
                            </h2>
                            <span
                                className="shrink-0 text-[11px] font-stats px-3 py-1.5 rounded-full border mt-0.5"
                                style={{ color: statusStyle.color, background: statusStyle.bg, borderColor: statusStyle.border }}
                            >
                                {statusStyle.label}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── Dates ─────────────────────────────────────────── */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="bg-surface border border-surface-3 rounded-xl px-4 py-4">
                        <p className="text-muted-2 text-[10px] font-stats uppercase tracking-wider mb-1">Check-in</p>
                        <p className="text-white-soft font-stats font-semibold text-sm">
                            {fmt(booking.startDate)}
                        </p>
                    </div>
                    <div className="bg-surface border border-surface-3 rounded-xl px-4 py-4">
                        <p className="text-muted-2 text-[10px] font-stats uppercase tracking-wider mb-1">Check-out</p>
                        <p className="text-white-soft font-stats font-semibold text-sm">
                            {fmt(booking.endDate)}
                        </p>
                    </div>
                </div>

                {/* ── Price breakdown ───────────────────────────────── */}
                <div className="bg-surface border border-surface-3 rounded-2xl px-6 py-5 mb-5 space-y-3">
                    <div className="flex justify-between text-sm font-stats">
                        <span className="text-muted">€{booking.pricePerDay}/day × {booking.totalDays} day{booking.totalDays > 1 ? "s" : ""}</span>
                        <span className="text-white-soft">€{subtotal.toFixed(0)}</span>
                    </div>

                    {discountPct > 0 && (
                        <div className="flex justify-between text-sm font-stats">
                            <span className="text-emerald-400 flex items-center gap-1.5">
                                <span className="text-[10px]">◆</span>
                                {tier.name} discount ({(discountPct * 100).toFixed(0)}% off)
                            </span>
                            <span className="text-emerald-400">−€{discountAmt.toFixed(0)}</span>
                        </div>
                    )}

                    <div className="flex justify-between text-sm font-stats">
                        <span className="text-muted">Service fee</span>
                        <span className="text-white-soft">€{SERVICE_FEE}</span>
                    </div>

                    <div className="flex justify-between font-bold border-t border-surface-3 pt-3 mt-1">
                        <span className="text-white-soft font-stats">Total</span>
                        <span className="text-gold font-stats text-xl">€{booking.totalPrice.toFixed(0)}</span>
                    </div>

                    {booking.deposit != null && (
                        <div className="flex justify-between text-sm font-stats border-t border-surface-3 pt-3">
                            <span className="text-muted">
                                Deposit {isPending ? "due now" : "paid"}
                            </span>
                            <span className={isPending ? "text-amber-400 font-semibold" : "text-white-soft"}>
                                €{booking.deposit.toFixed(0)}
                            </span>
                        </div>
                    )}
                </div>

                {/* ── XP banner ─────────────────────────────────────── */}
                {booking.status !== "CANCELLED" && xpToEarn > 0 && (
                    <div className="flex items-center gap-4 bg-gold/8 border border-gold/20 rounded-2xl px-5 py-4 mb-5">
                        <span className="text-gold text-xl shrink-0">◆</span>
                        <div>
                            <p className="text-gold font-stats font-semibold text-sm leading-none mb-1">
                                {booking.status === "COMPLETED"
                                    ? `+${xpToEarn} XP earned`
                                    : `+${xpToEarn} XP to earn`}
                            </p>
                            <p className="text-muted text-[12px] font-stats">
                                {booking.status === "COMPLETED"
                                    ? "Added to your loyalty balance."
                                    : "XP will be credited when your rental is completed."}
                            </p>
                        </div>
                    </div>
                )}

                {/* ── Actions ───────────────────────────────────────── */}
                <div className="flex flex-col gap-3">
                    {/* Pay deposit — only for PENDING bookings */}
                    {isPending && (
                        <PayDepositButton
                            bookingId={booking.id}
                            depositAmt={booking.deposit}
                        />
                    )}

                    <div className="flex flex-col sm:flex-row gap-3">
                        <Link
                            href="/profile"
                            className={`flex-1 text-center font-body font-semibold py-4 rounded-xl text-sm transition-colors ${
                                isPending
                                    ? "bg-surface border border-surface-3 hover:border-gold/30 text-white-soft"
                                    : "bg-gold hover:bg-gold-light text-dark"
                            }`}
                        >
                            View all bookings
                        </Link>
                        <Link
                            href="/cars"
                            className="flex-1 text-center bg-surface border border-surface-3 hover:border-gold/30 text-white-soft font-body font-semibold py-4 rounded-xl text-sm transition-colors"
                        >
                            Browse more cars
                        </Link>
                    </div>
                </div>

                {/* Booking reference */}
                <p className="text-center text-muted-2 text-[11px] font-stats mt-6">
                    Booking reference: <span className="text-muted">{booking.id}</span>
                </p>
            </div>
        </div>
    )
}
