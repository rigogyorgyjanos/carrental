import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import Link from "next/link"
import BookingForm from "@/components/BookingForm"

export const dynamic = "force-dynamic"

interface Props {
    params: Promise<{ id: string }>
}

export default async function EditBookingPage({ params }: Props) {
    const session = await getServerSession(authOptions)
    if (!session?.user) redirect("/login")

    const { id } = await params

    const booking = await prisma.transaction.findUnique({
        where: { id },
        include: { product: true },
    })

    if (!booking) redirect("/profile")

    if (booking.userId !== session.user.id && session.user.role !== "ADMIN") {
        redirect("/")
    }

    if (!["PENDING", "CONFIRMED"].includes(booking.status)) {
        redirect(`/bookings/${id}/confirm`)
    }

    // Fresh XP from DB to avoid stale session discount
    const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { xp: true },
    })

    const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })

    return (
        <div className="min-h-screen bg-dark">
            <div className="max-w-2xl mx-auto px-6 py-12">

                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/profile"
                        className="inline-flex items-center gap-2 text-muted hover:text-white-soft text-xs font-stats transition-colors mb-6"
                    >
                        ← Back to profile
                    </Link>
                    <p className="text-gold text-[11px] font-stats uppercase tracking-[0.2em] mb-2">Edit Booking</p>
                    <h1 className="font-heading text-3xl font-light text-white-soft">
                        {booking.product.brand} {booking.product.name}
                    </h1>
                    <p className="text-muted text-sm font-stats mt-1">
                        Current dates:{" "}
                        <span className="text-white-soft">
                            {fmt(booking.startDate)} → {fmt(booking.endDate)}
                        </span>
                    </p>
                </div>

                <BookingForm
                    carId={booking.productId}
                    pricePerDay={booking.product.pricePerDay}
                    category={booking.product.category}
                    deposit={booking.product.deposit}
                    minimumRentalDays={booking.product.minimumRentalDays}
                    dailyKmLimit={booking.product.dailyKmLimit}
                    excessKmFee={booking.product.excessKmFee}
                    editBookingId={booking.id}
                    serverUserXp={dbUser?.xp ?? 0}
                />
            </div>
        </div>
    )
}
