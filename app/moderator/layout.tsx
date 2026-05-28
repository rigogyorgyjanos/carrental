import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import ModeratorNavbar from "./components/ModeratorNavbar"

export default async function ModeratorLayout({ children }: { children: React.ReactNode }) {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== "MODERATOR" && session.user.role !== "ADMIN")) {
        redirect("/")
    }
    if (!session.user.companyId) redirect("/")

    return (
        <div className="min-h-screen flex flex-col bg-dark">
            <ModeratorNavbar />
            <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
                {children}
            </main>
        </div>
    )
}
