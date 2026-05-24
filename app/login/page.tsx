"use client"

import { signIn } from "next-auth/react"
import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import ForgotPasswordModal from "@/components/ForgotPasswordModal"
import ResetPasswordModal from "@/components/ResetPasswordModal"

function LoginContent() {
    const searchParams = useSearchParams()
    const error = searchParams.get("error")
    const resetToken = searchParams.get("token")

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)

    const [isForgotOpen, setForgotOpen] = useState(false)
    const [isResetOpen, setResetOpen] = useState(false)

    useEffect(() => {
        if (resetToken) setResetOpen(true)
    }, [resetToken])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        await signIn("credentials", {
            email,
            password,
            redirect: true,
            callbackUrl: "/",
        })

        setLoading(false)
    }

    const handleSocialLogin = async (provider: "google") => {
        setLoading(true)
        await signIn(provider, { callbackUrl: "/" })
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-dark px-4">
            <div className="w-full max-w-md">

                {/* Logo */}
                <div className="flex flex-col items-center mb-10">
                    <span className="text-gold text-2xl mb-3">◆</span>
                    <h1 className="font-heading text-3xl font-semibold tracking-[0.22em] text-white-soft uppercase">
                        AURUM
                    </h1>
                    <p className="text-muted text-sm font-stats mt-2">Sign in to your account</p>
                </div>

                <div className="bg-surface border border-surface-3 rounded-2xl p-8 shadow-2xl">

                    {/* Error */}
                    {error && (
                        <div className="mb-5 text-xs text-danger font-stats text-center bg-danger/8 border border-danger/20 rounded-xl px-4 py-3">
                            Invalid email or password
                        </div>
                    )}

                    {/* Social logins */}
                    <button
                        onClick={() => handleSocialLogin("google")}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 bg-surface-2 border border-surface-3 hover:border-gold/30 rounded-xl py-3 transition-colors duration-200 disabled:opacity-50"
                    >
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.73 1.22 9.24 3.6l6.9-6.9C35.64 2.24 30.2 0 24 0 14.64 0 6.56 5.4 2.56 13.3l8.04 6.24C12.6 13.4 17.8 9.5 24 9.5z" />
                            <path fill="#4285F4" d="M46.5 24.5c0-1.64-.14-3.2-.4-4.7H24v9h12.7c-.54 2.9-2.2 5.36-4.7 7l7.2 5.6c4.2-3.9 6.6-9.6 6.6-16.9z" />
                            <path fill="#FBBC05" d="M10.6 28.5c-1-2.9-1-6.1 0-9l-8-6.2C.8 17.2 0 20.5 0 24s.8 6.8 2.6 10.7l8-6.2z" />
                            <path fill="#34A853" d="M24 48c6.5 0 12-2.1 16-5.7l-7.2-5.6c-2 1.4-4.6 2.3-8.8 2.3-6.2 0-11.4-3.9-13.4-9.4l-8 6.2C6.6 42.6 14.6 48 24 48z" />
                        </svg>
                        <span className="text-sm font-stats text-muted">Continue with Google</span>
                    </button>

                    {/* Divider */}
                    <div className="flex items-center my-6">
                        <div className="flex-1 h-px bg-surface-3" />
                        <span className="px-3 text-[10px] font-stats text-muted-2 uppercase tracking-widest">or</span>
                        <div className="flex-1 h-px bg-surface-3" />
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <input
                            type="email"
                            placeholder="Email address"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            className="w-full bg-surface-2 border border-surface-3 text-white-soft text-sm font-body placeholder:text-muted rounded-xl px-4 py-3 focus:outline-none focus:border-gold/40 transition-colors"
                        />

                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            className="w-full bg-surface-2 border border-surface-3 text-white-soft text-sm font-body placeholder:text-muted rounded-xl px-4 py-3 focus:outline-none focus:border-gold/40 transition-colors"
                        />

                        <div className="flex justify-end -mt-1">
                            <button
                                type="button"
                                onClick={() => setForgotOpen(true)}
                                className="text-xs font-stats text-muted hover:text-gold transition-colors"
                            >
                                Forgot password?
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gold hover:bg-gold-light disabled:opacity-60 disabled:cursor-not-allowed text-dark font-body font-semibold py-3.5 rounded-xl transition-colors duration-200 text-sm"
                        >
                            {loading ? "Signing in…" : "Sign in"}
                        </button>
                    </form>

                    {/* Footer */}
                    <p className="text-center text-xs font-stats text-muted mt-6">
                        Don&apos;t have an account?{" "}
                        <a href="/register" className="text-gold hover:text-gold-light transition-colors font-semibold">
                            Sign up
                        </a>
                    </p>
                </div>
            </div>

            {/* Modals */}
            <ForgotPasswordModal isOpen={isForgotOpen} onClose={() => setForgotOpen(false)} />
            <ResetPasswordModal isOpen={isResetOpen} onClose={() => setResetOpen(false)} />
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense>
            <LoginContent />
        </Suspense>
    )
}
