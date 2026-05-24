"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"

const NAV = [
    { href: "/admin",              label: "Dashboard" },
    { href: "/admin/transactions", label: "Bookings"  },
    { href: "/admin/cars",         label: "Cars"      },
    { href: "/admin/users",        label: "Users"     },
]

export default function AdminNavbar() {
    const path = usePathname()

    return (
        <header className="sticky top-0 z-50 border-b border-surface-3 bg-dark/95 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-6">

                {/* Logo */}
                <Link href="/admin" className="flex items-center gap-2 shrink-0">
                    <span className="text-gold font-stats text-sm tracking-[0.2em]">◆ AURUM</span>
                    <span className="text-muted text-xs font-stats border-l border-surface-3 pl-2">Admin</span>
                </Link>

                {/* Nav links */}
                <nav className="hidden sm:flex items-center gap-1">
                    {NAV.map(n => {
                        const active = n.href === "/admin"
                            ? path === "/admin"
                            : path.startsWith(n.href)
                        return (
                            <Link
                                key={n.href}
                                href={n.href}
                                className={`px-3 py-1.5 rounded-lg text-xs font-stats transition-colors ${
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

                {/* Right: view site + logout */}
                <div className="flex items-center gap-2 shrink-0">
                    <Link
                        href="/"
                        target="_blank"
                        className="text-xs font-stats text-muted hover:text-white-soft transition-colors px-2 py-1 hidden sm:block"
                    >
                        View site ↗
                    </Link>
                    <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="text-xs font-stats px-3 py-1.5 rounded-lg border border-danger/30 text-danger/80 hover:bg-danger/10 hover:border-danger/50 transition-all"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </header>
    )
}
