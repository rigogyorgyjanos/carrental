import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import EventForm from "@/app/admin/events/EventForm"

export const dynamic = "force-dynamic"

export default async function ModeratorNewEventPage() {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== "MODERATOR" && session.user.role !== "ADMIN")) redirect("/")
    if (!session.user.companyId) redirect("/moderator")

    // Only show categories + brands from this company's fleet
    const cars = await prisma.product.findMany({
        where:   { companyId: session.user.companyId, active: true },
        select:  { category: true, brand: true },
    })

    const allCategories = [...new Set(cars.map(c => c.category))].sort()
    const allBrands     = [...new Set(cars.map(c => c.brand))].sort()

    return (
        <div className="max-w-2xl">
            <div className="mb-8">
                <h1 className="font-heading text-3xl font-light text-white-soft">New Event</h1>
                <p className="text-muted text-sm font-stats mt-1">
                    Your event will be submitted for admin approval. Once approved, your past customers will be notified.
                </p>
            </div>
            <EventForm
                isAdmin={false}
                allCategories={allCategories}
                allBrands={allBrands}
                backHref="/moderator/events"
                companyId={session.user.companyId}
            />
        </div>
    )
}
