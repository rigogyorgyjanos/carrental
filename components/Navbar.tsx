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

                {/* ── Mobile Menu ── */}
                <div
                    id="mobile-nav"
                    className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
                        open ? "max-h-120 opacity-100" : "max-h-0 opacity-0"
                    }`}
                >
                    <div className="bg-dark/98 backdrop-blur-2xl border-t border-white/8 px-6 py-6 space-y-1">

                        {NAV_LINKS.map(({ label, href }) => (
                            <Link
                                key={href}
                                href={href}
                                className="block py-3 text-sm font-body text-muted hover:text-white-soft border-b border-surface-3 transition-colors duration-200"
                                onClick={() => setOpen(false)}
                            >
                                {label}
                            </Link>
                        ))}

                        <div className="pt-4 space-y-3">
                            {!session ? (
                                <>
                                    <Link
                                        href="/login"
                                        className="block py-3 text-sm font-body text-muted hover:text-white-soft transition-colors"
                                        onClick={() => setOpen(false)}
                                    >
                                        Sign In
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="block text-center text-sm font-body font-semibold bg-gold hover:bg-gold-light text-dark py-3 rounded-full transition-colors duration-200"
                                        onClick={() => setOpen(false)}
                                    >
                                        Get Started
                                    </Link>
                                </>
                            ) : (
                                <>
                                    {/* Mobile XP chip */}
                                    <div
                                        className="flex items-center gap-2.5 bg-surface rounded-full px-4 py-2 w-fit border"
                                        style={{ borderColor: `${tier.color}35` }}
                                    >
                                        <span
                                            className="text-[11px] font-stats font-bold"
                                            style={{ color: tier.color }}
                                        >
                                            Lv.{level}
                                        </span>
                                        <div className="w-px h-3 bg-surface-3" />
                                        <span className="text-[11px] font-stats text-muted">
                                            {xp.toLocaleString()} XP
                                        </span>
                                        <div className="w-px h-3 bg-surface-3" />
                                        <span
                                            className="text-[11px] font-stats"
                                            style={{ color: tier.color }}
                                        >
                                            {tier.name}
                                        </span>
                                    </div>

                                    <Link
                                        href="/profile"
                                        className="block py-3 text-sm font-body text-muted hover:text-white-soft transition-colors border-b border-surface-3"
                                        onClick={() => setOpen(false)}
                                    >
                                        Profile
                                    </Link>

                                    <button
                                        onClick={() => { signOut({ callbackUrl: "/" }); setOpen(false) }}
                                        className="block py-3 text-sm font-body text-muted-2 hover:text-danger transition-colors text-left w-full"
                                    >
                                        Sign out
                                    </button>
                                </>
                            )}
                        </div>

                    </div>
                </div>
            </nav>

            {/* Spacer — keeps content below fixed navbar on non-hero pages */}
            <div className="h-18" aria-hidden />
        </>
    )
}
