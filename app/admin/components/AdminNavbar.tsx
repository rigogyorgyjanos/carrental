"use client"

import Link from "next/link"
import { useState } from "react"
import { signOut } from "next-auth/react"

export default function AdminNavbar() {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <nav className="bg-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">

                    {/* Logo / Title */}
                    <div className="shrink-0 font-bold text-xl text-gray-800">
                        <Link href="/admin">
                            Admin Panel
                        </Link>
                    </div>

                    {/* Desktop menu */}
                    <div className="hidden md:flex md:items-center md:space-x-6">
                        <Link href="/admin/cars" className="text-gray-700 hover:text-blue-600">
                            Cars
                        </Link>
                        <Link href="/admin/users" className="text-gray-700 hover:text-blue-600">
                            Users
                        </Link>
                        <button
                            onClick={() => signOut()}
                            className="ml-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
                        >
                            Logout
                        </button>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                        >
                            <svg
                                className="h-6 w-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                {isOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {isOpen && (
                <div className="md:hidden bg-white border-t border-gray-200">
                    <Link
                        href="/admin/cars"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsOpen(false)}
                    >
                        Cars
                    </Link>
                    <Link
                        href="/admin/users"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsOpen(false)}
                    >
                        Users
                    </Link>
                    <button
                        onClick={() => signOut()}
                        className="w-full text-left px-4 py-2 bg-red-600 hover:bg-red-700 text-white"
                    >
                        Logout
                    </button>
                </div>
            )}
        </nav>
    )
}