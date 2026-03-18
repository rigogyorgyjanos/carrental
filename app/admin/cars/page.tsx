"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

interface Car {
    id: string
    name: string
    brand: string
    pricePerDay: number
}

interface CarStatus {
    todayAvailable: boolean
}

const ITEMS_PER_PAGE = 15

export default function CarsAdminPage() {
    const [cars, setCars] = useState<Car[]>([])
    const [carStatusMap, setCarStatusMap] = useState<Record<string, CarStatus>>({})
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)

    const fetchCars = async () => {
        try {
            const carsRes = await fetch("/api/admin/cars")
            const carsData: Car[] = await carsRes.json()
            setCars(carsData)

            // Fetch status for each car individually
            const statusMap: Record<string, CarStatus> = {}
            await Promise.all(carsData.map(async (car) => {
                const res = await fetch(`/api/admin/cars/status/${car.id}`)
                if (res.ok) {
                    const data = await res.json()
                    statusMap[car.id] = { todayAvailable: data.todayAvailable }
                } else {
                    statusMap[car.id] = { todayAvailable: true }
                }
            }))
            setCarStatusMap(statusMap)
        } catch (err) {
            console.error("Failed to fetch cars or statuses:", err)
        }
    }

    useEffect(() => {
        fetchCars()
    }, [])

    const deleteCar = async (id: string) => {
        if (!confirm("Are you sure you want to delete this car?")) return
        await fetch(`/api/admin/cars/${id}`, { method: "DELETE" })
        fetchCars()
    }

    const filteredCars = cars.filter(car =>
        car.name.toLowerCase().includes(search.toLowerCase()) ||
        car.brand.toLowerCase().includes(search.toLowerCase())
    )

    const totalPages = Math.ceil(filteredCars.length / ITEMS_PER_PAGE)
    const paginatedCars = filteredCars.slice(
        (page - 1) * ITEMS_PER_PAGE,
        page * ITEMS_PER_PAGE
    )

    return (
        <div className="p-8 max-w-6xl mx-auto">

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Cars Management</h1>
                <Link
                    href="/admin/cars/create"
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                >
                    + Add New Car
                </Link>
            </div>

            {/* Search */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search cars..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                    className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Table */}
            <div className="bg-white shadow rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-100 text-gray-900">
                        <tr>
                            <th className="p-3">Name</th>
                            <th className="p-3">Brand</th>
                            <th className="p-3">Price / day</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedCars.map(car => (
                            <tr key={car.id} className="border-t hover:bg-gray-50">
                                <td className="p-3 font-medium text-gray-600">{car.name}</td>
                                <td className="p-3 text-gray-800">{car.brand}</td>
                                <td className="p-3 text-gray-400">€{car.pricePerDay}</td>
                                <td className="p-3">
                                    {carStatusMap[car.id] === undefined ? (
                                        // Betöltés alatt
                                        <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                                    ) : carStatusMap[car.id].todayAvailable ? (
                                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm">
                                            Available
                                        </span>
                                    ) : (
                                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-sm">
                                            Booked
                                        </span>
                                    )}
                                </td>
                                <td className="p-3 flex justify-end gap-2">
                                    <Link
                                        href={`/admin/cars/${car.id}/edit`}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                                    >
                                        Edit
                                    </Link>
                                    <button
                                        onClick={() => deleteCar(car.id)}
                                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredCars.length === 0 && (
                    <div className="p-6 text-center text-gray-500">No cars found</div>
                )}
            </div>

            {/* Pagination */}
            <div className="flex justify-center gap-2 mt-6">
                <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="px-3 py-1 border rounded disabled:opacity-40"
                >
                    Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                    <button
                        key={i}
                        onClick={() => setPage(i + 1)}
                        className={`px-3 py-1 rounded border ${page === i + 1 ? "bg-blue-600 text-white" : "bg-white text-gray-600"}`}
                    >
                        {i + 1}
                    </button>
                ))}
                <button
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className="px-3 py-1 border rounded disabled:opacity-40"
                >
                    Next
                </button>
            </div>
        </div>
    )
}