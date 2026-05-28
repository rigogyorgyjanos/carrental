import { prisma } from "@/lib/prisma"
import CompaniesClient from "./CompaniesClient"

export const dynamic = "force-dynamic"

export default async function AdminCompaniesPage() {
    const companies = await prisma.company.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            _count: { select: { users: true, products: true } },
        },
    })

    const serialized = companies.map(c => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
    }))

    return <CompaniesClient initialCompanies={serialized} />
}
