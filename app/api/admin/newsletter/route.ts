import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { sendMail } from "@/lib/nodemailer"
import { newsletterHtml } from "@/lib/emails/newsletter"
import { buildRecipientWhere, type NewsletterFilters } from "@/lib/newsletterFilters"

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { subject, body, ctaLabel, ctaUrl, filters } = await req.json() as {
        subject:   string
        body:      string
        ctaLabel?: string
        ctaUrl?:   string
        filters?:  NewsletterFilters
    }

    if (!subject?.trim() || !body?.trim()) {
        return NextResponse.json({ error: "Subject and body are required" }, { status: 400 })
    }

    const where = buildRecipientWhere(filters ?? {})

    const recipients = await prisma.user.findMany({
        where,
        select: { email: true, name: true },
    })

    if (recipients.length === 0) {
        return NextResponse.json({ sent: 0, failed: 0, total: 0 })
    }

    const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
    let sent   = 0
    let failed = 0

    for (const user of recipients) {
        if (!user.email) continue
        try {
            await sendMail({
                to:      user.email,
                subject: subject.trim(),
                html:    newsletterHtml({
                    subject:        subject.trim(),
                    body:           body.trim(),
                    appUrl,
                    recipientEmail: user.email,
                    recipientName:  user.name ?? undefined,
                    ctaLabel:       ctaLabel?.trim() || undefined,
                    ctaUrl:         ctaUrl?.trim()   || undefined,
                }),
            })
            sent++
        } catch (err) {
            console.error(`[newsletter] Failed to send to ${user.email}:`, err)
            failed++
        }
    }

    await prisma.newsletterLog.create({
        data: {
            subject:    subject.trim(),
            body:       body.trim(),
            sentCount:  sent,
            failedCount: failed,
            filters:    filters ? JSON.stringify(filters) : null,
            sentBy:     session.user.id,
        },
    })

    return NextResponse.json({ sent, failed, total: recipients.length })
}

// GET — return send history (last 20)
export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const logs = await prisma.newsletterLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
            id:          true,
            subject:     true,
            sentCount:   true,
            failedCount: true,
            filters:     true,
            createdAt:   true,
        },
    })

    return NextResponse.json({ logs })
}
