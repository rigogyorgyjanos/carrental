import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET
export async function GET() {
    const users = await prisma.user.findMany()
    return NextResponse.json(users)
}

// POST 
export async function POST(req: NextRequest) {
    const data = await req.json();

    try {
        const newUser = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                role: data.role,
                xp: 0,
                level: 0
            }
        })
        return NextResponse.json(newUser)
    } catch (error) {
        console.error("USER POST ERROR ", error);
        return NextResponse.json({ error: "User creation failed" }, { status: 500 })
    }
}