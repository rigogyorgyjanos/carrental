import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
    console.log("Seeding cars...")

    const brands = [
        { brand: "BMW", models: ["X5", "X3", "M3", "M4", "i4"] },
        { brand: "Mercedes", models: ["C-Class", "E-Class", "GLE", "GLC", "AMG GT"] },
        { brand: "Audi", models: ["A3", "A4", "A6", "Q5", "Q7"] },
        { brand: "Toyota", models: ["Corolla", "Camry", "RAV4", "Yaris", "Supra"] },
        { brand: "Ford", models: ["Mustang", "Focus", "Explorer", "Edge", "Fiesta"] },
        { brand: "Honda", models: ["Civic", "Accord", "CR-V", "HR-V"] },
        { brand: "Nissan", models: ["Altima", "Qashqai", "X-Trail", "370Z"] },
        { brand: "Chevrolet", models: ["Camaro", "Malibu", "Tahoe"] }
    ]

    const images = [
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70",
        "https://images.unsplash.com/photo-1493238792000-8113da705763",
        "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d",
        "https://images.unsplash.com/photo-1553440569-bcc63803a83d",
        "https://images.unsplash.com/photo-1511919884226-fd3cad34687c"
    ]

    const transmissions = ["Automatic", "Manual"]
    const fuelTypes = ["Petrol", "Diesel", "Electric", "Hybrid"]
    const drivetrains = ["FWD", "RWD", "AWD"]
    const locations = ["Budapest", "Vienna", "Prague", "Berlin", "London"]

    const carsToCreate = []

    for (let i = 0; i < 150; i++) {
        const brandObj = brands[Math.floor(Math.random() * brands.length)]
        const model = brandObj.models[Math.floor(Math.random() * brandObj.models.length)]
        const year = Math.floor(Math.random() * 6) + 2018
        const price = Math.floor(Math.random() * 180) + 40
        const seats = Math.floor(Math.random() * 4) + 2
        const horsepower = Math.floor(Math.random() * 300) + 100
        const zeroToHundred = parseFloat((Math.random() * 5 + 3).toFixed(1))
        const topSpeed = Math.floor(Math.random() * 120) + 160

        const product = await prisma.product.create({
            data: {
                name: `${brandObj.brand} ${model}`,
                brand: brandObj.brand,
                model,
                year,
                category: ["Sport", "SUV", "Sedan", "Compact"][Math.floor(Math.random() * 4)],
                description: `${brandObj.brand} ${model} (${year}) is a premium rental car, perfect for city driving and long trips.`,
                pricePerDay: price,
                deposit: price * 4,
                transmission: transmissions[Math.floor(Math.random() * transmissions.length)],
                fuelType: fuelTypes[Math.floor(Math.random() * fuelTypes.length)],
                seats,
                horsepower,
                drivetrain: drivetrains[Math.floor(Math.random() * drivetrains.length)],
                zeroToHundred,
                topSpeed,
                mileage: Math.floor(Math.random() * 80000) + 5000,
                licensePlate: `PLT-${Math.floor(Math.random() * 9000 + 1000)}`,
                location: locations[Math.floor(Math.random() * locations.length)],
                featured: Math.random() > 0.85,
                active: true,
                rating: parseFloat((Math.random() * 2 + 3).toFixed(1)),
                reviewCount: Math.floor(Math.random() * 120),
                images: {
                    create: images.sort(() => 0.5 - Math.random()).slice(0, 3).map((url) => ({ url }))
                }
            }
        })

        carsToCreate.push(product)
    }

    console.log("Cars seeded:", carsToCreate.length)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })