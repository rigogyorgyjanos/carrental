"use client"

import { useState } from "react"

export default function RegisterPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [name, setName] = useState("")
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState("")
    const [isSuccess, setIsSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage("")

        const res = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, name })
        })

        if (res.ok) {
            setMessage("User created successfully! Please login.")
            setEmail("")
            setPassword("")
            setName("")
            setIsSuccess(true)
        } else {
            const text = await res.text()
            setMessage(text || "Registration failed")
            setIsSuccess(false)
        }

        setLoading(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-100">

                {/* Header */}
                <div className="mb-6 text-center">
                    <h1 className="text-3xl font-semibold text-gray-900">Create Account</h1>
                    <p className="text-gray-500 mt-2 text-sm">
                        Join us and start your journey
                    </p>
                </div>

                {/* Message */}
                {message && (
                    <div className={`mb-4 text-center text-sm ${isSuccess ? "text-green-600" : "text-red-500"}`}>
                        {message}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input
                        type="text"
                        placeholder="Full Name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black/80 transition"
                        required
                    />

                    <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black/80 transition"
                        required
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black/80 transition"
                        required
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-2 bg-black text-white py-2.5 rounded-lg font-medium hover:bg-black/90 transition disabled:opacity-50"
                    >
                        {loading ? "Registering..." : "Register"}
                    </button>
                </form>

                {/* Footer */}
                <p className="text-center text-sm text-gray-500 mt-6">
                    Already have an account?{" "}
                    <a href="/login" className="text-black font-medium hover:underline">
                        Sign in
                    </a>
                </p>
            </div>
        </div>
    )
}