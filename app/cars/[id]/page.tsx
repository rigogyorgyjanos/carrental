import { prisma } from "@/lib/prisma"
import BookingForm from "@/components/BookingForm"

export default async function CarPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const car = await prisma.product.findUnique({
        where: { id },
        include: {
            images: true, // az összes kép betöltése
        }
    })

    if (!car || !car.active) return <div>Car not found</div>

    return (
        <div className="max-w-9xl mx-auto p-8 grid md:grid-cols-2 gap-12">
            {/* Bal oldal: galéria */}
            <div className="w-full space-y-4">
                {car.images.length > 0 ? (
                    car.images.map((img, idx) => (
                        <img
                            key={idx}
                            src={img.url}
                            alt={`${car.name} image ${idx + 1}`}
                            className="rounded-xl w-full h-96 object-cover shadow-lg"
                        />
                    ))
                ) : (
                    <img
                        src="/placeholder.png"
                        alt={car.name}
                        className="rounded-xl w-full h-96 object-cover shadow-lg"
                    />
                )}
            </div>

            {/* Jobb oldal: adatok és Booking */}
            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2 text-gray-800">{car.name}</h1>
                    <p className="text-gray-500 mb-2">{car.brand}</p>

                    {/* Új mezők */}
                    <p className="text-gray-600 mb-1">
                        {car.year} • {car.category} • {car.transmission} • {car.fuelType} • {car.seats} seats
                    </p>
                    <p className="text-gray-600 mb-1">
                        Mileage: {car.mileage} km • License: {car.licensePlate} • Location: {car.location}
                    </p>
                    <p className="text-yellow-500 mb-2">
                        ⭐ {car.rating} ({car.reviewCount} reviews)
                    </p>

                    <p className="text-gray-700 mb-4">{car.description}</p>
                    <p className="text-xl font-semibold text-blue-600 mb-6">
                        €{car.pricePerDay} / day
                    </p>
                </div>

                {/* Booking form */}
                <div className="bg-white rounded-xl shadow p-6">
                    <h2 className="text-2xl font-bold mb-4 text-gray-800">Book this car</h2>
                    <BookingForm carId={car.id} pricePerDay={car.pricePerDay} />
                </div>
            </div>
        </div>
    )
}