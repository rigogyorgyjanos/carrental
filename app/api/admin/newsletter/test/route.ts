import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { sendMail } from "@/lib/nodemailer"
import { newsletterHtml } from "@/lib/emails/newsletter"

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const adminEmail = session.user.email
    if (!adminEmail) {
        return NextResponse.json({ error: "Admin account has no email" }, { status: 400 })
    }

    const { subject, body, ctaLabel, ctaUrl } = await req.json() as {
        subject:   string
        body:      string
        ctaLabel?: string
        ctaUrl?:   string
    }

    if (!subject?.trim() || !body?.trim()) {
        return NextResponse.json({ error: "Subject and body are required" }, { status: 400 })
    }

    const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
    const testSubject = `[TEST] ${subject.trim()}`

    await sendMail({
        to:      adminEmail,
        subject: testSubject,
        html:    newsletterHtml({
            subject:        testSubject,
            body:           body.trim(),
            appUrl,
            recipientEmail: adminEmail,
            recipientName:  session.user.name ?? undefined,
            ctaLabel:       ctaLabel?.trim() || undefined,
            ctaUrl:         ctaUrl?.trim()   || undefined,
            isTest:         true,
        }),
    })

    return NextResponse.json({ ok: true, sentTo: adminEmail })
}
