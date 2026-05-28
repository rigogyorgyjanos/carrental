import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcrypt"
import { audit } from "@/lib/audit"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const name     = (body.name     ?? "").trim()
        const email    = (body.email    ?? "").trim().toLowerCase()
        const password = (body.password ?? "")

        if (!name || !email || !password) {
            return NextResponse.json({ error: "Name, email and password are required." }, { status: 400 })
        }
        if (!EMAIL_RE.test(email)) {
            return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 })
        }
        if (password.length < 8) {
            return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 })
        }

        const existing = await prisma.user.findUnique({ where: { email } })
        if (existing) {
            return NextResponse.json({ error: "This email address is already registered." }, { status: 409 })
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        const user = await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
                accounts: {
                    create: [{
                        type:              "credentials",
                        provider:          "local",
                        providerAccountId: email,
                    }],
                },
            },
            select: { id: true, email: true, name: true },
        })

        audit({
            action:    "user.registered",
            entity:    "user",
            entityId:  user.id,
            userEmail: user.email,
            userRole:  "USER",
            metadata:  { name: user.name, method: "credentials" },
        })

        return NextResponse.json(user, { status: 201 })
    } catch (error: unknown) {
        // Handle race condition: duplicate email inserted between check and create
        if (
            typeof error === "object" && error !== null &&
            "code" in error && (error as { code: string }).code === "P2002"
        ) {
            return NextResponse.json({ error: "This email address is already registered." }, { status: 409 })
        }
        console.error("Register error:", error)
        return NextResponse.json({ error: "Internal server error." }, { status: 500 })
    }
}
