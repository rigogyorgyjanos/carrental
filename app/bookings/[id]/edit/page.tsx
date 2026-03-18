import { prisma } from "@/lib/prisma"
import BookingForm from "@/components/BookingForm"


interface Props {
    params: Promise<{ id: string }>
}

export default async function EditBookingPage({ params }: Props) {
    const { id } = await params

    const booking = await prisma.transaction.findUnique({
        where: { id },
        include: { product: true }
    })

    if (!booking) return <div>Booking not found</div>

    return (
        <div className="max-w-3xl mx-auto p-8">
            <h1 className="text-3xl font-bold mb-6">Edit Booking for {booking.product.name}</h1>

            <p className="mb-4 text-gray-500">
                Current dates: {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
            </p>

            {/* BookingForm lehet edit módban, ahol start/end dátumot és napokat lehet változtatni */}
            <BookingForm
                bookingId={booking.id}
                initialStartDate={booking.startDate.toISOString().split("T")[0]}
                initialEndDate={booking.endDate.toISOString().split("T")[0]}
                pricePerDay={booking.product.pricePerDay}
            />
        </div>
    )
}