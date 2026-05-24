import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { getTier } from "@/lib/tiers"
import AdminUsersTable from "./AdminUsersTable"

export const dynamic = "force-dynamic"

export default async function UsersAdminPage() {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") redirect("/")

    const users = await prisma.user.findMany({
        select: {
            id:        true,
            name:      true,
            email:     true,
            role:      true,
            xp:        true,
            level:     true,
            createdAt: true,
            _count:    { select: { transactions: true } },
        },
        orderBy: { createdAt: "desc" },
    })

    const serialized = users.map(u => {
        const tier = getTier(u.xp)
        return {
            id:            u.id,
            name:          u.name,
            email:         u.email,
            role:          u.role as string,
            xp:            u.xp,
            level:         u.level,
            createdAt:     u.createdAt.toISOString(),
            totalBookings: u._count.transactions,
            tierName:      tier.name,
            tierColor:     tier.color,
        }
    })

    return (
        <div className="space-y-6">
            <div>
                <p className="text-gold text-[11px] font-stats uppercase tracking-[0.2em] mb-1">AURUM Admin</p>
                <h1 className="font-heading text-4xl font-light text-white-soft">Users</h1>
            </div>
            <AdminUsersTable initialUsers={serialized} />
        </div>
    )
}
