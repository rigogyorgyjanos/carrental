import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"

const prisma = new PrismaClient()

const BADGES = [
    { slug: "first_ride",     name: "First Ride",     description: "Complete your very first rental",             icon: "🚗" },
    { slug: "road_warrior_5", name: "Road Warrior",   description: "Complete 5 rentals",                         icon: "🛣"  },
    { slug: "loyal_10",       name: "Loyal Member",   description: "Complete 10 rentals",                        icon: "💎" },
    { slug: "supercar_club",  name: "Supercar Club",  description: "Rent a Supercar or Hypercar",                icon: "🏎" },
    { slug: "long_haul",      name: "Long Haul",      description: "Rent a car for 7 or more consecutive days",  icon: "📅" },
    { slug: "road_explorer",  name: "Road Explorer",  description: "Reach Road Explorer tier (200 XP)",          icon: "🗺"  },
    { slug: "elite_driver",   name: "Elite Driver",   description: "Reach Elite Driver tier (500 XP)",           icon: "⚡" },
    { slug: "vip_member",     name: "VIP Member",     description: "Reach VIP Member tier (1000 XP)",            icon: "👑" },
    { slug: "dubai_legend",   name: "Dubai Legend",   description: "Reach Dubai Legend tier (2000 XP)",          icon: "🌟" },
    { slug: "reviewer",       name: "Reviewer",       description: "Leave your first approved review",           icon: "✍"  },
]

