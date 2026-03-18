"use client"

import { useEffect, useState } from "react"


interface Props {
    userId: string
}

interface User {
    id: string
    name: string
    email: string
    role: string
    xp: number
    level: number
}

export default function UserEditForm({ userId }: Props) {
    const [user, setUser] = useState<User | null>(null)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState("")

    useEffect(() => {
        fetch(`/api/admin/users/${userId}`)
            .then(res => res.json())
            .then(data => setUser(data))
    }, [userId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setSaving(true)
        setMessage("")

        const res = await fetch(`/api/admin/users/${userId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(user),
        })

        if (res.ok) {
            setMessage("User updated successfully ✅")
        } else {
            setMessage("Error while saving ❌")
        }

        setSaving(false)
    }

    if (!user) return <div className="text-center mt-10">Loading...</div>

    return (
        <div className="flex justify-center items-start min-h-screen bg-gray-100 p-6">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-lg bg-white shadow-lg rounded-xl p-8 space-y-6 text-gray-900"
            >
                <h2 className="text-2xl font-bold text-gray-800">Edit User</h2>

                {/* Name */}
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-600">Name</label>
                    <input
                        className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={user.name}
                        onChange={e => setUser({ ...user, name: e.target.value })}
                    />
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <input
                        type="email"
                        className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={user.email}
                        onChange={e => setUser({ ...user, email: e.target.value })}
                    />
                </div>

                {/* Role */}
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-600">Role</label>
                    <select
                        className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={user.role}
                        onChange={e => setUser({ ...user, role: e.target.value })}
                    >
                        <option value="USER">User</option>
                        <option value="ADMIN">Admin</option>
                        <option value="MODERATOR">Moderator</option>
                    </select>
                </div>

                {/* Level */}
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-600">Level</label>
                    <input
                        type="number"
                        className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={user.level}
                        onChange={e => setUser({ ...user, level: Number(e.target.value) })}
                    />
                </div>

                {/* XP */}
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-600">XP</label>
                    <input
                        type="number"
                        className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={user.xp}
                        onChange={e => setUser({ ...user, xp: Number(e.target.value) })}
                    />
                </div>

                {/* Save button */}
                <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition disabled:opacity-50"
                >
                    {saving ? "Saving..." : "Save changes"}
                </button>

                {/* Message */}
                {message && <p className="text-center text-sm text-gray-600">{message}</p>}
            </form>
        </div>
    )
}