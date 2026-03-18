"use client"

import { useState } from "react"

export default function ForgotPasswordModal({
    isOpen,
    onClose,
}: {
    isOpen: boolean
    onClose: () => void
}) {
    const [email, setEmail] = useState("")
    const [message, setMessage] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            })
            const text = await res.text()
            setMessage(text)
        } catch (err) {
            setMessage("Something went wrong. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-96 p-8 transform transition-transform duration-300 scale-100">

                {/* Header */}
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                    Forgot Password
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    Enter your email to receive a password reset link.
                </p>

                {/* Message or Form */}
                {message ? (
                    <p className="text-center text-gray-700 dark:text-gray-300 mb-4">{message}</p>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <input
                            type="email"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black/70 dark:focus:ring-white/70 transition"
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-black dark:bg-white text-white dark:text-black py-2.5 rounded-lg font-medium hover:bg-black/90 dark:hover:bg-gray-200 transition disabled:opacity-50"
                        >
                            {loading ? "Sending..." : "Send Reset Link"}
                        </button>
                    </form>
                )}

                {/* Close */}
                <button
                    onClick={onClose}
                    className="mt-6 w-full text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
                >
                    Cancel
                </button>
            </div>
        </div>
    )
}