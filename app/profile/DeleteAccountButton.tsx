"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"

export default function DeleteAccountButton() {
    const [open,    setOpen]    = useState(false)
    const [loading, setLoading] = useState(false)
    const [error,   setError]   = useState("")

    const confirm = async () => {
        setLoading(true)
        setError("")
        try {
            const res = await fetch("/api/users/me", { method: "DELETE" })
            if (res.ok) {
                await signOut({ callbackUrl: "/" })
            } else {
                const data = await res.json().catch(() => ({}))
                setError(data.error ?? "Deletion failed. Please try again.")
                setLoading(false)
            }
        } catch {
            setError("Network error. Please try again.")
            setLoading(false)
        }
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="text-xs font-stats text-danger/60 hover:text-danger border border-danger/20 hover:border-danger/40 hover:bg-danger/5 px-4 py-2 rounded-xl transition-all"
            >
                Delete Account
            </button>

            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center px-4"
                    style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
                >
                    <div className="bg-surface border border-surface-3 rounded-2xl w-full max-w-sm shadow-2xl">
                        <div className="px-6 pt-6 pb-4 border-b border-surface-3">
                            <p className="text-[10px] font-stats text-danger uppercase tracking-[0.2em] mb-1">Irreversible Action</p>
                            <h2 className="font-heading text-2xl font-light text-white-soft">Delete Account</h2>
                        </div>
                        <div className="px-6 py-5 space-y-3 text-sm font-body text-muted">
                            <p>This will permanently delete your account and personal data:</p>
                            <ul className="list-disc list-inside space-y-1 text-xs ml-1">
                                <li>Your name, email and login credentials</li>
                                <li>XP history, badges and tier status</li>
                                <li>All submitted reviews</li>
                            </ul>
                            <p className="text-[12px] bg-amber-500/8 border border-amber-500/20 rounded-xl px-3 py-2 text-amber-400/90">
                                ⚠ Transaction records are retained for 7 years as required by law, but will be fully anonymised.
                            </p>
                            {error && (
                                <p className="text-danger text-xs bg-danger/8 border border-danger/20 rounded-xl px-3 py-2">{error}</p>
                            )}
                        </div>
                        <div className="px-6 pb-6 flex gap-3">
                            <button
                                onClick={() => { setOpen(false); setError("") }}
                                disabled={loading}
                                className="flex-1 py-3 rounded-xl border border-surface-3 text-muted hover:text-white-soft font-stats text-sm transition-all disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirm}
                                disabled={loading}
                                className="flex-1 py-3 rounded-xl bg-danger/80 hover:bg-danger disabled:opacity-50 disabled:cursor-not-allowed text-white font-body font-semibold text-sm transition-all"
                            >
                                {loading ? "Deleting…" : "Delete Forever"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
