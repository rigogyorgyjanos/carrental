import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params
    // Egyszerű példa: lekérjük az összes jelvényt (később logikát lehet XP-hez kötni)
    const badges = await prisma.badge.findMany()

    return NextResponse.json(badges)
}