"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Car } from "@/types/types"

interface CarsGridProps {
    initialCars: Car[]
    search: string
    brand: string
    sort: string
    page: number
}

export default function CarsGrid({
    initialCars,
    search,
    brand,
    sort,
    page
}: CarsGridProps) {
    const [cars, setCars] = useState<Car[]>(initialCars)
    const [loading, setLoading] = useState(false)

    return (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {loading ? (
                // Skeleton loading
                Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="bg-gray-200 animate-pulse h-64 rounded-xl"></div>
                ))
            ) : (
                cars.map((car: Car) => (
                    <Link
                        key={car.id}
                        href={`/cars/${car.id}`}
                        className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden"
                    >
                        <Image
                            src={car.images[0]?.url || "/placeholder.png"}
                            alt={car.name}
                            width={400}
                            height={300}
                            className="object-cover w-full h-48"
                            placeholder="blur"
                            blurDataURL="/placeholder.png"
                        />
                        <div className="p-4">
                            <h2 className="font-bold text-lg">{car.name}</h2>
                            <p className="text-gray-500 text-sm">{car.brand}</p>
                            <div className="text-gray-600 text-sm mt-1">
                                {car.year} • {car.category} • {car.transmission} • {car.fuelType} • {car.seats} seats
                            </div>
                            <div className="text-gray-600 text-sm mt-1">
                                Mileage: {car.mileage} km • License: {car.licensePlate} • Location: {car.location}
                            </div>
                            <div className="mt-3 flex justify-between items-center">
                                <p className="font-semibold text-blue-600">€{car.pricePerDay}/day</p>
                                <span className="text-sm text-gray-400">View →</span>
                            </div>
                            <div className="text-yellow-500 text-sm mt-1">
                                ⭐ {car.rating} ({car.reviewCount} reviews)
                            </div>
                        </div>
                    </Link>
                ))
            )}
        </div>
    )
}