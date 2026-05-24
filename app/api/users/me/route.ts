import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

// GDPR Article 17 — Right to Erasure
// Anonymises PII but retains transaction records (tax/legal obligation, 7 years)
export async function DELETE() {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const userId = session.user.id

    const activeBooking = await prisma.transaction.findFirst({
        where: { userId, status: { in: ["PENDING", "CONFIRMED", "ACTIVE"] } },
        select: { id: true },
    })

    if (activeBooking) {
        return NextResponse.json(
            { error: "You have active bookings. Please cancel or complete them before deleting your account." },
            { status: 409 }
        )
    }

    // Anonymise — keep transaction rows for legal/tax retention, strip PII
    await prisma.$transaction([
        // Anonymise the user row (do not hard-delete so FK refs remain valid)
        prisma.user.update({
            where: { id: userId },
            data: {
                name:     "Deleted User",
                email:    `deleted_${userId}@aurum-deleted.invalid`,
                password: null,
                image:    null,
            },
        }),
        // Remove auth accounts (OAuth tokens etc.)
        prisma.account.deleteMany({ where: { userId } }),
        // Remove sessions
        prisma.session.deleteMany({ where: { userId } }),
        // Remove XP logs
        prisma.xpTransaction.deleteMany({ where: { userId } }),
        // Remove reviews
        prisma.review.deleteMany({ where: { userId } }),
        // Remove user badges
        prisma.userBadge.deleteMany({ where: { userId } }),
    ])

    return NextResponse.json({ success: true })
}
