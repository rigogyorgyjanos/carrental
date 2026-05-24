import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import Link from "next/link"

interface Props {
    params:       Promise<{ id: string }>
    searchParams: Promise<{ payment?: string; km?: string }>
}

export default async function KmSuccessPage({ params, searchParams }: Props) {
    const session = await getServerSession(authOptions)
    if (!session?.user) redirect("/api/auth/signin")

    const { id }             = await params
    const { payment, km }    = await searchParams
    const success            = payment === "success"
    const kmAdded            = parseInt(km ?? "0", 10) || 0

    const booking = await prisma.transaction.findUnique({
        where: { id },
        include: { product: { select: { brand: true, name: true, dailyKmLimit: true, excessKmFee: true } } },
    })

    if (!booking || booking.userId !== session.user.id) redirect("/profile")

    const totalIncluded = (booking.product.dailyKmLimit ?? 0) * booking.totalDays + booking.extraKmPurchased

    return (
        <div className="min-h-screen bg-dark flex items-center justify-center px-6">
            <div className="max-w-md w-full text-center space-y-8">

                {/* Icon */}
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 text-4xl">
                    {success ? "✓" : "📏"}
                </div>

                {/* Title */}
                <div>
                    <p className="text-gold text-[11px] font-stats uppercase tracking-[0.2em] mb-2">AURUM Extra Km</p>
                    <h1 className="font-heading text-4xl font-light text-white-soft mb-3">
                        {success ? "Km Package Activated!" : "Package Details"}
                    </h1>
                    {success && kmAdded > 0 && (
                        <p className="text-muted text-sm font-stats">
                            +{kmAdded} km added to your active rental
                        </p>
                    )}
                </div>

                {/* Summary card */}
                <div className="bg-surface border border-surface-3 rounded-2xl px-6 py-5 text-left space-y-3">
                    <p className="text-[11px] font-stats text-gold uppercase tracking-[0.15em]">
                        {booking.product.brand} {booking.product.name}
                    </p>

                    <div className="flex justify-between text-sm font-stats">
                        <span className="text-muted">Base included km</span>
                        <span className="text-white-soft">
                            {(booking.product.dailyKmLimit ?? 0) * booking.totalDays} km
                        </span>
                    </div>

                    {booking.extraKmPurchased > 0 && (
                        <div className="flex justify-between text-sm font-stats">
                            <span className="text-emerald-400">Extra km purchased</span>
                            <span className="text-emerald-400">+{booking.extraKmPurchased} km</span>
                        </div>
                    )}

                    <div className="flex justify-between text-sm font-stats border-t border-surface-3 pt-3">
                        <span className="text-white-soft font-semibold">Total included km</span>
                        <span className="text-gold font-bold">{totalIncluded} km</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                        href="/profile"
                        className="flex-1 text-center bg-gold hover:bg-gold-light text-dark font-body font-semibold py-4 rounded-xl text-sm transition-colors"
                    >
                        Back to profile
                    </Link>
                    <Link
                        href={`/bookings/${id}/confirm`}
                        className="flex-1 text-center bg-surface border border-surface-3 hover:border-gold/30 text-white-soft font-body font-semibold py-4 rounded-xl text-sm transition-colors"
                    >
                        View booking
                    </Link>
                </div>

                <p className="text-muted-2 text-[11px] font-stats">
                    Booking reference: <span className="text-muted">{id}</span>
                </p>
            </div>
        </div>
    )
}
