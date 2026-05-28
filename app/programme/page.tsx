import Link from "next/link"
import { TIERS, getXpPerDay } from "@/lib/tiers"
import { BADGE_DEFS } from "@/lib/gamification"

const TIER_ICONS: Record<string, string> = {
    "New Driver":    "🚗",
    "Road Explorer": "🗺",
    "Elite Driver":  "⚡",
    "VIP Member":    "👑",
    "Dubai Legend":  "🌟",
}

const XP_CATEGORIES = [
    { label: "Standard",          xp: getXpPerDay("Standard"),  desc: "Sedan, SUV, Van",           color: "#9CA3AF" },
    { label: "Premium",           xp: getXpPerDay("Premium"),   desc: "Premium vehicles",           color: "#60A5FA" },
    { label: "Luxury & Sport",    xp: getXpPerDay("Luxury"),    desc: "Luxury & sports cars",       color: "#A78BFA" },
    { label: "Supercar / Hyper",  xp: getXpPerDay("Supercar"),  desc: "Supercars & hypercars",      color: "#C9A84C" },
]

const HOW_IT_WORKS = [
    {
        step: "01",
        title: "Rent a car",
        desc: "Book any vehicle from our fleet. Every completed rental earns XP based on the car category and number of days.",
    },
    {
        step: "02",
        title: "Earn XP",
        desc: "XP accumulates on your account automatically when a rental is marked completed. The more you rent — and the more premium the car — the faster you level up.",
    },
    {
        step: "03",
        title: "Unlock discounts",
        desc: "As you reach higher tiers, a permanent discount is applied to every future booking. No vouchers, no expiry — just better prices the more loyal you are.",
    },
]

