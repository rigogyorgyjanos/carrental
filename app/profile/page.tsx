import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import Link from "next/link"
import { TIERS, BADGE_DEFS, ensureBadgesSeeded } from "@/lib/gamification"
import ProfileActions from "./ProfileActions"
import DeleteAccountButton from "./DeleteAccountButton"

// ── Tier helpers ───────────────────────────────────────────────────────────
function getTierInfo(xp: number) {
    for (let i = TIERS.length - 1; i >= 0; i--) {
        if (xp >= TIERS[i].minXp) {
            const current = TIERS[i]
            const next    = TIERS[i + 1] ?? null
            const xpIn    = xp - current.minXp
            const range   = next ? next.minXp - current.minXp : 1
            const progress = next ? Math.round((xpIn / range) * 100) : 100
            const xpToNext = next ? next.minXp - xp : 0
            return { current, next, progress, xpToNext }
        }
    }
    return { current: TIERS[0], next: TIERS[1], progress: 0, xpToNext: TIERS[1].minXp }
}

// ── Tier gradient (inline style) ───────────────────────────────────────────
const TIER_GRADIENTS: Record<string, string> = {
    "New Driver":    "linear-gradient(135deg, #1a1a1f 0%, #141418 100%)",
    "Road Explorer": "linear-gradient(135deg, #0d1a2e 0%, #141418 100%)",
    "Elite Driver":  "linear-gradient(135deg, #1a0d2e 0%, #141418 100%)",
    "VIP Member":    "linear-gradient(135deg, #2a1800 0%, #141418 100%)",
    "Dubai Legend":  "linear-gradient(135deg, #2a1f08 0%, #141418 100%)",
}

