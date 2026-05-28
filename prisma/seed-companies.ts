/**
 * Seed script: 5 companies + moderators + 25 approved cars
 * Run: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed-companies.ts
 *   or: npx tsx prisma/seed-companies.ts
 */

import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"

const prisma = new PrismaClient()

// ── Companies ────────────────────────────────────────────────────────────────

const COMPANIES = [
    {
        slug:        "auto-elite",
        name:        "AutoElite",
        description: "Budapest's premier executive car rental — sedans, premium and luxury fleet for business and leisure.",
        address:     "Budapest, Andrássy út 22",
        website:     "https://autoelite.hu",
        mod: { email: "mod@autoelite.hu", name: "AutoElite Moderator", password: "AutoElite2024" },
    },
    {
        slug:        "speed-zone",
        name:        "SpeedZone",
        description: "Vienna's high-performance specialist. Sport coupes, AMG and Porsche supercars for the driving enthusiast.",
        address:     "Vienna, Ringstraße 5",
        website:     "https://speedzone.at",
        mod: { email: "mod@speedzone.at", name: "SpeedZone Moderator", password: "SpeedZone2024" },
    },
    {
        slug:        "city-drive",
        name:        "CityDrive",
        description: "Affordable compact and SUV rentals across Central Europe. Practical, modern and always reliable.",
        address:     "Prague, Wenceslas Square 14",
        website:     "https://citydrive.cz",
        mod: { email: "mod@citydrive.cz", name: "CityDrive Moderator", password: "CityDrive2024" },
    },
    {
        slug:        "luxury-wheels",
        name:        "LuxuryWheels",
        description: "Rolls-Royce, Bentley, Ferrari and McLaren — ultra-luxury and supercar experiences in Vienna and Berlin.",
        address:     "Vienna, Kärntner Straße 42",
        website:     "https://luxurywheels.at",
        mod: { email: "mod@luxurywheels.at", name: "LuxuryWheels Moderator", password: "LuxuryWheels2024" },
    },
    {
        slug:        "hyper-drive",
        name:        "HyperDrive",
        description: "The world's most exclusive hypercars — Ferrari SF90, Lamborghini Revuelto, Bugatti Chiron. Budapest.",
        address:     "Budapest, Váci út 1",
        website:     "https://hyperdrive.hu",
        mod: { email: "mod@hyperdrive.hu", name: "HyperDrive Moderator", password: "HyperDrive2024" },
    },
]

// ── Cars per company (index matches COMPANIES array) ─────────────────────────

