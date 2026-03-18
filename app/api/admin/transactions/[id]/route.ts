// app/api/admin/transactions/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// --- GET single transaction with availability check ---
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params

    if (!id) return NextResponse.json({ error: "Missing transaction ID" }, { status: 400 })

    try {
        const tx = await prisma.transaction.findUnique({
            where: { id },
            include: { user: true, product: true },
        })
        console.log(id)
        if (!tx) return NextResponse.json({ error: "Transaction not found" }, { status: 404 })

        // Mai napra elérhetőség ellenőrzés
        const today = new Date()
        today.setHours(0, 0, 0, 0) // csak a napot nézzük
        const start = new Date(tx.startDate)
        const end = new Date(tx.endDate)
        start.setHours(0, 0, 0, 0)
        end.setHours(0, 0, 0, 0)

        const availableToday = today < start || today > end

        return NextResponse.json({
            id: tx.id,
            userName: tx.user.name,
            productName: tx.product.name,
            startDate: tx.startDate,
            endDate: tx.endDate,
            totalDays: tx.totalDays,
            pricePerDay: tx.pricePerDay,
            totalPrice: tx.totalPrice,
            deposit: tx.deposit ?? 0,
            status: tx.status,
            notes: tx.notes,
            createdAt: tx.createdAt,
            updatedAt: tx.updatedAt,
            availableToday, // új mező
        })
    } catch (error) {
        console.error("GET transaction error:", error)
        return NextResponse.json({ error: "Failed to fetch transaction" }, { status: 500 })
    }
}

// --- UPDATE transaction ---
export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params
    if (!id) return NextResponse.json({ error: "Missing transaction ID" }, { status: 400 })

    const data = await req.json()
    const { startDate, endDate, pricePerDay, deposit, status, notes } = data

    try {
        const existing = await prisma.transaction.findUnique({
            where: { id },
            include: { product: true },
        })
        if (!existing) return NextResponse.json({ error: "Transaction not found" }, { status: 404 })

        const start = startDate ? new Date(startDate) : existing.startDate
        const end = endDate ? new Date(endDate) : existing.endDate
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
        if (days <= 0) return NextResponse.json({ error: "Invalid rental period" }, { status: 400 })

        const updated = await prisma.transaction.update({
            where: { id },
            data: {
                startDate: start,
                endDate: end,
                totalDays: days,
                pricePerDay: pricePerDay ?? existing.pricePerDay,
                totalPrice: (pricePerDay ?? existing.pricePerDay) * days,
                deposit: deposit ?? existing.deposit,
                status: status ?? existing.status,
                notes: notes ?? existing.notes,
            },
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error("UPDATE transaction error:", error)
        return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 })
    }
}

// --- DELETE transaction ---
export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params
    if (!id) return NextResponse.json({ error: "Missing transaction ID" }, { status: 400 })

    try {
        const existing = await prisma.transaction.findUnique({ where: { id } })
        if (!existing) return NextResponse.json({ error: "Transaction not found" }, { status: 404 })

        await prisma.transaction.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("DELETE transaction error:", error)
        return NextResponse.json({ error: "Failed to delete transaction" }, { status: 500 })
    }
}