export default function ProgrammePage() {
    return (
        <div className="min-h-screen bg-dark">
            <div className="max-w-4xl mx-auto px-6 py-16 space-y-24">

                {/* ── Hero ─────────────────────────────────────────────── */}
                <div className="text-center space-y-5">
                    <p className="text-gold text-[11px] font-stats uppercase tracking-[0.35em]">
                        Loyalty & Rewards
                    </p>
                    <h1 className="font-heading text-5xl md:text-6xl font-light text-white-soft leading-tight">
                        The AURUM Programme
                    </h1>
                    <p className="text-muted text-base font-stats max-w-xl mx-auto leading-relaxed">
                        Every kilometre you drive with AURUM moves you closer to exclusive benefits.
                        Earn XP, climb tiers, and unlock permanent discounts on every rental.
                    </p>
                    <div className="flex flex-wrap justify-center gap-3 pt-2">
                        <Link
                            href="/cars"
                            className="bg-gold hover:bg-gold-light text-dark font-body font-semibold px-8 py-3.5 rounded-full text-sm transition-colors"
                        >
                            Browse vehicles →
                        </Link>
                        <Link
                            href="/register"
                            className="border border-surface-3 hover:border-gold/30 text-muted hover:text-white-soft font-stats px-8 py-3.5 rounded-full text-sm transition-colors"
                        >
                            Create account
                        </Link>
                    </div>
                </div>

                {/* ── How it works ─────────────────────────────────────── */}
                <div className="space-y-8">
                    <div className="text-center">
                        <p className="text-gold text-[11px] font-stats uppercase tracking-[0.3em] mb-2">How it works</p>
                        <h2 className="font-heading text-3xl font-light text-white-soft">Simple. Automatic. Rewarding.</h2>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-5">
                        {HOW_IT_WORKS.map(item => (
                            <div key={item.step} className="bg-surface border border-surface-3 rounded-2xl p-6 space-y-3">
                                <p className="text-gold/40 font-heading text-4xl font-light leading-none">{item.step}</p>
                                <h3 className="font-heading text-xl text-white-soft font-light">{item.title}</h3>
                                <p className="text-muted text-sm font-stats leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── XP per category ──────────────────────────────────── */}
                <div className="space-y-8">
                    <div className="text-center">
                        <p className="text-gold text-[11px] font-stats uppercase tracking-[0.3em] mb-2">Earning XP</p>
                        <h2 className="font-heading text-3xl font-light text-white-soft">More premium, more XP</h2>
                        <p className="text-muted text-sm font-stats mt-2">XP is earned per day of rental, multiplied by the car category.</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {XP_CATEGORIES.map(cat => (
                            <div key={cat.label} className="bg-surface border border-surface-3 rounded-2xl p-5 text-center space-y-2">
                                <p className="font-heading text-3xl font-light" style={{ color: cat.color }}>
                                    {cat.xp}
                                    <span className="text-base ml-1 font-stats">XP</span>
                                </p>
                                <p className="text-white-soft text-sm font-stats font-semibold">{cat.label}</p>
                                <p className="text-muted text-[11px] font-stats">{cat.desc}</p>
                                <p className="text-muted/60 text-[10px] font-stats">per day</p>
                            </div>
                        ))}
                    </div>
                    <div className="bg-surface border border-surface-3 rounded-2xl px-6 py-4 flex items-center gap-4">
                        <span className="text-gold text-xl shrink-0">◆</span>
                        <p className="text-muted text-sm font-stats">
                            <span className="text-white-soft font-semibold">+1 XP</span> for every approved review you leave after a completed rental.
                        </p>
                    </div>
                </div>

                {/* ── Tiers ────────────────────────────────────────────── */}
                <div className="space-y-8">
                    <div className="text-center">
                        <p className="text-gold text-[11px] font-stats uppercase tracking-[0.3em] mb-2">Membership Tiers</p>
                        <h2 className="font-heading text-3xl font-light text-white-soft">The higher you climb, the more you save</h2>
                        <p className="text-muted text-sm font-stats mt-2">Discounts are applied automatically to every booking — no codes needed.</p>
                    </div>
                    <div className="space-y-3">
                        {TIERS.map((tier, i) => {
                            const isLast = i === TIERS.length - 1
                            const next   = TIERS[i + 1] ?? null
                            return (
                                <div
                                    key={tier.name}
                                    className="bg-surface border rounded-2xl px-6 py-5 flex items-center gap-5"
                                    style={{ borderColor: isLast ? `${tier.color}40` : "#2a2a30" }}
                                >
                                    <span className="text-2xl shrink-0">{TIER_ICONS[tier.name]}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 flex-wrap mb-1">
                                            <p className="font-heading text-lg font-light" style={{ color: tier.color }}>
                                                {tier.name}
                                            </p>
                                            <span className="text-[10px] font-stats text-muted uppercase tracking-wider border border-surface-3 px-2 py-0.5 rounded-full">
                                                {tier.minXp === 0 ? "Starting tier" : `${tier.minXp.toLocaleString()} XP`}
                                            </span>
                                        </div>
                                        <p className="text-muted text-xs font-stats">
                                            {next
                                                ? `${(next.minXp - tier.minXp).toLocaleString()} XP to reach ${next.name}`
                                                : "Maximum tier — the pinnacle of AURUM membership"}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        {tier.discount > 0 ? (
                                            <>
                                                <p className="font-heading text-2xl font-light" style={{ color: tier.color }}>
                                                    {(tier.discount * 100).toFixed(0)}%
                                                </p>
                                                <p className="text-muted text-[11px] font-stats">discount</p>
                                            </>
                                        ) : (
                                            <p className="text-muted text-sm font-stats">No discount yet</p>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* ── Badges ───────────────────────────────────────────── */}
                <div className="space-y-8">
                    <div className="text-center">
                        <p className="text-gold text-[11px] font-stats uppercase tracking-[0.3em] mb-2">Achievements</p>
                        <h2 className="font-heading text-3xl font-light text-white-soft">Collect badges, prove your journey</h2>
                        <p className="text-muted text-sm font-stats mt-2">Badges are awarded automatically when you hit milestones. They appear on your profile and the leaderboard.</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {BADGE_DEFS.map(badge => (
                            <div key={badge.slug} className="bg-surface border border-surface-3 rounded-2xl px-5 py-4 flex items-center gap-4">
                                <span className="text-2xl shrink-0">{badge.icon}</span>
                                <div className="min-w-0">
                                    <p className="text-white-soft text-sm font-stats font-semibold truncate">{badge.name}</p>
                                    <p className="text-muted text-[11px] font-stats leading-relaxed">{badge.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── CTA ──────────────────────────────────────────────── */}
                <div className="bg-surface border border-gold/20 rounded-3xl px-8 py-12 text-center space-y-5">
                    <span className="text-gold text-3xl">◆</span>
                    <h2 className="font-heading text-3xl font-light text-white-soft">
                        Ready to start earning?
                    </h2>
                    <p className="text-muted text-sm font-stats max-w-md mx-auto leading-relaxed">
                        Create a free account, make your first booking, and your XP counter starts ticking from day one.
                    </p>
                    <div className="flex flex-wrap justify-center gap-3 pt-2">
                        <Link
                            href="/register"
                            className="bg-gold hover:bg-gold-light text-dark font-body font-semibold px-8 py-3.5 rounded-full text-sm transition-colors"
                        >
                            Join AURUM →
                        </Link>
                        <Link
                            href="/cars"
                            className="border border-surface-3 hover:border-gold/30 text-muted hover:text-white-soft font-stats px-8 py-3.5 rounded-full text-sm transition-colors"
                        >
                            Browse vehicles
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    )
}
