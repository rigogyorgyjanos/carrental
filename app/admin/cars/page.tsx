import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import AdminCarsTable from "./AdminCarsTable"

export const dynamic = "force-dynamic"

export default async function CarsAdminPage() {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") redirect("/")

    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const todayEnd   = new Date(todayStart.getTime() + 86_400_000)

    // Single query for all cars + one query for today's booked car IDs
    // Eliminates the previous N+1 pattern (1 + 150 separate status requests)
    const [cars, bookedToday] = await Promise.all([
        prisma.product.findMany({
            select: {
                id:          true,
                name:        true,
                brand:       true,
                model:       true,
                category:    true,
                year:        true,
                pricePerDay: true,
                active:      true,
                location:    true,
                _count: { select: { transactions: true } },
            },
            orderBy: [{ brand: "asc" }, { name: "asc" }],
        }),
        prisma.transaction.findMany({
            where: {
                startDate: { lte: todayEnd },
                endDate:   { gte: todayStart },
                status:    { in: ["PENDING", "CONFIRMED", "ACTIVE"] },
            },
            select: { productId: true },
        }),
    ])

    const bookedIds = new Set(bookedToday.map(b => b.productId))

    const serialized = cars.map(c => ({
        id:             c.id,
        name:           c.name,
        brand:          c.brand,
        model:          c.model,
        category:       c.category,
        year:           c.year,
        pricePerDay:    c.pricePerDay,
        active:         c.active,
        location:       c.location,
        todayAvailable: !bookedIds.has(c.id),
        totalBookings:  c._count.transactions,
    }))

    return (
        <div className="space-y-6">
            <div>
                <p className="text-gold text-[11px] font-stats uppercase tracking-[0.2em] mb-1">AURUM Admin</p>
                <h1 className="font-heading text-4xl font-light text-white-soft">Fleet</h1>
            </div>
            <AdminCarsTable initialCars={serialized} />
        </div>
    )
}
