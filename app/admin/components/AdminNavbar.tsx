"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { useState, useEffect } from "react"

const NAV = [
    { href: "/admin",              label: "Dashboard"   },
    { href: "/admin/companies",    label: "Companies"   },
    { href: "/admin/pending",      label: "Approvals"   },
    { href: "/admin/transactions", label: "Bookings"    },
    { href: "/admin/cars",         label: "Fleet"       },
    { href: "/admin/users",        label: "Customers"   },
    { href: "/admin/reviews",      label: "Reviews"     },
    { href: "/admin/events",       label: "Events"      },
    { href: "/admin/penalties",    label: "Penalties"   },
    { href: "/admin/newsletter",   label: "Newsletter"  },
    { href: "/admin/logs",         label: "Audit Log"   },
]

export default function AdminNavbar() {
    const path = usePathname()
    const [open, setOpen] = useState(false)

    useEffect(() => {
        const onResize = () => { if (window.innerWidth >= 640) setOpen(false) }
        window.addEventListener("resize", onResize)
        return () => window.removeEventListener("resize", onResize)
    }, [])

    useEffect(() => {
        document.body.style.overflow = open ? "hidden" : ""
        return () => { document.body.style.overflow = "" }
    }, [open])

    return (
        <>
            <header className="sticky top-0 z-50 border-b border-surface-3 bg-dark/95 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-6">

                    <Link href="/admin" className="flex items-center gap-2 shrink-0">
                        <span className="text-gold font-stats text-sm tracking-[0.2em]">◆ AURUM</span>
                        <span className="text-muted text-xs font-stats border-l border-surface-3 pl-2">Admin</span>
                    </Link>

                    {/* Desktop nav */}
                    <nav className="hidden sm:flex items-center gap-1 flex-1 overflow-x-auto">
                        {NAV.map(n => {
                            const active = n.href === "/admin"
                                ? path === "/admin"
                                : path.startsWith(n.href)
                            return (
                                <Link
                                    key={n.href}
                                    href={n.href}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-stats transition-colors whitespace-nowrap ${
                                        active
                                            ? "bg-gold/15 text-gold"
                                            : "text-muted hover:text-white-soft hover:bg-surface"
                                    }`}
                                >
                                    {n.label}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Desktop right */}
                    <div className="hidden sm:flex items-center gap-2 shrink-0">
                        <Link
                            href="/"
                            target="_blank"
                            className="text-xs font-stats text-muted hover:text-white-soft transition-colors px-2 py-1"
                        >
                            View site ↗
                        </Link>
                        <button
                            onClick={() => signOut({ callbackUrl: "/" })}
                            className="text-xs font-stats px-3 py-1.5 rounded-lg border border-danger/30 text-danger/80 hover:bg-danger/10 hover:border-danger/50 transition-all cursor-pointer"
                        >
                            Logout
                        </button>
                    </div>

                    {/* Mobile hamburger */}
                    <button
                        className="sm:hidden flex flex-col justify-center items-center w-9 h-9 gap-1.5 rounded-lg hover:bg-surface transition-colors cursor-pointer"
                        onClick={() => setOpen(prev => !prev)}
                        aria-label={open ? "Close menu" : "Open menu"}
                        aria-expanded={open}
                    >
                        <span className={`block h-px w-5 bg-white-soft transition-all duration-300 ${open ? "rotate-45 translate-y-1.5" : ""}`} />
                        <span className={`block h-px w-5 bg-white-soft transition-all duration-300 ${open ? "opacity-0" : ""}`} />
                        <span className={`block h-px w-5 bg-white-soft transition-all duration-300 ${open ? "-rotate-45 -translate-y-1.5" : ""}`} />
                    </button>
                </div>
            </header>

            {/* Mobile full-screen overlay */}
            <div
                aria-hidden={!open}
                className={`fixed inset-0 z-40 sm:hidden flex flex-col bg-dark transition-all duration-300 ease-out ${
                    open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                }`}
            >
                {/* Matches sticky header height */}
                <div className="h-14 shrink-0 border-b border-surface-3" />

                <div className="flex-1 overflow-y-auto">
                    <nav className="flex flex-col px-6 py-2">
                        {NAV.map((n, i) => {
                            const active = n.href === "/admin"
                                ? path === "/admin"
                                : path.startsWith(n.href)
                            return (
                                <Link
                                    key={n.href}
                                    href={n.href}
                                    onClick={() => setOpen(false)}
                                    className={`flex items-center justify-between py-4 border-b border-surface-3/60 transition-colors duration-200 ${
                                        active ? "text-gold" : "text-white-soft hover:text-gold"
                                    }`}
                                    style={{ transitionDelay: open ? `${i * 25}ms` : "0ms" }}
                                >
                                    <span className="font-stats text-base tracking-wide">{n.label}</span>
                                    <span className="text-muted text-sm">→</span>
                                </Link>
                            )
                        })}
                    </nav>
                </div>

                <div className="px-6 py-6 border-t border-surface-3 flex items-center justify-between shrink-0">
                    <Link
                        href="/"
                        target="_blank"
                        className="text-xs font-stats text-muted hover:text-white-soft transition-colors"
                        onClick={() => setOpen(false)}
                    >
                        View site ↗
                    </Link>
                    <button
                        onClick={() => { signOut({ callbackUrl: "/" }); setOpen(false) }}
                        className="text-xs font-stats px-4 py-2 rounded-lg border border-danger/30 text-danger/80 hover:bg-danger/10 hover:border-danger/50 transition-all cursor-pointer"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </>
    )
}
