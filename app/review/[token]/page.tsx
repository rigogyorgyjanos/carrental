"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"

interface ReviewInfo {
    productId: string
    carBrand:  string
    carName:   string
    carImage:  string | null
    expiresAt: string
}

type Phase = "loading" | "form" | "done" | "error"

export default function ReviewPage() {
    const { token } = useParams<{ token: string }>()

    const [phase,   setPhase]   = useState<Phase>("loading")
    const [info,    setInfo]    = useState<ReviewInfo | null>(null)
    const [errMsg,  setErrMsg]  = useState("")
    const [rating,  setRating]  = useState(0)
    const [hovered, setHovered] = useState(0)
    const [comment, setComment] = useState("")
    const [saving,  setSaving]  = useState(false)

    useEffect(() => {
        fetch(`/api/review/${token}`)
            .then(async r => {
                const data = await r.json()
                if (!r.ok) { setErrMsg(data.error ?? "Invalid link"); setPhase("error"); return }
                setInfo(data)
                setPhase("form")
            })
            .catch(() => { setErrMsg("Failed to load review page"); setPhase("error") })
    }, [token])

    const submit = async () => {
        if (rating === 0) return
        setSaving(true)
        try {
            const res  = await fetch(`/api/review/${token}`, {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ rating, comment }),
            })
            const data = await res.json().catch(() => ({}))
            if (res.ok) {
                setPhase("done")
            } else {
                setErrMsg(data.error ?? "Failed to submit review")
                setSaving(false)
            }
        } catch {
            setErrMsg("Network error. Please try again.")
            setSaving(false)
        }
    }

    const stars = [1, 2, 3, 4, 5]
    const active = hovered || rating

    const STAR_LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"]

    return (
        <div className="min-h-screen bg-dark flex items-center justify-center px-4 py-16">
            <div className="w-full max-w-lg">

                {/* Logo */}
                <div className="text-center mb-10">
                    <Link href="/" className="inline-block">
                        <span className="text-gold font-stats text-base tracking-[0.25em]">◆ AURUM</span>
                    </Link>
                </div>

                {phase === "loading" && (
                    <div className="text-center text-muted font-stats py-20">Loading…</div>
                )}

                {phase === "error" && (
                    <div className="bg-surface border border-surface-3 rounded-2xl p-8 text-center space-y-4">
                        <p className="text-danger text-4xl">◎</p>
                        <h1 className="font-heading text-xl text-white-soft">Link unavailable</h1>
                        <p className="text-muted text-sm font-stats">{errMsg}</p>
                        <Link href="/" className="inline-block text-gold text-sm font-stats hover:underline mt-2">
                            Back to homepage →
                        </Link>
                    </div>
                )}

                {phase === "form" && info && (
                    <div className="bg-surface border border-surface-3 rounded-2xl overflow-hidden">

                        {/* Car image */}
                        {info.carImage && (
                            <div className="relative w-full h-48">
                                <Image src={info.carImage} alt={info.carName} fill className="object-cover" />
                                <div className="absolute inset-0 bg-linear-to-t from-surface to-transparent" />
                            </div>
                        )}

                        <div className="p-8 space-y-6">
                            <div>
                                <p className="text-muted text-xs font-stats uppercase tracking-wider mb-1">You rented</p>
                                <h1 className="font-heading text-2xl text-white-soft font-light">
                                    {info.carBrand} {info.carName}
                                </h1>
                            </div>

                            <p className="text-muted text-sm font-stats">
                                How would you rate your experience? Your feedback helps other drivers and earns you{" "}
                                <span className="text-gold font-semibold">+1 XP</span>.
                            </p>

                            {/* Star rating */}
                            <div className="space-y-2">
                                <p className="text-[11px] font-stats text-muted uppercase tracking-wider">Your rating</p>
                                <div className="flex gap-2">
                                    {stars.map(s => (
                                        <button
                                            key={s}
                                            type="button"
                                            onMouseEnter={() => setHovered(s)}
                                            onMouseLeave={() => setHovered(0)}
                                            onClick={() => setRating(s)}
                                            className="text-3xl transition-transform hover:scale-110 focus:outline-none"
                                            style={{ color: s <= active ? "#C9A84C" : "#374151" }}
                                        >
                                            ★
                                        </button>
                                    ))}
                                    {active > 0 && (
                                        <span className="self-center text-xs font-stats text-gold ml-1">
                                            {STAR_LABELS[active]}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Comment */}
                            <div className="space-y-1">
                                <label className="text-[11px] font-stats text-muted uppercase tracking-wider">
                                    Comment <span className="text-muted/50 normal-case">(optional)</span>
                                </label>
                                <textarea
                                    rows={4}
                                    value={comment}
                                    onChange={e => setComment(e.target.value)}
                                    placeholder="Tell us about your experience…"
                                    className="w-full bg-dark border border-surface-3 rounded-xl px-4 py-3 text-sm font-stats text-white-soft placeholder:text-muted focus:outline-none focus:border-gold/40 transition-colors resize-none"
                                />
                            </div>

                            {errMsg && (
                                <p className="text-danger text-xs font-stats">{errMsg}</p>
                            )}

                            <button
                                onClick={submit}
                                disabled={rating === 0 || saving}
                                className="w-full bg-gold hover:bg-gold-light disabled:opacity-50 disabled:cursor-not-allowed text-dark font-body font-semibold py-3 rounded-xl text-sm transition-colors"
                            >
                                {saving ? "Submitting…" : "Submit Review"}
                            </button>

                            <p className="text-muted/50 text-[11px] font-stats text-center">
                                Your review will be published immediately on the vehicle page.
                            </p>
                        </div>
                    </div>
                )}

                {phase === "done" && (
                    <div className="bg-surface border border-surface-3 rounded-2xl p-10 text-center space-y-4">
                        <p className="text-gold text-5xl">★</p>
                        <h1 className="font-heading text-2xl text-white-soft font-light">Thank you!</h1>
                        <p className="text-muted text-sm font-stats leading-relaxed">
                            Your review has been submitted and is pending approval.
                        </p>
                        <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-4 py-2">
                            <span className="text-gold text-sm font-stats font-semibold">◆ +1 XP awarded</span>
                        </div>
                        <div className="pt-2">
                            <Link href="/" className="text-gold text-sm font-stats hover:underline">
                                Back to homepage →
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
