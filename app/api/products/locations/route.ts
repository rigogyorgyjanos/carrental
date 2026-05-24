import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q") || ""

    if (!q) return NextResponse.json({ error: "Missing location query" }, { status: 400 })

    try {
        const locations = await prisma.product.findMany({
            where: {
                location: { contains: q, mode: "insensitive" },
                active:   true,
            },
            select:   { location: true },
            distinct: ["location"],
            take:     10,
        })

        return NextResponse.json(locations.map(l => l.location))
    } catch (error) {
        console.error("Locations error:", error)
        return NextResponse.json({ error: "Failed to fetch locations" }, { status: 500 })
    }
}
