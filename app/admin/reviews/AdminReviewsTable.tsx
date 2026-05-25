"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"

interface ReviewRow {
    id:        string
    rating:    number
    comment:   string | null
    createdAt: string
    user:      { id: string; name: string | null; email: string; image: string | null }
    product:   { id: string; name: string; brand: string }
}

function Stars({ rating }: { rating: number }) {
    return (
        <span className="inline-flex gap-0.5">
            {[1, 2, 3, 4, 5].map(s => (
                <span key={s} className={`text-base ${s <= rating ? "text-gold" : "text-surface-3"}`}>★</span>
            ))}
        </span>
    )
}

export default function AdminReviewsTable({ initialReviews }: { initialReviews: ReviewRow[] }) {
    const [reviews, setReviews] = useState(initialReviews)
    const [loading, setLoading] = useState<string | null>(null)
    const [error,   setError]   = useState("")

    const approve = async (id: string) => {
        setLoading(id + "approve")
        setError("")
        const res = await fetch(`/api/admin/reviews/${id}`, { method: "PATCH" })
        if (res.ok) {
            setReviews(prev => prev.filter(r => r.id !== id))
        } else {
            const data = await res.json().catch(() => ({}))
            setError(data.error ?? "Approval failed.")
        }
        setLoading(null)
    }

    const reject = async (id: string) => {
        setLoading(id + "reject")
        setError("")
        const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" })
        if (res.ok) {
            setReviews(prev => prev.filter(r => r.id !== id))
        } else {
            const data = await res.json().catch(() => ({}))
            setError(data.error ?? "Rejection failed.")
        }
        setLoading(null)
    }

    if (reviews.length === 0) {
        return (
            <div className="bg-surface border border-surface-3 rounded-2xl px-6 py-16 text-center">
                <p className="text-muted text-4xl mb-3">◎</p>
                <p className="text-muted text-sm font-stats">No pending reviews.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {error && (
                <p className="text-danger text-xs font-stats bg-danger/8 border border-danger/20 rounded-xl px-4 py-2">
                    {error}
                </p>
            )}

            {reviews.map(r => {
                const date     = new Date(r.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                const initials = r.user.name
                    ? r.user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
                    : r.user.email[0].toUpperCase()

                return (
                    <div key={r.id} className="bg-surface border border-surface-3 rounded-2xl p-5 space-y-4 hover:border-surface-2 transition-colors">

                        {/* Car + user row */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="space-y-1">
                                <Link
                                    href={`/cars/${r.product.id}`}
                                    target="_blank"
                                    className="font-heading text-lg text-white-soft hover:text-gold transition-colors font-light leading-none"
                                >
                                    {r.product.brand} {r.product.name} ↗
                                </Link>
                                <div className="flex items-center gap-2 pt-1">
                                    {r.user.image ? (
                                        <Image
                                            src={r.user.image}
                                            alt={r.user.name ?? ""}
                                            width={24} height={24}
                                            className="rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-surface-2 border border-surface-3 flex items-center justify-center text-[10px] font-stats font-semibold text-muted shrink-0">
                                            {initials}
                                        </div>
                                    )}
                                    <span className="text-muted text-xs font-stats">
                                        {r.user.name ?? r.user.email}
                                    </span>
                                    <span className="text-muted-2 text-[10px] font-stats">{date}</span>
                                </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    onClick={() => approve(r.id)}
                                    disabled={loading === r.id + "approve"}
                                    className="text-xs font-stats px-4 py-2 rounded-lg border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-all disabled:opacity-50"
                                >
                                    {loading === r.id + "approve" ? "…" : "Approve +1 XP"}
                                </button>
                                <button
                                    onClick={() => reject(r.id)}
                                    disabled={loading === r.id + "reject"}
                                    className="text-xs font-stats px-4 py-2 rounded-lg border border-danger/30 text-danger/80 hover:bg-danger/10 transition-all disabled:opacity-50"
                                >
                                    {loading === r.id + "reject" ? "…" : "Reject"}
                                </button>
                            </div>
                        </div>

                        {/* Rating + comment */}
                        <div className="pl-0 space-y-2">
                            <Stars rating={r.rating} />
                            {r.comment && (
                                <p className="font-body text-muted text-sm leading-relaxed bg-surface-2 border border-surface-3 rounded-xl px-4 py-3">
                                    {r.comment}
                                </p>
                            )}
                            {!r.comment && (
                                <p className="text-muted-2 text-xs font-stats italic">No comment.</p>
                            )}
                        </div>

                    </div>
                )
            })}
        </div>
    )
}
