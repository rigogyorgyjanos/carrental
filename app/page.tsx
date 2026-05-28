import Link from "next/link"
import Image from "next/image"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import FeaturedCarsGrid from "@/components/FeaturedCarsGrid"
import HeroSearch from "@/components/HeroSearch"
import { Car } from "@/types/types"

// ─── Hero image (replace with your own in /public/hero-car.jpg) ───────────
const HERO_IMAGE = "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=1920&q=80"

// ─── Luxury brands scrolling strip ────────────────────────────────────────
const BRANDS = [
    "ROLLS-ROYCE", "LAMBORGHINI", "FERRARI", "BENTLEY", "PORSCHE",
    "McLAREN", "ASTON MARTIN", "BUGATTI", "MASERATI", "LEXUS",
    "MERCEDES-BENZ", "BMW", "AUDI", "JAGUAR", "LOTUS",
]

// ─── Loyalty tiers ────────────────────────────────────────────────────────
const TIERS = [
    {
        name: "New Driver",
        xp: "0+",
        icon: "🏁",
        color: "#5A5A6A",
        border: "rgba(90,90,106,0.3)",
        benefits: ["Full fleet access", "Standard support"],
    },
    {
        name: "Road Explorer",
        xp: "200+",
        icon: "🗺️",
        color: "#A8A9AD",
        border: "rgba(168,169,173,0.35)",
        benefits: ["5% rental discount", "Early availability alerts"],
    },
    {
        name: "Elite Driver",
        xp: "500+",
        icon: "⭐",
        color: "#C9A84C",
        border: "rgba(201,168,76,0.4)",
        benefits: ["10% rental discount", "Free category upgrade"],
    },
    {
        name: "VIP Member",
        xp: "1,000+",
        icon: "💎",
        color: "#3498DB",
        border: "rgba(52,152,219,0.4)",
        benefits: ["15% rental discount", "1 experience drive / year"],
    },
    {
        name: "Dubai Legend",
        xp: "2,000+",
        icon: "👑",
        color: "#9B59B6",
        border: "rgba(155,89,182,0.4)",
        benefits: ["20% rental discount", "Personal concierge"],
    },
]

// ─── How it works steps ────────────────────────────────────────────────────
const STEPS = [
    {
        number: "01",
        icon: "🔍",
        title: "Browse & Choose",
        desc: "Explore our curated fleet of luxury and performance vehicles, filtered by location, date and category.",
    },
    {
        number: "02",
        icon: "📅",
        title: "Book Instantly",
        desc: "Select your dates, review the pricing, and confirm your reservation in under 60 seconds.",
    },
    {
        number: "03",
        icon: "⭐",
        title: "Drive & Earn",
        desc: "Complete your rental to earn XP. Level up, unlock badges, and claim exclusive member benefits.",
    },
]

// ─── Trust stats ────────────────────────────────────────────────────────────
const STATS = [
    { value: "500+", label: "Happy Drivers" },
    { value: "120+", label: "Premium Vehicles" },
    { value: "4.9★", label: "Average Rating" },
]

