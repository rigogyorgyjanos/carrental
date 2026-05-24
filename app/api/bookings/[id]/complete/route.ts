import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { completeBooking, ensureBadgesSeeded } from "@/lib/gamification"

export async function PATCH(
    _req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id: bookingId } = await context.params

    await ensureBadgesSeeded()
    const result = await completeBooking(bookingId)

    if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result)
}
