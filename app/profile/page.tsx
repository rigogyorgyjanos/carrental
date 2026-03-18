import { prisma } from "@/lib/prisma"
import ProfileActions from "./ProfileActions"
import { getServerSession } from "next-auth"
import { authOptions as authHandler } from "@/app/api/auth/[...nextauth]/route"

export default async function ProfilePage() {
    const session = await getServerSession(authHandler)

    if (!session?.user) {
        return (
            <div className="p-8 text-center text-red-500 font-semibold">
                Please log in to view your profile.
            </div>
        )
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
    })

    if (!user) return <div className="p-8 text-center">User not found</div>

    const transactions = await prisma.transaction.findMany({
        where: { userId: user.id },
        include: { product: true },
        orderBy: { createdAt: "desc" },
    })

    return (
        <div className="max-w-5xl mx-auto p-8 space-y-12">

            {/* PROFIL FEJLÉC */}
            <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col md:flex-row items-center md:items-start gap-8">

                {/* Profil kép és alapadatok */}
                <div className="shrink-0 flex flex-col items-center md:items-start">
                    {user.image ? (
                        <img
                            src={user.image}
                            alt={user.name || "Profile picture"}
                            className="h-32 w-32 rounded-full object-cover shadow-lg border-4 border-white"
                        />
                    ) : (
                        <div className="h-32 w-32 rounded-full bg-gray-200 flex items-center justify-center text-4xl font-bold text-gray-500 shadow-lg border-4 border-white">
                            {user.name ? user.name[0].toUpperCase() : "U"}
                        </div>
                    )}

                    <h1 className="text-4xl font-bold mt-4">{user?.name || "Unknown User"}</h1>
                </div>

                <div className="flex-1 space-y-2">
                    <h1 className="text-4xl font-bold">{user.name}</h1>
                    <p className="text-gray-500">{user.email}</p>
                    <p className="text-sm text-gray-400">Role: {user.role}</p>

                    {/* XP és level */}
                    <div className="mt-4">
                        <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">Level {user.level}</span>
                            <span className="text-sm font-medium text-gray-700">{user.xp} XP</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4">
                            <div
                                className="bg-blue-500 h-4 rounded-full transition-all"
                                style={{ width: `${Math.min((user.xp / 100) * 100, 100)}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Badge placeholder */}
                    <div className="mt-4 flex gap-3 flex-wrap">
                        <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                            Newbie
                        </div>
                        <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
                            Explorer
                        </div>
                        {/* Ide lehet dinamikusan betölteni a felhasználó jelvényeit */}
                    </div>
                </div>

            </div>

            {/* Foglalások */}
            <ProfileActions transactions={transactions} />
        </div>
    )
}