"use client"

import { signIn } from "next-auth/react"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import ForgotPasswordModal from "@/components/ForgotPasswordModal"
import ResetPasswordModal from "@/components/ResetPasswordModal"

export default function LoginPage() {
    const searchParams = useSearchParams()
    const error = searchParams.get("error")
    const resetToken = searchParams.get("token")

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)

    const [isForgotOpen, setForgotOpen] = useState(false)
    const [isResetOpen, setResetOpen] = useState(false)

    useEffect(() => {
        if (resetToken)
            setResetOpen(true)
    }, [resetToken])

    const handleSubmit = async (e: React.SubmitEvent) => {
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
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-50 to-gray-100 px-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-100">

                {/* Header */}
                <div className="mb-6 text-center">
                    <h1 className="text-3xl font-semibold text-gray-900">
                        Welcome back
                    </h1>
                    <p className="text-gray-500 mt-2 text-sm">
                        Sign in to your account
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-4 text-sm text-red-500 text-center">
                        Invalid email or password
                    </div>
                )}

                {/* Social logins */}
                <div className="flex flex-col gap-3 mb-6">
                    <button
                        onClick={() => handleSocialLogin("google")}
                        className="flex items-center justify-center gap-3 border border-gray-200 rounded-lg py-2.5 hover:bg-gray-50 transition"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 48 48">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.73 1.22 9.24 3.6l6.9-6.9C35.64 2.24 30.2 0 24 0 14.64 0 6.56 5.4 2.56 13.3l8.04 6.24C12.6 13.4 17.8 9.5 24 9.5z" />
                            <path fill="#4285F4" d="M46.5 24.5c0-1.64-.14-3.2-.4-4.7H24v9h12.7c-.54 2.9-2.2 5.36-4.7 7l7.2 5.6c4.2-3.9 6.6-9.6 6.6-16.9z" />
                            <path fill="#FBBC05" d="M10.6 28.5c-1-2.9-1-6.1 0-9l-8-6.2C.8 17.2 0 20.5 0 24s.8 6.8 2.6 10.7l8-6.2z" />
                            <path fill="#34A853" d="M24 48c6.5 0 12-2.1 16-5.7l-7.2-5.6c-2 1.4-4.6 2.3-8.8 2.3-6.2 0-11.4-3.9-13.4-9.4l-8 6.2C6.6 42.6 14.6 48 24 48z" />
                        </svg>
                        <span className="text-sm font-medium">
                            Continue with Google
                        </span>
                    </button>
                </div>

                {/* Divider */}
                <div className="flex items-center my-6">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="px-3 text-xs text-gray-400">OR</span>
                    <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black/80 transition"
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black/80 transition"
                    />

                    {/* Forgot password */}
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={() => setForgotOpen(true)}
                            className="text-sm text-gray-500 hover:text-black transition"
                        >
                            Forgot password?
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-2 bg-black text-white py-2.5 rounded-lg font-medium hover:bg-black/90 transition disabled:opacity-50"
                    >
                        {loading ? "Signing in..." : "Sign in"}
                    </button>
                </form>

                {/* Footer */}
                <p className="text-center text-sm text-gray-500 mt-6">
                    Don’t have an account?{" "}
                    <a href="/register" className="text-black font-medium hover:underline">
                        Sign up
                    </a>
                </p>

            </div>

            {/* Modals */}
            <ForgotPasswordModal isOpen={isForgotOpen} onClose={() => setForgotOpen(false)} />
            <ResetPasswordModal isOpen={isResetOpen} onClose={() => setResetOpen(false)} />
        </div>
    )
}