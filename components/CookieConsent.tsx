"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

export default function CookieConsent() {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const consent = localStorage.getItem("cookie_consent")
        if (!consent) setVisible(true)
    }, [])

    const accept = () => {
        localStorage.setItem("cookie_consent", "accepted")
        setVisible(false)
    }

    const decline = () => {
        localStorage.setItem("cookie_consent", "declined")
        setVisible(false)
    }

    if (!visible) return null

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
            <div className="max-w-3xl mx-auto bg-surface border border-surface-3 rounded-2xl shadow-2xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                    <p className="text-white-soft text-sm font-stats font-semibold mb-0.5">
                        🍪 We use cookies
                    </p>
                    <p className="text-muted text-xs font-body leading-relaxed">
                        We use strictly necessary session cookies for authentication. No advertising or tracking cookies.{" "}
                        <Link href="/privacy" className="text-gold hover:underline">
                            Privacy Policy
                        </Link>
                    </p>
                </div>
                <div className="flex gap-2 shrink-0">
                    <button
                        onClick={decline}
                        className="px-4 py-2 text-xs font-stats text-muted border border-surface-3 hover:border-gold/20 hover:text-white-soft rounded-xl transition-all"
                    >
                        Decline
                    </button>
                    <button
                        onClick={accept}
                        className="px-4 py-2 text-xs font-stats font-semibold bg-gold hover:bg-gold-light text-dark rounded-xl transition-all"
                    >
                        Accept
                    </button>
                </div>
            </div>
        </div>
    )
}