const CARS_BY_COMPANY: Record<number, object[]> = {

    // ── 0: AutoElite — Sedan / Premium ──────────────────────────────────────
    0: [
        {
            name: "3 Series", brand: "BMW", model: "3 Series", year: 2023,
            category: "Sedan", pricePerDay: 120, deposit: 600,
            transmission: "Automatic", fuelType: "Petrol", seats: 5,
            horsepower: 255, drivetrain: "RWD", zeroToHundred: 5.8, topSpeed: 250,
            mileage: 15000, licensePlate: "AE-BM31", location: "Budapest",
            dailyKmLimit: 300, excessKmFee: 0.35, minimumAge: null, minimumRentalDays: null,
            description: "The definitive executive sedan. The BMW 3 Series delivers legendary rear-wheel-drive dynamics, a beautifully crafted interior and cutting-edge iDrive technology.",
            images: { create: [{ url: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200" }] },
        },
        {
            name: "C-Class", brand: "Mercedes", model: "C-Class", year: 2024,
            category: "Sedan", pricePerDay: 130, deposit: 650,
            transmission: "Automatic", fuelType: "Hybrid", seats: 5,
            horsepower: 258, drivetrain: "RWD", zeroToHundred: 6.0, topSpeed: 250,
            mileage: 9000, licensePlate: "AE-MB30", location: "Budapest",
            dailyKmLimit: 300, excessKmFee: 0.35, minimumAge: null, minimumRentalDays: null,
            description: "Mercedes-Benz C-Class — where refined luxury meets spirited performance. Portrait touchscreen, whisper-quiet ride and the iconic three-pointed star.",
            images: { create: [{ url: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1200" }] },
        },
        {
            name: "A4 Quattro", brand: "Audi", model: "A4", year: 2023,
            category: "Sedan", pricePerDay: 115, deposit: 580,
            transmission: "Automatic", fuelType: "Petrol", seats: 5,
            horsepower: 245, drivetrain: "AWD", zeroToHundred: 6.0, topSpeed: 250,
            mileage: 22000, licensePlate: "AE-AU40", location: "Budapest",
            dailyKmLimit: 300, excessKmFee: 0.30, minimumAge: null, minimumRentalDays: null,
            description: "Audi A4 — understated elegance with Quattro all-wheel drive precision. Virtual cockpit, refined turbocharged engine and a cabin built to impress.",
            images: { create: [{ url: "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=1200" }] },
        },
        {
            name: "7 Series", brand: "BMW", model: "7 Series", year: 2024,
            category: "Premium", pricePerDay: 320, deposit: 1600,
            transmission: "Automatic", fuelType: "Hybrid", seats: 5,
            horsepower: 544, drivetrain: "AWD", zeroToHundred: 4.7, topSpeed: 250,
            mileage: 7000, licensePlate: "AE-BM70", location: "Budapest",
            dailyKmLimit: 400, excessKmFee: 0.50, minimumAge: 25, minimumRentalDays: 2,
            description: "The BMW 7 Series redefines long-distance luxury. Theatre Screen in the rear, Executive Lounge seating and a plug-in V8 hybrid drivetrain.",
            images: { create: [{ url: "https://images.unsplash.com/photo-1523983302500-a84da543c48b?w=1200" }] },
        },
        {
            name: "S-Class", brand: "Mercedes", model: "S-Class", year: 2024,
            category: "Premium", pricePerDay: 380, deposit: 1900,
            transmission: "Automatic", fuelType: "Hybrid", seats: 5,
            horsepower: 510, drivetrain: "AWD", zeroToHundred: 4.9, topSpeed: 250,
            mileage: 5000, licensePlate: "AE-MBS0", location: "Budapest",
            dailyKmLimit: 400, excessKmFee: 0.55, minimumAge: 28, minimumRentalDays: 2,
            description: "The Mercedes-Benz S-Class — the world's most sophisticated sedan. Rear-axle steering, E-Active Body Control and Burmester 4D surround sound.",
            images: { create: [{ url: "https://images.unsplash.com/photo-1631295868223-63265b40d9e4?w=1200" }] },
        },
    ],

    // ── 1: SpeedZone — Sport / Supercar ─────────────────────────────────────
    1: [
        {
            name: "M4 Competition", brand: "BMW", model: "M4", year: 2023,
            category: "Sport", pricePerDay: 280, deposit: 1400,
            transmission: "Automatic", fuelType: "Petrol", seats: 4,
            horsepower: 510, drivetrain: "AWD", zeroToHundred: 3.5, topSpeed: 290,
            mileage: 8000, licensePlate: "SZ-BM40", location: "Vienna",
            dailyKmLimit: 250, excessKmFee: 0.60, minimumAge: 25, minimumRentalDays: 2,
            description: "The BMW M4 Competition is raw, focused and electrifying. 510 hp inline-six with M xDrive and a track-tuned chassis.",
            images: { create: [{ url: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=1200" }] },
        },
        {
            name: "AMG C63 S", brand: "Mercedes", model: "C63", year: 2023,
            category: "Sport", pricePerDay: 295, deposit: 1500,
            transmission: "Automatic", fuelType: "Hybrid", seats: 4,
            horsepower: 671, drivetrain: "RWD", zeroToHundred: 3.4, topSpeed: 280,
            mileage: 6000, licensePlate: "SZ-MC63", location: "Vienna",
            dailyKmLimit: 250, excessKmFee: 0.65, minimumAge: 25, minimumRentalDays: 2,
            description: "Mercedes-AMG C63 S — 671 hp plug-in hybrid powerplant. The most powerful four-cylinder car in the world, with a V8 soundtrack.",
            images: { create: [{ url: "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=1200" }] },
        },
        {
            name: "RS5 Sportback", brand: "Audi", model: "RS5", year: 2023,
            category: "Sport", pricePerDay: 270, deposit: 1350,
            transmission: "Automatic", fuelType: "Petrol", seats: 5,
            horsepower: 450, drivetrain: "AWD", zeroToHundred: 3.9, topSpeed: 280,
            mileage: 11000, licensePlate: "SZ-RS50", location: "Vienna",
            dailyKmLimit: 250, excessKmFee: 0.55, minimumAge: 25, minimumRentalDays: 2,
            description: "Audi RS5 Sportback — 450 hp biturbo V6 with Quattro. Five doors of practicality with astonishing everyday performance.",
            images: { create: [{ url: "https://images.unsplash.com/photo-1541443131876-44b03de101c5?w=1200" }] },
        },
        {
            name: "911 Turbo S", brand: "Porsche", model: "911", year: 2024,
            category: "Supercar", pricePerDay: 890, deposit: 5500,
            transmission: "Automatic", fuelType: "Petrol", seats: 4,
            horsepower: 650, drivetrain: "AWD", zeroToHundred: 2.7, topSpeed: 330,
            mileage: 4500, licensePlate: "SZ-PO91", location: "Vienna",
            dailyKmLimit: 200, excessKmFee: 1.80, minimumAge: 28, minimumRentalDays: 2,
            description: "The Porsche 911 Turbo S — 650 hp twin-turbo flat-six. 0–100 in 2.7 seconds. Seven decades of engineering excellence condensed into an icon.",
            images: { create: [{ url: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1200" }] },
        },
        {
            name: "Panamera Turbo S", brand: "Porsche", model: "Panamera", year: 2024,
            category: "Luxury", pricePerDay: 750, deposit: 4500,
            transmission: "Automatic", fuelType: "Hybrid", seats: 4,
            horsepower: 700, drivetrain: "AWD", zeroToHundred: 3.2, topSpeed: 315,
            mileage: 3500, licensePlate: "SZ-PPAN", location: "Vienna",
            dailyKmLimit: 300, excessKmFee: 1.20, minimumAge: 28, minimumRentalDays: 2,
            description: "The Porsche Panamera Turbo S E-Hybrid — the four-door sports car. 700 hp combined, active aerodynamics and Burmester sound.",
            images: { create: [{ url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200" }] },
        },
    ],

    // ── 2: CityDrive — Compact / SUV ────────────────────────────────────────
    2: [
        {
            name: "Polo GTI", brand: "Volkswagen", model: "Polo", year: 2023,
            category: "Compact", pricePerDay: 55, deposit: 220,
            transmission: "Automatic", fuelType: "Petrol", seats: 5,
            horsepower: 207, drivetrain: "FWD", zeroToHundred: 6.5, topSpeed: 237,
            mileage: 12000, licensePlate: "CD-VW01", location: "Prague",
            dailyKmLimit: 200, excessKmFee: 0.25, minimumAge: null, minimumRentalDays: null,
            description: "The Polo GTI blends everyday practicality with genuine hot-hatch excitement. Turbocharged 2.0 TSI, sharp handling and premium interior.",
            images: { create: [{ url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200" }] },
        },
        {
            name: "Clio RS Line", brand: "Renault", model: "Clio", year: 2023,
            category: "Compact", pricePerDay: 48, deposit: 190,
            transmission: "Automatic", fuelType: "Hybrid", seats: 5,
            horsepower: 145, drivetrain: "FWD", zeroToHundred: 8.1, topSpeed: 205,
            mileage: 18000, licensePlate: "CD-RN01", location: "Prague",
            dailyKmLimit: 200, excessKmFee: 0.20, minimumAge: null, minimumRentalDays: null,
            description: "Stylish French flair in a compact package. Sport-tuned suspension, bold styling and a refined turbocharged engine for spirited urban driving.",
            images: { create: [{ url: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=1200" }] },
        },
        {
            name: "X5 xDrive", brand: "BMW", model: "X5", year: 2023,
            category: "SUV", pricePerDay: 180, deposit: 900,
            transmission: "Automatic", fuelType: "Petrol", seats: 5,
            horsepower: 340, drivetrain: "AWD", zeroToHundred: 5.5, topSpeed: 250,
            mileage: 20000, licensePlate: "CD-BX50", location: "Prague",
            dailyKmLimit: 350, excessKmFee: 0.40, minimumAge: null, minimumRentalDays: null,
            description: "The BMW X5 xDrive — commanding road presence, athletic dynamics and a sumptuous interior with panoramic roof.",
            images: { create: [{ url: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=1200" }] },
        },
        {
            name: "GLE 400d", brand: "Mercedes", model: "GLE", year: 2024,
            category: "SUV", pricePerDay: 195, deposit: 980,
            transmission: "Automatic", fuelType: "Diesel", seats: 7,
            horsepower: 330, drivetrain: "AWD", zeroToHundred: 5.9, topSpeed: 250,
            mileage: 16000, licensePlate: "CD-MGL0", location: "Prague",
            dailyKmLimit: 400, excessKmFee: 0.40, minimumAge: null, minimumRentalDays: null,
            description: "The Mercedes GLE 400d — diesel efficiency with luxury SUV presence. Air suspension, MBUX and a seven-seat cabin for exceptional journeys.",
            images: { create: [{ url: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=1200" }] },
        },
        {
            name: "Q7 TDI", brand: "Audi", model: "Q7", year: 2023,
            category: "SUV", pricePerDay: 185, deposit: 920,
            transmission: "Automatic", fuelType: "Diesel", seats: 7,
            horsepower: 286, drivetrain: "AWD", zeroToHundred: 6.1, topSpeed: 250,
            mileage: 28000, licensePlate: "CD-AQ70", location: "Prague",
            dailyKmLimit: 400, excessKmFee: 0.40, minimumAge: null, minimumRentalDays: null,
            description: "Audi Q7 — the flagship SUV with 7-seat versatility and Quattro all-road capability. Matrix LEDs, virtual cockpit and air suspension.",
            images: { create: [{ url: "https://images.unsplash.com/photo-1616422285623-13ff0162193c?w=1200" }] },
        },
    ],

    // ── 3: LuxuryWheels — Luxury / Supercar ─────────────────────────────────
    3: [
        {
            name: "Ghost Series II", brand: "Rolls-Royce", model: "Ghost", year: 2023,
            category: "Luxury", pricePerDay: 1200, deposit: 8000,
            transmission: "Automatic", fuelType: "Petrol", seats: 5,
            horsepower: 571, drivetrain: "AWD", zeroToHundred: 4.8, topSpeed: 250,
            mileage: 4000, licensePlate: "LW-RRG1", location: "Vienna",
            dailyKmLimit: 200, excessKmFee: 2.00, minimumAge: 30, minimumRentalDays: 3,
            description: "The Rolls-Royce Ghost Series II — post opulence in its purest form. Starlight headliner with 1,340 fibre-optic stars and a 6.75-litre twin-turbo V12.",
            images: { create: [{ url: "https://images.unsplash.com/photo-1631295868223-63265b40d9e4?w=1200" }] },
        },
        {
            name: "Continental GT V8", brand: "Bentley", model: "Continental", year: 2023,
            category: "Luxury", pricePerDay: 950, deposit: 6000,
            transmission: "Automatic", fuelType: "Petrol", seats: 4,
            horsepower: 550, drivetrain: "AWD", zeroToHundred: 4.0, topSpeed: 318,
            mileage: 6000, licensePlate: "LW-BCG1", location: "Vienna",
            dailyKmLimit: 250, excessKmFee: 1.50, minimumAge: 28, minimumRentalDays: 3,
            description: "The Bentley Continental GT V8 — handcrafted grand touring perfection. Rotating veneer dashboard, 650 hp V8 thunder and a dynamically brilliant chassis.",
            images: { create: [{ url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200" }] },
        },
        {
            name: "F8 Tributo", brand: "Ferrari", model: "F8", year: 2023,
            category: "Supercar", pricePerDay: 1250, deposit: 8000,
            transmission: "Automatic", fuelType: "Petrol", seats: 2,
            horsepower: 710, drivetrain: "RWD", zeroToHundred: 2.9, topSpeed: 340,
            mileage: 3200, licensePlate: "LW-FRF8", location: "Vienna",
            dailyKmLimit: 150, excessKmFee: 2.80, minimumAge: 30, minimumRentalDays: 2,
            description: "The Ferrari F8 Tributo — 710 hp twin-turbo V8. Active aerodynamics inherited from the FXX K. Mid-engine masterpiece.",
            images: { create: [{ url: "https://images.unsplash.com/photo-1592853625597-7d17c46c8016?w=1200" }] },
        },
        {
            name: "Huracan EVO", brand: "Lamborghini", model: "Huracan", year: 2023,
            category: "Supercar", pricePerDay: 1100, deposit: 7000,
            transmission: "Automatic", fuelType: "Petrol", seats: 2,
            horsepower: 640, drivetrain: "AWD", zeroToHundred: 2.9, topSpeed: 325,
            mileage: 5500, licensePlate: "LW-LBHE", location: "Vienna",
            dailyKmLimit: 150, excessKmFee: 2.50, minimumAge: 30, minimumRentalDays: 2,
            description: "Lamborghini Huracan EVO — naturally aspirated 5.2-litre V10 screaming to 8,500 rpm. LDVI predictive AWD and a soundtrack that turns heads for miles.",
            images: { create: [{ url: "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=1200" }] },
        },
        {
            name: "Artura", brand: "McLaren", model: "Artura", year: 2024,
            category: "Supercar", pricePerDay: 1150, deposit: 7500,
            transmission: "Automatic", fuelType: "Hybrid", seats: 2,
            horsepower: 680, drivetrain: "RWD", zeroToHundred: 3.0, topSpeed: 330,
            mileage: 2800, licensePlate: "LW-MCAR", location: "Vienna",
            dailyKmLimit: 150, excessKmFee: 2.60, minimumAge: 30, minimumRentalDays: 2,
            description: "The McLaren Artura — plug-in V6 hybrid, 680 hp, carbon fibre MonoCell II chassis. Pure driver focus that defines every McLaren.",
            images: { create: [{ url: "https://images.unsplash.com/photo-1566473965997-3de9c817e938?w=1200" }] },
        },
    ],

    // ── 4: HyperDrive — Hypercar ─────────────────────────────────────────────
    4: [
        {
            name: "SF90 Stradale", brand: "Ferrari", model: "SF90", year: 2024,
            category: "Hypercar", pricePerDay: 2500, deposit: 15000,
            transmission: "Automatic", fuelType: "Hybrid", seats: 2,
            horsepower: 1000, drivetrain: "AWD", zeroToHundred: 2.5, topSpeed: 340,
            mileage: 1800, licensePlate: "HD-FSF9", location: "Budapest",
            dailyKmLimit: 100, excessKmFee: 5.00, minimumAge: 32, minimumRentalDays: 3,
            description: "The Ferrari SF90 Stradale — Ferrari's most powerful production car ever. 1,000 hp tri-motor hybrid, eAWD and 0–100 in 2.5 seconds.",
            images: { create: [{ url: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=1200" }] },
        },
        {
            name: "Revuelto", brand: "Lamborghini", model: "Revuelto", year: 2024,
            category: "Hypercar", pricePerDay: 3200, deposit: 20000,
            transmission: "Automatic", fuelType: "Hybrid", seats: 2,
            horsepower: 1001, drivetrain: "AWD", zeroToHundred: 2.5, topSpeed: 350,
            mileage: 900, licensePlate: "HD-LBRV", location: "Budapest",
            dailyKmLimit: 100, excessKmFee: 6.00, minimumAge: 32, minimumRentalDays: 3,
            description: "The Lamborghini Revuelto — 1,001 hp V12 hybrid successor to the Aventador. Three electric motors and active aerodynamics.",
            images: { create: [{ url: "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=1200" }] },
        },
        {
            name: "Chiron Super Sport", brand: "Bugatti", model: "Chiron", year: 2024,
            category: "Hypercar", pricePerDay: 5000, deposit: 30000,
            transmission: "Automatic", fuelType: "Petrol", seats: 2,
            horsepower: 1578, drivetrain: "AWD", zeroToHundred: 2.4, topSpeed: 440,
            mileage: 600, licensePlate: "HD-BGCS", location: "Budapest",
            dailyKmLimit: 80, excessKmFee: 10.00, minimumAge: 35, minimumRentalDays: 3,
            description: "The Bugatti Chiron Super Sport — 1,578 hp quad-turbocharged W16. The fastest and most powerful production car available for rent. Pure engineering art.",
            images: { create: [{ url: "https://images.unsplash.com/photo-1566473965997-3de9c817e938?w=1200" }] },
        },
        {
            name: "Huayra Roadster", brand: "Pagani", model: "Huayra", year: 2023,
            category: "Hypercar", pricePerDay: 3800, deposit: 22000,
            transmission: "Automatic", fuelType: "Petrol", seats: 2,
            horsepower: 838, drivetrain: "RWD", zeroToHundred: 2.8, topSpeed: 370,
            mileage: 1200, licensePlate: "HD-PGHR", location: "Budapest",
            dailyKmLimit: 100, excessKmFee: 7.00, minimumAge: 32, minimumRentalDays: 3,
            description: "The Pagani Huayra Roadster — hand-built Italian masterpiece. AMG-sourced twin-turbo V12, titanium details and a carbon fibre body that is art in motion.",
            images: { create: [{ url: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200" }] },
        },
        {
            name: "Jesko Absolut", brand: "Koenigsegg", model: "Jesko", year: 2024,
            category: "Hypercar", pricePerDay: 4500, deposit: 28000,
            transmission: "Automatic", fuelType: "Petrol", seats: 2,
            horsepower: 1600, drivetrain: "RWD", zeroToHundred: 2.5, topSpeed: 330,
            mileage: 400, licensePlate: "HD-KSJA", location: "Budapest",
            dailyKmLimit: 80, excessKmFee: 9.00, minimumAge: 35, minimumRentalDays: 3,
            description: "The Koenigsegg Jesko Absolut — 1,600 hp on E85, 9-speed multi-clutch transmission and active aerodynamics. One of the rarest production cars on Earth.",
            images: { create: [{ url: "https://images.unsplash.com/photo-1580274455191-1c62238fa333?w=1200" }] },
        },
    ],
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    console.log("🧹  Clearing old company data…")

    // Remove company cars first (FK constraint order)
    const existingCompanies = await prisma.company.findMany({ select: { id: true } })
    const companyIds = existingCompanies.map(c => c.id)

    if (companyIds.length > 0) {
        await prisma.carImage.deleteMany({
            where: { product: { companyId: { in: companyIds } } },
        })
        await prisma.product.deleteMany({
            where: { companyId: { in: companyIds } },
        })
        await prisma.user.deleteMany({
            where: { companyId: { in: companyIds } },
        })
        await prisma.company.deleteMany({
            where: { id: { in: companyIds } },
        })
    }

    console.log("🏢  Creating companies, moderators & cars…\n")

    const credentials: string[] = []

    for (let i = 0; i < COMPANIES.length; i++) {
        const { mod, ...companyData } = COMPANIES[i]

        const company = await prisma.company.create({ data: companyData })

        const hash = await bcrypt.hash(mod.password, 12)
        await prisma.user.create({
            data: {
                name:      mod.name,
                email:     mod.email,
                password:  hash,
                role:      "MODERATOR",
                companyId: company.id,
            },
        })

        const cars = CARS_BY_COMPANY[i] as any[]
        for (const car of cars) {
            await prisma.product.create({
                data: {
                    ...car,
                    companyId:      company.id,
                    approvalStatus: "APPROVED",
                    active:         true,
                    featured:       false,
                },
            })
        }

        credentials.push(
            `  ${company.name.padEnd(18)} │ ${mod.email.padEnd(28)} │ ${mod.password}`
        )
        console.log(`  ✓ ${company.name} (${cars.length} cars)`)
    }

    const totalCars = Object.values(CARS_BY_COMPANY).reduce((s, arr) => s + arr.length, 0)

    console.log(`\n✅  Done! ${COMPANIES.length} companies, ${totalCars} cars.\n`)
    console.log("─".repeat(75))
    console.log("  Company            │ Email                        │ Password")
    console.log("─".repeat(75))
    credentials.forEach(l => console.log(l))
    console.log("─".repeat(75))
}

main()
    .catch(e => { console.error(e); process.exit(1) })
    .finally(() => prisma.$disconnect())