async function main() {
    console.log("🌱 Starting NeonDB seed...")

    const pw = await bcrypt.hash("Admin123!", 12)

    // ── Admins ────────────────────────────────────────────────────────────────
    const angi = await prisma.user.upsert({
        where:  { email: "angi@aurum.com" },
        update: {},
        create: { name: "Angi", email: "angi@aurum.com", password: pw, role: "ADMIN" },
    })
    const ramon = await prisma.user.upsert({
        where:  { email: "ramon@aurum.com" },
        update: {},
        create: { name: "Ramon", email: "ramon@aurum.com", password: pw, role: "ADMIN" },
    })
    console.log(`✓ Admins: ${angi.email}, ${ramon.email}`)

    // ── Companies ─────────────────────────────────────────────────────────────
    const company1 = await prisma.company.upsert({
        where:  { slug: "aurum-fleet" },
        update: {},
        create: {
            name:        "Aurum Fleet",
            slug:        "aurum-fleet",
            description: "Premium supercar and luxury vehicle rentals in Budapest.",
            status:      "ACTIVE",
        },
    })
    const company2 = await prisma.company.upsert({
        where:  { slug: "elite-drive" },
        update: {},
        create: {
            name:        "Elite Drive",
            slug:        "elite-drive",
            description: "Vienna's finest luxury and exotic car rental service.",
            status:      "ACTIVE",
        },
    })
    console.log(`✓ Companies: ${company1.name}, ${company2.name}`)

    // ── Moderators ────────────────────────────────────────────────────────────
    const alex = await prisma.user.upsert({
        where:  { email: "alex@aurumfleet.com" },
        update: {},
        create: { name: "Alex Kovács", email: "alex@aurumfleet.com", password: pw, role: "MODERATOR", companyId: company1.id },
    })
    const sofia = await prisma.user.upsert({
        where:  { email: "sofia@elitedrive.com" },
        update: {},
        create: { name: "Sofia Müller", email: "sofia@elitedrive.com", password: pw, role: "MODERATOR", companyId: company2.id },
    })
    console.log(`✓ Moderators: ${alex.email} → ${company1.name}, ${sofia.email} → ${company2.name}`)

    // ── Cars: Aurum Fleet (Budapest) ──────────────────────────────────────────
    const aurumCars = [
        {
            name: "F8 Tributo", brand: "Ferrari", model: "F8", year: 2023,
            category: "Supercar",
            description: "The Ferrari F8 Tributo — 710 hp twin-turbo V8, active aerodynamics inherited from the FXX K and Ferrari Dynamic Enhancer. A mid-engine masterpiece that is simultaneously race car and daily supercar.",
            pricePerDay: 1250, deposit: 8000, transmission: "Automatic", fuelType: "Petrol",
            seats: 2, horsepower: 710, drivetrain: "RWD", zeroToHundred: 2.9, topSpeed: 340,
            mileage: 3200, licensePlate: "AF-F801", location: "Budapest",
            featured: true, active: true, approvalStatus: "APPROVED",
            minimumAge: 28, minimumRentalDays: 2, dailyKmLimit: 150, excessKmFee: 2.80,
            companyId: company1.id,
            images: { create: [
                { url: "https://images.unsplash.com/photo-1592853625597-7d17c46c8016?w=1200" },
                { url: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=1200" },
            ]},
        },
        {
            name: "Huracan EVO", brand: "Lamborghini", model: "Huracan", year: 2023,
            category: "Supercar",
            description: "The Lamborghini Huracan EVO — naturally aspirated 5.2-litre V10 screaming to 8,500 rpm. LDVI predictive all-wheel drive, magnetorheological suspension and a soundtrack that turns heads for miles.",
            pricePerDay: 1100, deposit: 7000, transmission: "Automatic", fuelType: "Petrol",
            seats: 2, horsepower: 640, drivetrain: "AWD", zeroToHundred: 2.9, topSpeed: 325,
            mileage: 5500, licensePlate: "AF-LB01", location: "Budapest",
            featured: true, active: true, approvalStatus: "APPROVED",
            minimumAge: 28, minimumRentalDays: 2, dailyKmLimit: 150, excessKmFee: 2.50,
            companyId: company1.id,
            images: { create: [
                { url: "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=1200" },
                { url: "https://images.unsplash.com/photo-1526726538690-5cbf956ae2fd?w=1200" },
            ]},
        },
        {
            name: "Ghost", brand: "Rolls-Royce", model: "Ghost", year: 2023,
            category: "Luxury",
            description: "The Rolls-Royce Ghost Series II — post opulence in its purest form. Starlight headliner with 1,340 fibre-optic stars, Architecture of Luxury insulation and a 6.75-litre twin-turbo V12. Pure serenity at any speed.",
            pricePerDay: 1200, deposit: 8000, transmission: "Automatic", fuelType: "Petrol",
            seats: 5, horsepower: 571, drivetrain: "AWD", zeroToHundred: 4.8, topSpeed: 250,
            mileage: 4000, licensePlate: "AF-RR01", location: "Budapest",
            featured: true, active: true, approvalStatus: "APPROVED",
            minimumAge: 30, minimumRentalDays: 3, dailyKmLimit: 200, excessKmFee: 2.00,
            companyId: company1.id,
            images: { create: [
                { url: "https://images.unsplash.com/photo-1631295868223-63265b40d9e4?w=1200" },
                { url: "https://images.unsplash.com/photo-1526726538690-5cbf956ae2fd?w=1200" },
            ]},
        },
        {
            name: "911 Turbo S", brand: "Porsche", model: "911", year: 2024,
            category: "Supercar",
            description: "The Porsche 911 Turbo S — 650 hp twin-turbo flat-six, Porsche Traction Management with PDCC Sport and launch control. 0–100 in 2.7 seconds. Seven decades of engineering excellence condensed into an icon.",
            pricePerDay: 890, deposit: 5500, transmission: "Automatic", fuelType: "Petrol",
            seats: 4, horsepower: 650, drivetrain: "AWD", zeroToHundred: 2.7, topSpeed: 330,
            mileage: 4500, licensePlate: "AF-P911", location: "Budapest",
            featured: true, active: true, approvalStatus: "APPROVED",
            minimumAge: 28, minimumRentalDays: 2, dailyKmLimit: 200, excessKmFee: 1.80,
            companyId: company1.id,
            images: { create: [
                { url: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1200" },
                { url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200" },
            ]},
        },
        {
            name: "G63 AMG", brand: "Mercedes", model: "G63", year: 2024,
            category: "SUV",
            description: "The Mercedes-AMG G 63 — a legend evolved. Handbuilt 4.0-litre twin-turbo V8 with 585 hp, three locking differentials and AMG RIDE CONTROL+ suspension wrapped in unmistakable boxy luxury.",
            pricePerDay: 580, deposit: 3500, transmission: "Automatic", fuelType: "Petrol",
            seats: 5, horsepower: 585, drivetrain: "AWD", zeroToHundred: 4.5, topSpeed: 220,
            mileage: 8000, licensePlate: "AF-G63", location: "Budapest",
            featured: true, active: true, approvalStatus: "APPROVED",
            minimumAge: 25, minimumRentalDays: 2, dailyKmLimit: 300, excessKmFee: 1.00,
            companyId: company1.id,
            images: { create: [
                { url: "https://images.unsplash.com/photo-1520031441872-265e4ff70366?w=1200" },
                { url: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=1200" },
            ]},
        },
    ]

    // ── Cars: Elite Drive (Vienna) ────────────────────────────────────────────
    const eliteCars = [
        {
            name: "Continental GT", brand: "Bentley", model: "Continental", year: 2023,
            category: "Luxury",
            description: "The Bentley Continental GT V8 — handcrafted grand touring perfection. Rotating veneer dashboard, 550 hp V8 thunder and a chassis that floats over broken road while remaining dynamically brilliant.",
            pricePerDay: 950, deposit: 6000, transmission: "Automatic", fuelType: "Petrol",
            seats: 4, horsepower: 550, drivetrain: "AWD", zeroToHundred: 4.0, topSpeed: 318,
            mileage: 6000, licensePlate: "ED-BT01", location: "Vienna",
            featured: true, active: true, approvalStatus: "APPROVED",
            minimumAge: 28, minimumRentalDays: 2, dailyKmLimit: 250, excessKmFee: 1.50,
            companyId: company2.id,
            images: { create: [
                { url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200" },
                { url: "https://images.unsplash.com/photo-1567818735868-e71b99932e29?w=1200" },
            ]},
        },
        {
            name: "720S", brand: "McLaren", model: "720S", year: 2023,
            category: "Supercar",
            description: "The McLaren 720S — 720 hp twin-turbo V8 in a carbon fibre MonoCell II chassis. Active suspension, proactive chassis control and driver-focused cockpit deliver a visceral, unfiltered supercar experience.",
            pricePerDay: 1300, deposit: 9000, transmission: "Automatic", fuelType: "Petrol",
            seats: 2, horsepower: 720, drivetrain: "RWD", zeroToHundred: 2.9, topSpeed: 341,
            mileage: 4200, licensePlate: "ED-MC01", location: "Vienna",
            featured: true, active: true, approvalStatus: "APPROVED",
            minimumAge: 30, minimumRentalDays: 2, dailyKmLimit: 150, excessKmFee: 2.80,
            companyId: company2.id,
            images: { create: [
                { url: "https://images.unsplash.com/photo-1566473965997-3de9c817e938?w=1200" },
                { url: "https://images.unsplash.com/photo-1493238792000-8113da705763?w=1200" },
            ]},
        },
        {
            name: "DB11 V12", brand: "Aston Martin", model: "DB11", year: 2023,
            category: "Luxury",
            description: "The Aston Martin DB11 V12 — 630 hp twin-turbo twelve-cylinder grand tourer. Aeroblade II bodywork, adaptive damping and a handcrafted interior define Aston's most powerful DB series model.",
            pricePerDay: 850, deposit: 5500, transmission: "Automatic", fuelType: "Petrol",
            seats: 4, horsepower: 630, drivetrain: "RWD", zeroToHundred: 3.7, topSpeed: 334,
            mileage: 5000, licensePlate: "ED-AM01", location: "Vienna",
            featured: true, active: true, approvalStatus: "APPROVED",
            minimumAge: 28, minimumRentalDays: 2, dailyKmLimit: 200, excessKmFee: 1.60,
            companyId: company2.id,
            images: { create: [
                { url: "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=1200" },
                { url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200" },
            ]},
        },
        {
            name: "M8 Competition", brand: "BMW", model: "M8", year: 2023,
            category: "Sport",
            description: "The BMW M8 Competition Coupé — 625 hp M twin-turbo V8 with M xDrive and launch control. Track-tuned suspension, carbon ceramic brakes and grand touring range in a stunning fastback body.",
            pricePerDay: 520, deposit: 3200, transmission: "Automatic", fuelType: "Petrol",
            seats: 4, horsepower: 625, drivetrain: "AWD", zeroToHundred: 3.3, topSpeed: 305,
            mileage: 7000, licensePlate: "ED-M801", location: "Vienna",
            featured: false, active: true, approvalStatus: "APPROVED",
            minimumAge: 25, minimumRentalDays: 2, dailyKmLimit: 250, excessKmFee: 1.00,
            companyId: company2.id,
            images: { create: [
                { url: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=1200" },
                { url: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200" },
            ]},
        },
        {
            name: "Panamera Turbo S", brand: "Porsche", model: "Panamera", year: 2024,
            category: "Luxury",
            description: "The Porsche Panamera Turbo S E-Hybrid — 700 hp combined, active aerodynamics, rear-axle steering and a Burmester High-End 3D sound system. The four-door sports car that compromises on nothing.",
            pricePerDay: 750, deposit: 4500, transmission: "Automatic", fuelType: "Hybrid",
            seats: 4, horsepower: 700, drivetrain: "AWD", zeroToHundred: 3.2, topSpeed: 315,
            mileage: 3500, licensePlate: "ED-PO01", location: "Vienna",
            featured: false, active: true, approvalStatus: "APPROVED",
            minimumAge: 28, minimumRentalDays: 2, dailyKmLimit: 300, excessKmFee: 1.20,
            companyId: company2.id,
            images: { create: [
                { url: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1200" },
                { url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200" },
            ]},
        },
    ]

    for (const car of [...aurumCars, ...eliteCars]) {
        await prisma.product.create({ data: car as any })
    }
    console.log("✓ 10 cars created (5 per company)")

    // ── Badges ────────────────────────────────────────────────────────────────
    for (const b of BADGES) {
        await prisma.badge.upsert({
            where:  { slug: b.slug },
            update: { name: b.name, description: b.description, icon: b.icon },
            create: b,
        })
    }
    console.log(`✓ ${BADGES.length} badges seeded`)

    // ── Summary ───────────────────────────────────────────────────────────────
    console.log("")
    console.log("═══════════════════════════════════════")
    console.log("  NEONDB SEED COMPLETE")
    console.log("═══════════════════════════════════════")
    console.log("")
    console.log("  ADMIN  │ Angi   │ angi@aurum.com          │ Admin123!")
    console.log("  ADMIN  │ Ramon  │ ramon@aurum.com         │ Admin123!")
    console.log("  MOD    │ Alex   │ alex@aurumfleet.com     │ Admin123!")
    console.log("  MOD    │ Sofia  │ sofia@elitedrive.com    │ Admin123!")
    console.log("")
    console.log("  Aurum Fleet (Budapest) → Alex")
    console.log("    Ferrari F8 Tributo · Lamborghini Huracan EVO")
    console.log("    Rolls-Royce Ghost · Porsche 911 Turbo S · Mercedes G63 AMG")
    console.log("")
    console.log("  Elite Drive (Vienna) → Sofia")
    console.log("    Bentley Continental GT · McLaren 720S")
    console.log("    Aston Martin DB11 · BMW M8 Competition · Porsche Panamera Turbo S")
    console.log("═══════════════════════════════════════")
}

main()
    .catch(e => { console.error(e); process.exit(1) })
    .finally(() => prisma.$disconnect())
