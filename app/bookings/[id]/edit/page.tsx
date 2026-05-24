import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import BookingForm from "@/components/BookingForm"

interface Props {
    params: Promise<{ id: string }>
}

export default async function EditBookingPage({ params }: Props) {
    const session = await getServerSession(authOptions)
    if (!session?.user) redirect("/login")

    const { id } = await params

    const booking = await prisma.transaction.findUnique({
        where: { id },
        include: { product: true }
    })

    if (!booking) return <div>Booking not found</div>

    // Only the booking owner or an admin may edit
    if (booking.userId !== session.user.id && session.user.role !== "ADMIN") {
        redirect("/")
    }

    return (
        <div className="max-w-3xl mx-auto p-8">
            <h1 className="text-3xl font-bold mb-6">Edit Booking for {booking.product.name}</h1>

            <p className="mb-4 text-gray-500">
                Current dates: {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
            </p>

            <BookingForm
                carId={booking.productId}
                pricePerDay={booking.product.pricePerDay}
                category={booking.product.category}
                deposit={booking.product.deposit}
                minimumRentalDays={booking.product.minimumRentalDays}
            />
        </div>
    )
}
