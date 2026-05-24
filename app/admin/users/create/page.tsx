"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

const INPUT  = "w-full bg-dark border border-surface-3 rounded-xl px-3 py-2.5 text-sm font-stats text-white-soft placeholder:text-muted focus:outline-none focus:border-gold/40 transition-colors"
const SELECT = "w-full bg-dark border border-surface-3 rounded-xl px-3 py-2.5 text-sm font-stats text-white-soft focus:outline-none focus:border-gold/40 transition-colors"
const LABEL  = "block text-[11px] font-stats text-muted uppercase tracking-wider mb-1"

export default function CreateUserPage() {
    const router = useRouter()
    const [name,     setName]     = useState("")
    const [email,    setEmail]    = useState("")
    const [role,     setRole]     = useState("USER")
    const [saving,   setSaving]   = useState(false)
    const [errorMsg, setErrorMsg] = useState("")

    const handleSubmit = async (e: { preventDefault(): void }) => {
        e.preventDefault()
        if (!email) { setErrorMsg("Email is required."); return }

        setSaving(true)
        setErrorMsg("")

        try {
            const res = await fetch("/api/admin/users", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ name: name || undefined, email, role }),
            })
            if (res.ok) {
                router.push("/admin/users")
            } else {
                const data = await res.json().catch(() => ({}))
                setErrorMsg(data.error ?? "Failed to create user.")
            }
        } catch {
            setErrorMsg("Network error.")
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="max-w-lg mx-auto space-y-6">

            {/* Header */}
            <div>
                <Link href="/admin/users" className="text-muted text-xs font-stats hover:text-gold transition-colors">
                    ← Users
                </Link>
                <div className="mt-2">
                    <p className="text-gold text-[11px] font-stats uppercase tracking-[0.2em] mb-1">AURUM Admin</p>
                    <h1 className="font-heading text-3xl font-light text-white-soft">Add New User</h1>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-surface border border-surface-3 rounded-2xl p-6 space-y-4">
                    <p className="text-[11px] font-stats text-gold uppercase tracking-[0.15em]">Profile</p>

                    <div>
                        <label className={LABEL}>Name</label>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Full name (optional)"
                            className={INPUT}
                        />
                    </div>
                    <div>
                        <label className={LABEL}>Email *</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            placeholder="user@example.com"
                            className={INPUT}
                        />
                    </div>
                    <div>
                        <label className={LABEL}>Role</label>
                        <select value={role} onChange={e => setRole(e.target.value)} className={SELECT}>
                            <option value="USER">User</option>
                            <option value="ADMIN">Admin</option>
                            <option value="MODERATOR">Moderator</option>
                        </select>
                    </div>
                </div>

                {errorMsg && (
                    <p className="text-danger text-xs font-stats bg-danger/8 border border-danger/20 rounded-xl px-4 py-2">
                        {errorMsg}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-gold hover:bg-gold-light disabled:opacity-60 disabled:cursor-not-allowed text-dark font-body font-semibold py-4 rounded-xl transition-colors text-sm"
                >
                    {saving ? "Creating…" : "Create User"}
                </button>
            </form>
        </div>
    )
}
