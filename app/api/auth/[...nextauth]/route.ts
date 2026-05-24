import NextAuth, { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import AppleProvider from "next-auth/providers/apple"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcrypt"
import { prisma } from "@/lib/prisma"
import { PrismaAdapter } from "@auth/prisma-adapter"

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),

    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            allowDangerousEmailAccountLinking: true,
        }),
        AppleProvider({
            clientId: process.env.APPLE_ID!,
            clientSecret: process.env.APPLE_SECRET!
        }),
        CredentialsProvider({
            name: "credentials",
            credentials: { email: {}, password: {} },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                })
                if (!user || !user.password) return null

                const valid = await bcrypt.compare(credentials.password, user.password)
                if (!valid) return null

                return user
            }
        })
    ],

    session: { strategy: "jwt" },

    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id   = user.id
                token.role = (user as { role?: string }).role ?? "USER"

                const dbUser = await prisma.user.findUnique({
                    where:  { id: user.id },
                    select: { xp: true, level: true },
                })
                token.xp    = dbUser?.xp    ?? 0
                token.level = dbUser?.level ?? 1
            }
            return token
        },

        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id
                session.user.role = token.role
                session.user.xp = token.xp
                session.user.level = token.level
            }
            return session
        },

        async signIn({ user, account, profile }) {
            if (account?.provider === "google") {
                if (!user.email) return false
                // @ts-ignore
                if (profile && !profile.email_verified) return false
                return true
            }
            return true
        },
    }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
