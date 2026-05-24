const REQUIRED_VARS = [
    "DATABASE_URL",
    "NEXTAUTH_URL",
    "NEXTAUTH_SECRET",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
] as const

export function validateEnv(): void {
    const missing = REQUIRED_VARS.filter(key => !process.env[key])

    if (missing.length > 0) {
        throw new Error(
            `[AURUM] Missing required environment variables:\n  ${missing.join("\n  ")}\n` +
            `Please add them to your .env file.`
        )
    }

    if (!process.env.CRON_SECRET) {
        console.warn("[AURUM] CRON_SECRET is not set — the cron endpoint will return 503 until configured")
    }

    if (process.env.NODE_ENV === "production" && !process.env.SMTP_HOST) {
        console.warn("[AURUM] SMTP not configured in production — booking confirmation emails will not be sent")
    }
}
