import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import Link from "next/link"
import { effectLabel, effectColor } from "@/lib/events"

export const dynamic = "force-dynamic"

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
    PENDING_APPROVAL: { label: "Pending approval", color: "#F59E0B", bg: "#F59E0B15" },
    APPROVED:         { label: "Approved",          color: "#34D399", bg: "#34D39915" },
    REJECTED:         { label: "Rejected",          color: "#EF4444", bg: "#EF444415" },
    DRAFT:            { label: "Draft",             color: "#6B7280", bg: "#6B728015" },
}

export default async function ModeratorEventsPage() {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== "MODERATOR" && session.user.role !== "ADMIN")) redirect("/")
    if (!session.user.companyId) redirect("/moderator")

    const events = await prisma.event.findMany({
        where:   { companyId: session.user.companyId },
        orderBy: [{ status: "asc" }, { startsAt: "asc" }],
    })

    const now = new Date()

    const fmt = (d: Date) =>
        d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-heading text-3xl font-light text-white-soft">Events</h1>
                    <p className="text-muted text-sm font-stats mt-1">
                        Events you create are reviewed by an admin before going live.
                    </p>
                </div>
                <Link
                    href="/moderator/events/new"
                    className="bg-gold hover:bg-gold-light text-dark text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
                >
                    + New Event
                </Link>
            </div>

            {/* Info box */}
            <div className="flex items-start gap-3 bg-blue-500/8 border border-blue-500/20 rounded-2xl px-5 py-4">
                <span className="text-blue-400 text-lg shrink-0 mt-0.5">ℹ</span>
                <div>
                    <p className="text-blue-400 font-stats font-semibold text-sm leading-none mb-1">How events work</p>
                    <p className="text-muted text-xs font-stats">
                        Submit an event for admin approval. Once approved, an email notification is automatically sent to your past customers. Events apply only to your company's vehicles.
                    </p>
                </div>
            </div>

            {events.length === 0 ? (
                <div className="text-center py-20 text-muted font-stats text-sm">
                    <p className="text-4xl mb-4">◎</p>
                    <p>No events yet. Create your first event to offer promotions to your customers.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {events.map(ev => {
                        const clr      = effectColor(ev.effectType)
                        const st       = STATUS_STYLES[ev.status] ?? STATUS_STYLES.DRAFT
                        const isActive = ev.status === "APPROVED" && ev.startsAt <= now && ev.endsAt >= now
                        const scope    = [...ev.targetCategories, ...ev.targetBrands].join(", ") || "All your vehicles"

                        return (
                            <div
                                key={ev.id}
                                className={`bg-surface border rounded-2xl px-6 py-5 ${
                                    ev.status === "PENDING_APPROVAL" ? "border-amber-500/25" : "border-surface-3"
                                }`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <h3 className="font-heading text-lg text-white-soft font-light">{ev.title}</h3>
                                            {isActive && <span className="text-[10px] font-stats px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 rounded-full">● Live</span>}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs font-stats text-muted flex-wrap">
                                            <span>{fmt(ev.startsAt)} → {fmt(ev.endsAt)}</span>
                                            <span className="text-surface-3">·</span>
                                            <span>{scope}</span>
                                        </div>
                                        {ev.description && (
                                            <p className="text-muted text-xs font-stats mt-2 line-clamp-2">{ev.description}</p>
                                        )}
                                        {ev.adminNote && (
                                            <p className="mt-2 text-xs font-stats px-3 py-2 bg-amber-500/8 border border-amber-500/20 rounded-lg text-amber-400/80 italic">
                                                Admin note: {ev.adminNote}
                                            </p>
                                        )}
                                        {ev.notificationSent && (
                                            <p className="text-[11px] font-stats text-emerald-400/70 mt-1.5">✓ Customers notified</p>
                                        )}
                                    </div>

                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                        <span
                                            className="text-xs font-stats font-bold px-3 py-1.5 rounded-full border"
                                            style={{ color: clr.text, background: clr.bg, borderColor: clr.border }}
                                        >
                                            {effectLabel(ev.effectType, ev.effectValue)}
                                        </span>
                                        <span
                                            className="text-[11px] font-stats px-2.5 py-1 rounded-full"
                                            style={{ color: st.color, background: st.bg }}
                                        >
                                            {st.label}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
