"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"

interface CarImage {
    id: string
    url: string
}

interface Props {
    images: CarImage[]
    carName: string
}

export default function CarGallery({ images, carName }: Props) {
    const [lightboxOpen, setLightboxOpen] = useState(false)
    const [activeIndex, setActiveIndex] = useState(0)
    const [touchStart, setTouchStart] = useState<number | null>(null)
    const closeBtnRef  = useRef<HTMLButtonElement>(null)
    const triggerRef   = useRef<HTMLButtonElement>(null)

    const total = images.length

    // ── Focus management: move focus into lightbox on open, restore on close ──
    useEffect(() => {
        if (lightboxOpen) {
            closeBtnRef.current?.focus()
        } else {
            triggerRef.current?.focus()
        }
    }, [lightboxOpen])

    // ── Keyboard navigation + focus trap ────────────────────────────────────
    useEffect(() => {
        if (!lightboxOpen) return
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape")      setLightboxOpen(false)
            if (e.key === "ArrowLeft")   goTo((activeIndex - 1 + total) % total)
            if (e.key === "ArrowRight")  goTo((activeIndex + 1) % total)
            // Trap Tab within the lightbox overlay
            if (e.key === "Tab") {
                const overlay = document.getElementById("lightbox-overlay")
                if (!overlay) return
                const focusable = overlay.querySelectorAll<HTMLElement>(
                    "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
                )
                const first = focusable[0]
                const last  = focusable[focusable.length - 1]
                if (e.shiftKey) {
                    if (document.activeElement === first) { e.preventDefault(); last.focus() }
                } else {
                    if (document.activeElement === last)  { e.preventDefault(); first.focus() }
                }
            }
        }
        window.addEventListener("keydown", handler)
        return () => window.removeEventListener("keydown", handler)
    }, [lightboxOpen, activeIndex, total])

    // ── Body scroll lock ─────────────────────────────────────────────────
    useEffect(() => {
        document.body.style.overflow = lightboxOpen ? "hidden" : ""
        return () => { document.body.style.overflow = "" }
    }, [lightboxOpen])

    function goTo(index: number) {
        setActiveIndex(index)
    }

    function openLightbox(index: number) {
        setActiveIndex(index)
        setLightboxOpen(true)
    }

    // ── Swipe support ────────────────────────────────────────────────────
    function handleTouchStart(e: React.TouchEvent) {
        setTouchStart(e.touches[0].clientX)
    }

    function handleTouchEnd(e: React.TouchEvent) {
        if (touchStart === null) return
        const delta = touchStart - e.changedTouches[0].clientX
        if (Math.abs(delta) > 50) {
            goTo(delta > 0
                ? (activeIndex + 1) % total
                : (activeIndex - 1 + total) % total
            )
        }
        setTouchStart(null)
    }

    // ── Placeholder (no images) ──────────────────────────────────────────
    if (total === 0) {
        return (
            <div className="w-full h-[480px] bg-surface-2 flex flex-col items-center justify-center gap-3">
                <span className="text-muted text-6xl">◎</span>
                <p className="text-muted text-sm font-stats">No photos available</p>
            </div>
        )
    }

    const main  = images[0]
    const right = images.slice(1, 3)   // max 2 secondary images
    const extra = Math.max(0, total - 3)

    return (
        <>
            {/* ── Gallery grid ──────────────────────────────────────────── */}
            <div className="relative w-full overflow-hidden" style={{ height: "clamp(300px, 55vh, 560px)" }}>

                {total === 1 ? (
                    /* Single image — full width */
                    <button
                        ref={triggerRef}
                        className="relative w-full h-full block overflow-hidden"
                        onClick={() => openLightbox(0)}
                        aria-label="View photo"
                    >
                        <Image
                            src={main.url}
                            alt={carName}
                            fill
                            sizes="100vw"
                            className="object-cover hover:scale-[1.03] transition-transform duration-700"
                        />
                    </button>

                ) : (
                    /* Mosaic: left large + right column */
                    <div
                        className={`grid gap-1 h-full ${
                            total >= 3 ? "grid-cols-[2fr_1fr]" : "grid-cols-2"
                        }`}
                    >
                        {/* Main image */}
                        <button
                            className={`relative overflow-hidden ${total >= 3 ? "row-span-2" : ""}`}
                            onClick={() => openLightbox(0)}
                            aria-label="View main photo"
                        >
                            <Image
                                src={main.url}
                                alt={carName}
                                fill
                                sizes="(max-width: 768px) 100vw, 66vw"
                                className="object-cover hover:scale-[1.03] transition-transform duration-700 cursor-pointer"
                            />
                        </button>

                        {/* Secondary images */}
                        {right.map((img, i) => (
                            <button
                                key={img.id}
                                className="relative overflow-hidden"
                                onClick={() => openLightbox(i + 1)}
                                aria-label={`View photo ${i + 2}`}
                            >
                                <Image
                                    src={img.url}
                                    alt={`${carName} ${i + 2}`}
                                    fill
                                    sizes="(max-width: 768px) 50vw, 33vw"
                                    className="object-cover hover:scale-[1.05] transition-transform duration-500 cursor-pointer"
                                />
                                {/* "+N more" overlay on last secondary image */}
                                {i === right.length - 1 && extra > 0 && (
                                    <div className="absolute inset-0 bg-dark/70 flex items-center justify-center">
                                        <span className="font-heading text-white text-2xl font-semibold">
                                            +{extra} more
                                        </span>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                )}

                {/* "All X photos" button — bottom right */}
                {total > 1 && (
                    <button
                        onClick={() => openLightbox(0)}
                        className="absolute bottom-4 right-4 flex items-center gap-2 bg-dark/80 backdrop-blur-sm border border-surface-3 hover:border-gold/30 text-white-soft text-xs font-stats px-4 py-2 rounded-full transition-all hover:bg-surface"
                    >
                        <span className="text-gold">⊞</span>
                        All {total} photos
                    </button>
                )}
            </div>

            {/* ── Lightbox ──────────────────────────────────────────────── */}
            {lightboxOpen && (
                <div
                    id="lightbox-overlay"
                    role="dialog"
                    aria-modal="true"
                    aria-label={`${carName} photo gallery`}
                    className="fixed inset-0 z-[100] bg-black/96 flex items-center justify-center"
                    onClick={e => { if (e.target === e.currentTarget) setLightboxOpen(false) }}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    {/* Close */}
                    <button
                        ref={closeBtnRef}
                        onClick={() => setLightboxOpen(false)}
                        className="absolute top-5 right-5 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-surface/80 border border-surface-3 text-muted hover:text-white-soft transition-colors"
                        aria-label="Close gallery"
                    >
                        ✕
                    </button>

                    {/* Counter */}
                    <p className="absolute top-5 left-1/2 -translate-x-1/2 text-muted text-xs font-stats z-10">
                        {activeIndex + 1} / {total}
                    </p>

                    {/* Main image */}
                    <img
                        src={images[activeIndex].url}
                        alt={`${carName} — photo ${activeIndex + 1}`}
                        className="max-h-[82vh] max-w-[88vw] object-contain select-none"
                        draggable={false}
                    />

                    {/* Prev / Next */}
                    {total > 1 && (
                        <>
                            <button
                                onClick={() => goTo((activeIndex - 1 + total) % total)}
                                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-surface/70 border border-surface-3 hover:bg-surface hover:border-gold/30 text-white text-xl transition-all"
                                aria-label="Previous photo"
                            >
                                ‹
                            </button>
                            <button
                                onClick={() => goTo((activeIndex + 1) % total)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-surface/70 border border-surface-3 hover:bg-surface hover:border-gold/30 text-white text-xl transition-all"
                                aria-label="Next photo"
                            >
                                ›
                            </button>
                        </>
                    )}

                    {/* Thumbnails */}
                    {total > 1 && (
                        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 max-w-[90vw] overflow-x-auto pb-1">
                            {images.map((img, i) => (
                                <button
                                    key={img.id}
                                    onClick={() => goTo(i)}
                                    className={`shrink-0 w-16 h-11 rounded-lg overflow-hidden border-2 transition-all ${
                                        i === activeIndex
                                            ? "border-gold opacity-100"
                                            : "border-transparent opacity-40 hover:opacity-70"
                                    }`}
                                    aria-label={`Go to photo ${i + 1}`}
                                >
                                    <Image src={img.url} alt="" fill sizes="64px" className="object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </>
    )
}
