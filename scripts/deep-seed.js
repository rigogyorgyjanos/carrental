/**
 * AURUM — Deep Test Seeder
 * Creates all cars, badges, admin + 14 test users covering every booking status,
 * approved & pending reviews, mileage tracking, XP and badges.
 *
 * Run: node scripts/deep-seed.js
 * Password for all test users: AurumTest2024!
 */

"use strict"
const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcrypt")

const prisma = new PrismaClient()
const today = new Date(); today.setHours(12, 0, 0, 0)

function daysAgo(n)       { const d = new Date(today); d.setDate(d.getDate() - n); return d }
function daysFromNow(n)   { const d = new Date(today); d.setDate(d.getDate() + n); return d }
function getLevel(xp)     { return Math.floor(xp / 200) + 1 }
function getXpPerDay(cat) {
    const c = cat.toLowerCase()
    if (c.includes("super") || c.includes("hyper"))   return 30
    if (c.includes("luxury") || c.includes("sport"))  return 20
    if (c.includes("premium"))                         return 15
    return 10
}

// ─────────────────────────────────────────────────────────────────
// 1. BADGES
// ─────────────────────────────────────────────────────────────────
const BADGE_DEFS = [
    { slug: "first_ride",      name: "First Ride",       description: "Complete your very first rental",                    icon: "🚗" },
    { slug: "road_warrior_5",  name: "Road Warrior",     description: "Complete 5 rentals",                                icon: "🛣" },
    { slug: "loyal_10",        name: "Loyal Member",     description: "Complete 10 rentals",                               icon: "💎" },
    { slug: "supercar_club",   name: "Supercar Club",    description: "Rent a Supercar or Hypercar",                       icon: "🏎" },
    { slug: "long_haul",       name: "Long Haul",        description: "Rent a car for 7 or more consecutive days",         icon: "📅" },
    { slug: "road_explorer",   name: "Road Explorer",    description: "Reach Road Explorer tier (200 XP)",                 icon: "🗺" },
    { slug: "elite_driver",    name: "Elite Driver",     description: "Reach Elite Driver tier (500 XP)",                  icon: "⚡" },
    { slug: "vip_member",      name: "VIP Member",       description: "Reach VIP Member tier (1000 XP)",                   icon: "👑" },
    { slug: "dubai_legend",    name: "Dubai Legend",     description: "Reach Dubai Legend tier (2000 XP)",                 icon: "🌟" },
    { slug: "first_review",    name: "Trusted Reviewer", description: "Leave your first review after a completed rental",  icon: "⭐" },
]

