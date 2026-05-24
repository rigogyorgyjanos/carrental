import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"

const prisma = new PrismaClient()

async function main() {
    const email    = "admin@aurum.com"
    const password = "aurum-admin-2025"
    const name     = "AURUM Admin"

    const hash = await bcrypt.hash(password, 12)

    const user = await prisma.user.upsert({
        where:  { email },
        update: { password: hash, role: "ADMIN", name },
        create: { email, password: hash, role: "ADMIN", name },
    })

    console.log("Admin user ready:")
    console.log("  Email:   ", user.email)
    console.log("  Password:", password)
    console.log("  Role:    ", user.role)
    console.log("  ID:      ", user.id)
}

main()
    .catch(e => { console.error(e); process.exit(1) })
    .finally(() => prisma.$disconnect())
