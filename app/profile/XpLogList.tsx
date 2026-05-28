"use client"

import { useState } from "react"
import Link from "next/link"

interface XpLogRow {
    id:        string
    label:     string
    xpAmount:  number
    createdAt: string
}

const LIMIT = 5

export default function XpLogList({ logs }: { logs: XpLogRow[] }) {
    const [showAll, setShowAll] = useState(false)

    if (logs.length === 0) {
        return (
            <div className="bg-surface border border-surface-3 rounded-xl px-6 py-10 text-center">
                <p className="text-muted text-4xl mb-3">◎</p>
                <p className="text-muted text-sm font-stats">No XP earned yet.</p>
                <Link href="/cars" className="text-gold text-xs font-stats hover:underline mt-2 inline-block">
                    Browse vehicles →
                </Link>
            </div>
        )
    }

    const visible = showAll ? logs : logs.slice(0, LIMIT)
    const hidden  = logs.length - LIMIT

    return (
        <div>
            <div className="bg-surface border border-surface-3 rounded-xl overflow-hidden">
                {visible.map((log, i) => (
                    <div
                        key={log.id}
                        className={`flex items-center justify-between px-5 py-3.5 ${i !== visible.length - 1 ? "border-b border-surface-3" : ""}`}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-gold text-xs">◆</span>
                            <div>
                                <p className="text-white-soft text-sm font-stats font-semibold leading-none mb-0.5">
                                    {log.label}
                                </p>
                                <p className="text-muted text-[11px] font-stats">
                                    {new Date(log.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                </p>
                            </div>
                        </div>
                        <span className="text-gold font-stats font-bold text-sm">
                            +{log.xpAmount} XP
                        </span>
                    </div>
                ))}
            </div>

            {!showAll && hidden > 0 && (
                <button
                    onClick={() => setShowAll(true)}
                    className="mt-2 w-full text-xs font-stats text-muted hover:text-gold border border-surface-3 hover:border-gold/20 py-2 rounded-xl transition-colors"
                >
                    Show {hidden} more entr{hidden === 1 ? "y" : "ies"}
                </button>
            )}
            {showAll && logs.length > LIMIT && (
                <button
                    onClick={() => setShowAll(false)}
                    className="mt-2 w-full text-xs font-stats text-muted hover:text-gold border border-surface-3 hover:border-gold/20 py-2 rounded-xl transition-colors"
                >
                    Show less
                </button>
            )}
        </div>
    )
}