export default async function LandingPage() {
    const session = await getServerSession(authOptions)

    const featuredCarsRaw = await prisma.product.findMany({
        where: { featured: true, active: true, approvalStatus: "APPROVED" },
        take: 3,
        include: { images: true },
    })

    const featuredCars: Car[] = featuredCarsRaw.map(c => ({
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
        deposit: c.deposit ?? undefined,
        rating: c.rating ?? 0,
        reviewCount: c.reviewCount ?? 0,
        images: c.images.map(img => ({ id: img.id, productId: img.productId, url: img.url })),
    }))

    return (
        <div className="bg-dark text-white-soft overflow-x-hidden">


            {/* ══════════════════════════════════════
                HERO
            ══════════════════════════════════════ */}
            <section className="-mt-18 relative min-h-screen flex flex-col items-center justify-center text-white overflow-hidden">

                {/* Background image */}
                <Image
                    src={HERO_IMAGE}
                    alt=""
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover object-center"
                />

                {/* Dark base overlay */}
                <div className="absolute inset-0 bg-dark/65" />

                {/* Gradient: bottom darkens toward page */}
                <div className="absolute inset-0 bg-linear-to-t from-dark via-dark/30 to-transparent" />

                {/* Gradient: left column for readability */}
                <div className="absolute inset-0 bg-linear-to-r from-dark/70 via-dark/20 to-transparent" />

                {/* Subtle gold glow behind headline */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-gold/5 blur-[120px] rounded-full pointer-events-none" />

                {/* Content */}
                <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-32 pb-24 flex flex-col items-center text-center">

                    {/* Eyebrow */}
                    <p className="text-gold font-stats text-xs tracking-[0.3em] uppercase mb-6 animate-fade-in-up">
                        Premium Car Rental
                    </p>

                    {/* Headline */}
                    <h1 className="font-heading font-light text-6xl sm:text-7xl md:text-[5.5rem] lg:text-[7rem] leading-[0.92] tracking-tight mb-6 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                        Drive the
                        <br />
                        <span className="text-gradient-gold italic font-normal">
                            Extraordinary
                        </span>
                    </h1>

                    {/* Subtext */}
                    <p className="text-white/65 font-body text-base md:text-lg max-w-xl mb-10 leading-relaxed animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                        Discover our exclusive fleet of luxury and performance vehicles.
                        Every rental earns you XP towards elite rewards.
                    </p>

                    {/* Search bar */}
                    <div className="relative z-10 w-full flex justify-center animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
                        <HeroSearch />
                    </div>

                    {/* Trust stats */}
                    <div className="mt-16 flex flex-col sm:flex-row items-center gap-8 sm:gap-16 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
                        {STATS.map(s => (
                            <div key={s.label} className="text-center">
                                <p className="font-stats text-3xl font-bold text-white-soft">{s.value}</p>
                                <p className="font-body text-sm text-white/50 mt-1">{s.label}</p>
                            </div>
                        ))}
                    </div>

                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
                    <span className="font-stats text-[10px] tracking-[0.2em] uppercase text-white">Scroll</span>
                    <div className="w-px h-8 bg-white/50" />
                </div>

            </section>


            {/* ══════════════════════════════════════
                BRANDS MARQUEE
            ══════════════════════════════════════ */}
            <div className="border-y border-surface-3 bg-surface py-4 overflow-hidden">
                <div className="flex animate-marquee whitespace-nowrap">
                    {[...BRANDS, ...BRANDS].map((brand, i) => (
                        <span
                            key={i}
                            className="mx-8 font-stats text-[11px] tracking-[0.25em] text-muted-2 uppercase"
                        >
                            {brand}
                            <span className="ml-8 text-surface-3">◆</span>
                        </span>
                    ))}
                </div>
            </div>


            {/* ══════════════════════════════════════
                FEATURED VEHICLES
            ══════════════════════════════════════ */}
            <section className="py-28 max-w-7xl mx-auto px-6">

                <div className="text-center mb-16">
                    <p className="text-gold font-stats text-xs tracking-[0.3em] uppercase mb-4">
                        Handpicked for you
                    </p>
                    <h2 className="font-heading text-5xl md:text-6xl font-light text-white-soft mb-4">
                        Featured Vehicles
                    </h2>
                    <p className="font-body text-muted max-w-lg mx-auto">
                        Curated selection of our most sought-after luxury and performance cars.
                    </p>
                </div>

                <FeaturedCarsGrid initialCars={featuredCars} />

                <div className="text-center mt-12">
                    <Link
                        href="/cars"
                        className="inline-flex items-center gap-2 border border-surface-3 hover:border-gold/50 text-muted hover:text-white-soft font-body text-sm px-8 py-3.5 rounded-full transition-all duration-300 hover:bg-surface"
                    >
                        Browse All Vehicles
                        <span className="text-gold">→</span>
                    </Link>
                </div>

            </section>


            {/* ══════════════════════════════════════
                HOW IT WORKS
            ══════════════════════════════════════ */}
            <section className="py-28 bg-surface border-y border-surface-3">
                <div className="max-w-7xl mx-auto px-6">

                    <div className="text-center mb-20">
                        <p className="text-gold font-stats text-xs tracking-[0.3em] uppercase mb-4">
                            Simple Process
                        </p>
                        <h2 className="font-heading text-5xl md:text-6xl font-light text-white-soft">
                            How It Works
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 relative">

                        {/* Connecting line (desktop) */}
                        <div className="hidden md:block absolute top-12 left-[calc(33.333%+1rem)] right-[calc(33.333%+1rem)] h-px bg-surface-3" aria-hidden />

                        {STEPS.map((step, i) => (
                            <div key={i} className="relative flex flex-col items-center text-center group">

                                {/* Number + icon */}
                                <div className="relative mb-8">
                                    <div className="w-24 h-24 rounded-full bg-surface-2 border border-surface-3 group-hover:border-gold/30 flex items-center justify-center text-3xl transition-all duration-300 group-hover:bg-surface-3">
                                        {step.icon}
                                    </div>
                                    <span className="absolute -top-2 -right-2 font-stats text-[10px] text-gold/60 font-bold">
                                        {step.number}
                                    </span>
                                </div>

                                <h3 className="font-heading text-2xl font-semibold text-white-soft mb-3 group-hover:text-gold transition-colors duration-300">
                                    {step.title}
                                </h3>

                                <p className="font-body text-muted text-sm leading-relaxed max-w-xs">
                                    {step.desc}
                                </p>

                            </div>
                        ))}
                    </div>

                </div>
            </section>


            {/* ══════════════════════════════════════
                LOYALTY TIERS
            ══════════════════════════════════════ */}
            <section className="py-28 max-w-7xl mx-auto px-6">

                <div className="text-center mb-16">
                    <p className="text-gold font-stats text-xs tracking-[0.3em] uppercase mb-4">
                        Gamified Rewards
                    </p>
                    <h2 className="font-heading text-5xl md:text-6xl font-light text-white-soft mb-4">
                        The AURUM Programme
                    </h2>
                    <p className="font-body text-muted max-w-xl mx-auto">
                        Every rental earns XP. Level up your tier and unlock exclusive
                        benefits — from discounts to personal concierge service.
                    </p>
                </div>

                {/* Tier cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {TIERS.map((tier, i) => (
                        <div
                            key={i}
                            className="relative bg-surface rounded-2xl p-6 border transition-all duration-300 hover:-translate-y-1 group"
                            style={{ borderColor: tier.border }}
                        >
                            {/* Subtle glow on hover */}
                            <div
                                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                                style={{ boxShadow: `0 0 24px ${tier.color}18` }}
                            />

                            {/* Icon */}
                            <div className="text-3xl mb-4">{tier.icon}</div>

                            {/* XP threshold */}
                            <p
                                className="font-stats text-[11px] font-bold tracking-wider uppercase mb-1"
                                style={{ color: tier.color }}
                            >
                                {tier.xp} XP
                            </p>

                            {/* Tier name */}
                            <h3
                                className="font-heading text-lg font-semibold mb-4 leading-tight"
                                style={{ color: tier.color }}
                            >
                                {tier.name}
                            </h3>

                            {/* Benefits */}
                            <ul className="space-y-2">
                                {tier.benefits.map((b, j) => (
                                    <li key={j} className="flex items-start gap-2 text-muted text-xs font-body">
                                        <span className="text-[8px] mt-1 shrink-0" style={{ color: tier.color }}>◆</span>
                                        {b}
                                    </li>
                                ))}
                            </ul>

                        </div>
                    ))}
                </div>

                {/* XP progress teaser */}
                <div className="mt-12 glass rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <p className="font-heading text-2xl font-semibold text-white-soft mb-1">
                            Start earning XP today
                        </p>
                        <p className="font-body text-muted text-sm">
                            Your first rental earns a <span className="text-gold font-semibold">+100 XP bonus</span> — instantly unlocking Road Explorer status.
                        </p>
                    </div>
                    <Link
                        href={session ? "/cars" : "/register"}
                        className="shrink-0 bg-gold hover:bg-gold-light text-dark font-body font-semibold text-sm px-8 py-3.5 rounded-full transition-colors duration-200 whitespace-nowrap"
                    >
                        {session ? "Browse Cars" : "Create Account"}
                    </Link>
                </div>

            </section>


            {/* ══════════════════════════════════════
                FINAL CTA
            ══════════════════════════════════════ */}
            <section className="relative py-32 overflow-hidden bg-surface border-t border-surface-3">

                {/* Background glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-100 bg-gold/5 blur-[100px] rounded-full pointer-events-none" />

                <div className="relative max-w-4xl mx-auto px-6 text-center">

                    <p className="text-gold font-stats text-xs tracking-[0.3em] uppercase mb-6">
                        Your Next Ride Awaits
                    </p>

                    <h2 className="font-heading text-5xl md:text-7xl font-light text-white-soft mb-6 leading-tight">
                        Ready to Drive
                        <br />
                        <span className="text-gradient-gold italic">Something Rare?</span>
                    </h2>

                    <p className="font-body text-muted text-base md:text-lg mb-12 max-w-xl mx-auto">
                        Browse our fleet of extraordinary vehicles and start your journey towards
                        elite driver status.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/cars"
                            className="bg-gold hover:bg-gold-light text-dark font-body font-semibold px-10 py-4 rounded-full transition-colors duration-200 text-sm"
                        >
                            Browse All Cars
                        </Link>
                        {!session && (
                            <Link
                                href="/register"
                                className="border border-surface-3 hover:border-gold/40 text-muted hover:text-white-soft font-body text-sm px-10 py-4 rounded-full transition-all duration-300"
                            >
                                Create Free Account
                            </Link>
                        )}
                    </div>

                </div>
            </section>


            {/* ══════════════════════════════════════
                FOOTER
            ══════════════════════════════════════ */}
            <footer className="bg-dark border-t border-surface-3">

                <div className="max-w-7xl mx-auto px-6 py-16">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">

                        {/* Brand */}
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-gold text-xs" aria-hidden>◆</span>
                                <span className="font-heading text-xl font-semibold tracking-[0.22em] text-white-soft uppercase">
                                    AURUM
                                </span>
                            </div>
                            <p className="font-body text-muted text-sm leading-relaxed max-w-xs">
                                Premium car rental with a gamified loyalty programme.
                                Drive extraordinary vehicles and earn exclusive rewards.
                            </p>
                        </div>

                        {/* Navigation */}
                        <div>
                            <p className="font-stats text-[11px] tracking-widest text-muted-2 uppercase mb-5">
                                Explore
                            </p>
                            <ul className="space-y-3">
                                {[
                                    { label: "Home",         href: "/" },
                                    { label: "Browse Cars",  href: "/cars" },
                                ].map(l => (
                                    <li key={l.href}>
                                        <Link href={l.href} className="font-body text-sm text-muted hover:text-white-soft transition-colors duration-200">
                                            {l.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Account */}
                        <div>
                            <p className="font-stats text-[11px] tracking-widest text-muted-2 uppercase mb-5">
                                Account
                            </p>
                            <ul className="space-y-3">
                                {[
                                    { label: "Sign In",   href: "/login" },
                                    { label: "Register",  href: "/register" },
                                    { label: "Profile",   href: "/profile" },
                                ].map(l => (
                                    <li key={l.href}>
                                        <Link href={l.href} className="font-body text-sm text-muted hover:text-white-soft transition-colors duration-200">
                                            {l.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                    </div>

                    {/* Bottom row */}
                    <div className="border-t border-surface-3 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="font-stats text-[11px] text-muted-2 tracking-wide">
                            © {new Date().getFullYear()} AURUM. All rights reserved.
                        </p>
                        <div className="flex gap-6">
                            <Link href="/privacy" className="font-body text-xs text-muted-2 hover:text-muted transition-colors">
                                Privacy Policy
                            </Link>
                            <Link href="/terms" className="font-body text-xs text-muted-2 hover:text-muted transition-colors">
                                Terms of Service
                            </Link>
                        </div>
                    </div>

                </div>
            </footer>


        </div>
    )
}
