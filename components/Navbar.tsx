"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { useState, useEffect } from "react"
import { getTier } from "@/lib/tiers"

const NAV_LINKS = [
    { label: "Home",        href: "/" },
    { label: "Cars",        href: "/cars" },
    { label: "Leaderboard", href: "/leaderboard" },
]

export default function Navbar() {
    const { data: session } = useSession()
    const [open, setOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24)
        window.addEventListener("scroll", onScroll, { passive: true })
        return () => window.removeEventListener("scroll", onScroll)
    }, [])

    // Close mobile menu on resize to desktop
    useEffect(() => {
        const onResize = () => { if (window.innerWidth >= 768) setOpen(false) }
        window.addEventListener("resize", onResize)
        return () => window.removeEventListener("resize", onResize)
    }, [])

    // Lock body scroll when menu is open
    useEffect(() => {
        document.body.style.overflow = open ? "hidden" : ""
        return () => { document.body.style.overflow = "" }
    }, [open])

    const xp    = session?.user?.xp    ?? 0
    const level = session?.user?.level ?? 1
    const tier  = getTier(xp)

    return (
        <>
            <nav
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
                    scrolled
                        ? "bg-dark/90 backdrop-blur-2xl border-b border-white/8 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
                        : "bg-transparent border-b border-transparent"
                }`}
            >
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-center justify-between h-18">

                        {/* ── Logo ── */}
                        <Link
                            href="/"
                            className="flex items-center gap-2 group shrink-0"
                            onClick={() => setOpen(false)}
                        >
                            <span
                                className="text-gold text-xs leading-none transition-transform duration-300 group-hover:rotate-12"
                                aria-hidden
                            >
                                ◆
                            </span>
                            <span className="font-heading text-[1.4rem] font-semibold tracking-[0.22em] text-white-soft uppercase group-hover:text-gold transition-colors duration-300">
                                AURUM
                            </span>
                        </Link>

                        {/* ── Desktop Nav Links ── */}
                        <div className="hidden md:flex items-center gap-8">
                            {NAV_LINKS.map(({ label, href }) => (
                                <Link
                                    key={href}
                                    href={href}
                                    className="relative text-sm font-body tracking-wide text-muted hover:text-white-soft transition-colors duration-200 group py-1"
                                >
                                    {label}
                                    <span className="absolute bottom-0 left-0 h-px w-0 bg-gold transition-all duration-300 group-hover:w-full" />
                                </Link>
                            ))}
                        </div>

                        {/* ── Desktop Right Side ── */}
                        <div className="hidden md:flex items-center gap-4">
                            {!session ? (
                                <>
                                    <Link
                                        href="/login"
                                        className="text-sm font-body text-muted hover:text-white-soft transition-colors duration-200"
                                    >
                                        Sign In
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="text-sm font-body font-semibold bg-gold hover:bg-gold-light text-dark px-5 py-2 rounded-full transition-colors duration-200"
                                    >
                                        Get Started
                                    </Link>
                                </>
                            ) : (
                                <>
                                    {/* XP / Tier Chip */}
                                    <div
                                        className="flex items-center gap-2.5 bg-surface rounded-full px-4 py-1.5 border transition-all duration-300"
                                        style={{ borderColor: `${tier.color}35` }}
                                        title={tier.name}
                                    >
                                        <span
                                            className="text-[11px] font-stats font-bold tracking-wide"
                                            style={{ color: tier.color }}
                                        >
                                            Lv.{level}
                                        </span>
                                        <div className="w-px h-3 bg-surface-3" />
                                        <span className="text-[11px] font-stats text-muted">
                                            {xp.toLocaleString()} XP
                                        </span>
                                    </div>

                                    <Link
                                        href="/profile"
                                        className="text-sm font-body text-muted hover:text-white-soft transition-colors duration-200"
                                    >
                                        Profile
                                    </Link>

                                    <button
                                        onClick={() => signOut({ callbackUrl: "/" })}
                                        className="text-sm font-body text-muted-2 hover:text-danger transition-colors duration-200"
                                    >
                                        Sign out
                                    </button>
                                </>
                            )}
                        </div>

                        {/* ── Mobile Hamburger ── */}
                        <button
                            className="md:hidden flex flex-col justify-center items-center w-9 h-9 gap-1.25 rounded-lg hover:bg-surface transition-colors"
                            onClick={() => setOpen(prev => !prev)}
                            aria-label={open ? "Close menu" : "Open menu"}
                            aria-expanded={open}
                            aria-controls="mobile-nav"
                        >
                            <span
                                className={`block h-px w-5 bg-white-soft transition-all duration-300 ${
                                    open ? "rotate-45 translate-y-1.75" : ""
                                }`}
                            />
                            <span
                                className={`block h-px w-5 bg-white-soft transition-all duration-300 ${
                                    open ? "opacity-0" : ""
                                }`}
                            />
                            <span
                                className={`block h-px w-5 bg-white-soft transition-all duration-300 ${
                                    open ? "-rotate-45 -translate-y-1.75" : ""
                                }`}
                            />
                        </button>

                    </div>
                </div>

            </nav>

            {/* ── Full-screen mobile menu overlay ── */}
            <div
                id="mobile-nav"
                aria-hidden={!open}
                className={`fixed inset-0 z-40 md:hidden flex flex-col bg-dark transition-all duration-300 ease-out ${
                    open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                }`}
            >
                {/* Spacer — height of the fixed navbar */}
                <div className="h-18 shrink-0 border-b border-white/8" />

                {/* Nav links — vertically centered */}
                <div className="flex-1 flex flex-col justify-center px-8">
                    {NAV_LINKS.map(({ label, href }, i) => (
                        <Link
                            key={href}
                            href={href}
                            onClick={() => setOpen(false)}
                            className="group flex items-center justify-between py-6 border-b border-surface-3/60 transition-colors duration-200 hover:border-gold/30"
                            style={{ transitionDelay: open ? `${i * 40}ms` : "0ms" }}
                        >
                            <span className="font-heading text-4xl font-light text-white-soft group-hover:text-gold transition-colors duration-200">
                                {label}
                            </span>
                            <span className="text-muted group-hover:text-gold transition-colors duration-200 text-xl">→</span>
                        </Link>
                    ))}

                    {/* Profile link (logged in) */}
                    {session && (
                        <Link
                            href="/profile"
                            onClick={() => setOpen(false)}
                            className="group flex items-center justify-between py-6 border-b border-surface-3/60 transition-colors duration-200 hover:border-gold/30"
                            style={{ transitionDelay: open ? `${NAV_LINKS.length * 40}ms` : "0ms" }}
                        >
                            <span className="font-heading text-4xl font-light text-white-soft group-hover:text-gold transition-colors duration-200">
                                Profile
                            </span>
                            <span className="text-muted group-hover:text-gold transition-colors duration-200 text-xl">→</span>
                        </Link>
                    )}
                </div>

                {/* Bottom auth section */}
                <div className="px-8 py-10 border-t border-surface-3 shrink-0">
                    {!session ? (
                        <div className="flex flex-col gap-3">
                            <Link
                                href="/register"
                                onClick={() => setOpen(false)}
                                className="block text-center font-body font-semibold bg-gold hover:bg-gold-light text-dark py-4 rounded-full transition-colors duration-200 text-base"
                            >
                                Get Started
                            </Link>
                            <Link
                                href="/login"
                                onClick={() => setOpen(false)}
                                className="block text-center font-body text-muted hover:text-white-soft transition-colors py-3 text-sm"
                            >
                                Sign In
                            </Link>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between gap-4">
                            {/* XP chip */}
                            <div
                                className="flex items-center gap-2.5 bg-surface rounded-full px-4 py-2.5 border"
                                style={{ borderColor: `${tier.color}35` }}
                            >
                                <span className="text-xs font-stats font-bold" style={{ color: tier.color }}>
                                    Lv.{level}
                                </span>
                                <div className="w-px h-3 bg-surface-3" />
                                <span className="text-xs font-stats text-muted">{xp.toLocaleString()} XP</span>
                                <div className="w-px h-3 bg-surface-3" />
                                <span className="text-xs font-stats" style={{ color: tier.color }}>{tier.name}</span>
                            </div>

                            <button
                                onClick={() => { signOut({ callbackUrl: "/" }); setOpen(false) }}
                                className="text-sm font-body text-muted-2 hover:text-danger transition-colors"
                            >
                                Sign out
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Spacer — keeps content below fixed navbar on non-hero pages */}
            <div className="h-18" aria-hidden />
        </>
    )
}
