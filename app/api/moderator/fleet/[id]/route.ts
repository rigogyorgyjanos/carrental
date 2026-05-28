import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { audit } from "@/lib/audit"

async function getCompanyId(session: any) {
    return session?.user?.companyId ?? null
}

// GET /api/moderator/fleet/[id] — fetch single car (moderator-safe)
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== "MODERATOR" && session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const companyId = await getCompanyId(session)
    if (!companyId) return NextResponse.json({ error: "No company assigned" }, { status: 400 })

    const { id } = await params
    const car = await prisma.product.findUnique({
        where: { id },
        include: { images: true },
    })
    if (!car || car.companyId !== companyId) {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    return NextResponse.json(car)
}

// PATCH /api/moderator/fleet/[id] — edit car (resets to PENDING if key fields changed)
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== "MODERATOR" && session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const companyId = await getCompanyId(session)
    if (!companyId) return NextResponse.json({ error: "No company assigned" }, { status: 400 })

    const { id } = await params
    const existing = await prisma.product.findUnique({ where: { id } })
    if (!existing || existing.companyId !== companyId) {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const body = await req.json()
    const { images } = body

    // Explicit whitelist — moderators may not touch approvalStatus, active, companyId, featured, etc.
    const allowed: Record<string, unknown> = {}
    const EDITABLE = [
        "name", "brand", "model", "year", "category", "description",
        "pricePerDay", "deposit", "transmission", "fuelType", "seats",
        "horsepower", "drivetrain", "zeroToHundred", "topSpeed",
        "mileage", "licensePlate", "location", "minimumAge",
        "minimumRentalDays", "dailyKmLimit", "excessKmFee",
    ] as const
    for (const key of EDITABLE) {
        if (key in body) allowed[key] = body[key]
    }

    // Editing an APPROVED car also resets approval — force admin re-review
    const wasRejected = existing.approvalStatus === "REJECTED"
    const wasApproved = existing.approvalStatus === "APPROVED"
    const resubmit    = wasRejected || wasApproved

    const updated = await prisma.product.update({
        where: { id },
        data: {
            ...allowed,
            ...(resubmit ? { approvalStatus: "PENDING", active: false, adminNote: null } : {}),
            ...(Array.isArray(images) ? {
                images: {
                    deleteMany: {},
                    create: images.map((url: string) => ({ url })),
                },
            } : {}),
        },
    })

    audit({
        action:    "car.edited",
        entity:    "car",
        entityId:  id,
        userId:    session.user.id,
        userEmail: session.user.email,
        userRole:  session.user.role,
        metadata:  {
            resubmitted: resubmit,
            changedFields: Object.keys(allowed),
        },
    })

    return NextResponse.json(updated)
}

// DELETE /api/moderator/fleet/[id] — deactivate (soft delete)
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== "MODERATOR" && session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const companyId = await getCompanyId(session)
    if (!companyId) return NextResponse.json({ error: "No company assigned" }, { status: 400 })

    const { id } = await params
    const existing = await prisma.product.findUnique({ where: { id } })
    if (!existing || existing.companyId !== companyId) {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const updated = await prisma.product.update({
        where: { id },
        data:  { active: false },
    })

    audit({
        action:    "car.deactivated",
        entity:    "car",
        entityId:  id,
        userId:    session.user.id,
        userEmail: session.user.email,
        userRole:  session.user.role,
    })

    return NextResponse.json(updated)
}
