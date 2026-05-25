import { prisma } from "@/lib/prisma"
import BookingForm from "@/components/BookingForm"
import CarGallery from "@/components/CarGallery"
import ReviewsList, { type ReviewRow } from "@/components/ReviewsList"
import Link from "next/link"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { getXpPerDay } from "@/lib/tiers"

// ── Auto-generate highlights from car data ─────────────────────────────────
function getHighlights(car: {
    horsepower?: number | null
    zeroToHundred?: number | null
    topSpeed?: number | null
    transmission: string
    seats: number
    mileage: number
    drivetrain?: string | null
    category: string
    year: number
}): { icon: string; text: string }[] {
    const h: { icon: string; text: string }[] = []

    if (car.horsepower && car.horsepower >= 500)
        h.push({ icon: "🔥", text: `${car.horsepower} HP high-performance powerplant` })
    else if (car.horsepower && car.horsepower >= 300)
        h.push({ icon: "⚡", text: `${car.horsepower} HP sports-tuned engine` })

    if (car.zeroToHundred && car.zeroToHundred <= 3)
        h.push({ icon: "🏎", text: `0–100 km/h in just ${car.zeroToHundred}s` })
    else if (car.zeroToHundred && car.zeroToHundred <= 5)
        h.push({ icon: "⚡", text: `0–100 km/h in ${car.zeroToHundred}s` })

    if (car.topSpeed && car.topSpeed >= 300)
        h.push({ icon: "💨", text: `${car.topSpeed} km/h top speed` })
    else if (car.topSpeed && car.topSpeed >= 250)
        h.push({ icon: "💨", text: `${car.topSpeed} km/h maximum speed` })

    if (car.drivetrain === "AWD" || car.drivetrain === "4WD")
        h.push({ icon: "🔧", text: `${car.drivetrain} — superior traction in all conditions` })
    else if (car.drivetrain === "RWD")
        h.push({ icon: "🔧", text: "Rear-wheel drive — pure, engaging driving experience" })

    if (car.seats === 2)
        h.push({ icon: "🏆", text: "Exclusive 2-seat sports configuration" })

    if (car.mileage < 5000)
        h.push({ icon: "✨", text: `Near-new condition — only ${car.mileage.toLocaleString()} km` })

    if (car.transmission?.toLowerCase().includes("auto"))
        h.push({ icon: "⚙", text: "Smooth automatic transmission" })

    const cat = car.category.toLowerCase()
    if (cat.includes("luxury"))
        h.push({ icon: "💎", text: "Luxury interior with premium finishes" })
    if (cat.includes("super") || cat.includes("hyper"))
        h.push({ icon: "👑", text: "Supercar performance and exclusivity" })

    if (h.length < 3) {
        h.push({ icon: "📅", text: `${car.year} model year` })
        h.push({ icon: "🛡", text: "Fully insured and regularly serviced" })
    }

    return h.slice(0, 5)
}

