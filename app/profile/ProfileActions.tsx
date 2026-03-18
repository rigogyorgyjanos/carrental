"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Product {
    id: string
    name: string
    brand: string
    pricePerDay: number
    image: string
}

interface Transaction {
    id: string
    product: Product
    startDate: string | Date
    endDate: string | Date
    totalDays: number
    totalPrice: number
    deposit?: number
    status: string
    createdAt: string | Date
}

interface Props {
    transactions: Transaction[]
}

export default function ProfileActions({ transactions }: Props) {
    const [txs, setTxs] = useState(transactions)
    const router = useRouter()

    const cancelBooking = async (id: string) => {
        if (!confirm("Are you sure you want to cancel this booking?")) return
        try {
            const res = await fetch(`/api/bookings/${id}`, { method: "DELETE" })
            if (res.ok) setTxs(prev => prev.filter(tx => tx.id !== id))
            else alert("Failed to cancel booking.")
        } catch (err) {
            console.error(err)
            alert("Error occurred.")
        }
    }

    return (
        <div className="mt-8 w-full">
            <h2 className="text-2xl font-semibold mb-4">Your Bookings</h2>
            {txs.length === 0 ? (
                <p className="text-gray-500">No bookings yet.</p>
            ) : (
                <div className="space-y-4">
                    {txs.map(tx => {
                        const start = new Date(tx.startDate)
                        const end = new Date(tx.endDate)
                        return (
                            <div key={tx.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border rounded-lg bg-white shadow-sm">
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg">{tx.product.name}</h3>
                                    <p className="text-gray-500 text-sm">{tx.product.brand}</p>
                                    <p className="text-gray-500 text-sm">
                                        {start.toLocaleDateString()} - {end.toLocaleDateString()} ({tx.totalDays} days)
                                    </p>
                                    <p className="text-blue-600 font-semibold">
                                        €{tx.totalPrice} ({tx.product.pricePerDay}/day)
                                    </p>
                                    {tx.deposit && (
                                        <p className="text-gray-500 text-sm">Deposit: €{tx.deposit}</p>
                                    )}
                                    <p className="text-sm text-gray-400">{tx.status}</p>
                                </div>

                                <div className="flex flex-col md:flex-row gap-2 mt-2 md:mt-0">
                                    <button
                                        onClick={() => cancelBooking(tx.id)}
                                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        onClick={() => router.push(`/bookings/${tx.id}/edit`)}
                                        className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition"
                                    >
                                        Edit
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}