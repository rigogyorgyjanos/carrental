import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

const PAGE_SIZE = 50

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const page      = Math.max(1, parseInt(searchParams.get("page")     ?? "1",  10))
    const action    = searchParams.get("action")    ?? undefined
    const entity    = searchParams.get("entity")    ?? undefined
    const level     = searchParams.get("level")     ?? undefined
    const search    = searchParams.get("search")    ?? undefined   // email / userId
    const dateFrom  = searchParams.get("dateFrom")  ?? undefined
    const dateTo    = searchParams.get("dateTo")    ?? undefined

    const where: Record<string, unknown> = {}

    if (action) where.action = action
    if (entity) where.entity = entity
    if (level)  where.level  = level
    if (search) {
        where.OR = [
            { userEmail: { contains: search, mode: "insensitive" } },
            { userId:    { contains: search, mode: "insensitive" } },
            { entityId:  { contains: search, mode: "insensitive" } },
        ]
    }
    if (dateFrom || dateTo) {
        where.createdAt = {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo   ? { lte: new Date(dateTo + "T23:59:59.999Z") } : {}),
        }
    }

    const [total, logs] = await prisma.$transaction([
        prisma.auditLog.count({ where: where as any }),
        prisma.auditLog.findMany({
            where:   where as any,
            orderBy: { createdAt: "desc" },
            skip:    (page - 1) * PAGE_SIZE,
            take:    PAGE_SIZE,
        }),
    ])

    return NextResponse.json({
        logs,
        total,
        page,
        pageSize: PAGE_SIZE,
        totalPages: Math.ceil(total / PAGE_SIZE),
    })
}
