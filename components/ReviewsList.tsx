"use client"

import { useState } from "react"
import ReviewForm from "./ReviewForm"

interface ReviewUser {
    id:    string
    name:  string | null
    image: string | null
}

export interface ReviewRow {
    id:        string
    rating:    number
    comment:   string | null
    createdAt: string
    user:      ReviewUser
}

interface Props {
    initialReviews: ReviewRow[]
    carId:          string
    carName:        string
    canReview:      boolean     // user has completed booking + not reviewed yet
}

function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
    const cls = size === "md" ? "text-xl" : "text-base"
    return (
        <span className="inline-flex gap-0.5">
            {[1, 2, 3, 4, 5].map(s => (
                <span key={s} className={`${cls} ${s <= rating ? "text-gold" : "text-surface-3"}`}>
                    ★
                </span>
            ))}
        </span>
    )
}

function AverageRating({ reviews }: { reviews: ReviewRow[] }) {
    if (reviews.length === 0) return null
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length

    return (
        <div className="flex items-center gap-3 mb-6">
            <span className="font-heading text-4xl text-gold font-light">
                {avg.toFixed(1)}
            </span>
            <div>
                <Stars rating={Math.round(avg)} size="md" />
                <p className="text-muted text-xs font-stats mt-0.5">
                    {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                </p>
            </div>
        </div>
    )
}

export default function ReviewsList({ initialReviews, carId, carName, canReview }: Props) {
    const [reviews,    setReviews]    = useState(initialReviews)
    const [reviewed,   setReviewed]   = useState(!canReview)

    const [pendingNotice, setPendingNotice] = useState(false)

    const handlePosted = () => {
        setReviewed(true)
        setPendingNotice(true)
    }

    return (
        <div className="space-y-6">
            <AverageRating reviews={reviews} />

            {/* Pending approval notice */}
            {pendingNotice && (
                <div className="bg-gold/8 border border-gold/20 rounded-xl px-5 py-4 text-sm font-stats text-gold">
                    Your review has been submitted and is awaiting admin approval.
                </div>
            )}

            {/* Review form — shown before list if eligible */}
            {canReview && !reviewed && (
                <ReviewForm carId={carId} carName={carName} onPosted={handlePosted} />
            )}

            {/* Reviews list */}
            {reviews.length === 0 ? (
                <div className="bg-surface border border-surface-3 rounded-xl px-6 py-10 text-center">
                    <p className="text-muted text-4xl mb-3">◎</p>
                    <p className="text-muted text-sm font-stats">No reviews yet.</p>
                    {canReview && !reviewed && (
                        <p className="text-muted-2 text-xs font-stats mt-1">Be the first to review this vehicle.</p>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {reviews.map(r => {
                        const initials = r.user.name
                            ? r.user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
                            : "?"
                        const date = new Date(r.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric", month: "short", year: "numeric",
                        })
                        return (
                            <div
                                key={r.id}
                                className="bg-surface border border-surface-3 rounded-2xl px-5 py-4 space-y-2"
                            >
                                <div className="flex items-center gap-3">
                                    {r.user.image ? (
                                        <img
                                            src={r.user.image}
                                            alt={r.user.name ?? ""}
                                            className="w-9 h-9 rounded-full object-cover shrink-0"
                                        />
                                    ) : (
                                        <div className="w-9 h-9 rounded-full bg-surface-2 border border-surface-3 flex items-center justify-center text-xs font-stats font-semibold text-muted shrink-0">
                                            {initials}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                            <p className="text-white-soft text-sm font-stats font-semibold truncate">
                                                {r.user.name ?? "Anonymous"}
                                            </p>
                                            <p className="text-muted text-[11px] font-stats shrink-0">{date}</p>
                                        </div>
                                        <Stars rating={r.rating} />
                                    </div>
                                </div>

                                {r.comment && (
                                    <p className="font-body text-muted text-sm leading-relaxed pl-12">
                                        {r.comment}
                                    </p>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
