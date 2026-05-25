import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import AdminReviewsTable from "./AdminReviewsTable"

export const dynamic = "force-dynamic"

export default async function AdminReviewsPage() {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") redirect("/")

    const reviews = await prisma.review.findMany({
        where:   { approved: false },
        include: {
            user:    { select: { id: true, name: true, email: true, image: true } },
            product: { select: { id: true, name: true, brand: true } },
        },
        orderBy: { createdAt: "asc" },
    })

    const serialized = reviews.map(r => ({
        id:        r.id,
        rating:    r.rating,
        comment:   r.comment,
        createdAt: r.createdAt.toISOString(),
        user:      { id: r.user.id, name: r.user.name, email: r.user.email ?? "", image: r.user.image },
        product:   { id: r.product.id, name: r.product.name, brand: r.product.brand },
    }))

    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between">
                <div>
                    <p className="text-gold text-[11px] font-stats uppercase tracking-[0.2em] mb-1">AURUM Admin</p>
                    <h1 className="font-heading text-4xl font-light text-white-soft">Reviews</h1>
                </div>
                {reviews.length > 0 && (
                    <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs font-stats px-3 py-1.5 rounded-full">
                        {reviews.length} pending
                    </span>
                )}
            </div>
            <AdminReviewsTable initialReviews={serialized} />
        </div>
    )
}
