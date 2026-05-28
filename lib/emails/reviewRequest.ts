export interface ReviewRequestEmailData {
    userName:    string
    carBrand:    string
    carName:     string
    reviewUrl:   string
    expiresAt:   Date
    appUrl:      string
}

export function reviewRequestHtml(d: ReviewRequestEmailData): string {
    const gold    = "#C9A84C"
    const dark    = "#0B0B0F"
    const surface = "#141418"
    const muted   = "#6B7280"
    const white   = "#F5F5F0"

    const expiry = d.expiresAt.toLocaleDateString("en-GB", {
        day: "numeric", month: "long", year: "numeric",
    })

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Review your AURUM rental</title>
</head>
<body style="margin:0;padding:0;background:${dark};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:${dark};padding:40px 16px;">
        <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${surface};border-radius:16px;overflow:hidden;border:1px solid #1F1F28;">

                <!-- Header -->
                <tr>
                    <td style="padding:32px 40px 24px;border-bottom:1px solid #1F1F28;text-align:center;">
                        <div style="color:${gold};font-size:13px;letter-spacing:0.25em;font-weight:600;">◆ AURUM</div>
                        <div style="color:${muted};font-size:11px;letter-spacing:0.1em;margin-top:4px;">LUXURY RENTALS</div>
                    </td>
                </tr>

                <!-- Body -->
                <tr>
                    <td style="padding:36px 40px 32px;">
                        <p style="color:${muted};font-size:13px;margin:0 0 24px;">Hello ${d.userName},</p>

                        <h1 style="color:${white};font-size:22px;font-weight:300;margin:0 0 8px;letter-spacing:0.02em;">
                            How was your experience?
                        </h1>
                        <p style="color:${muted};font-size:14px;margin:0 0 28px;line-height:1.6;">
                            Your rental of the <strong style="color:${white};">${d.carBrand} ${d.carName}</strong> is now complete.
                            We'd love to hear what you thought — your feedback helps other drivers and improves our fleet.
                        </p>

                        <!-- Star hint -->
                        <div style="background:#0B0B0F;border:1px solid #1F1F28;border-radius:12px;padding:20px 24px;margin-bottom:28px;text-align:center;">
                            <div style="color:${gold};font-size:28px;letter-spacing:4px;margin-bottom:8px;">★★★★★</div>
                            <p style="color:${muted};font-size:12px;margin:0;">Rate from 1 to 5 stars and leave a comment</p>
                        </div>

                        <!-- CTA -->
                        <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td align="center" style="padding:8px 0 28px;">
                                    <a href="${d.reviewUrl}"
                                       style="display:inline-block;background:${gold};color:#0B0B0F;text-decoration:none;font-weight:700;font-size:14px;padding:14px 40px;border-radius:10px;letter-spacing:0.05em;">
                                        Leave a Review
                                    </a>
                                </td>
                            </tr>
                        </table>

                        <!-- Bonus XP note -->
                        <div style="background:#0B0B0F;border:1px solid #1F1F28;border-radius:12px;padding:16px 20px;margin-bottom:28px;display:flex;align-items:center;gap:12px;">
                            <p style="color:${muted};font-size:13px;margin:0;">
                                <span style="color:${gold};font-weight:600;">◆ +1 XP</span> awarded for submitting your review.
                            </p>
                        </div>

                        <p style="color:${muted};font-size:12px;margin:0;line-height:1.6;">
                            This link expires on <strong style="color:${white};">${expiry}</strong>.
                            If you already submitted a review or don't wish to, simply ignore this email.
                        </p>
                    </td>
                </tr>

                <!-- Footer -->
                <tr>
                    <td style="padding:20px 40px;border-top:1px solid #1F1F28;text-align:center;">
                        <p style="color:${muted};font-size:11px;margin:0;">
                            © AURUM Luxury Rentals · <a href="${d.appUrl}" style="color:${gold};text-decoration:none;">${d.appUrl.replace(/^https?:\/\//, "")}</a>
                        </p>
                    </td>
                </tr>

            </table>
        </td></tr>
    </table>
</body>
</html>`
}