export default async function CarPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const session = await getServerSession(authOptions)
    const userId  = session?.user?.id ?? null

    // Fetch fresh XP from DB to avoid stale session discount in BookingForm
    const dbUser = userId
        ? await prisma.user.findUnique({ where: { id: userId }, select: { xp: true } })
        : null

    const [car, reviews] = await Promise.all([
        prisma.product.findUnique({
            where: { id },
            include: { images: true },
        }),
        prisma.review.findMany({
            where:   { productId: id, approved: true },
            include: { user: { select: { id: true, name: true, image: true } } },
            orderBy: { createdAt: "desc" },
        }),
    ])

    // Eligibility: logged-in user has a COMPLETED booking + hasn't reviewed yet
    let canReview = false
    if (userId) {
        const [completedBooking, existingReview] = await Promise.all([
            prisma.transaction.findFirst({
                where: { userId, productId: id, status: "COMPLETED" },
                select: { id: true },
            }),
            prisma.review.findUnique({
                where: { userId_productId: { userId, productId: id } },
                select: { id: true, approved: true },
            }),
        ])
        canReview = !!completedBooking && !existingReview
    }

    const reviewRows: ReviewRow[] = reviews.map((r: {
        id: string; rating: number; comment: string | null; createdAt: Date
        user: { id: string; name: string | null; image: string | null }
    }) => ({
        id:        r.id,
        rating:    r.rating,
        comment:   r.comment,
        createdAt: r.createdAt.toISOString(),
        user:      { id: r.user.id, name: r.user.name, image: r.user.image },
    }))

    if (!car || !car.active) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <p className="text-muted text-5xl">◎</p>
                <h1 className="font-heading text-3xl text-white-soft">Vehicle not found</h1>
                <Link href="/cars" className="text-gold text-sm font-stats hover:underline">
                    ← Back to all vehicles
                </Link>
            </div>
        )
    }

    const xpPerDay   = getXpPerDay(car.category)
    const highlights = getHighlights(car)

    const specs: { icon: string; label: string; value: string }[] = [
        car.horsepower    ? { icon: "⚡", label: "Power",       value: `${car.horsepower} HP` }       : null,
        car.zeroToHundred ? { icon: "⏱", label: "0–100 km/h", value: `${car.zeroToHundred}s` }       : null,
        car.topSpeed      ? { icon: "🏎", label: "Top Speed",  value: `${car.topSpeed} km/h` }        : null,
        { icon: "⛽", label: "Fuel",        value: car.fuelType },
        { icon: "⚙", label: "Gearbox",    value: car.transmission },
        car.drivetrain    ? { icon: "🔧", label: "Drivetrain", value: car.drivetrain }                : null,
        { icon: "👥", label: "Seats",      value: `${car.seats} seats` },
        { icon: "📅", label: "Year",       value: car.year.toString() },
        { icon: "🛣", label: "Mileage",    value: `${car.mileage.toLocaleString()} km` },
        { icon: "📍", label: "Location",   value: car.location },
        car.dailyKmLimit != null
            ? { icon: "📏", label: "Daily km limit", value: `${car.dailyKmLimit} km/day` }
            : { icon: "♾", label: "Mileage policy", value: "Unlimited km" },
    ].filter(Boolean) as { icon: string; label: string; value: string }[]

    return (
        <div className="bg-dark min-h-screen">

            {/* ── Gallery — full width, no side padding ──────────────── */}
            <CarGallery
                images={car.images.map((i: { id: string; url: string }) => ({ id: i.id, url: i.url }))}
                carName={car.name}
            />

            {/* ── Content ────────────────────────────────────────────── */}
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex flex-col lg:flex-row gap-14">

                    {/* ────────────────────────────────────────────────────
                        LEFT COLUMN: info
                    ──────────────────────────────────────────────────── */}
                    <div className="flex-1 min-w-0">

                        {/* ── Back link ── */}
                        <Link
                            href="/cars"
                            className="inline-flex items-center gap-1.5 text-muted hover:text-white-soft text-xs font-stats transition-colors mb-8"
                        >
                            ← All vehicles
                        </Link>

                        {/* ── Header ── */}
                        <div className="mb-10">
                            <p className="text-gold text-[11px] font-stats uppercase tracking-[0.25em] mb-3">
                                {car.brand} · {car.category}
                            </p>
                            <h1 className="font-heading text-5xl md:text-6xl font-light text-white-soft leading-tight mb-4">
                                {car.name}
                            </h1>

                            <div className="flex flex-wrap items-center gap-3 text-sm font-stats">
                                {(car.rating ?? 0) > 0 && (
                                    <span className="flex items-center gap-1">
                                        <span className="text-gold">★</span>
                                        <span className="text-white-soft font-semibold">{car.rating}</span>
                                        <span className="text-muted">({car.reviewCount} reviews)</span>
                                    </span>
                                )}
                                <span className="text-surface-3">·</span>
                                <span className="text-muted">📍 {car.location}</span>
                                <span className="text-surface-3">·</span>
                                <span className="flex items-center gap-1 text-gold/80">
                                    <span className="text-[9px]">◆</span>
                                    +{xpPerDay} XP/day
                                </span>
                            </div>
                        </div>

                        {/* ── Spec grid ── */}
                        <div className="mb-10">
                            <h2 className="font-heading text-2xl font-semibold text-white-soft mb-5">
                                Specifications
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {specs.map(s => (
                                    <div
                                        key={s.label}
                                        className="bg-surface border border-surface-3 rounded-xl px-4 py-3 flex items-start gap-3"
                                    >
                                        <span className="text-lg leading-none mt-0.5 shrink-0">{s.icon}</span>
                                        <div className="min-w-0">
                                            <p className="text-muted-2 text-[10px] font-stats uppercase tracking-wider mb-0.5">
                                                {s.label}
                                            </p>
                                            <p className="text-white-soft text-sm font-stats font-semibold truncate">
                                                {s.value}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="border-t border-surface-3 my-10" />

                        {/* ── Description ── */}
                        <div className="mb-10">
                            <h2 className="font-heading text-2xl font-semibold text-white-soft mb-4">
                                About this vehicle
                            </h2>
                            <p className="font-body text-muted leading-relaxed text-[15px]">
                                {car.description}
                            </p>
                        </div>

                        <div className="border-t border-surface-3 my-10" />

                        {/* ── Highlights ── */}
                        <div className="mb-10">
                            <h2 className="font-heading text-2xl font-semibold text-white-soft mb-5">
                                Why this vehicle
                            </h2>
                            <div className="space-y-3">
                                {highlights.map((h, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-4 bg-surface border border-surface-3 rounded-xl px-5 py-4 hover:border-gold/20 transition-colors duration-200"
                                    >
                                        <span className="text-2xl shrink-0">{h.icon}</span>
                                        <span className="font-body text-white-soft text-sm">
                                            {h.text}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ── Rental rules ── */}
                        {(car.minimumAge || car.minimumRentalDays || car.dailyKmLimit != null) && (
                            <>
                                <div className="border-t border-surface-3 my-10" />
                                <div>
                                    <h2 className="font-heading text-2xl font-semibold text-white-soft mb-5">
                                        Rental rules
                                    </h2>
                                    <div className="grid grid-cols-2 gap-3">
                                        {car.minimumAge && (
                                            <div className="bg-surface border border-surface-3 rounded-xl px-4 py-3">
                                                <p className="text-muted-2 text-[10px] font-stats uppercase tracking-wider mb-1">Minimum Age</p>
                                                <p className="text-white-soft font-stats font-semibold">{car.minimumAge} years</p>
                                            </div>
                                        )}
                                        {car.minimumRentalDays && (
                                            <div className="bg-surface border border-surface-3 rounded-xl px-4 py-3">
                                                <p className="text-muted-2 text-[10px] font-stats uppercase tracking-wider mb-1">Minimum Rental</p>
                                                <p className="text-white-soft font-stats font-semibold">{car.minimumRentalDays} days</p>
                                            </div>
                                        )}
                                        <div className="bg-surface border border-surface-3 rounded-xl px-4 py-3">
                                            <p className="text-muted-2 text-[10px] font-stats uppercase tracking-wider mb-1">Mileage</p>
                                            {car.dailyKmLimit != null ? (
                                                <div>
                                                    <p className="text-white-soft font-stats font-semibold">{car.dailyKmLimit} km/day</p>
                                                    {car.excessKmFee != null && (
                                                        <p className="text-muted text-[11px] font-stats mt-0.5">€{car.excessKmFee}/km over limit</p>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-white-soft font-stats font-semibold">Unlimited</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ── Reviews ── */}
                        <div className="border-t border-surface-3 my-10" />
                        <div className="mb-10">
                            <h2 className="font-heading text-2xl font-semibold text-white-soft mb-6">
                                Reviews
                                {reviewRows.length > 0 && (
                                    <span className="ml-2 text-sm font-stats text-muted font-normal">
                                        ({reviewRows.length})
                                    </span>
                                )}
                            </h2>
                            <ReviewsList
                                initialReviews={reviewRows}
                                carId={car.id}
                                carName={car.name}
                                canReview={canReview}
                            />
                        </div>

                    </div>

                    {/* ────────────────────────────────────────────────────
                        RIGHT COLUMN: sticky booking widget
                    ──────────────────────────────────────────────────── */}
                    <div className="lg:w-100 shrink-0">
                        <div className="sticky top-24">
                            <BookingForm
                                carId={car.id}
                                pricePerDay={car.pricePerDay}
                                category={car.category}
                                deposit={car.deposit}
                                minimumRentalDays={car.minimumRentalDays}
                                dailyKmLimit={car.dailyKmLimit}
                                excessKmFee={car.excessKmFee}
                                serverUserXp={dbUser?.xp ?? 0}
                            />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
