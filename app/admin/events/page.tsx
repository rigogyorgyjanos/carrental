import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import Link from "next/link"
import { effectLabel, effectColor } from "@/lib/events"
import AdminEventsClient from "./AdminEventsClient"

export const dynamic = "force-dynamic"

export default async function AdminEventsPage() {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") redirect("/")

    const events = await prisma.event.findMany({
        include: { company: { select: { id: true, name: true } } },
        orderBy: [{ status: "asc" }, { startsAt: "asc" }],
    })

    const now = new Date()

    const serialized = events.map(e => ({
        id:               e.id,
        title:            e.title,
        description:      e.description,
        startsAt:         e.startsAt.toISOString(),
        endsAt:           e.endsAt.toISOString(),
        effectType:       e.effectType,
        effectValue:      e.effectValue,
        targetCategories: e.targetCategories,
        targetBrands:     e.targetBrands,
        minDays:          e.minDays,
        status:           e.status,
        adminNote:        e.adminNote,
        companyName:      e.company?.name ?? null,
        companyId:        e.companyId,
        notificationSent: e.notificationSent,
        isActive:         e.status === "APPROVED" && e.startsAt <= now && e.endsAt >= now,
        isUpcoming:       e.status === "APPROVED" && e.startsAt > now,
        isExpired:        e.endsAt < now,
    }))

    const pending = serialized.filter(e => e.status === "PENDING_APPROVAL")

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-heading text-3xl font-light text-white-soft">Events</h1>
                    <p className="text-muted text-sm font-stats mt-1">{serialized.length} total · {pending.length} pending approval</p>
                </div>
                <Link
                    href="/admin/events/new"
                    className="bg-gold hover:bg-gold-light text-dark text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
                >
                    + New Event
                </Link>
            </div>

            <AdminEventsClient events={serialized} />
        </div>
    )
}
