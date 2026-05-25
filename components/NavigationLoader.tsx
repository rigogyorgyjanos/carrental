"use client"

import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"

export default function NavigationLoader() {
    const pathname      = usePathname()
    const prevPath      = useRef(pathname)
    const [visible, setVisible] = useState(false)
    const timeoutRef    = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Hide when navigation completes (pathname changed)
    useEffect(() => {
        if (pathname !== prevPath.current) {
            setVisible(false)
            prevPath.current = pathname
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
        }
    }, [pathname])

    // Show on any internal link click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const anchor = (e.target as HTMLElement).closest("a")
            if (!anchor) return

            const href = anchor.getAttribute("href")
            if (!href) return
            if (href.startsWith("#")) return
            if (href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:")) return
            if (anchor.getAttribute("target") === "_blank") return
            // Same page — no loading needed
            if (href === pathname || href === window.location.pathname) return

            setVisible(true)

            // Failsafe: auto-hide after 8 s in case something goes wrong
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
            timeoutRef.current = setTimeout(() => setVisible(false), 8000)
        }

        document.addEventListener("click", handleClick)
        return () => {
            document.removeEventListener("click", handleClick)
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
        }
    }, [pathname])

    if (!visible) return null

    return (
        <div
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-5"
            style={{ background: "rgba(11,11,15,0.65)", backdropFilter: "blur(6px)" }}
        >
            {/* Spinning ring */}
            <div className="relative w-14 h-14">
                <div className="absolute inset-0 rounded-full border-2 border-surface-3" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-gold animate-spin" />
            </div>

            {/* Label */}
            <span className="text-muted text-[10px] font-stats uppercase tracking-[0.3em]">
                Loading
            </span>
        </div>
    )
}
