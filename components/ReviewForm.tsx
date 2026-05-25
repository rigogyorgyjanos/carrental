"use client"

import { useState } from "react"

interface Props {
    carId:    string
    carName:  string
    onPosted: () => void
}

export default function ReviewForm({ carId, carName, onPosted }: Props) {
    const [rating,   setRating]   = useState(0)
    const [hover,    setHover]    = useState(0)
    const [comment,  setComment]  = useState("")
    const [status,   setStatus]   = useState<"idle" | "loading" | "success" | "error">("idle")
    const [errorMsg, setErrorMsg] = useState("")

    const handleSubmit = async () => {
        if (rating === 0) { setErrorMsg("Please select a rating."); return }

        setStatus("loading")
        setErrorMsg("")

        const res = await fetch("/api/reviews", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ productId: carId, rating, comment }),
        })

        if (res.ok) {
            setStatus("success")
            onPosted()
        } else {
            const data = await res.json().catch(() => ({}))
            setErrorMsg(data.error ?? "Failed to submit review.")
            setStatus("error")
        }
    }

    if (status === "success") {
        return (
            <div className="bg-gold/8 border border-gold/20 rounded-2xl px-6 py-8 text-center space-y-3">
                <div className="text-4xl">⭐</div>
                <h3 className="font-heading text-xl text-white-soft">Review submitted!</h3>
                <p className="text-muted text-sm font-stats">
                    Your review is awaiting admin approval. You&apos;ll earn +1 XP once it&apos;s approved.
                </p>
            </div>
        )
    }

    return (
        <div className="bg-surface border border-surface-3 rounded-2xl p-6 space-y-5">
            <div>
                <h3 className="font-heading text-xl text-white-soft mb-1">Leave a Review</h3>
                <p className="text-muted text-xs font-stats">
                    Share your experience with the {carName}.
                </p>
            </div>

            {/* Star picker */}
            <div className="space-y-2">
                <p className="text-muted-2 text-[10px] font-stats uppercase tracking-wider">Rating</p>
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHover(star)}
                            onMouseLeave={() => setHover(0)}
                            className="text-3xl leading-none transition-all duration-100 hover:scale-110"
                            aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                        >
                            <span className={
                                star <= (hover || rating)
                                    ? "text-gold drop-shadow-[0_0_6px_rgba(201,168,76,0.6)]"
                                    : "text-surface-3"
                            }>
                                ★
                            </span>
                        </button>
                    ))}
                    {(hover || rating) > 0 && (
                        <span className="ml-2 self-center text-xs font-stats text-muted">
                            {["", "Poor", "Fair", "Good", "Great", "Excellent"][hover || rating]}
                        </span>
                    )}
                </div>
            </div>

            {/* Comment */}
            <div className="space-y-2">
                <p className="text-muted-2 text-[10px] font-stats uppercase tracking-wider">
                    Comment <span className="normal-case text-muted">(optional)</span>
                </p>
                <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Describe your experience…"
                    rows={3}
                    maxLength={500}
                    className="w-full bg-surface-2 border border-surface-3 focus:border-gold/40 rounded-xl px-4 py-3 text-sm font-body text-white-soft placeholder:text-muted resize-none outline-none transition-colors"
                />
                <p className="text-right text-[10px] font-stats text-muted">{comment.length}/500</p>
            </div>

            {errorMsg && (
                <p className="text-danger text-xs font-stats bg-danger/8 border border-danger/20 rounded-xl px-4 py-2 text-center">
                    {errorMsg}
                </p>
            )}

            <button
                onClick={handleSubmit}
                disabled={status === "loading" || rating === 0}
                className="w-full bg-gold hover:bg-gold-light disabled:opacity-50 disabled:cursor-not-allowed text-dark font-body font-semibold py-3.5 rounded-xl transition-colors text-sm"
            >
                {status === "loading" ? "Submitting…" : "Submit Review"}
            </button>
        </div>
    )
}
