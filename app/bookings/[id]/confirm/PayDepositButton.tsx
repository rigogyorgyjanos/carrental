"use client"

import { useState } from "react"

interface Props {
    bookingId:  string
    depositAmt: number | null
}

export default function PayDepositButton({ bookingId, depositAmt }: Props) {
    const [loading, setLoading] = useState(false)
    const [error,   setError]   = useState("")

    const handlePay = async () => {
        setLoading(true)
        setError("")
        try {
            const res  = await fetch("/api/stripe/checkout", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ bookingId }),
            })
            const data = await res.json().catch(() => ({}))
            if (res.ok && data.url) {
                window.location.href = data.url
            } else {
                setError(data.error ?? "Payment setup failed. Please try again.")
                setLoading(false)
            }
        } catch {
            setError("Network error. Please try again.")
            setLoading(false)
        }
    }

    return (
        <div className="space-y-2">
            <button
                onClick={handlePay}
                disabled={loading}
                className="w-full bg-gold hover:bg-gold-light disabled:opacity-60 disabled:cursor-not-allowed text-dark font-body font-semibold py-4 rounded-xl text-sm transition-colors"
            >
                {loading
                    ? "Preparing payment…"
                    : depositAmt != null
                    ? `Pay Deposit · €${depositAmt.toFixed(0)}`
                    : "Complete Payment →"}
            </button>
            {error && (
                <p className="text-danger text-xs font-stats text-center bg-danger/8 border border-danger/20 rounded-xl px-3 py-2">
                    {error}
                </p>
            )}
        </div>
    )
}
