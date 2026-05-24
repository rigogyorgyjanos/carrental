"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Props { userId: string }

interface User {
    id:    string
    name:  string | null
    email: string
    role:  string
    xp:    number
    level: number
}

const INPUT  = "w-full bg-dark border border-surface-3 rounded-xl px-3 py-2.5 text-sm font-stats text-white-soft placeholder:text-muted focus:outline-none focus:border-gold/40 transition-colors"
const SELECT = "w-full bg-dark border border-surface-3 rounded-xl px-3 py-2.5 text-sm font-stats text-white-soft focus:outline-none focus:border-gold/40 transition-colors"
const LABEL  = "block text-[11px] font-stats text-muted uppercase tracking-wider mb-1"

export default function UserEditForm({ userId }: Props) {
    const router = useRouter()
    const [user,       setUser]       = useState<User | null>(null)
    const [saving,     setSaving]     = useState(false)
    const [successMsg, setSuccessMsg] = useState("")
    const [errorMsg,   setErrorMsg]   = useState("")

    useEffect(() => {
        fetch(`/api/admin/users/${userId}`)
            .then(r => r.json())
            .then((data: User) => setUser(data))
            .catch(() => setErrorMsg("Failed to load user."))
    }, [userId])

    const handleSubmit = async (e: { preventDefault(): void }) => {
        e.preventDefault()
        if (!user) return

        setSaving(true)
        setSuccessMsg("")
        setErrorMsg("")

        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method:  "PUT",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify(user),
            })
            if (res.ok) {
                setSuccessMsg("Changes saved.")
                setTimeout(() => router.push("/admin/users"), 1200)
            } else {
                const data = await res.json().catch(() => ({}))
                setErrorMsg(data.error ?? "Save failed.")
            }
        } catch {
            setErrorMsg("Network error.")
        } finally {
            setSaving(false)
        }
    }

    if (!user && !errorMsg) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="w-6 h-6 border-2 border-surface-3 border-t-gold rounded-full animate-spin" />
            </div>
        )
    }

    if (errorMsg && !user) {
        return (
            <div className="text-center py-24 space-y-3">
                <p className="text-danger font-stats text-sm">{errorMsg}</p>
                <Link href="/admin/users" className="text-gold text-xs font-stats hover:underline">← Users</Link>
            </div>
        )
    }

    if (!user) return null

    return (
        <div className="max-w-lg mx-auto space-y-6">

            {/* Header */}
            <div>
                <Link href="/admin/users" className="text-muted text-xs font-stats hover:text-gold transition-colors">
                    ← Users
                </Link>
                <div className="mt-2">
                    <p className="text-gold text-[11px] font-stats uppercase tracking-[0.2em] mb-1">AURUM Admin</p>
                    <h1 className="font-heading text-3xl font-light text-white-soft">
                        {user.name ?? user.email}
                    </h1>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-surface border border-surface-3 rounded-2xl p-6 space-y-4">
                    <p className="text-[11px] font-stats text-gold uppercase tracking-[0.15em]">Profile</p>

                    <div>
                        <label className={LABEL}>Name</label>
                        <input
                            value={user.name ?? ""}
                            onChange={e => setUser({ ...user, name: e.target.value })}
                            placeholder="Full name"
                            className={INPUT}
                        />
                    </div>
                    <div>
                        <label className={LABEL}>Email *</label>
                        <input
                            type="email"
                            value={user.email}
                            onChange={e => setUser({ ...user, email: e.target.value })}
                            required
                            className={INPUT}
                        />
                    </div>
                    <div>
                        <label className={LABEL}>Role</label>
                        <select
                            value={user.role}
                            onChange={e => setUser({ ...user, role: e.target.value })}
                            className={SELECT}
                        >
                            <option value="USER">User</option>
                            <option value="ADMIN">Admin</option>
                            <option value="MODERATOR">Moderator</option>
                        </select>
                    </div>
                </div>

                <div className="bg-surface border border-surface-3 rounded-2xl p-6 space-y-4">
                    <p className="text-[11px] font-stats text-gold uppercase tracking-[0.15em]">Loyalty</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={LABEL}>XP</label>
                            <input
                                type="number"
                                value={user.xp}
                                min={0}
                                onChange={e => setUser({ ...user, xp: Number(e.target.value) })}
                                className={INPUT}
                            />
                        </div>
                        <div>
                            <label className={LABEL}>Level</label>
                            <input
                                type="number"
                                value={user.level}
                                min={1}
                                onChange={e => setUser({ ...user, level: Number(e.target.value) })}
                                className={INPUT}
                            />
                        </div>
                    </div>
                </div>

                {errorMsg && (
                    <p className="text-danger text-xs font-stats bg-danger/8 border border-danger/20 rounded-xl px-4 py-2">
                        {errorMsg}
                    </p>
                )}
                {successMsg && (
                    <p className="text-emerald-400 text-xs font-stats bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-4 py-2">
                        {successMsg}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-gold hover:bg-gold-light disabled:opacity-60 disabled:cursor-not-allowed text-dark font-body font-semibold py-4 rounded-xl transition-colors text-sm"
                >
                    {saving ? "Saving…" : "Save Changes"}
                </button>
            </form>
        </div>
    )
}
