import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { cloudinary } from "@/lib/cloudinary"

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== "MODERATOR" && session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"]
    if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ error: "Invalid file type. Use JPEG, PNG, WebP or AVIF." }, { status: 400 })
    }
    if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: "File too large (max 10 MB)." }, { status: 400 })
    }

    const bytes  = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
        cloudinary.uploader
            .upload_stream({ folder: "aurum-cars", resource_type: "image" }, (err, res) => {
                if (err || !res) reject(err ?? new Error("Upload failed"))
                else resolve(res as { secure_url: string })
            })
            .end(buffer)
    })

    return NextResponse.json({ url: result.secure_url })
}
