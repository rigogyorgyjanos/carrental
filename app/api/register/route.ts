import { prisma } from "@/lib/prisma"
import { PrismaAdapter } from "@auth/prisma-adapter"
import bcrypt from "bcrypt"
import { json } from "stream/consumers"

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { email, name, password } = body

        if (!email || !name || !password) {
            return new Response(
                JSON.stringify({ errpr: "Name, email and password are required!" }),
                { status: 400 }
            )
        }

        const existingUser = await prisma.user.findUnique({ where: { email } })
        if (existingUser) {
            return new Response(
                JSON.stringify({ error: "Email is already registered!" }),
                { status: 400 }
            )
        }

        const hashedPasword = await bcrypt.hash(password, 10)
        const user = await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPasword,
                accounts: {
                    create: [
                        {
                            type: "credentials",
                            provider: "local",
                            providerAccountId: email
                        }
                    ]
                }
            },
            include: { accounts: true }
        })
        return new Response(
            JSON.stringify({
                id: user.id,
                email: user.email,
                name: user.name,
                accounts: user.accounts.map(a => ({ id: a.id, provider: a.provider }))
            }),
            { status: 201 }
        )
    } catch (error) {
        console.log("Register error: ", error)
        return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 })
    }
}