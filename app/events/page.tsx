import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { effectLabel, effectColor } from "@/lib/events"
import { EventEffectType } from "@prisma/client"

export const dynamic = "force-dynamic"

export default async function EventsPage() {
    const now = new Date()

    const events = await prisma.event.findMany({
        where:   { status: "APPROVED", endsAt: { gte: now } },
        include: { company: { select: { name: true } } },
        orderBy: { startsAt: "asc" },
    })

    const active   = events.filter(e => e.startsAt <= now)
    const upcoming = events.filter(e => e.startsAt > now)

    const fmt = (d: Date) =>
        d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })

    function timeLeft(d: Date): string {
        const diff = d.getTime() - now.getTime()
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        if (days > 0) return `in ${days}d ${hours}h`
        return `in ${hours}h`
    }

    function timeEnd(d: Date): string {
        const diff = d.getTime() - now.getTime()
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        if (days > 0) return `${days}d ${hours}h left`
        return `${hours}h left`
    }

    function EventCard({ ev, isActive }: { ev: typeof events[0]; isActive: boolean }) {
        const clr   = effectColor(ev.effectType)
        const label = effectLabel(ev.effectType, ev.effectValue)
        const scope = [...ev.targetCategories, ...ev.targetBrands].join(", ") || "All vehicles"

        return (
            <div
                className={`relative bg-surface border rounded-2xl overflow-hidden transition-all hover:border-gold/20 ${
                    isActive ? "border-gold/25" : "border-surface-3"
                }`}
            >
                {isActive && (
                    <div className="absolute top-0 left-0 right-0 h-0.5"
                         style={{ background: `linear-gradient(to right, transparent, ${clr.text}80, transparent)` }} />
                )}

                <div className="px-6 py-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                {isActive && (
                                    <span className="text-[10px] font-stats px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 rounded-full">
                                        ● Live now
                                    </span>
                                )}
                                {!isActive && (
                                    <span className="text-[10px] font-stats px-2 py-0.5 bg-blue-500/15 border border-blue-500/25 text-blue-400 rounded-full">
                                        {timeLeft(ev.startsAt)}
                                    </span>
                                )}
                            </div>
                            <h3 className="font-heading text-xl font-light text-white-soft">{ev.title}</h3>
                            {ev.company?.name && (
                                <p className="text-muted-2 text-[11px] font-stats mt-0.5">by {ev.company.name}</p>
                            )}
                        </div>
                        <div
                            className="shrink-0 px-4 py-2 rounded-full border text-sm font-stats font-bold"
                            style={{ color: clr.text, background: clr.bg, borderColor: clr.border }}
                        >
                            {label}
                        </div>
                    </div>

                    {ev.description && (
                        <p className="text-muted text-sm font-stats mb-4 line-clamp-2">{ev.description}</p>
                    )}

                    <div className="flex items-center justify-between text-xs font-stats text-muted flex-wrap gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span>{fmt(ev.startsAt)}</span>
                            <span className="text-surface-3">→</span>
                            <span>{fmt(ev.endsAt)}</span>
                        </div>
                        {isActive && (
                            <span className="text-amber-400/80">{timeEnd(ev.endsAt)}</span>
                        )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-surface-3 flex items-center justify-between text-xs font-stats">
                        <span className="text-muted-2">{scope}</span>
                        {ev.minDays && <span className="text-muted-2">Min. {ev.minDays} days</span>}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-dark">
            <div className="max-w-4xl mx-auto px-6 py-16">

                {/* Header */}
                <div className="text-center mb-14">
                    <p className="text-gold text-[11px] font-stats uppercase tracking-[0.25em] mb-3">Limited Offers</p>
                    <h1 className="font-heading text-5xl font-light text-white-soft mb-4">Events & Promotions</h1>
                    <p className="text-muted text-sm font-stats max-w-md mx-auto">
                        Exclusive offers and time-limited deals on our premium fleet.
                    </p>
                </div>

                {events.length === 0 ? (
                    <div className="text-center py-24">
                        <p className="text-5xl text-muted mb-6">◎</p>
                        <h2 className="font-heading text-2xl font-light text-white-soft mb-2">No active events</h2>
                        <p className="text-muted text-sm font-stats mb-8">Check back soon for exclusive promotions.</p>
                        <Link
                            href="/cars"
                            className="inline-block bg-gold hover:bg-gold-light text-dark text-sm font-semibold px-6 py-3 rounded-xl transition-colors"
                        >
                            Browse Fleet →
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-12">

                        {active.length > 0 && (
                            <section>
                                <h2 className="font-heading text-xl font-light text-white-soft mb-5 flex items-center gap-3">
                                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
                                    Live Now
                                    <span className="text-xs font-stats text-muted">{active.length}</span>
                                </h2>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {active.map(ev => <EventCard key={ev.id} ev={ev} isActive />)}
                                </div>
                            </section>
                        )}

                        {upcoming.length > 0 && (
                            <section>
                                <h2 className="font-heading text-xl font-light text-white-soft mb-5 flex items-center gap-3">
                                    <span className="inline-block w-2 h-2 rounded-full bg-blue-400" />
                                    Coming Up
                                    <span className="text-xs font-stats text-muted">{upcoming.length}</span>
                                </h2>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {upcoming.map(ev => <EventCard key={ev.id} ev={ev} isActive={false} />)}
                                </div>
                            </section>
                        )}

                        <div className="text-center pt-4">
                            <Link
                                href="/cars"
                                className="inline-block bg-gold hover:bg-gold-light text-dark text-sm font-semibold px-8 py-4 rounded-xl transition-colors"
                            >
                                Browse Fleet & Book →
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
