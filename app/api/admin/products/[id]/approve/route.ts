import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { audit } from "@/lib/audit"

// POST /api/admin/products/[id]/approve
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const { action, adminNote } = await req.json() // action: "approve" | "reject"

    if (!["approve", "reject"].includes(action)) {
        return NextResponse.json({ error: "action must be approve or reject" }, { status: 400 })
    }

    const product = await prisma.product.findUnique({ where: { id } })
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 })

    const updated = await prisma.product.update({
        where: { id },
        data: {
            approvalStatus: action === "approve" ? "APPROVED" : "REJECTED",
            active:         action === "approve",
            adminNote:      adminNote ?? null,
        },
    })

    audit({
        action:    action === "approve" ? "car.approved" : "car.rejected",
        entity:    "car",
        entityId:  id,
        userId:    session.user.id,
        userEmail: session.user.email,
        userRole:  session.user.role,
        metadata:  {
            car:       `${product.brand} ${product.name}`,
            adminNote: adminNote ?? null,
        },
    })

    return NextResponse.json(updated)
}
