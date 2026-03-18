"use client"

import { useEffect, useState } from "react"

interface Props {
    carId: string
}

interface ProductImage {
    id?: string
    url: string
}

interface Car {
    id: string
    name: string
    brand: string
    model: string
    year: number
    category: string
    description: string
    pricePerDay: number
    deposit?: number
    transmission: string
    fuelType: string
    seats: number
    horsepower?: number
    drivetrain?: string
    zeroToHundred?: number
    topSpeed?: number
    mileage: number
    licensePlate: string
    location: string
    minimumAge?: number
    minimumRentalDays?: number
    featured: boolean
    active: boolean
    rating?: number
    reviewCount?: number
    images: ProductImage[]
}

export default function CarEditForm({ carId }: Props) {
    const [car, setCar] = useState<Car | null>(null)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState("")

    useEffect(() => {
        fetch(`/api/admin/cars/${carId}`)
            .then(res => res.json())
            .then(data => setCar(data))
    }, [carId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!car) return

        setSaving(true)
        setMessage("")

        const res = await fetch(`/api/admin/cars/${carId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(car)
        })

        if (res.ok) setMessage("Car updated successfully")
        else setMessage("Error while saving")

        setSaving(false)
    }

    if (!car) return <div className="text-center mt-10">Loading...</div>

    return (
        <div className="flex justify-center items-start min-h-screen bg-gray-100 p-6">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-4xl bg-white shadow-lg rounded-xl p-8 grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-800"
            >
                <h2 className="col-span-2 text-2xl font-bold text-gray-800">Edit Car</h2>

                {/* Name */}
                <div className="flex flex-col gap-1">
                    <label className="font-medium">Name *</label>
                    <input
                        type="text"
                        value={car.name}
                        onChange={e => setCar({ ...car, name: e.target.value })}
                        className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                {/* Brand */}
                <div className="flex flex-col gap-1">
                    <label className="font-medium">Brand *</label>
                    <input
                        type="text"
                        value={car.brand}
                        onChange={e => setCar({ ...car, brand: e.target.value })}
                        className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                {/* Model */}
                <div className="flex flex-col gap-1">
                    <label className="font-medium">Model *</label>
                    <input
                        type="text"
                        value={car.model}
                        onChange={e => setCar({ ...car, model: e.target.value })}
                        className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                {/* Year */}
                <div className="flex flex-col gap-1">
                    <label className="font-medium">Year *</label>
                    <input
                        type="number"
                        value={car.year}
                        onChange={e => setCar({ ...car, year: Number(e.target.value) })}
                        className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                {/* Category */}
                <div className="flex flex-col gap-1">
                    <label className="font-medium">Category *</label>
                    <input
                        type="text"
                        value={car.category}
                        onChange={e => setCar({ ...car, category: e.target.value })}
                        className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                {/* Transmission */}
                <div className="flex flex-col gap-1">
                    <label className="font-medium">Transmission *</label>
                    <input
                        type="text"
                        value={car.transmission}
                        onChange={e => setCar({ ...car, transmission: e.target.value })}
                        className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                {/* Fuel Type */}
                <div className="flex flex-col gap-1">
                    <label className="font-medium">Fuel Type *</label>
                    <input
                        type="text"
                        value={car.fuelType}
                        onChange={e => setCar({ ...car, fuelType: e.target.value })}
                        className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                {/* Seats */}
                <div className="flex flex-col gap-1">
                    <label className="font-medium">Seats *</label>
                    <input
                        type="number"
                        value={car.seats}
                        onChange={e => setCar({ ...car, seats: Number(e.target.value) })}
                        className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                {/* Price per day */}
                <div className="flex flex-col gap-1">
                    <label className="font-medium">Price per Day (€) *</label>
                    <input
                        type="number"
                        value={car.pricePerDay}
                        onChange={e => setCar({ ...car, pricePerDay: Number(e.target.value) })}
                        className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                {/* Deposit */}
                <div className="flex flex-col gap-1">
                    <label className="font-medium">Deposit</label>
                    <input
                        type="number"
                        value={car.deposit ?? ""}
                        onChange={e => setCar({ ...car, deposit: Number(e.target.value) })}
                        className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* License Plate */}
                <div className="flex flex-col gap-1">
                    <label className="font-medium">License Plate *</label>
                    <input
                        type="text"
                        value={car.licensePlate}
                        onChange={e => setCar({ ...car, licensePlate: e.target.value })}
                        className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                {/* Mileage */}
                <div className="flex flex-col gap-1">
                    <label className="font-medium">Mileage *</label>
                    <input
                        type="number"
                        value={car.mileage}
                        onChange={e => setCar({ ...car, mileage: Number(e.target.value) })}
                        className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                {/* Location */}
                <div className="flex flex-col gap-1">
                    <label className="font-medium">Location *</label>
                    <input
                        type="text"
                        value={car.location}
                        onChange={e => setCar({ ...car, location: e.target.value })}
                        className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="font-medium">Description *</label>
                    <textarea
                        value={car.description}
                        onChange={e => setCar({ ...car, description: e.target.value })}
                        className="p-2 border rounded h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                {/* Optional stats */}
                <div className="flex flex-col gap-1">
                    <label className="font-medium">Horsepower</label>
                    <input
                        type="number"
                        value={car.horsepower ?? ""}
                        onChange={e => setCar({ ...car, horsepower: Number(e.target.value) })}
                        className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="font-medium">Drivetrain</label>
                    <input
                        type="text"
                        value={car.drivetrain ?? ""}
                        onChange={e => setCar({ ...car, drivetrain: e.target.value })}
                        className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="font-medium">0-100 km/h</label>
                    <input
                        type="number"
                        value={car.zeroToHundred ?? ""}
                        onChange={e => setCar({ ...car, zeroToHundred: Number(e.target.value) })}
                        className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="font-medium">Top Speed (km/h)</label>
                    <input
                        type="number"
                        value={car.topSpeed ?? ""}
                        onChange={e => setCar({ ...car, topSpeed: Number(e.target.value) })}
                        className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Featured */}
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={car.featured}
                        onChange={e => setCar({ ...car, featured: e.target.checked })}
                        className="w-4 h-4"
                    />
                    <span className="text-sm">Featured</span>
                </div>

                {/* Active */}
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={car.active}
                        onChange={e => setCar({ ...car, active: e.target.checked })}
                        className="w-4 h-4"
                    />
                    <span className="text-sm">Active</span>
                </div>

                {/* Images */}
                <div className="md:col-span-2">
                    <label className="font-medium">Images</label>
                    {car.images.map((img, idx) => (
                        <div key={idx} className="flex gap-2 items-center mt-1">
                            <input
                                type="text"
                                value={img.url}
                                onChange={e => {
                                    const newImages = [...car.images]
                                    newImages[idx].url = e.target.value
                                    setCar({ ...car, images: newImages })
                                }}
                                className="p-2 border rounded flex-1"
                            />
                            <button
                                type="button"
                                onClick={() =>
                                    setCar({ ...car, images: car.images.filter((_, i) => i !== idx) })
                                }
                                className="bg-red-500 text-white px-2 py-1 rounded"
                            >
                                X
                            </button>
                            {img.url && (
                                <img src={img.url} alt="Car preview" className="h-16 w-24 object-cover rounded" />
                            )}
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => setCar({ ...car, images: [...car.images, { url: "" }] })}
                        className="bg-blue-500 text-white px-4 py-2 rounded mt-2"
                    >
                        + Add Image
                    </button>
                </div>

                {/* Save button */}
                <button
                    type="submit"
                    disabled={saving}
                    className="col-span-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition disabled:opacity-50"
                >
                    {saving ? "Saving..." : "Save Changes"}
                </button>

                {/* Message */}
                {message && <p className="col-span-2 text-center text-gray-600">{message}</p>}
            </form>
        </div>
    )
}