export interface CarImage {
    id: string
    productId: string
    url: string
}

export interface Car {
    id: string
    name: string
    brand: string
    model: string
    year: number
    category: string
    transmission: string
    fuelType: string
    seats: number
    mileage: number
    licensePlate: string
    location: string
    pricePerDay: number
    deposit?: number
    rating: number
    reviewCount: number
    images: CarImage[]
}