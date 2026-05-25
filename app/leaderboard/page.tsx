import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { getTier } from "@/lib/tiers"
import { BADGE_DEFS } from "@/lib/badgeDefs"
import Image from "next/image"
import Link from "next/link"

const MEDAL = ["🥇", "🥈", "🥉"] as const

const RANK_STYLES = [
    { ring: "#C9A84C", bg: "rgba(201,168,76,0.08)", border: "rgba(201,168,76,0.25)" },
    { ring: "#9CA3AF", bg: "rgba(156,163,175,0.06)", border: "rgba(156,163,175,0.20)" },
    { ring: "#CD7F32", bg: "rgba(205,127,50,0.06)", border: "rgba(205,127,50,0.20)" },
]

export const revalidate = 60  // refresh leaderboard data every minute

export default async function LeaderboardPage() {
    const session = await getServerSession(authOptions)
    const currentUserId = session?.user?.id ?? null

    const [users, currentUserSettings] = await Promise.all([
        prisma.user.findMany({
            where:   { showOnLeaderboard: true },
            orderBy: { xp: "desc" },
            take:    50,
            select: {
                id:    true,
                name:  true,
                image: true,
                xp:    true,
                level: true,
                badges: {
                    include:  { badge: { select: { slug: true, icon: true, name: true } } },
                    orderBy:  { awardedAt: "asc" },
                },
            },
        }),
        currentUserId
            ? prisma.user.findUnique({
                where:  { id: currentUserId },
                select: { showOnLeaderboard: true },
            })
            : Promise.resolve(null),
    ])

    const currentUserOnBoard = currentUserId
        ? users.findIndex(u => u.id === currentUserId)
        : -1

    // Show opt-out notice only if the user explicitly disabled leaderboard visibility
    const isOptedOut = currentUserSettings?.showOnLeaderboard === false

    return (
        <div className="min-h-screen bg-dark">
            <div className="max-w-3xl mx-auto px-6 py-14">

                {/* ── Header ──────────────────────────────────────────── */}
                <div className="text-center mb-14">
                    <p className="text-gold text-[11px] font-stats uppercase tracking-[0.3em] mb-3">
                        AURUM Programme
                    </p>
                    <h1 className="font-heading text-5xl md:text-6xl font-light text-white-soft mb-3">
                        Leaderboard
                    </h1>
                    <p className="text-muted text-sm font-stats">
                        Top drivers ranked by lifetime XP
                    </p>
                </div>

                {/* ── Opt-out notice ───────────────────────────────────── */}
                {isOptedOut && (
                    <div className="flex items-center gap-3 bg-surface border border-surface-3 rounded-2xl px-5 py-4 mb-8 text-sm font-stats">
                        <span className="text-muted-2 text-lg shrink-0">👁</span>
                        <p className="text-muted">
                            You are not visible on the leaderboard.{" "}
                            <Link href="/profile" className="text-gold hover:underline">
                                Enable it in Profile → Settings
                            </Link>
                        </p>
                    </div>
                )}

                {/* ── Empty state ──────────────────────────────────────── */}
                {users.length === 0 && (
                    <div className="text-center py-24">
                        <p className="text-muted text-5xl mb-4">◎</p>
                        <p className="text-white-soft font-heading text-2xl mb-2">No drivers yet</p>
                        <p className="text-muted text-sm font-stats">Be the first to complete a rental and claim the #1 spot.</p>
                    </div>
                )}

                {/* ── List ────────────────────────────────────────────── */}
                <div className="space-y-2">
                    {users.map((user, index) => {
                        const rank        = index + 1
                        const tier        = getTier(user.xp)
                        const isTop3      = rank <= 3
                        const isMe        = user.id === currentUserId
                        const rankStyle   = isTop3 ? RANK_STYLES[index] : null
                        const initials    = user.name
                            ? user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
                            : "AU"
                        const shownBadges = user.badges.slice(0, 6)

                        return (
                            <div
                                key={user.id}
                                className="flex items-center gap-4 rounded-2xl px-5 py-4 transition-colors"
                                style={rankStyle
                                    ? { background: rankStyle.bg, border: `1px solid ${rankStyle.border}` }
                                    : { background: isMe ? "rgba(201,168,76,0.05)" : "rgba(20,20,24,1)", border: isMe ? "1px solid rgba(201,168,76,0.20)" : "1px solid #2a2a30" }
                                }
                            >
                                {/* Rank */}
                                <div className="w-8 shrink-0 text-center">
                                    {isTop3 ? (
                                        <span className="text-xl leading-none">{MEDAL[index]}</span>
                                    ) : (
                                        <span className="text-sm font-stats font-bold text-muted-2">
                                            #{rank}
                                        </span>
                                    )}
                                </div>

                                {/* Avatar */}
                                <div
                                    className="w-10 h-10 rounded-full shrink-0 overflow-hidden flex items-center justify-center font-heading text-sm font-semibold text-white-soft bg-surface-2"
                                    style={isTop3
                                        ? { outline: `2px solid ${rankStyle!.ring}`, outlineOffset: "2px" }
                                        : isMe
                                        ? { outline: `2px solid ${tier.color}`, outlineOffset: "2px" }
                                        : undefined
                                    }
                                >
                                    {user.image ? (
                                        <Image
                                            src={user.image}
                                            alt={user.name ?? "Driver avatar"}
                                            width={40}
                                            height={40}
                                            className="object-cover w-full h-full"
                                        />
                                    ) : initials}
                                </div>

                                {/* Name + tier */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-stats font-semibold text-white-soft truncate">
                                            {user.name ?? "Anonymous"}
                                        </span>
                                        {isMe && (
                                            <span className="text-[9px] font-stats uppercase tracking-wider bg-gold/15 text-gold border border-gold/30 px-1.5 py-0.5 rounded-full">
                                                You
                                            </span>
                                        )}
                                    </div>
                                    {/* Tier + badges row */}
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        <span
                                            className="text-[10px] font-stats"
                                            style={{ color: tier.color }}
                                        >
                                            {tier.name}
                                        </span>
                                        {shownBadges.length > 0 && (
                                            <>
                                                <span className="text-surface-3 text-[10px]">·</span>
                                                <div className="flex items-center gap-1">
                                                    {shownBadges.map(ub => (
                                                        <span
                                                            key={ub.badge.slug}
                                                            title={ub.badge.name}
                                                            className="text-sm leading-none"
                                                        >
                                                            {ub.badge.icon}
                                                        </span>
                                                    ))}
                                                    {user.badges.length > 6 && (
                                                        <span className="text-[10px] font-stats text-muted ml-0.5">
                                                            +{user.badges.length - 6}
                                                        </span>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* XP + level */}
                                <div className="text-right shrink-0">
                                    <p className="text-sm font-stats font-bold" style={{ color: isTop3 ? rankStyle!.ring : tier.color }}>
                                        {user.xp.toLocaleString()} XP
                                    </p>
                                    <p className="text-[10px] font-stats text-muted mt-0.5">
                                        Lv. {user.level}
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* ── Footer note ─────────────────────────────────────── */}
                {users.length > 0 && (
                    <p className="text-center text-muted-2 text-[11px] font-stats mt-10">
                        Showing top {users.length} drivers · Updates every minute
                    </p>
                )}

                {/* ── CTA for guests ───────────────────────────────────── */}
                {!currentUserId && (
                    <div className="mt-10 text-center">
                        <p className="text-muted text-sm font-stats mb-4">
                            Complete rentals to earn XP and climb the ranks.
                        </p>
                        <Link
                            href="/register"
                            className="inline-flex items-center gap-2 bg-gold hover:bg-gold-light text-dark font-body font-semibold px-8 py-3.5 rounded-full text-sm transition-colors"
                        >
                            Join AURUM →
                        </Link>
                    </div>
                )}

            </div>
        </div>
    )
}
