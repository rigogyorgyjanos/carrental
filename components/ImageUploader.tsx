"use client"

import { useImperativeHandle, forwardRef, useRef, useState } from "react"

type ImageEntry =
    | { kind: "url";  url: string }
    | { kind: "file"; file: File; preview: string }

export type ImageUploaderHandle = {
    /** Uploads pending files and returns all final URLs */
    uploadAll: () => Promise<string[]>
}

interface Props {
    initialUrls?: string[]
}

const ImageUploader = forwardRef<ImageUploaderHandle, Props>(function ImageUploader(
    { initialUrls = [] },
    ref,
) {
    const [entries,     setEntries]     = useState<ImageEntry[]>(
        initialUrls.filter(Boolean).map(url => ({ kind: "url", url }))
    )
    const [uploading,   setUploading]   = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    useImperativeHandle(ref, () => ({
        async uploadAll() {
            setUploading(true)
            setUploadError(null)
            const urls: string[] = []
            for (const entry of entries) {
                if (entry.kind === "url") {
                    urls.push(entry.url)
                } else {
                    const fd = new FormData()
                    fd.append("file", entry.file)
                    try {
                        const res  = await fetch("/api/upload", { method: "POST", body: fd })
                        const data = await res.json()
                        if (!res.ok) throw new Error(data.error ?? "Upload failed")
                        urls.push(data.url)
                    } catch (err: any) {
                        setUploading(false)
                        const msg = err?.message ?? "Image upload failed. Please try again."
                        setUploadError(msg)
                        throw new Error(msg)
                    }
                }
            }
            setUploading(false)
            return urls
        },
    }))

    const handleFiles = (files: FileList | null) => {
        if (!files) return
        const newEntries: ImageEntry[] = Array.from(files).map(file => ({
            kind:    "file",
            file,
            preview: URL.createObjectURL(file),
        }))
        setEntries(prev => [...prev, ...newEntries])
    }

    const remove = (i: number) => {
        setEntries(prev => {
            const entry = prev[i]
            if (entry.kind === "file") URL.revokeObjectURL(entry.preview)
            return prev.filter((_, idx) => idx !== i)
        })
    }

    const previewSrc = (e: ImageEntry) => e.kind === "url" ? e.url : e.preview

    return (
        <div className="space-y-3">
            {/* Image grid */}
            {entries.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {entries.map((entry, i) => (
                        <div key={i} className="relative group rounded-xl overflow-hidden border border-surface-3 aspect-4/3 bg-surface-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={previewSrc(entry)}
                                alt={`Image ${i + 1}`}
                                className="w-full h-full object-cover"
                            />
                            {/* Pending upload badge */}
                            {entry.kind === "file" && (
                                <span className="absolute top-1.5 left-1.5 text-[9px] font-stats uppercase tracking-wider bg-amber-500/80 text-dark px-1.5 py-0.5 rounded-md">
                                    pending
                                </span>
                            )}
                            {/* Remove button */}
                            <button
                                type="button"
                                onClick={() => remove(i)}
                                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-dark/70 text-danger flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-danger hover:text-dark"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload button */}
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    disabled={uploading}
                    onClick={() => inputRef.current?.click()}
                    className="inline-flex items-center gap-2 text-[11px] font-stats text-muted hover:text-gold border border-surface-3 hover:border-gold/20 px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                >
                    <span className="text-base leading-none">↑</span>
                    {uploading ? "Uploading…" : entries.length === 0 ? "Add Images" : "Add More"}
                </button>
                {entries.length > 0 && (
                    <p className="text-[11px] font-stats text-muted">
                        {entries.length} image{entries.length !== 1 ? "s" : ""}
                        {entries.filter(e => e.kind === "file").length > 0 && (
                            <span className="text-amber-400/80 ml-1">
                                ({entries.filter(e => e.kind === "file").length} to upload)
                            </span>
                        )}
                    </p>
                )}
            </div>

            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                multiple
                className="hidden"
                onChange={e => handleFiles(e.target.files)}
            />

            {uploadError && (
                <p className="text-danger text-xs font-stats">{uploadError}</p>
            )}

            {/* Drop hint */}
            <p className="text-[10px] font-stats text-muted/60">
                JPEG, PNG, WebP or AVIF · max 10 MB per image
            </p>
        </div>
    )
})

export default ImageUploader
