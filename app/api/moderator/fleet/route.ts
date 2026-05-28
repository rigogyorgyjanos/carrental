import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { audit } from "@/lib/audit"

// GET /api/moderator/fleet — company's cars
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== "MODERATOR" && session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const companyId = session.user.companyId
    if (!companyId) return NextResponse.json({ error: "No company assigned" }, { status: 400 })

    const cars = await prisma.product.findMany({
        where:   { companyId },
        orderBy: { createdAt: "desc" },
        include: { images: { take: 1 } },
    })

    return NextResponse.json(cars)
}

// POST /api/moderator/fleet — add new car (starts as PENDING)
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== "MODERATOR" && session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const companyId = session.user.companyId
    if (!companyId) return NextResponse.json({ error: "No company assigned" }, { status: 400 })

    const body = await req.json()
    const {
        name, brand, model, year, category, description, pricePerDay,
        deposit, transmission, fuelType, seats, horsepower, drivetrain,
        zeroToHundred, topSpeed, mileage, licensePlate, location,
        minimumAge, minimumRentalDays, dailyKmLimit, excessKmFee, images,
    } = body

    if (!name || !brand || !description || !pricePerDay) {
        return NextResponse.json({ error: "name, brand, description and pricePerDay are required" }, { status: 400 })
    }

    const car = await prisma.product.create({
        data: {
            name, brand,
            model:            model        ?? "Unknown",
            year:             year         ?? 2020,
            category:         category     ?? "Sedan",
            description,
            pricePerDay:      Number(pricePerDay),
            deposit:          deposit      != null ? Number(deposit)          : null,
            transmission:     transmission ?? "Automatic",
            fuelType:         fuelType     ?? "Petrol",
            seats:            seats        ?? 4,
            horsepower:       horsepower   != null ? Number(horsepower)       : null,
            drivetrain:       drivetrain   ?? null,
            zeroToHundred:    zeroToHundred != null ? Number(zeroToHundred)   : null,
            topSpeed:         topSpeed     != null ? Number(topSpeed)         : null,
            mileage:          mileage      ?? 0,
            licensePlate:     licensePlate ?? "UNKNOWN",
            location:         location     ?? "Budapest",
            minimumAge:       minimumAge   != null ? Number(minimumAge)       : null,
            minimumRentalDays: minimumRentalDays != null ? Number(minimumRentalDays) : null,
            dailyKmLimit:     dailyKmLimit != null ? Number(dailyKmLimit)     : null,
            excessKmFee:      excessKmFee  != null ? Number(excessKmFee)      : null,
            companyId,
            approvalStatus:   "PENDING",
            active:           false,
            images: images?.length
                ? { create: images.map((url: string) => ({ url })) }
                : undefined,
        },
    })

    audit({
        action:    "car.submitted",
        entity:    "car",
        entityId:  car.id,
        userId:    session.user.id,
        userEmail: session.user.email,
        userRole:  session.user.role,
        metadata:  { name: car.name, brand: car.brand, pricePerDay: car.pricePerDay, companyId },
    })

    return NextResponse.json(car, { status: 201 })
}
