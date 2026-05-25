"use client"

import { useState } from "react"

export default function ResetPasswordModal({
    isOpen,
    onClose,
    token,
}: {
    isOpen: boolean
    onClose: () => void
    token: string
}) {
    const [password, setPassword] = useState("")
    const [message,  setMessage]  = useState("")
    const [isError,  setIsError]  = useState(false)
    const [loading,  setLoading]  = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!token) { setIsError(true); setMessage("Invalid or missing reset token."); return }
        if (password.length < 8) { setIsError(true); setMessage("Password must be at least 8 characters."); return }
        setLoading(true)
        setMessage("")

        try {
            const res = await fetch("/api/auth/reset-password", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ token, password }),
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
                    <h2 className="font-heading text-2xl font-semibold text-white-soft">Reset Password</h2>
                    <p className="text-muted text-sm font-stats mt-1 text-center">Enter your new password below.</p>
                </div>

                {message ? (
                    <div className={`text-center text-sm font-stats px-4 py-3 rounded-xl border mb-4 ${
                        isError
                            ? "bg-danger/8 border-danger/20 text-danger"
                            : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    }`}>
                        {message}
                    </div>
                ) : null}

                {!message || isError ? (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div>
                            <label htmlFor="reset-password" className="sr-only">New password</label>
                            <input
                                id="reset-password"
                                type="password"
                                placeholder="New password (min. 8 characters)"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                minLength={8}
                                autoComplete="new-password"
                                className="w-full bg-surface-2 border border-surface-3 text-white-soft text-sm font-body placeholder:text-muted rounded-xl px-4 py-3 focus:outline-none focus:border-gold/40 transition-colors"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gold hover:bg-gold-light disabled:opacity-60 disabled:cursor-not-allowed text-dark font-body font-semibold py-3.5 rounded-xl transition-colors duration-200 text-sm"
                        >
                            {loading ? "Resetting…" : "Reset Password"}
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
