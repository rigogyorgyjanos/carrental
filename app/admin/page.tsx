"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"

export default function AdminDashboard() {
    const { data: session } = useSession()

    if (!session) return <div>Loading...</div>
    if (session.user.role !== "ADMIN") return <div>Not authorized</div>

    return (
        <div className="min-h-screen p-8">
            <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/admin/cars" className="p-6 border rounded shadow hover:bg-gray-100">
                    <h2 className="text-xl font-semibold">Cars</h2>
                    <p>Manage all cars in the system</p>
                </Link>
                <Link href="/admin/users" className="p-6 border rounded shadow hover:bg-gray-100">
                    <h2 className="text-xl font-semibold">Users</h2>
                    <p>View and manage users</p>
                </Link>
                <Link href="/admin/transactions" className="p-6 border rounded shadow hover:bg-gray-100">
                    <h2 className="text-xl font-semibold">Transactions</h2>
                    <p>Check and update bookings</p>
                </Link>
            </div>

            <button
                className="mt-8 bg-red-500 text-white px-4 py-2 rounded"
                onClick={() => signOut({ callbackUrl: "/" })}
            >
                Logout
            </button>
        </div>
    )
}