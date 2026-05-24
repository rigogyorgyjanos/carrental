import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import AdminBookingsTable from "./AdminBookingsTable"

export const dynamic = "force-dynamic"

export default async function TransactionsAdminPage() {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") redirect("/")

    const transactions = await prisma.transaction.findMany({
        include: {
            user:    { select: { id: true, name: true, email: true } },
            product: { select: { id: true, name: true, brand: true, category: true, dailyKmLimit: true, excessKmFee: true } },
        },
        orderBy: [
            { status: "asc" },
            { createdAt: "desc" },
        ],
    })

    const serialized = transactions.map(t => ({
        id:          t.id,
        userName:    t.user.name ?? t.user.email ?? "—",
        userEmail:   t.user.email ?? "",
        productName: `${t.product.brand} ${t.product.name}`,
        productId:   t.product.id,
        category:    t.product.category,
        startDate:   t.startDate.toISOString(),
        endDate:     t.endDate.toISOString(),
        totalDays:   t.totalDays,
        pricePerDay: t.pricePerDay,
        totalPrice:  t.totalPrice,
        deposit:     t.deposit,
        discountApplied: t.discountApplied,
        xpAwarded:       t.xpAwarded,
        status:          t.status as string,
        notes:           t.notes,
        createdAt:       t.createdAt.toISOString(),
        paymentIntentId: t.paymentIntentId ?? null,
        startMileage:     t.startMileage       ?? null,
        endMileage:       t.endMileage         ?? null,
        excessKmCharge:   t.excessKmCharge     ?? null,
        dailyKmLimit:     t.product.dailyKmLimit ?? null,
        excessKmFee:      t.product.excessKmFee  ?? null,
        extraKmPurchased: t.extraKmPurchased,
    }))

    return (
        <div className="space-y-6">
            <div>
                <p className="text-gold text-[11px] font-stats uppercase tracking-[0.2em] mb-1">AURUM Admin</p>
                <h1 className="font-heading text-4xl font-light text-white-soft">Bookings</h1>
            </div>
            <AdminBookingsTable initialBookings={serialized} />
        </div>
    )
}
