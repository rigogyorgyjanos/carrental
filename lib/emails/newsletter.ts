export interface NewsletterEmailData {
    subject:        string
    body:           string   // plain text, paragraphs separated by \n\n; supports {{name}}
    appUrl:         string
    recipientEmail: string
    recipientName?: string   // used to replace {{name}}
    ctaLabel?:      string   // custom CTA button label (default: "Browse Our Fleet →")
    ctaUrl?:        string   // custom CTA URL (default: appUrl/cars)
    isTest?:        boolean  // prepends [TEST] badge in email header
}

export function newsletterHtml(d: NewsletterEmailData): string {
    const gold    = "#C9A84C"
    const dark    = "#0B0B0F"
    const surface = "#141418"
    const muted   = "#6B7280"
    const white   = "#F5F5F0"

    const unsubscribeUrl = `${d.appUrl}/profile`
    const ctaHref  = d.ctaUrl  ?? `${d.appUrl}/cars`
    const ctaLabel = d.ctaLabel ?? "Browse Our Fleet →"
    const displayName = d.recipientName ?? "Member"

    const personalizedBody = d.body.replace(/\{\{name\}\}/g, displayName)

    const bodyHtml = personalizedBody
        .split(/\n\n+/)
        .map(para => para.trim())
        .filter(Boolean)
        .map(para => `<p style="margin:0 0 16px;color:${white};font-size:15px;line-height:1.7;">${para.replace(/\n/g, "<br/>")}</p>`)
        .join("")

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${d.subject}</title>
</head>
<body style="margin:0;padding:0;background:${dark};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">

    <table width="100%" cellpadding="0" cellspacing="0" style="background:${dark};padding:40px 16px;">
        <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

                <!-- Logo -->
                <tr>
                    <td style="padding-bottom:${d.isTest ? "8px" : "32px"};text-align:center;">
                        <span style="font-size:22px;letter-spacing:0.25em;color:${gold};font-weight:600;">◆ AURUM</span>
                    </td>
                </tr>

                ${d.isTest ? `
                <!-- Test badge -->
                <tr>
                    <td style="padding-bottom:24px;text-align:center;">
                        <span style="display:inline-block;background:#F59E0B22;border:1px solid #F59E0B55;color:#F59E0B;font-size:11px;font-weight:600;letter-spacing:0.15em;padding:4px 14px;border-radius:999px;">
                            TEST EMAIL — not sent to real recipients
                        </span>
                    </td>
                </tr>` : ""}

                <!-- Gold divider -->
                <tr>
                    <td style="padding-bottom:32px;">
                        <div style="height:1px;background:linear-gradient(to right,transparent,${gold}60,transparent);"></div>
                    </td>
                </tr>

                <!-- Body card -->
                <tr>
                    <td style="background:${surface};border:1px solid #2a2a30;border-radius:16px;padding:40px;">
                        ${bodyHtml}
                    </td>
                </tr>

                <!-- Spacer -->
                <tr><td style="height:24px;"></td></tr>

                <!-- CTA -->
                <tr>
                    <td style="text-align:center;padding-bottom:32px;">
                        <a href="${ctaHref}"
                           style="display:inline-block;background:${gold};color:#0B0B0F;font-size:14px;font-weight:600;padding:14px 36px;border-radius:12px;text-decoration:none;letter-spacing:0.02em;">
                            ${ctaLabel}
                        </a>
                    </td>
                </tr>

                <!-- Gold divider -->
                <tr>
                    <td style="padding-bottom:24px;">
                        <div style="height:1px;background:linear-gradient(to right,transparent,${gold}40,transparent);"></div>
                    </td>
                </tr>

                <!-- Footer -->
                <tr>
                    <td style="text-align:center;padding-bottom:8px;">
                        <p style="margin:0 0 6px;font-size:12px;color:#3f3f46;">
                            © AURUM Premium Car Rental
                        </p>
                        <p style="margin:0;font-size:11px;color:#3f3f46;">
                            You're receiving this because you opted in to promotional emails. ·
                            <a href="${unsubscribeUrl}" style="color:${muted};text-decoration:underline;">Manage preferences</a>
                        </p>
                    </td>
                </tr>

            </table>
        </td></tr>
    </table>
</body>
</html>`
}
