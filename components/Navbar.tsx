"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { useState } from "react"

export default function Navbar() {

    const { data: session } = useSession()
    const [open, setOpen] = useState(false)

    return (
        <nav className="bg-white border-b shadow-sm sticky top-0 z-50">

            <div className="max-w-7xl mx-auto px-6">

                <div className="flex justify-between items-center h-16">

                    {/* Logo */}
                    <Link
                        href="/"
                        className="font-bold text-xl text-blue-600"
                    >
                        RentCars
                    </Link>

                    {/* Desktop menu */}
                    <div className="hidden md:flex items-center gap-6">

                        <Link href="/" className="hover:text-blue-600">
                            Home
                        </Link>

                        <Link href="/cars" className="hover:text-blue-600">
                            Cars
                        </Link>

                        {!session && (
                            <>
                                <Link
                                    href="/login"
                                    className="hover:text-blue-600"
                                >
                                    Login
                                </Link>

                                <Link
                                    href="/register"
                                    className="bg-blue-600 text-white px-4 py-2 rounded"
                                >
                                    Register
                                </Link>
                            </>
                        )}

                        {session && (
                            <>
                                <Link
                                    href="/profile"
                                    className="hover:text-blue-600"
                                >
                                    Profile
                                </Link>

                                <button
                                    onClick={() => signOut()}
                                    className="bg-red-500 text-white px-4 py-2 rounded"
                                >
                                    Logout
                                </button>
                            </>
                        )}

                    </div>

                    {/* Mobile menu button */}
                    <button
                        className="md:hidden"
                        onClick={() => setOpen(!open)}
                    >
                        ☰
                    </button>

                </div>

            </div>

            {/* Mobile menu */}
            {open && (
                <div className="md:hidden border-t">

                    <Link
                        href="/"
                        className="block px-6 py-3"
                    >
                        Home
                    </Link>

                    <Link
                        href="/cars"
                        className="block px-6 py-3"
                    >
                        Cars
                    </Link>

                    {!session && (
                        <>
                            <Link
                                href="/login"
                                className="block px-6 py-3"
                            >
                                Login
                            </Link>

                            <Link
                                href="/register"
                                className="block px-6 py-3"
                            >
                                Register
                            </Link>
                        </>
                    )}

                    {session && (
                        <>
                            <Link
                                href="/profile"
                                className="block px-6 py-3"
                            >
                                Profile
                            </Link>

                            <button
                                onClick={() => signOut()}
                                className="block px-6 py-3 text-left w-full"
                            >
                                Logout
                            </button>
                        </>
                    )}

                </div>
            )}

        </nav>
    )
}