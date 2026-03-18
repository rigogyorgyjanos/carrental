"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function CreateUserPage() {
    const router = useRouter();
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [role, setRole] = useState("")


    const handleSubmit = async (e: React.SubmitEvent) => {
        e.preventDefault()
        await fetch("/api/admin/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, role })
        })
        router.push("/admin/users")
    }
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Add New User</h1>
            <form onSubmit={handleSubmit} className="grid gap-4 max-w-md">
                {/* Name */}
                <input
                    placeholder="User Name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="p-2 border rounded"
                />

                {/* Email */}
                <input
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="p-2 border rounded"
                />

                {/* Role as select */}
                <select
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    className="p-2 border rounded bg-white"
                >
                    <option value="">Select Role</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="MODERATOR">MODERATOR</option>
                    <option value="USER">USER</option>
                </select>

                <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">Create User</button>
            </form>
        </div>
    )

}