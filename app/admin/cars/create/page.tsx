"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function CreateCarPage() {
    const router = useRouter()

    // Required mezők
    const [name, setName] = useState("")
    const [brand, setBrand] = useState("")
    const [description, setDescription] = useState("")
    const [pricePerDay, setPricePerDay] = useState<number>(0)

    // Optional / default mezők
    const [model, setModel] = useState("Unknown")
    const [year, setYear] = useState(2020)
    const [category, setCategory] = useState("Sedan")
    const [deposit, setDeposit] = useState<number | "">("")
    const [transmission, setTransmission] = useState("Automatic")
    const [fuelType, setFuelType] = useState("Petrol")
    const [seats, setSeats] = useState(4)
    const [horsepower, setHorsepower] = useState<number | "">("")
    const [drivetrain, setDrivetrain] = useState("")
    const [zeroToHundred, setZeroToHundred] = useState<number | "">("")
    const [topSpeed, setTopSpeed] = useState<number | "">("")
    const [mileage, setMileage] = useState(0)
    const [licensePlate, setLicensePlate] = useState("UNKNOWN")
    const [location, setLocation] = useState("Budapest")
    const [minimumAge, setMinimumAge] = useState<number | "">("")
    const [minimumRentalDays, setMinimumRentalDays] = useState<number | "">("")
    const [featured, setFeatured] = useState(false)
    const [active, setActive] = useState(true)
    const [rating, setRating] = useState<number | "">("")
    const [reviewCount, setReviewCount] = useState<number | "">("")
    const [images, setImages] = useState<string[]>([""]) // minimum 1 kép

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const filteredImages = images.filter(img => img.trim() !== "")
        await fetch("/api/admin/cars", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name,
                brand,
                description,
                pricePerDay,
                model,
                year,
                category,
                deposit: deposit === "" ? undefined : deposit,
                transmission,
                fuelType,
                seats,
                horsepower: horsepower === "" ? undefined : horsepower,
                drivetrain: drivetrain || undefined,
                zeroToHundred: zeroToHundred === "" ? undefined : zeroToHundred,
                topSpeed: topSpeed === "" ? undefined : topSpeed,
                mileage,
                licensePlate,
                location,
                minimumAge: minimumAge === "" ? undefined : minimumAge,
                minimumRentalDays: minimumRentalDays === "" ? undefined : minimumRentalDays,
                featured,
                active,
                rating: rating === "" ? undefined : rating,
                reviewCount: reviewCount === "" ? undefined : reviewCount,
                images: filteredImages,
            }),
        })
        router.push("/admin/cars")
    }

    const handleImageChange = (index: number, value: string) => {
        const newImages = [...images]
        newImages[index] = value
        setImages(newImages)
    }

    const addImageField = () => setImages(prev => [...prev, ""])
    const removeImageField = (index: number) => setImages(prev => prev.filter((_, i) => i !== index))

    return (
        <div className="p-8 max-w-4xl mx-auto bg-white shadow-lg rounded-lg">
            <h1 className="text-2xl font-bold mb-6">Add New Car</h1>
            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="font-medium">Car Name *</label>
                        <input value={name} onChange={e => setName(e.target.value)} required className="mt-1 p-2 border rounded w-full" />
                    </div>
                    <div>
                        <label className="font-medium">Brand *</label>
                        <input value={brand} onChange={e => setBrand(e.target.value)} required className="mt-1 p-2 border rounded w-full" />
                    </div>
                    <div>
                        <label className="font-medium">Model</label>
                        <input value={model} onChange={e => setModel(e.target.value)} className="mt-1 p-2 border rounded w-full" />
                    </div>
                    <div>
                        <label className="font-medium">Year</label>
                        <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} className="mt-1 p-2 border rounded w-full" />
                    </div>
                    <div>
                        <label className="font-medium">Category</label>
                        <input value={category} onChange={e => setCategory(e.target.value)} className="mt-1 p-2 border rounded w-full" />
                    </div>
                    <div>
                        <label className="font-medium">Price Per Day *</label>
                        <input type="number" value={pricePerDay} onChange={e => setPricePerDay(Number(e.target.value))} required className="mt-1 p-2 border rounded w-full" />
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="font-medium">Description *</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} required className="mt-1 p-2 border rounded w-full" rows={3} />
                </div>

                {/* Performance & Specs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="font-medium">Transmission</label>
                        <input value={transmission} onChange={e => setTransmission(e.target.value)} className="mt-1 p-2 border rounded w-full" />
                    </div>
                    <div>
                        <label className="font-medium">Fuel Type</label>
                        <input value={fuelType} onChange={e => setFuelType(e.target.value)} className="mt-1 p-2 border rounded w-full" />
                    </div>
                    <div>
                        <label className="font-medium">Seats</label>
                        <input type="number" value={seats} onChange={e => setSeats(Number(e.target.value))} className="mt-1 p-2 border rounded w-full" />
                    </div>
                    <div>
                        <label className="font-medium">Horsepower</label>
                        <input type="number" value={horsepower} onChange={e => setHorsepower(Number(e.target.value))} className="mt-1 p-2 border rounded w-full" />
                    </div>
                    <div>
                        <label className="font-medium">0-100 km/h</label>
                        <input type="number" value={zeroToHundred} onChange={e => setZeroToHundred(Number(e.target.value))} className="mt-1 p-2 border rounded w-full" />
                    </div>
                    <div>
                        <label className="font-medium">Top Speed</label>
                        <input type="number" value={topSpeed} onChange={e => setTopSpeed(Number(e.target.value))} className="mt-1 p-2 border rounded w-full" />
                    </div>
                </div>

                {/* Location & Legal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="font-medium">Mileage</label>
                        <input type="number" value={mileage} onChange={e => setMileage(Number(e.target.value))} className="mt-1 p-2 border rounded w-full" />
                    </div>
                    <div>
                        <label className="font-medium">License Plate</label>
                        <input value={licensePlate} onChange={e => setLicensePlate(e.target.value)} className="mt-1 p-2 border rounded w-full" />
                    </div>
                    <div>
                        <label className="font-medium">Location</label>
                        <input value={location} onChange={e => setLocation(e.target.value)} className="mt-1 p-2 border rounded w-full" />
                    </div>
                    <div>
                        <label className="font-medium">Deposit</label>
                        <input type="number" value={deposit} onChange={e => setDeposit(Number(e.target.value))} className="mt-1 p-2 border rounded w-full" />
                    </div>
                </div>

                {/* Restrictions & Flags */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="font-medium">Minimum Age</label>
                        <input type="number" value={minimumAge} onChange={e => setMinimumAge(Number(e.target.value))} className="mt-1 p-2 border rounded w-full" />
                    </div>
                    <div>
                        <label className="font-medium">Minimum Rental Days</label>
                        <input type="number" value={minimumRentalDays} onChange={e => setMinimumRentalDays(Number(e.target.value))} className="mt-1 p-2 border rounded w-full" />
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)} />
                        <span>Featured</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} />
                        <span>Active</span>
                    </div>
                </div>

                {/* Images */}
                <div>
                    <label className="font-medium">Images (URLs)</label>
                    {images.map((img, idx) => (
                        <div key={idx} className="flex gap-2 items-center mt-1">
                            <input
                                type="text"
                                placeholder="Image URL"
                                value={img}
                                onChange={e => handleImageChange(idx, e.target.value)}
                                className="p-2 border rounded flex-1"
                            />
                            <button type="button" onClick={() => removeImageField(idx)} className="bg-red-500 text-white px-2 py-1 rounded">X</button>
                        </div>
                    ))}
                    <button type="button" onClick={addImageField} className="bg-blue-500 text-white px-4 py-2 rounded mt-2">
                        + Add Another Image
                    </button>
                </div>

                <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded mt-4 w-full">
                    Add Car
                </button>
            </form>
        </div>
    )
}