import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import PenaltiesClient from "@/app/admin/penalties/PenaltiesClient"

export const dynamic = "force-dynamic"

export default async function ModeratorPenaltiesPage() {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== "MODERATOR" && session.user.role !== "ADMIN")) {
        redirect("/")
    }
    const companyId = session.user.companyId
    if (!companyId) redirect("/")

    // Only this company's penalties
    const penalties = await prisma.penalty.findMany({
        where:   { companyId },
        include: {
            user:     { select: { id: true, name: true, email: true, image: true } },
            issuedBy: { select: { id: true, name: true, role: true } },
            company:  { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
    })

    // Only users who have booked from this company
    const companyCustomers = await prisma.user.findMany({
        where: {
            transactions: { some: { product: { companyId } } },
        },
        select:  { id: true, name: true, email: true },
        orderBy: { name: "asc" },
    })

    const serialized = penalties.map(p => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        paidAt:    p.paidAt?.toISOString() ?? null,
    }))

    return (
        <PenaltiesClient
            initialPenalties={serialized}
            allUsers={[]}
            isAdmin={false}
            companyUsers={companyCustomers}
        />
    )
}
