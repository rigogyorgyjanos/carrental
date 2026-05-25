"use client"

import { useState } from "react"

export default function ForgotPasswordModal({
    isOpen,
    onClose,
}: {
    isOpen: boolean
    onClose: () => void
}) {
    const [email,   setEmail]   = useState("")
    const [message, setMessage] = useState("")
    const [isError, setIsError] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage("")

        try {
            const res = await fetch("/api/auth/forgot-password", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ email: email.trim().toLowerCase() }),
            })
            const text = await res.text()
            setIsError(!res.ok)
            setMessage(text)
        } catch {
            setIsError(true)
            setMessage("Network error. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div className="bg-surface border border-surface-3 rounded-2xl shadow-2xl w-full max-w-sm p-8">

                <div className="flex flex-col items-center mb-6">
                    <span className="text-gold text-xl mb-3">◆</span>
                    <h2 className="font-heading text-2xl font-semibold text-white-soft">Forgot Password</h2>
                    <p className="text-muted text-sm font-stats mt-1 text-center">
                        Enter your email to receive a reset link.
                    </p>
                </div>

                {message && (
                    <div className={`text-center text-sm font-stats px-4 py-3 rounded-xl border mb-4 ${
                        isError
                            ? "bg-danger/8 border-danger/20 text-danger"
                            : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    }`}>
                        {message}
                    </div>
                )}

                {!message || isError ? (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div>
                            <label htmlFor="forgot-email" className="sr-only">Email address</label>
                            <input
                                id="forgot-email"
                                type="email"
                                placeholder="Email address"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                                className="w-full bg-surface-2 border border-surface-3 text-white-soft text-sm font-body placeholder:text-muted rounded-xl px-4 py-3 focus:outline-none focus:border-gold/40 transition-colors"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gold hover:bg-gold-light disabled:opacity-60 disabled:cursor-not-allowed text-dark font-body font-semibold py-3.5 rounded-xl transition-colors duration-200 text-sm"
                        >
                            {loading ? "Sending…" : "Send Reset Link"}
                        </button>
                    </form>
                ) : null}

                <button
                    onClick={onClose}
                    className="mt-5 w-full text-xs font-stats text-muted-2 hover:text-muted transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    )
}
