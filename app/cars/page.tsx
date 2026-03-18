// app/cars/page.tsx
import { prisma } from "@/lib/prisma"
import CarsGrid from "./CarsGrid" // client component
import Link from "next/link"
import { Car } from "@/types/types"
interface Props {
    searchParams: Promise<{
        search?: string
        brand?: string
        sort?: string
        page?: string
    }>
}

export default async function CarsPage({ searchParams }: Props) {
    const params = await searchParams

    const search = params.search || ""
    const brand = params.brand || ""
    const sort = params.sort || ""
    const page = Number(params.page || 1)

    const pageSize = 50
    const skip = (page - 1) * pageSize

    const where = {
        active: true,
        name: {
            contains: search,
            mode: "insensitive" as const
        },
        ...(brand && { brand })
    }

    // Prisma lekérdezés
    const carsRaw = await prisma.product.findMany({
        where,
        take: pageSize,
        skip,
        orderBy:
            sort === "price_asc"
                ? { pricePerDay: "asc" }
                : sort === "price_desc"
                    ? { pricePerDay: "desc" }
                    : undefined,
        include: {
            images: true,
        }
    })

    // Type casting a Car típushoz
    const cars: Car[] = carsRaw.map(c => ({
        id: c.id,
        name: c.name,
        brand: c.brand,
        model: c.model,
        year: c.year,
        category: c.category,
        transmission: c.transmission,
        fuelType: c.fuelType,
        seats: c.seats,
        mileage: c.mileage,
        licensePlate: c.licensePlate,
        location: c.location,
        pricePerDay: c.pricePerDay,
        deposit: c.deposit,
        rating: c.rating ?? 0,
        reviewCount: c.reviewCount ?? 0,
        images: c.images.map(img => ({ id: img.id, productId: img.productId, url: img.url }))
    }))

    const totalCars = await prisma.product.count({ where })
    const totalPages = Math.ceil(totalCars / pageSize)

    const brandsList = await prisma.product.findMany({
        select: { brand: true },
        distinct: ["brand"]
    })

    return (
        <div className="max-w-7xl mx-auto p-8">
            {/* Search + filters */}
            <form className="grid md:grid-cols-4 gap-4 mb-10">
                <input
                    name="search"
                    placeholder="Search cars..."
                    defaultValue={search}
                    className="border rounded p-2"
                />
                <select name="brand" defaultValue={brand} className="border rounded p-2">
                    <option value="">All brands</option>
                    {brandsList.map(b => (
                        <option key={b.brand} value={b.brand}>
                            {b.brand}
                        </option>
                    ))}
                </select>
                <select name="sort" defaultValue={sort} className="border rounded p-2">
                    <option value="">Sort</option>
                    <option value="price_asc">Price low → high</option>
                    <option value="price_desc">Price high → low</option>
                </select>
                <button className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700">
                    Search
                </button>
            </form>

            {/* Cars grid */}
            <CarsGrid
                initialCars={cars}
                search={search}
                brand={brand}
                sort={sort}
                page={page}
            />

            {/* Pagination */}
            <div className="flex justify-center mt-12 gap-2">
                {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNumber = i + 1
                    return (
                        <Link
                            key={pageNumber}
                            href={`/cars?page=${pageNumber}&search=${search}&brand=${brand}&sort=${sort}`}
                            className={`px-4 py-2 rounded border ${pageNumber === page ? "bg-blue-600 text-white" : "bg-white"
                                }`}
                        >
                            {pageNumber}
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}