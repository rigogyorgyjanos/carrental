"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

interface User {
    id: string
    name: string
    email: string
    role: string
    xp: number
    level: number
}

const ITEMS_PER_PAGE = 15

export default function UsersAdminPage() {
    const [users, setUsers] = useState<User[]>([])
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)

    const fetchUsers = () => {
        fetch("/api/admin/users")
            .then(res => res.json())
            .then(data => setUsers(data))
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const deleteUser = async (id: string) => {
        if (!confirm("Are you sure you want to delete this user?")) return
        await fetch(`/api/admin/users/${id}`, { method: "DELETE" })
        fetchUsers()
    }

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        user.role.toLowerCase().includes(search.toLowerCase())
    )

    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)
    const paginatedUsers = filteredUsers.slice(
        (page - 1) * ITEMS_PER_PAGE,
        page * ITEMS_PER_PAGE
    )

    return (
        <div className="p-8 max-w-6xl mx-auto">

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Users Management</h1>

                <Link
                    href="/admin/users/create"
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                >
                    + Add New User
                </Link>
            </div>

            {/* Search */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search users..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value)
                        setPage(1)
                    }}
                    className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Table */}
            <div className="bg-white shadow rounded-xl overflow-hidden">

                <table className="w-full text-left">
                    <thead className="bg-gray-100 text-gray-900">
                        <tr>
                            <th className="p-3">Name</th>
                            <th className="p-3">Email</th>
                            <th className="p-3">Role</th>
                            <th className="p-3">Level / XP</th>
                            <th className="p-3 text-right">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {paginatedUsers.map(user => (
                            <tr
                                key={user.id}
                                className="border-t hover:bg-gray-50"
                            >
                                <td className="p-3 font-medium text-gray-900">{user.name}</td>
                                <td className="p-3 text-gray-600">{user.email}</td>
                                <td className="p-3 text-gray-800">{user.role}</td>
                                <td className="p-3 text-gray-800">{user.level} / {user.xp} XP</td>
                                <td className="p-3 flex justify-end gap-2">
                                    <Link
                                        href={`/admin/users/${user.id}/edit`
                                        }
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                                    >
                                        Edit
                                    </Link >
                                    <button
                                        onClick={() => deleteUser(user.id)}
                                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                                    >
                                        Delete
                                    </button>
                                </td >
                            </tr >
                        ))}
                    </tbody >
                </table >

                {
                    filteredUsers.length === 0 && (
                        <div className="p-6 text-center text-gray-500">
                            No users found
                        </div>
                    )
                }
            </div >

            {/* Pagination */}
            < div className="flex justify-center gap-2 mt-6" >
                <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="px-3 py-1 border rounded disabled:opacity-40"
                >
                    Prev
                </button>

                {
                    Array.from({ length: totalPages }, (_, i) => (
                        <button
                            key={i}
                            onClick={() => setPage(i + 1)}
                            className={`px-3 py-1 rounded border ${page === i + 1
                                ? "bg-blue-600 text-white"
                                : "bg-white text-gray-900"
                                }`}
                        >
                            {i + 1}
                        </button>
                    ))
                }

                <button
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className="px-3 py-1 border rounded disabled:opacity-40"
                >
                    Next
                </button>
            </div >

        </div >
    )

}
