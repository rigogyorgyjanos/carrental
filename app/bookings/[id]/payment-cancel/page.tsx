import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"

interface Props {
    params: Promise<{ id: string }>
}

export default async function PaymentCancelPage({ params }: Props) {
    const session = await getServerSession(authOptions)
    if (!session?.user) redirect("/api/auth/signin")

    const { id } = await params

    const booking = await prisma.transaction.findUnique({
        where: { id },
        include: { product: true },
    })

    if (!booking || booking.userId !== session.user.id) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-dark">
                <p className="text-muted text-5xl">◎</p>
                <h1 className="font-heading text-2xl text-white-soft">Booking not found</h1>
                <Link href="/cars" className="text-gold text-sm font-stats hover:underline">
                    ← Browse cars
                </Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-dark">
            <div className="max-w-lg mx-auto px-6 py-16 text-center">

                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 text-4xl bg-danger/10 border-2 border-danger/30">
                    ✕
                </div>

                <h1 className="font-heading text-4xl font-light text-white-soft mb-3">
                    Payment Cancelled
                </h1>
                <p className="text-muted text-sm font-stats mb-10">
                    Your reservation for the{" "}
                    <span className="text-white-soft">
                        {booking.product.brand} {booking.product.name}
                    </span>{" "}
                    was not charged. Your booking is still pending — you can retry payment or cancel it.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        href={`/bookings/${booking.id}/confirm`}
                        className="flex-1 text-center bg-gold hover:bg-gold-light text-dark font-body font-semibold py-4 rounded-xl text-sm transition-colors"
                    >
                        Retry payment →
                    </Link>
                    <Link
                        href="/profile"
                        className="flex-1 text-center bg-surface border border-surface-3 hover:border-gold/30 text-white-soft font-body font-semibold py-4 rounded-xl text-sm transition-colors"
                    >
                        View my bookings
                    </Link>
                </div>

                <p className="text-muted-2 text-[11px] font-stats mt-8">
                    Booking reference: <span className="text-muted">{booking.id}</span>
                </p>
            </div>
        </div>
    )
}
