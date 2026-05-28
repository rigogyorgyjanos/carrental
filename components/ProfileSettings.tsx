"use client"

import { useState } from "react"
import Link from "next/link"

interface Props {
    initialShowOnLeaderboard:        boolean
    initialReceivePromotionalEmails: boolean
}

interface ToggleRowProps {
    label:       string
    description: React.ReactNode
    checked:     boolean
    saving:      boolean
    onToggle:    () => void
}

function ToggleRow({ label, description, checked, saving, onToggle }: ToggleRowProps) {
    return (
        <div className="px-6 py-5 flex items-center justify-between gap-6 border-b border-surface-3 last:border-0">
            <div className="min-w-0">
                <p className="text-sm font-stats font-semibold text-white-soft leading-none mb-1">
                    {label}
                </p>
                <p className="text-xs font-stats text-muted leading-relaxed">
                    {description}
                </p>
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                aria-label={label}
                disabled={saving}
                onClick={onToggle}
                className={`relative shrink-0 w-11 h-6 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-gold/40 disabled:opacity-60 ${
                    checked ? "bg-gold" : "bg-surface-3"
                }`}
            >
                <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${
                        checked ? "translate-x-5" : "translate-x-0"
                    }`}
                />
            </button>
        </div>
    )
}

export default function ProfileSettings({ initialShowOnLeaderboard, initialReceivePromotionalEmails }: Props) {
    const [showOnLeaderboard,        setShowOnLeaderboard]        = useState(initialShowOnLeaderboard)
    const [receivePromotionalEmails, setReceivePromotionalEmails] = useState(initialReceivePromotionalEmails)
    const [saving, setSaving] = useState(false)
    const [saved,  setSaved]  = useState(false)

    const patch = async (update: Partial<{ showOnLeaderboard: boolean; receivePromotionalEmails: boolean }>) => {
        setSaving(true)
        setSaved(false)
        await fetch("/api/user/settings", {
            method:  "PATCH",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify(update),
        })
        setSaving(false)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    return (
        <div className="bg-surface border border-surface-3 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-surface-3 flex items-center justify-between">
                <h2 className="font-heading text-xl font-light text-white-soft">Settings</h2>
                {saved && (
                    <span className="text-[10px] font-stats text-emerald-400 uppercase tracking-wider">
                        Saved
                    </span>
                )}
            </div>

            <ToggleRow
                label="Show on Leaderboard"
                description={<>
                    Your rank, XP and badges are visible to everyone on the{" "}
                    <Link href="/programme" className="text-gold hover:underline">AURUM Programme</Link>
                </>}
                checked={showOnLeaderboard}
                saving={saving}
                onToggle={() => {
                    const next = !showOnLeaderboard
                    setShowOnLeaderboard(next)
                    patch({ showOnLeaderboard: next })
                }}
            />

            <ToggleRow
                label="Promotional Emails"
                description="Receive exclusive offers, new arrivals and AURUM programme updates by email"
                checked={receivePromotionalEmails}
                saving={saving}
                onToggle={() => {
                    const next = !receivePromotionalEmails
                    setReceivePromotionalEmails(next)
                    patch({ receivePromotionalEmails: next })
                }}
            />
        </div>
    )
}
