import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import EventForm from "../EventForm"

export const dynamic = "force-dynamic"

export default async function AdminNewEventPage() {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") redirect("/")

    const companies = await prisma.company.findMany({
        where:   { status: "ACTIVE" },
        select:  { id: true, name: true },
        orderBy: { name: "asc" },
    })

    const categories = await prisma.product.findMany({
        where:    { active: true },
        select:   { category: true },
        distinct: ["category"],
        orderBy:  { category: "asc" },
    })

    const brands = await prisma.product.findMany({
        where:    { active: true },
        select:   { brand: true },
        distinct: ["brand"],
        orderBy:  { brand: "asc" },
    })

    return (
        <div className="max-w-2xl">
            <div className="mb-8">
                <h1 className="font-heading text-3xl font-light text-white-soft">Create Event</h1>
                <p className="text-muted text-sm font-stats mt-1">Admin events are auto-approved and notifications are sent immediately.</p>
            </div>
            <EventForm
                isAdmin
                companies={companies}
                allCategories={categories.map(c => c.category)}
                allBrands={brands.map(b => b.brand)}
                backHref="/admin/events"
            />
        </div>
    )
}
