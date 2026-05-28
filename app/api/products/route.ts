import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const location = searchParams.get("location")
    const category = searchParams.get("category")
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")

    const products = await prisma.product.findMany({
        where: {
            active:         true,
            approvalStatus: "APPROVED",
            ...(location  ? { location: { contains: location, mode: "insensitive" } } : {}),
            ...(category  ? { category: { equals: category, mode: "insensitive" } }  : {}),
            ...(minPrice  ? { pricePerDay: { gte: Number(minPrice) } }               : {}),
            ...(maxPrice  ? { pricePerDay: { lte: Number(maxPrice) } }               : {}),
        },
        select: {
            id:           true,
            name:         true,
            brand:        true,
            model:        true,
            year:         true,
            category:     true,
            description:  true,
            pricePerDay:  true,
            deposit:      true,
            transmission: true,
            fuelType:     true,
            seats:        true,
            horsepower:   true,
            drivetrain:   true,
            zeroToHundred:true,
            topSpeed:     true,
            location:     true,
            minimumAge:   true,
            minimumRentalDays: true,
            dailyKmLimit: true,
            excessKmFee:  true,
            featured:     true,
            rating:       true,
            reviewCount:  true,
            companyId:    true,
            images:       { select: { id: true, url: true } },
            // Excluded: licensePlate, mileage, adminNote, approvalStatus, active, createdAt, updatedAt
        },
        orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(products)
}
