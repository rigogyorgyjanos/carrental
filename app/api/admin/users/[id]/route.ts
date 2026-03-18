import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// --- GET ---
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;

    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    console.log("Keresett ID: ", id);

    try {
        const user = await prisma.user.findUnique({
            where: { id: id },
        });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        return NextResponse.json(user);
    } catch (error) {
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}

// --- PUT ---

export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: "Missing id " }, { status: 400 });

    const data = await req.json();
    const { name, email, role, xp, level } = data;

    try {
        const updateUser = await prisma.user.update({
            where: { id },
            data: {
                name,
                email,
                role,
                xp,
                level,
            },
        })

        return NextResponse.json(updateUser);
    } catch (error) {
        console.log("User PUT error: ", error);
        return NextResponse.json({ error: "User update failed" }, { status: 500 });

    }
}

// --- DELETE ---
export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: "Missing user id" }, { status: 400 });

    try {
        await prisma.user.delete({ where: { id } });
        return NextResponse.json({ message: "User deleted" })
    } catch (error) {
        console.error("User DELETE error ", error)
        return NextResponse.json({ error: "User DELETE failed" }, { status: 500 })
    }
}