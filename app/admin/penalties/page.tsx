import { prisma } from "@/lib/prisma"
import PenaltiesClient from "./PenaltiesClient"

export const dynamic = "force-dynamic"

export default async function AdminPenaltiesPage() {
    const [penalties, allUsers] = await Promise.all([
        prisma.penalty.findMany({
            include: {
                user:     { select: { id: true, name: true, email: true, image: true } },
                issuedBy: { select: { id: true, name: true, role: true } },
                company:  { select: { id: true, name: true } },
            },
            orderBy: { createdAt: "desc" },
        }),
        prisma.user.findMany({
            where:   { role: { in: ["USER", "MODERATOR"] } },
            select:  { id: true, name: true, email: true, role: true },
            orderBy: { name: "asc" },
        }),
    ])

    const serialized = penalties.map(p => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        paidAt:    p.paidAt?.toISOString() ?? null,
    }))

    return (
        <PenaltiesClient
            initialPenalties={serialized}
            allUsers={allUsers}
            isAdmin={true}
        />
    )
}
