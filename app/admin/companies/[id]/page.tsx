import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import CompanyDetailClient from "./CompanyDetailClient"

export const dynamic = "force-dynamic"

export default async function AdminCompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const company = await prisma.company.findUnique({
        where: { id },
        include: {
            users:    { select: { id: true, name: true, email: true, role: true, createdAt: true } },
            products: {
                select:  { id: true, name: true, brand: true, active: true, approvalStatus: true, pricePerDay: true },
                orderBy: { createdAt: "desc" },
            },
        },
    })

    if (!company) notFound()

    const serialized = {
        ...company,
        createdAt: company.createdAt.toISOString(),
        updatedAt: company.updatedAt.toISOString(),
        users: company.users.map(u => ({
            ...u,
            createdAt: u.createdAt.toISOString(),
        })),
    }

    return <CompanyDetailClient initialCompany={serialized} />
}
