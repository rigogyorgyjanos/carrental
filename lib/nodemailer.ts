import nodemailer from "nodemailer"

function createProductionTransporter() {
    return nodemailer.createTransport({
        host:   process.env.SMTP_HOST!,
        port:   Number(process.env.SMTP_PORT ?? 587),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
            user: process.env.SMTP_USER!,
            pass: process.env.SMTP_PASS!,
        },
    })
}

async function createEtherealTransporter() {
    if (!process.env.ETHEREAL_USER || !process.env.ETHEREAL_PASS) {
        const testAccount = await nodemailer.createTestAccount()
        process.env.ETHEREAL_USER = testAccount.user
        process.env.ETHEREAL_PASS = testAccount.pass
        console.log("Ethereal test account:", testAccount.user)
    }
    return nodemailer.createTransport({
        host:   "smtp.ethereal.email",
        port:   587,
        secure: false,
        auth: {
            user: process.env.ETHEREAL_USER,
            pass: process.env.ETHEREAL_PASS,
        },
    })
}

export async function sendMail(options: nodemailer.SendMailOptions) {
    const isProduction = process.env.NODE_ENV === "production"
    const hasSMTP      = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)

    // In production, SMTP must be configured — Ethereal is dev-only
    if (isProduction && !hasSMTP) {
        console.error("[nodemailer] SMTP not configured in production — email not sent:", options.subject)
        return
    }

    const transporter = hasSMTP
        ? createProductionTransporter()
        : await createEtherealTransporter()

    const info = await transporter.sendMail({
        from: process.env.SMTP_FROM ?? `"AURUM Car Rental" <noreply@aurum.rent>`,
        ...options,
    })

    if (!hasSMTP) {
        const previewUrl = nodemailer.getTestMessageUrl(info)
        if (previewUrl) console.log("Email preview:", previewUrl)
    }

    return info
}
