import { prisma } from "@/lib/prisma"
import bcrypt from "bcrypt"

export async function POST(req: Request) {
    const { token, password } = await req.json()
    if (!token || !password) return new Response("Invalid request", { status: 400 })
    if (password.length < 8) return new Response("Password must be at least 8 characters", { status: 400 })

    const reset = await prisma.passwordReset.findUnique({ where: { token } })
    if (!reset || reset.expiresAt < new Date())
        return new Response("Token expired or invalid", { status: 400 })

    const hashed = await bcrypt.hash(password, 10)
    await prisma.user.update({
        where: { id: reset.userId },
        data: { password: hashed },
    })

    // Delete token after use
    await prisma.passwordReset.delete({ where: { id: reset.id } })

    return new Response("Password reset successful", { status: 200 })
}