const STATUS_STYLES: Record<string, { label: string; classes: string }> = {
    PENDING:   { label: "Pending",   classes: "bg-amber-500/15 text-amber-400 border-amber-500/30"   },
    CONFIRMED: { label: "Confirmed", classes: "bg-blue-500/15 text-blue-400 border-blue-500/30"     },
    ACTIVE:    { label: "Active",    classes: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
    COMPLETED: { label: "Completed", classes: "bg-gold/15 text-gold border-gold/30"                  },
    CANCELLED: { label: "Cancelled", classes: "bg-surface-3 text-muted border-surface-3"             },
}

export default async function ProfilePage() {
    const session = await getServerSession(authOptions)
    if (!session?.user) redirect("/api/auth/signin")

    await ensureBadgesSeeded()

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            xpLogs: {
                orderBy: { createdAt: "desc" },
                take: 12,
            },
            badges: {
                include: { badge: true },
                orderBy: { awardedAt: "desc" },
            },
        },
    })

    if (!user) redirect("/api/auth/signin")

    const transactions = await prisma.transaction.findMany({
        where: { userId: user.id },
        include: {
            product: {
                select: {
                    name: true, brand: true, category: true, id: true,
                    dailyKmLimit: true, excessKmFee: true,
                },
            },
            kmPurchases: { orderBy: { createdAt: "asc" } },
        },
        orderBy: { createdAt: "desc" },
    })

    const { current: tier, next: nextTier, progress, xpToNext } = getTierInfo(user.xp)
    const gradient = TIER_GRADIENTS[tier.name] ?? TIER_GRADIENTS["New Driver"]

    // Earned badge slugs set for fast lookup
    const earnedSlugs = new Set(user.badges.map(ub => ub.badge.slug))

    // XP log enriched with product name from transactions
    const txMap = new Map(transactions.map(t => [t.id, t.product.name]))
    const xpLogs = user.xpLogs.map(log => ({
        id:           log.id,
        xpAmount:     log.xpAmount,
        createdAt:    log.createdAt.toISOString(),
        label:        log.transactionId ? `Rental: ${txMap.get(log.transactionId) ?? "Vehicle"}` : "Bonus XP",
    }))

    // Serialize transactions for client component
    const txSerialized = transactions.map(t => ({
        id:              t.id,
        productName:     t.product.name,
        productBrand:    t.product.brand,
        productCategory: t.product.category,
        productId:       t.productId,
        startDate:       t.startDate.toISOString(),
        endDate:         t.endDate.toISOString(),
        totalDays:       t.totalDays,
        pricePerDay:     t.pricePerDay,
        totalPrice:      t.totalPrice,
        deposit:         t.deposit,
        discountApplied: t.discountApplied,
        xpAwarded:       t.xpAwarded,
        status:           t.status,
        createdAt:        t.createdAt.toISOString(),
        dailyKmLimit:     t.product.dailyKmLimit ?? null,
        excessKmFee:      t.product.excessKmFee  ?? null,
        extraKmPurchased: t.extraKmPurchased,
        startMileage:     t.startMileage ?? null,
        endMileage:       t.endMileage   ?? null,
        kmPurchases:      t.kmPurchases.map(p => ({
            kmAmount:  p.kmAmount,
            pricePaid: p.pricePaid,
            createdAt: p.createdAt.toISOString(),
        })),
    }))

    const initials = user.name
        ? user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
        : "AU"

    return (
        <div className="min-h-screen bg-dark">
            <div className="max-w-6xl mx-auto px-6 py-12 space-y-10">

                {/* ── Profile header ──────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-7">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                        {user.image ? (
                            <img
                                src={user.image}
                                alt={user.name ?? ""}
                                className="w-24 h-24 rounded-full object-cover"
                                style={{ outline: `3px solid ${tier.color}`, outlineOffset: "3px" }}
                            />
                        ) : (
                            <div
                                className="w-24 h-24 rounded-full bg-surface-2 flex items-center justify-center font-heading text-3xl text-white-soft"
                                style={{ outline: `3px solid ${tier.color}`, outlineOffset: "3px" }}
                            >
                                {initials}
                            </div>
                        )}
                        {/* Tier icon dot */}
                        <span
                            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-2 border-dark flex items-center justify-center text-sm"
                            style={{ background: tier.color }}
                            title={tier.name}
                        >
                            {tier.name === "Dubai Legend" ? "🌟" :
                             tier.name === "VIP Member"   ? "👑" :
                             tier.name === "Elite Driver" ? "⚡" :
                             tier.name === "Road Explorer"? "🗺" : "🚗"}
                        </span>
                    </div>

                    {/* Name + meta */}
                    <div className="text-center sm:text-left">
                        <h1 className="font-heading text-4xl font-light text-white-soft mb-1">
                            {user.name ?? "Anonymous"}
                        </h1>
                        <p className="text-muted text-sm font-stats mb-3">{user.email}</p>
                        <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                            <span
                                className="inline-flex items-center gap-1.5 text-xs font-stats px-3 py-1 rounded-full border"
                                style={{ color: tier.color, borderColor: `${tier.color}40`, background: `${tier.color}12` }}
                            >
                                ◆ {tier.name}
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-xs font-stats px-3 py-1 rounded-full border border-surface-3 text-muted bg-surface-2">
                                Level {user.level}
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-xs font-stats px-3 py-1 rounded-full border border-surface-3 text-muted bg-surface-2">
                                {user.xp.toLocaleString()} XP
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── Account settings strip ──────────────────────────── */}
                <div className="flex justify-end">
                    <DeleteAccountButton />
                </div>

                {/* ── Tier card ───────────────────────────────────────── */}
                <div
                    className="rounded-2xl border p-7 space-y-5"
                    style={{ background: gradient, borderColor: `${tier.color}30` }}
                >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <p className="text-[11px] font-stats uppercase tracking-[0.2em] mb-1"
                               style={{ color: `${tier.color}99` }}>
                                AURUM Loyalty Tier
                            </p>
                            <h2 className="font-heading text-3xl font-light text-white-soft">
                                {tier.name}
                            </h2>
                        </div>

                        {/* Discount badge */}
                        {tier.discount > 0 && (
                            <div
                                className="flex flex-col items-center justify-center w-20 h-20 rounded-2xl border"
                                style={{ background: `${tier.color}15`, borderColor: `${tier.color}40` }}
                            >
                                <span className="font-heading text-2xl font-semibold" style={{ color: tier.color }}>
                                    {(tier.discount * 100).toFixed(0)}%
                                </span>
                                <span className="text-[10px] font-stats text-muted uppercase tracking-wider">
                                    discount
                                </span>
                            </div>
                        )}
                    </div>

                    {/* XP progress bar */}
                    {nextTier ? (
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-stats">
                                <span className="text-muted">{user.xp.toLocaleString()} XP</span>
                                <span className="text-muted">
                                    {xpToNext.toLocaleString()} XP to <span style={{ color: nextTier.color }}>{nextTier.name}</span>
                                </span>
                            </div>
                            <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-700"
                                    style={{ width: `${progress}%`, background: tier.color }}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-stats">
                                <span style={{ color: tier.color }}>{user.xp.toLocaleString()} XP — Maximum tier reached</span>
                            </div>
                            <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
                                <div className="h-full rounded-full w-full" style={{ background: tier.color }} />
                            </div>
                        </div>
                    )}

                    {/* Discount callout */}
                    {tier.discount > 0 && (
                        <div
                            className="flex items-center gap-3 rounded-xl px-4 py-3 border text-sm font-stats"
                            style={{ background: `${tier.color}10`, borderColor: `${tier.color}25` }}
                        >
                            <span style={{ color: tier.color }}>✦</span>
                            <span className="text-white-soft">
                                You book with a <span style={{ color: tier.color }} className="font-semibold">{(tier.discount * 100).toFixed(0)}% loyalty discount</span> — applied automatically at checkout.
                            </span>
                        </div>
                    )}
                    {tier.discount === 0 && nextTier && (
                        <div className="flex items-center gap-3 rounded-xl px-4 py-3 border border-surface-3 text-sm font-stats bg-surface-2">
                            <span className="text-muted">✦</span>
                            <span className="text-muted">
                                Earn <span className="text-white-soft font-semibold">{xpToNext} more XP</span> to unlock{" "}
                                <span style={{ color: nextTier.color }} className="font-semibold">{(nextTier.discount * 100).toFixed(0)}% discount</span> at {nextTier.name}.
                            </span>
                        </div>
                    )}
                </div>

                {/* ── Badges + XP log ─────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Badge showcase */}
                    <div>
                        <h2 className="font-heading text-2xl font-light text-white-soft mb-5">
                            Badges
                            <span className="ml-2 text-sm font-stats text-muted font-normal">
                                {earnedSlugs.size}/{BADGE_DEFS.length}
                            </span>
                        </h2>
                        <div className="grid grid-cols-3 gap-3">
                            {BADGE_DEFS.map(def => {
                                const earned = earnedSlugs.has(def.slug)
                                const awardedAt = user.badges.find(ub => ub.badge.slug === def.slug)?.awardedAt
                                return (
                                    <div
                                        key={def.slug}
                                        className={`rounded-xl border px-3 py-4 flex flex-col items-center gap-2 text-center transition-all duration-200 ${
                                            earned
                                                ? "bg-surface border-gold/20 hover:border-gold/40"
                                                : "bg-surface-2 border-surface-3 opacity-40 grayscale"
                                        }`}
                                    >
                                        <span className="text-2xl leading-none">{def.icon}</span>
                                        <p className={`text-xs font-stats font-semibold leading-tight ${earned ? "text-white-soft" : "text-muted"}`}>
                                            {def.name}
                                        </p>
                                        {earned && awardedAt ? (
                                            <p className="text-[10px] font-stats text-muted">
                                                {new Date(awardedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })}
                                            </p>
                                        ) : (
                                            <p className="text-[10px] font-stats text-muted">Locked</p>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* XP log */}
                    <div>
                        <h2 className="font-heading text-2xl font-light text-white-soft mb-5">
                            XP History
                        </h2>
                        {xpLogs.length === 0 ? (
                            <div className="bg-surface border border-surface-3 rounded-xl px-6 py-10 text-center">
                                <p className="text-muted text-4xl mb-3">◎</p>
                                <p className="text-muted text-sm font-stats">No XP earned yet.</p>
                                <Link href="/cars" className="text-gold text-xs font-stats hover:underline mt-2 inline-block">
                                    Browse vehicles →
                                </Link>
                            </div>
                        ) : (
                            <div className="bg-surface border border-surface-3 rounded-xl overflow-hidden">
                                {xpLogs.map((log, i) => (
                                    <div
                                        key={log.id}
                                        className={`flex items-center justify-between px-5 py-3.5 ${i !== xpLogs.length - 1 ? "border-b border-surface-3" : ""}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-gold text-xs">◆</span>
                                            <div>
                                                <p className="text-white-soft text-sm font-stats font-semibold leading-none mb-0.5">
                                                    {log.label}
                                                </p>
                                                <p className="text-muted text-[11px] font-stats">
                                                    {new Date(log.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-gold font-stats font-bold text-sm">
                                            +{log.xpAmount} XP
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Booking history ─────────────────────────────────── */}
                <div>
                    <h2 className="font-heading text-2xl font-light text-white-soft mb-5">
                        Booking History
                    </h2>
                    <ProfileActions transactions={txSerialized} statusStyles={STATUS_STYLES} />
                </div>

            </div>
        </div>
    )
}