// ─────────────────────────────────────────────────────────────────
// 2. CARS (same data as prisma/seed.ts)
// ─────────────────────────────────────────────────────────────────
const CAR_DEFS = [
    // Compact
    {
        slug: "polo", name: "Polo GTI", brand: "Volkswagen", model: "Polo", year: 2023,
        category: "Compact", pricePerDay: 55, deposit: 220,
        description: "The Polo GTI blends everyday practicality with genuine hot-hatch excitement.",
        transmission: "Automatic", fuelType: "Petrol", seats: 5, horsepower: 207,
        drivetrain: "FWD", zeroToHundred: 6.5, topSpeed: 237, mileage: 12000,
        licensePlate: "VW-1234", location: "Budapest", featured: false, active: true,
        dailyKmLimit: 200, excessKmFee: 0.25,
        images: { create: [{ url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200" }] },
    },
    {
        slug: "clio", name: "Clio RS Line", brand: "Renault", model: "Clio", year: 2023,
        category: "Compact", pricePerDay: 48, deposit: 190,
        description: "Stylish French flair in a compact package.",
        transmission: "Automatic", fuelType: "Hybrid", seats: 5, horsepower: 145,
        drivetrain: "FWD", zeroToHundred: 8.1, topSpeed: 205, mileage: 18000,
        licensePlate: "RN-5678", location: "Vienna", featured: false, active: true,
        dailyKmLimit: 200, excessKmFee: 0.20,
        images: { create: [{ url: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=1200" }] },
    },
    // Sedan
    {
        slug: "bmw3", name: "3 Series", brand: "BMW", model: "3 Series", year: 2023,
        category: "Sedan", pricePerDay: 120, deposit: 600,
        description: "The definitive executive sedan.",
        transmission: "Automatic", fuelType: "Petrol", seats: 5, horsepower: 255,
        drivetrain: "RWD", zeroToHundred: 5.8, topSpeed: 250, mileage: 15000,
        licensePlate: "BM-3001", location: "Budapest", featured: true, active: true,
        dailyKmLimit: 300, excessKmFee: 0.35,
        images: { create: [{ url: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200" }] },
    },
    {
        slug: "mercc", name: "C-Class", brand: "Mercedes", model: "C-Class", year: 2024,
        category: "Sedan", pricePerDay: 130, deposit: 650,
        description: "Mercedes-Benz C-Class — refined luxury meets spirited performance.",
        transmission: "Automatic", fuelType: "Hybrid", seats: 5, horsepower: 258,
        drivetrain: "RWD", zeroToHundred: 6.0, topSpeed: 250, mileage: 9000,
        licensePlate: "MB-3002", location: "Vienna", featured: true, active: true,
        dailyKmLimit: 300, excessKmFee: 0.35,
        images: { create: [{ url: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1200" }] },
    },
    {
        slug: "audia4", name: "A4", brand: "Audi", model: "A4", year: 2023,
        category: "Sedan", pricePerDay: 115, deposit: 580,
        description: "Audi A4 — understated elegance with Quattro all-wheel drive.",
        transmission: "Automatic", fuelType: "Petrol", seats: 5, horsepower: 245,
        drivetrain: "AWD", zeroToHundred: 6.0, topSpeed: 250, mileage: 22000,
        licensePlate: "AU-4004", location: "Prague", featured: false, active: true,
        dailyKmLimit: 300, excessKmFee: 0.30,
        images: { create: [{ url: "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=1200" }] },
    },
    // SUV
    {
        slug: "bmwx5", name: "X5", brand: "BMW", model: "X5", year: 2023,
        category: "SUV", pricePerDay: 180, deposit: 900,
        description: "The BMW X5 xDrive redefines what an SUV can be.",
        transmission: "Automatic", fuelType: "Petrol", seats: 5, horsepower: 340,
        drivetrain: "AWD", zeroToHundred: 5.5, topSpeed: 250, mileage: 20000,
        licensePlate: "BM-5005", location: "Budapest", featured: true, active: true,
        dailyKmLimit: 350, excessKmFee: 0.40,
        images: { create: [{ url: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=1200" }] },
    },
    {
        slug: "mersuv", name: "GLE 400d", brand: "Mercedes", model: "GLE", year: 2024,
        category: "SUV", pricePerDay: 195, deposit: 980,
        description: "The Mercedes GLE 400d combines diesel efficiency with luxury SUV presence.",
        transmission: "Automatic", fuelType: "Diesel", seats: 7, horsepower: 330,
        drivetrain: "AWD", zeroToHundred: 5.9, topSpeed: 250, mileage: 16000,
        licensePlate: "MB-6006", location: "Berlin", featured: true, active: true,
        dailyKmLimit: 400, excessKmFee: 0.40,
        images: { create: [{ url: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=1200" }] },
    },
    // Sport
    {
        slug: "bmwm4", name: "M4 Competition", brand: "BMW", model: "M4", year: 2023,
        category: "Sport", pricePerDay: 280, deposit: 1400,
        description: "The BMW M4 Competition is raw, focused and electrifying.",
        transmission: "Automatic", fuelType: "Petrol", seats: 4, horsepower: 510,
        drivetrain: "AWD", zeroToHundred: 3.5, topSpeed: 290, mileage: 8000,
        licensePlate: "BM-M401", location: "Budapest", featured: true, active: true,
        minimumAge: 25, minimumRentalDays: 2, dailyKmLimit: 250, excessKmFee: 0.60,
        images: { create: [{ url: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=1200" }] },
    },
    {
        slug: "amgc63", name: "AMG C63 S", brand: "Mercedes", model: "C63", year: 2023,
        category: "Sport", pricePerDay: 295, deposit: 1500,
        description: "Mercedes-AMG C63 S — 671 hp plug-in hybrid powerplant.",
        transmission: "Automatic", fuelType: "Hybrid", seats: 4, horsepower: 671,
        drivetrain: "RWD", zeroToHundred: 3.4, topSpeed: 280, mileage: 6000,
        licensePlate: "MB-C631", location: "Vienna", featured: true, active: true,
        minimumAge: 25, minimumRentalDays: 2, dailyKmLimit: 250, excessKmFee: 0.65,
        images: { create: [{ url: "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=1200" }] },
    },
    {
        slug: "audirs5", name: "RS5 Sportback", brand: "Audi", model: "RS5", year: 2023,
        category: "Sport", pricePerDay: 270, deposit: 1350,
        description: "Audi RS5 Sportback — 450 hp biturbo V6 with Quattro.",
        transmission: "Automatic", fuelType: "Petrol", seats: 5, horsepower: 450,
        drivetrain: "AWD", zeroToHundred: 3.9, topSpeed: 280, mileage: 11000,
        licensePlate: "AU-RS51", location: "Berlin", featured: false, active: true,
        minimumAge: 25, minimumRentalDays: 2, dailyKmLimit: 250, excessKmFee: 0.55,
        images: { create: [{ url: "https://images.unsplash.com/photo-1541443131876-44b03de101c5?w=1200" }] },
    },
    // Premium
    {
        slug: "bmw7", name: "7 Series", brand: "BMW", model: "7 Series", year: 2024,
        category: "Premium", pricePerDay: 320, deposit: 1600,
        description: "The BMW 7 Series redefines long-distance luxury.",
        transmission: "Automatic", fuelType: "Hybrid", seats: 5, horsepower: 544,
        drivetrain: "AWD", zeroToHundred: 4.7, topSpeed: 250, mileage: 7000,
        licensePlate: "BM-7001", location: "Budapest", featured: true, active: true,
        minimumAge: 25, minimumRentalDays: 2, dailyKmLimit: 400, excessKmFee: 0.50,
        images: { create: [{ url: "https://images.unsplash.com/photo-1523983302500-a84da543c48b?w=1200" }] },
    },
    {
        slug: "mercs", name: "S-Class", brand: "Mercedes", model: "S-Class", year: 2024,
        category: "Premium", pricePerDay: 380, deposit: 1900,
        description: "The Mercedes-Benz S-Class — the world's most sophisticated sedan.",
        transmission: "Automatic", fuelType: "Hybrid", seats: 5, horsepower: 510,
        drivetrain: "AWD", zeroToHundred: 4.9, topSpeed: 250, mileage: 5000,
        licensePlate: "MB-S001", location: "Vienna", featured: true, active: true,
        minimumAge: 28, minimumRentalDays: 2, dailyKmLimit: 400, excessKmFee: 0.55,
        images: { create: [{ url: "https://images.unsplash.com/photo-1631295868223-63265b40d9e4?w=1200" }] },
    },
    // Luxury
    {
        slug: "ghost", name: "Ghost", brand: "Rolls-Royce", model: "Ghost", year: 2023,
        category: "Luxury", pricePerDay: 1200, deposit: 8000,
        description: "The Rolls-Royce Ghost Series II — post opulence in its purest form.",
        transmission: "Automatic", fuelType: "Petrol", seats: 5, horsepower: 571,
        drivetrain: "AWD", zeroToHundred: 4.8, topSpeed: 250, mileage: 4000,
        licensePlate: "RR-GH01", location: "Budapest", featured: true, active: true,
        minimumAge: 30, minimumRentalDays: 3, dailyKmLimit: 200, excessKmFee: 2.00,
        images: { create: [{ url: "https://images.unsplash.com/photo-1526726538690-5cbf956ae2fd?w=1200" }] },
    },
    {
        slug: "bentley", name: "Continental GT", brand: "Bentley", model: "Continental", year: 2023,
        category: "Luxury", pricePerDay: 950, deposit: 6000,
        description: "The Bentley Continental GT V8 — handcrafted grand touring perfection.",
        transmission: "Automatic", fuelType: "Petrol", seats: 4, horsepower: 550,
        drivetrain: "AWD", zeroToHundred: 4.0, topSpeed: 318, mileage: 6000,
        licensePlate: "BT-CG01", location: "Vienna", featured: true, active: true,
        minimumAge: 28, minimumRentalDays: 3, dailyKmLimit: 250, excessKmFee: 1.50,
        images: { create: [{ url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200" }] },
    },
    {
        slug: "panamera", name: "Panamera Turbo S", brand: "Porsche", model: "Panamera", year: 2024,
        category: "Luxury", pricePerDay: 750, deposit: 4500,
        description: "The Porsche Panamera Turbo S E-Hybrid — the four-door sports car.",
        transmission: "Automatic", fuelType: "Hybrid", seats: 4, horsepower: 700,
        drivetrain: "AWD", zeroToHundred: 3.2, topSpeed: 315, mileage: 3500,
        licensePlate: "PO-PA01", location: "Berlin", featured: true, active: true,
        minimumAge: 28, minimumRentalDays: 2, dailyKmLimit: 300, excessKmFee: 1.20,
        images: { create: [{ url: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1200" }] },
    },
    // Supercar
    {
        slug: "porsche911", name: "911 Turbo S", brand: "Porsche", model: "911", year: 2024,
        category: "Supercar", pricePerDay: 890, deposit: 5500,
        description: "The Porsche 911 Turbo S — 650 hp twin-turbo flat-six.",
        transmission: "Automatic", fuelType: "Petrol", seats: 4, horsepower: 650,
        drivetrain: "AWD", zeroToHundred: 2.7, topSpeed: 330, mileage: 4500,
        licensePlate: "PO-9T01", location: "Budapest", featured: true, active: true,
        minimumAge: 28, minimumRentalDays: 2, dailyKmLimit: 200, excessKmFee: 1.80,
        images: { create: [{ url: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1200" }] },
    },
    {
        slug: "huracan", name: "Huracan EVO", brand: "Lamborghini", model: "Huracan", year: 2023,
        category: "Supercar", pricePerDay: 1100, deposit: 7000,
        description: "The Lamborghini Huracan EVO — naturally aspirated 5.2-litre V10.",
        transmission: "Automatic", fuelType: "Petrol", seats: 2, horsepower: 640,
        drivetrain: "AWD", zeroToHundred: 2.9, topSpeed: 325, mileage: 5500,
        licensePlate: "LB-HE01", location: "Budapest", featured: true, active: true,
        minimumAge: 30, minimumRentalDays: 2, dailyKmLimit: 150, excessKmFee: 2.50,
        images: { create: [{ url: "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=1200" }] },
    },
    {
        slug: "f8", name: "F8 Tributo", brand: "Ferrari", model: "F8", year: 2023,
        category: "Supercar", pricePerDay: 1250, deposit: 8000,
        description: "The Ferrari F8 Tributo — 710 hp twin-turbo V8.",
        transmission: "Automatic", fuelType: "Petrol", seats: 2, horsepower: 710,
        drivetrain: "RWD", zeroToHundred: 2.9, topSpeed: 340, mileage: 3200,
        licensePlate: "FR-F801", location: "Vienna", featured: true, active: true,
        minimumAge: 30, minimumRentalDays: 2, dailyKmLimit: 150, excessKmFee: 2.80,
        images: { create: [{ url: "https://images.unsplash.com/photo-1592853625597-7d17c46c8016?w=1200" }] },
    },
    // Hypercar
    {
        slug: "sf90", name: "SF90 Stradale", brand: "Ferrari", model: "SF90", year: 2024,
        category: "Hypercar", pricePerDay: 2500, deposit: 15000,
        description: "The Ferrari SF90 Stradale — Ferrari's most powerful production car ever. 1,000 hp.",
        transmission: "Automatic", fuelType: "Hybrid", seats: 2, horsepower: 1000,
        drivetrain: "AWD", zeroToHundred: 2.5, topSpeed: 340, mileage: 1800,
        licensePlate: "FR-SF01", location: "Budapest", featured: true, active: true,
        minimumAge: 32, minimumRentalDays: 3, dailyKmLimit: 100, excessKmFee: 5.00,
        images: { create: [{ url: "https://images.unsplash.com/photo-1592853625597-7d17c46c8016?w=1200" }] },
    },
    {
        slug: "revuelto", name: "Revuelto", brand: "Lamborghini", model: "Revuelto", year: 2024,
        category: "Hypercar", pricePerDay: 3200, deposit: 20000,
        description: "The Lamborghini Revuelto — 1,001 hp V12 hybrid successor to the Aventador.",
        transmission: "Automatic", fuelType: "Hybrid", seats: 2, horsepower: 1001,
        drivetrain: "AWD", zeroToHundred: 2.5, topSpeed: 350, mileage: 900,
        licensePlate: "LB-RV01", location: "Vienna", featured: true, active: true,
        minimumAge: 32, minimumRentalDays: 3, dailyKmLimit: 100, excessKmFee: 6.00,
        images: { create: [{ url: "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=1200" }] },
    },
]

// ─────────────────────────────────────────────────────────────────
// 3. PERSONAS  (14 users — full workflow coverage)
// ─────────────────────────────────────────────────────────────────
//
// Booking types:
//   completed  : { car, days, daysAgoEnd, startKm?, endKm? }
//   active     : { car, totalDays, startedDaysAgo, startKm? }
//   pending    : { car, totalDays, startsInDays }
//   confirmed  : { car, totalDays, startsInDays }
//   cancelled  : { car, days, daysAgoEnd }
//
// Review types:
//   approvedReview / pendingReview : { car, rating, comment }

const PERSONAS = [
    // ── 1. Dubai Legend — ACTIVE booking + PENDING future ──────────
    {
        name: "Ahmed Al-Rashidi", email: "ahmed.alrashidi@aurum-test.com",
        showOnLeaderboard: true,
        completed:  [
            { car: "sf90",      days: 5,  daysAgoEnd: 280 },
            { car: "sf90",      days: 5,  daysAgoEnd: 260 },
            { car: "sf90",      days: 7,  daysAgoEnd: 230, startKm: 1200, endKm: 1900 },
            { car: "revuelto",  days: 5,  daysAgoEnd: 200 },
            { car: "revuelto",  days: 5,  daysAgoEnd: 175 },
            { car: "revuelto",  days: 7,  daysAgoEnd: 145, startKm: 500,  endKm: 1210 },
            { car: "f8",        days: 5,  daysAgoEnd: 120 },
            { car: "f8",        days: 5,  daysAgoEnd: 100 },
            { car: "f8",        days: 7,  daysAgoEnd: 75,  startKm: 2800, endKm: 3380 },
            { car: "bmwm4",     days: 5,  daysAgoEnd: 50  },
            { car: "huracan",   days: 4,  daysAgoEnd: 30  },
        ],
        active:    { car: "sf90",     totalDays: 7,  startedDaysAgo: 3,  startKm: 1850 },
        pending:   { car: "revuelto", totalDays: 5,  startsInDays: 20   },
        badges: ["first_ride","road_warrior_5","loyal_10","supercar_club","long_haul","road_explorer","elite_driver","vip_member","dubai_legend","first_review"],
        approvedReview: { car: "sf90", rating: 5, comment: "Absolutely phenomenal. The SF90 is a beast — AURUM service is flawless. 10/10 would rent again." },
    },

    // ── 2. Dubai Legend — CONFIRMED upcoming ───────────────────────
    {
        name: "James Blackwood", email: "james.blackwood@aurum-test.com",
        showOnLeaderboard: true,
        completed:  [
            { car: "revuelto",  days: 5,  daysAgoEnd: 310 },
            { car: "revuelto",  days: 5,  daysAgoEnd: 280 },
            { car: "revuelto",  days: 7,  daysAgoEnd: 245, startKm: 800,  endKm: 1600 },
            { car: "ghost",     days: 7,  daysAgoEnd: 200, startKm: 3500, endKm: 4000 },
            { car: "ghost",     days: 7,  daysAgoEnd: 165 },
            { car: "bentley",   days: 7,  daysAgoEnd: 130, startKm: 5500, endKm: 6200 },
            { car: "bentley",   days: 5,  daysAgoEnd: 100 },
            { car: "huracan",   days: 5,  daysAgoEnd: 70  },
            { car: "f8",        days: 5,  daysAgoEnd: 45  },
            { car: "amgc63",    days: 5,  daysAgoEnd: 20  },
        ],
        confirmed: { car: "ghost",    totalDays: 5,  startsInDays: 8    },
        badges: ["first_ride","road_warrior_5","loyal_10","supercar_club","long_haul","road_explorer","elite_driver","vip_member","dubai_legend","first_review"],
        approvedReview: { car: "revuelto", rating: 5, comment: "The Revuelto is on another level. Best supercar rental service in the region — James Blackwood approved." },
    },

    // ── 3. Dubai Legend — CANCELLED + pending review ───────────────
    {
        name: "Layla Hassan", email: "layla.hassan@aurum-test.com",
        showOnLeaderboard: true,
        completed:  [
            { car: "ghost",    days: 7,  daysAgoEnd: 260, startKm: 3800, endKm: 4200 },
            { car: "ghost",    days: 7,  daysAgoEnd: 220 },
            { car: "bentley",  days: 7,  daysAgoEnd: 185, startKm: 5900, endKm: 6500 },
            { car: "bentley",  days: 7,  daysAgoEnd: 150 },
            { car: "panamera", days: 7,  daysAgoEnd: 115 },
            { car: "panamera", days: 5,  daysAgoEnd: 80  },
            { car: "audirs5",  days: 7,  daysAgoEnd: 50  },
            { car: "bmw3",     days: 5,  daysAgoEnd: 20  },
        ],
        cancelled: [
            { car: "revuelto", days: 4, daysAgoEnd: 35, reason: "Customer cancelled — schedule conflict" },
        ],
        badges: ["first_ride","road_warrior_5","loyal_10","long_haul","road_explorer","elite_driver","vip_member","dubai_legend","first_review"],
        pendingReview: { car: "ghost", rating: 5, comment: "The Ghost is pure serenity. Layla loves AURUM — always my go-to for premium rentals." },
    },

    // ── 4. VIP Member — ACTIVE right now ───────────────────────────
    {
        name: "Sofia Reeves", email: "sofia.reeves@aurum-test.com",
        showOnLeaderboard: true,
        completed:  [
            { car: "bmwm4",   days: 7,  daysAgoEnd: 220, startKm: 7500, endKm: 8240 },
            { car: "bmwm4",   days: 7,  daysAgoEnd: 180 },
            { car: "bmwm4",   days: 5,  daysAgoEnd: 145 },
            { car: "audirs5", days: 5,  daysAgoEnd: 110 },
            { car: "audirs5", days: 5,  daysAgoEnd: 75  },
            { car: "amgc63",  days: 5,  daysAgoEnd: 45  },
            { car: "mercc",   days: 5,  daysAgoEnd: 20  },
        ],
        active:    { car: "bmwm4", totalDays: 7, startedDaysAgo: 2, startKm: 11200 },
        badges: ["first_ride","road_warrior_5","loyal_10","long_haul","road_explorer","elite_driver","vip_member","first_review"],
        approvedReview: { car: "bmwm4", rating: 4, comment: "The BMW M4 is incredible — Sofia recommends AURUM for any sports car enthusiast." },
    },

    // ── 5. VIP Member — PENDING future booking ─────────────────────
    {
        name: "Isabella Ferrari", email: "isabella.ferrari@aurum-test.com",
        showOnLeaderboard: true,
        completed:  [
            { car: "panamera",  days: 7,  daysAgoEnd: 200 },
            { car: "panamera",  days: 5,  daysAgoEnd: 160 },
            { car: "amgc63",    days: 5,  daysAgoEnd: 120 },
            { car: "amgc63",    days: 5,  daysAgoEnd: 85  },
            { car: "porsche911",days: 3,  daysAgoEnd: 55  },
            { car: "porsche911",days: 3,  daysAgoEnd: 30  },
            { car: "audia4",    days: 5,  daysAgoEnd: 10  },
        ],
        pending:   { car: "porsche911", totalDays: 4, startsInDays: 12 },
        badges: ["first_ride","road_warrior_5","loyal_10","long_haul","supercar_club","road_explorer","elite_driver","vip_member","first_review"],
        pendingReview: { car: "panamera", rating: 5, comment: "La Panamera est magnifique — AURUM, simply the finest rental experience in the region." },
    },

    // ── 6. VIP Member — CONFIRMED upcoming ─────────────────────────
    {
        name: "Priya Sharma", email: "priya.sharma@aurum-test.com",
        showOnLeaderboard: true,
        completed:  [
            { car: "amgc63",  days: 5,  daysAgoEnd: 190 },
            { car: "amgc63",  days: 5,  daysAgoEnd: 155 },
            { car: "bmw7",    days: 7,  daysAgoEnd: 120, startKm: 6800, endKm: 7500 },
            { car: "bmw7",    days: 5,  daysAgoEnd: 85  },
            { car: "bmw3",    days: 7,  daysAgoEnd: 50  },
            { car: "bmw3",    days: 5,  daysAgoEnd: 20  },
        ],
        confirmed: { car: "bmw7", totalDays: 5, startsInDays: 10 },
        badges: ["first_ride","road_warrior_5","loyal_10","long_haul","road_explorer","elite_driver","vip_member","first_review"],
        approvedReview: { car: "amgc63", rating: 5, comment: "Priya is thrilled — the AMG C63 is perfect for spirited driving. AURUM never disappoints." },
    },

    // ── 7. Elite Driver — 2 CANCELLED bookings + pending review ────
    {
        name: "Marcus Chen", email: "marcus.chen@aurum-test.com",
        showOnLeaderboard: true,
        completed:  [
            { car: "porsche911", days: 5, daysAgoEnd: 150 },
            { car: "porsche911", days: 5, daysAgoEnd: 100 },
            { car: "bmwm4",      days: 5, daysAgoEnd: 70  },
            { car: "bmwm4",      days: 5, daysAgoEnd: 40  },
            { car: "bmw3",       days: 7, daysAgoEnd: 12  },
        ],
        cancelled: [
            { car: "huracan", days: 3, daysAgoEnd: 85, reason: "Admin cancelled — availability conflict" },
            { car: "f8",      days: 2, daysAgoEnd: 45, reason: "Customer cancelled" },
        ],
        badges: ["first_ride","road_warrior_5","long_haul","supercar_club","road_explorer","elite_driver","first_review"],
        pendingReview: { car: "porsche911", rating: 5, comment: "Marcus here — the Porsche 911 Turbo S is a masterpiece. AURUM made the process effortless." },
    },

    // ── 8. Elite Driver — ACTIVE (BMW X5) ──────────────────────────
    {
        name: "Oscar Müller", email: "oscar.muller@aurum-test.com",
        showOnLeaderboard: true,
        completed:  [
            { car: "audirs5", days: 5, daysAgoEnd: 120 },
            { car: "audirs5", days: 5, daysAgoEnd: 85  },
            { car: "bmw3",    days: 7, daysAgoEnd: 55  },
            { car: "bmw3",    days: 7, daysAgoEnd: 20  },
        ],
        active:    { car: "bmwx5", totalDays: 6, startedDaysAgo: 1, startKm: 19800 },
        badges: ["first_ride","road_warrior_5","long_haul","road_explorer","elite_driver"],
        // No review yet
    },

    // ── 9. Road Explorer — PENDING booking + pending review ─────────
    {
        name: "Kai Nakamura", email: "kai.nakamura@aurum-test.com",
        showOnLeaderboard: true,
        completed:  [
            { car: "amgc63", days: 5, daysAgoEnd: 90 },
            { car: "bmw3",   days: 5, daysAgoEnd: 55 },
            { car: "mercc",  days: 5, daysAgoEnd: 25 },
        ],
        pending:   { car: "bmw3", totalDays: 5, startsInDays: 7 },
        badges: ["first_ride","road_warrior_5","long_haul","road_explorer","first_review"],
        pendingReview: { car: "amgc63", rating: 4, comment: "Kai's first time in an AMG — absolutely loved it. AURUM will definitely see me again!" },
    },

    // ── 10. Road Explorer — 1 CANCELLED ─────────────────────────────
    {
        name: "Emma Laurent", email: "emma.laurent@aurum-test.com",
        showOnLeaderboard: true,
        completed:  [
            { car: "polo", days: 7, daysAgoEnd: 60 },
            { car: "clio", days: 7, daysAgoEnd: 25 },
        ],
        cancelled: [
            { car: "polo", days: 5, daysAgoEnd: 40, reason: "Customer cancelled — changed plans" },
        ],
        badges: ["first_ride","road_explorer"],
        // No review yet
    },

    // ── 11. New Driver — first-ever PENDING booking ──────────────────
    {
        name: "Viktor Horvath", email: "viktor.horvath@aurum-test.com",
        showOnLeaderboard: true,
        completed: [],
        pending:   { car: "bmw3", totalDays: 3, startsInDays: 5 },
        badges: [],
        // No history, no review
    },

    // ── 12. Elite Driver — CONFIRMED + pending review ────────────────
    {
        name: "Yuki Tanaka", email: "yuki.tanaka@aurum-test.com",
        showOnLeaderboard: true,
        completed:  [
            { car: "audirs5",   days: 5, daysAgoEnd: 140 },
            { car: "audirs5",   days: 5, daysAgoEnd: 95  },
            { car: "bmwm4",     days: 5, daysAgoEnd: 60  },
            { car: "bmwm4",     days: 5, daysAgoEnd: 30  },
            { car: "porsche911",days: 3, daysAgoEnd: 10  },
        ],
        confirmed: { car: "f8", totalDays: 3, startsInDays: 9 },
        badges: ["first_ride","road_warrior_5","long_haul","road_explorer","elite_driver","first_review"],
        pendingReview: { car: "audirs5", rating: 5, comment: "Yuki's favourite car so far — the RS5 Sportback is a perfect daily supercar. Absolutely recommended!" },
    },

    // ── 13. Problem customer — 3 CANCELLED (test edge case) ─────────
    {
        name: "Carlos Mendez", email: "carlos.mendez@aurum-test.com",
        showOnLeaderboard: false,
        completed:  [
            { car: "bmwx5", days: 5, daysAgoEnd: 150 },
        ],
        cancelled: [
            { car: "ghost",   days: 3, daysAgoEnd: 120, reason: "Customer cancelled last minute" },
            { car: "bentley", days: 5, daysAgoEnd: 80,  reason: "No-show — auto cancelled by admin" },
            { car: "f8",      days: 2, daysAgoEnd: 30,  reason: "Payment issue — cancelled" },
        ],
        badges: ["first_ride"],
        // Cannot review since completed car was X5 but he didn't review it
    },

    // ── 14. Dubai Legend — lots of luxury, no active (pure history) ─
    {
        name: "Diana Prince", email: "diana.prince@aurum-test.com",
        showOnLeaderboard: true,
        completed:  [
            { car: "ghost",    days: 7,  daysAgoEnd: 300, startKm: 3200, endKm: 3900 },
            { car: "ghost",    days: 7,  daysAgoEnd: 260 },
            { car: "ghost",    days: 7,  daysAgoEnd: 210, startKm: 4800, endKm: 5600 },
            { car: "bentley",  days: 7,  daysAgoEnd: 175 },
            { car: "bentley",  days: 7,  daysAgoEnd: 140, startKm: 7000, endKm: 7750 },
            { car: "panamera", days: 7,  daysAgoEnd: 110 },
            { car: "panamera", days: 5,  daysAgoEnd: 80  },
            { car: "porsche911",days: 4, daysAgoEnd: 55  },
            { car: "porsche911",days: 4, daysAgoEnd: 30  },
            { car: "mercs",    days: 5,  daysAgoEnd: 12  },
        ],
        badges: ["first_ride","road_warrior_5","loyal_10","supercar_club","long_haul","road_explorer","elite_driver","vip_member","dubai_legend","first_review"],
        approvedReview: { car: "ghost", rating: 5, comment: "Diana's standard is impeccable — the Ghost is the only car worthy of that name. AURUM is world-class." },
    },
]

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

function makeTxData(userId, productId, car, status, startDate, endDate) {
    const days     = Math.round((endDate - startDate) / 86400000) + 1
    const total    = car.pricePerDay * days
    const xp       = status === "COMPLETED" ? getXpPerDay(car.category) * days : null
    return {
        userId, productId, status,
        startDate, endDate,
        totalDays:  days,
        pricePerDay: car.pricePerDay,
        totalPrice:  total,
        deposit:     Math.round(total * 0.2),
        xpAwarded:   xp,
        createdAt:   new Date(startDate.getTime() - 3 * 86400000),
        updatedAt:   new Date(startDate),
    }
}

async function recalcProductRatings() {
    const products = await prisma.product.findMany({ select: { id: true } })
    for (const p of products) {
        const agg = await prisma.review.aggregate({
            where: { productId: p.id, approved: true },
            _avg:  { rating: true },
            _count:{ rating: true },
        })
        if (agg._count.rating > 0) {
            await prisma.product.update({
                where: { id: p.id },
                data:  {
                    rating:      Math.round((agg._avg.rating ?? 0) * 10) / 10,
                    reviewCount: agg._count.rating,
                },
            })
        }
    }
}

// ─────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────
async function main() {
    console.log("\n══════════════════════════════════════════════════════")
    console.log("  AURUM Deep Test Seeder — Local DB")
    console.log("══════════════════════════════════════════════════════\n")

    // ── Step 1: Wipe everything ────────────────────────────────────
    process.stdout.write("  Clearing database... ")
    await prisma.kmPurchase.deleteMany({})
    await prisma.xpTransaction.deleteMany({})
    await prisma.userBadge.deleteMany({})
    await prisma.review.deleteMany({})
    await prisma.transaction.deleteMany({})
    await prisma.carImage.deleteMany({})
    await prisma.product.deleteMany({})
    await prisma.badge.deleteMany({})
    await prisma.passwordReset.deleteMany({})
    await prisma.session.deleteMany({})
    await prisma.account.deleteMany({})
    await prisma.user.deleteMany({})
    await prisma.newsletterLog.deleteMany({})
    console.log("✓")

    // ── Step 2: Seed badges ────────────────────────────────────────
    process.stdout.write("  Seeding badges... ")
    const badgeMap = {}
    for (const def of BADGE_DEFS) {
        const b = await prisma.badge.create({ data: { slug: def.slug, name: def.name, description: def.description, icon: def.icon } })
        badgeMap[def.slug] = b.id
    }
    console.log(`✓  (${BADGE_DEFS.length} badges)`)

    // ── Step 3: Seed cars ──────────────────────────────────────────
    process.stdout.write("  Seeding cars... ")
    const carMap = {}
    for (const { slug, ...def } of CAR_DEFS) {
        const car = await prisma.product.create({ data: def })
        carMap[slug] = { id: car.id, pricePerDay: car.pricePerDay, category: car.category, dailyKmLimit: car.dailyKmLimit }
    }
    console.log(`✓  (${CAR_DEFS.length} cars)`)

    // ── Step 4: Create admin ───────────────────────────────────────
    process.stdout.write("  Creating admin... ")
    const hashedPw = await bcrypt.hash("AurumTest2024!", 10)
    const adminPw  = await bcrypt.hash("aurum-admin-2025", 12)
    await prisma.user.create({
        data: { name: "AURUM Admin", email: "admin@aurum.com", password: adminPw, role: "ADMIN" },
    })
    console.log("✓  admin@aurum.com / aurum-admin-2025")

    // ── Step 5: Create test personas ───────────────────────────────
    console.log("\n  Creating test users:\n")
    const results = []

    for (const persona of PERSONAS) {
        process.stdout.write(`    ${persona.name.padEnd(22)}`)

        // Create user (XP = 0 for now, will set after counting bookings)
        const user = await prisma.user.create({
            data: {
                name:     persona.name,
                email:    persona.email,
                password: hashedPw,
                xp:       0,
                level:    1,
                showOnLeaderboard:        persona.showOnLeaderboard,
                receivePromotionalEmails: true,
            },
        })

        let totalXp = 0
        const completedProductIds = new Set()

        // COMPLETED bookings
        for (const b of (persona.completed || [])) {
            const car      = carMap[b.car]
            const endDate  = daysAgo(b.daysAgoEnd)
            const startDate = daysAgo(b.daysAgoEnd + b.days - 1)
            const txData   = makeTxData(user.id, car.id, car, "COMPLETED", startDate, endDate)

            if (b.startKm != null) txData.startMileage = b.startKm
            if (b.endKm   != null) {
                txData.endMileage = b.endKm
                // Check excess km
                if (car.dailyKmLimit) {
                    const allowed  = txData.totalDays * car.dailyKmLimit
                    const used     = b.endKm - b.startKm
                    const excess   = Math.max(0, used - allowed)
                    if (excess > 0) {
                        const feeDef = CAR_DEFS.find(c => c.slug === b.car)
                        txData.excessKmCharge = Math.round(excess * (feeDef?.excessKmFee ?? 0) * 100) / 100
                    }
                }
            }

            await prisma.transaction.create({ data: txData })
            await prisma.xpTransaction.create({ data: { userId: user.id, xpAmount: txData.xpAwarded } })
            totalXp += txData.xpAwarded
            completedProductIds.add(car.id)
        }

        // ACTIVE booking
        if (persona.active) {
            const a        = persona.active
            const car      = carMap[a.car]
            const startDate = daysAgo(a.startedDaysAgo)
            const endDate  = daysFromNow(a.totalDays - a.startedDaysAgo - 1)
            const txData   = makeTxData(user.id, car.id, car, "ACTIVE", startDate, endDate)
            if (a.startKm != null) txData.startMileage = a.startKm
            await prisma.transaction.create({ data: txData })
        }

        // PENDING booking
        if (persona.pending) {
            const p        = persona.pending
            const car      = carMap[p.car]
            const startDate = daysFromNow(p.startsInDays)
            const endDate  = daysFromNow(p.startsInDays + p.totalDays - 1)
            const txData   = makeTxData(user.id, car.id, car, "PENDING", startDate, endDate)
            await prisma.transaction.create({ data: txData })
        }

        // CONFIRMED booking
        if (persona.confirmed) {
            const c        = persona.confirmed
            const car      = carMap[c.car]
            const startDate = daysFromNow(c.startsInDays)
            const endDate  = daysFromNow(c.startsInDays + c.totalDays - 1)
            const txData   = makeTxData(user.id, car.id, car, "CONFIRMED", startDate, endDate)
            await prisma.transaction.create({ data: txData })
        }

        // CANCELLED bookings
        for (const c of (persona.cancelled || [])) {
            const car      = carMap[c.car]
            const endDate  = daysAgo(c.daysAgoEnd)
            const startDate = daysAgo(c.daysAgoEnd + c.days - 1)
            const txData   = makeTxData(user.id, car.id, car, "CANCELLED", startDate, endDate)
            if (c.reason) txData.notes = c.reason
            await prisma.transaction.create({ data: txData })
        }

        // Approved review
        if (persona.approvedReview) {
            const r   = persona.approvedReview
            const car = carMap[r.car]
            if (completedProductIds.has(car.id)) {
                await prisma.review.create({
                    data: { userId: user.id, productId: car.id, rating: r.rating, comment: r.comment, approved: true },
                })
            }
        }

        // Pending review
        if (persona.pendingReview) {
            const r   = persona.pendingReview
            const car = carMap[r.car]
            if (completedProductIds.has(car.id)) {
                await prisma.review.create({
                    data: { userId: user.id, productId: car.id, rating: r.rating, comment: r.comment, approved: false },
                })
            }
        }

        // Award badges
        for (const slug of (persona.badges || [])) {
            const badgeId = badgeMap[slug]
            if (badgeId) {
                await prisma.userBadge.create({ data: { userId: user.id, badgeId } })
            }
        }

        // Update user XP + level
        await prisma.user.update({
            where: { id: user.id },
            data:  { xp: totalXp, level: getLevel(totalXp) },
        })

        const bookingCount =
            (persona.completed?.length  || 0) +
            (persona.active    ? 1 : 0) +
            (persona.pending   ? 1 : 0) +
            (persona.confirmed ? 1 : 0) +
            (persona.cancelled?.length  || 0)

        const statusTag = [
            persona.active    ? "ACTIVE"     : null,
            persona.pending   ? "PENDING"    : null,
            persona.confirmed ? "CONFIRMED"  : null,
            persona.cancelled?.length ? `${persona.cancelled.length}x CANCELLED` : null,
        ].filter(Boolean).join(", ") || "history only"

        const reviewTag = persona.approvedReview ? "✓ review" : persona.pendingReview ? "⏳ review" : "—"
        console.log(`Lv.${String(getLevel(totalXp)).padStart(2)}  ${String(totalXp).padStart(5)} XP  ${String(bookingCount).padStart(2)} bookings  ${statusTag.padEnd(28)} ${reviewTag}`)

        results.push({ name: persona.name, xp: totalXp, level: getLevel(totalXp), bookings: bookingCount })
    }

    // ── Step 6: Recalculate product ratings ────────────────────────
    process.stdout.write("\n  Recalculating product ratings... ")
    await recalcProductRatings()
    console.log("✓")

    // ── Step 7: Summary ────────────────────────────────────────────
    console.log("\n══════════════════════════════════════════════════════")
    console.log("  LEADERBOARD PREVIEW")
    console.log("══════════════════════════════════════════════════════")
    results
        .sort((a, b) => b.xp - a.xp)
        .forEach((r, i) => {
            const medal = ["🥇","🥈","🥉"][i] || `#${i + 1} `
            console.log(`  ${medal}  ${r.name.padEnd(22)} ${String(r.xp).padStart(5)} XP  Lv.${r.level}`)
        })
    console.log("══════════════════════════════════════════════════════")

    const pending   = PERSONAS.filter(p => p.pending).length
    const confirmed = PERSONAS.filter(p => p.confirmed).length
    const active    = PERSONAS.filter(p => p.active).length
    const cancelled = PERSONAS.reduce((s, p) => s + (p.cancelled?.length || 0), 0)
    const appReviews = PERSONAS.filter(p => p.approvedReview).length
    const penReviews = PERSONAS.filter(p => p.pendingReview).length

    console.log(`
  Coverage:
    ${active}  ACTIVE bookings (rental in progress)
    ${pending}  PENDING bookings (awaiting confirmation)
    ${confirmed}  CONFIRMED bookings (upcoming)
    ${cancelled}  CANCELLED bookings (various reasons)
    ${appReviews}  Approved reviews (visible on car pages)
    ${penReviews}  Pending reviews (visible in /admin/reviews)

  Admin login: admin@aurum.com  /  aurum-admin-2025
  All test user passwords: AurumTest2024!

  Test users:`)
    PERSONAS.forEach(p => console.log(`    ${p.email.padEnd(42)} ${p.showOnLeaderboard ? "🏆 leaderboard" : "   hidden"}`))
    console.log("")
}

main()
    .catch(e => { console.error("\n❌", e.message, "\n", e); process.exit(1) })
    .finally(() => prisma.$disconnect())
