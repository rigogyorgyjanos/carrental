"use client"

import { useState } from "react"
import Link from "next/link"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const INPUT = "w-full bg-dark border border-surface-3 rounded-xl px-4 py-3 text-sm font-stats text-white-soft placeholder:text-muted focus:outline-none focus:border-gold/40 transition-colors"

export default function RegisterPage() {
    const [name,     setName]     = useState("")
    const [email,    setEmail]    = useState("")
    const [password, setPassword] = useState("")
    const [loading,  setLoading]  = useState(false)
    const [error,    setError]    = useState("")
    const [success,  setSuccess]  = useState(false)

    const validate = (): string => {
        if (!name.trim())               return "Full name is required."
        if (!EMAIL_RE.test(email))      return "Please enter a valid email address."
        if (password.length < 8)        return "Password must be at least 8 characters."
        return ""
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const msg = validate()
        if (msg) { setError(msg); return }

        setLoading(true)
        setError("")

        try {
            const res = await fetch("/api/register", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password: password.trim() }),
            })

            if (res.ok) {
                setSuccess(true)
            } else {
                const data = await res.json().catch(() => ({}))
                setError(data.error ?? "Registration failed. Please try again.")
            }
        } catch {
            setError("Network error. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen bg-dark flex items-center justify-center px-4">
                <div className="w-full max-w-md text-center space-y-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 text-3xl">✓</div>
                    <div>
                        <p className="text-gold text-[11px] font-stats uppercase tracking-[0.2em] mb-2">Welcome to AURUM</p>
                        <h1 className="font-heading text-3xl font-light text-white-soft mb-2">Account Created</h1>
                        <p className="text-muted text-sm font-stats">Your account is ready. Sign in to start driving.</p>
                    </div>
                    <Link
                        href="/login"
                        className="inline-block w-full bg-gold hover:bg-gold-light text-dark font-body font-semibold py-3.5 rounded-xl text-sm transition-colors"
                    >
                        Sign In
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-dark flex items-center justify-center px-4 py-16">
            <div className="w-full max-w-md space-y-8">

                {/* Header */}
                <div className="text-center">
                    <p className="text-gold text-[11px] font-stats uppercase tracking-[0.2em] mb-3">AURUM</p>
                    <h1 className="font-heading text-4xl font-light text-white-soft mb-2">Create Account</h1>
                    <p className="text-muted text-sm font-stats">Join the programme and start earning XP</p>
                </div>

                {/* Form */}
                <div className="bg-surface border border-surface-3 rounded-2xl p-8 space-y-5">

                    {error && (
                        <p className="text-danger text-xs font-stats bg-danger/8 border border-danger/20 rounded-xl px-4 py-2.5">
                            {error}
                        </p>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                        <div>
                            <label className="block text-[11px] font-stats text-muted uppercase tracking-wider mb-1.5">Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="John Doe"
                                className={INPUT}
                                autoComplete="name"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-stats text-muted uppercase tracking-wider mb-1.5">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className={INPUT}
                                autoComplete="email"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-stats text-muted uppercase tracking-wider mb-1.5">
                                Password
                                <span className="ml-2 text-muted-2 normal-case tracking-normal">min. 8 characters</span>
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className={INPUT}
                                autoComplete="new-password"
                                required
                                minLength={8}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gold hover:bg-gold-light disabled:opacity-60 disabled:cursor-not-allowed text-dark font-body font-semibold py-3.5 rounded-xl text-sm transition-colors mt-2"
                        >
                            {loading ? "Creating account…" : "Create Account"}
                        </button>
                    </form>

                    <p className="text-center text-xs font-stats text-muted pt-2">
                        By registering you agree to our{" "}
                        <Link href="/terms" className="text-gold hover:underline">Terms of Service</Link>
                        {" "}and{" "}
                        <Link href="/privacy" className="text-gold hover:underline">Privacy Policy</Link>.
                    </p>
                </div>

                <p className="text-center text-sm font-stats text-muted">
                    Already have an account?{" "}
                    <Link href="/login" className="text-gold hover:underline font-semibold">Sign in</Link>
                </p>
            </div>
        </div>
    )
}
