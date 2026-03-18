"use client"

import { useEffect, useState } from "react"

interface Transaction {
    id: string
    userName: string
    productName: string
    startDate: string
    endDate: string
    price: number
    status: string
}

export default function TransactionsAdminPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([])

    useEffect(() => {
        fetch("/api/admin/transactions")
            .then(res => res.json())
            .then(data => setTransactions(data))
    }, [])

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-4">Transactions</h1>

            <div className="grid gap-4">
                {transactions.map(t => (
                    <div key={t.id} className="p-4 border rounded flex justify-between items-center">
                        <div>
                            <p>User: {t.userName}</p>
                            <p>Product: {t.productName}</p>
                            <p>{new Date(t.startDate).toLocaleDateString()} - {new Date(t.endDate).toLocaleDateString()}</p>
                            <p>${t.price.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="capitalize">{t.status}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}