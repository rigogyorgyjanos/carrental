import { EventEffectType } from "@prisma/client"
import { effectLabel } from "@/lib/events"

export interface EventAnnouncementData {
    eventTitle:       string
    eventDescription: string
    effectType:       EventEffectType
    effectValue:      number
    targetCategories: string[]
    targetBrands:     string[]
    startsAt:         Date
    endsAt:           Date
    companyName:      string | null
    recipientName:    string | null
    appUrl:           string
}

export function eventAnnouncementHtml(d: EventAnnouncementData): string {
    const gold    = "#C9A84C"
    const dark    = "#0B0B0F"
    const surface = "#141418"
    const muted   = "#6B7280"
    const white   = "#F5F5F0"

    const fmt = (dt: Date) =>
        dt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })

    const label = effectLabel(d.effectType, d.effectValue)

    const effectColors: Record<EventEffectType, string> = {
        DISCOUNT_PCT:     "#34D399",
        XP_MULTIPLIER:    "#C9A84C",
        EXTRA_KM_PER_DAY: "#60A5FA",
        FREE_DAYS:        "#A78BFA",
    }
    const effectClr = effectColors[d.effectType] ?? gold

    const scopeLines: string[] = []
    if (d.targetCategories.length > 0)
        scopeLines.push(`<b>Categories:</b> ${d.targetCategories.join(", ")}`)
    if (d.targetBrands.length > 0)
        scopeLines.push(`<b>Brands:</b> ${d.targetBrands.join(", ")}`)
    if (scopeLines.length === 0)
        scopeLines.push("All vehicles")

    const descHtml = d.eventDescription
        ? `<p style="margin:0 0 16px;color:${white};font-size:15px;line-height:1.7;">${d.eventDescription}</p>`
        : ""

    const companyLine = d.companyName
        ? `<p style="margin:0 0 24px;font-size:12px;color:${muted};text-align:center;">From ${d.companyName}</p>`
        : ""

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${d.eventTitle} — AURUM</title>
</head>
<body style="margin:0;padding:0;background:${dark};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">

    <table width="100%" cellpadding="0" cellspacing="0" style="background:${dark};padding:40px 16px;">
        <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

                <!-- Logo -->
                <tr>
                    <td style="padding-bottom:32px;text-align:center;">
                        <span style="font-size:22px;letter-spacing:0.25em;color:${gold};font-weight:600;">◆ AURUM</span>
                    </td>
                </tr>

                <!-- Gold divider -->
                <tr>
                    <td style="padding-bottom:32px;">
                        <div style="height:1px;background:linear-gradient(to right,transparent,${gold}60,transparent);"></div>
                    </td>
                </tr>

                <!-- Hero card -->
                <tr>
                    <td style="background:${surface};border:1px solid #2a2a30;border-radius:16px;padding:40px;text-align:center;">
                        <div style="display:inline-block;background:${effectClr}18;border:1px solid ${effectClr}40;border-radius:999px;padding:8px 20px;margin-bottom:20px;">
                            <span style="color:${effectClr};font-size:18px;font-weight:700;letter-spacing:0.05em;">${label}</span>
                        </div>
                        <h1 style="margin:0 0 12px;color:${white};font-size:28px;font-weight:300;letter-spacing:0.02em;">
                            ${d.eventTitle}
                        </h1>
                        ${companyLine}
                        ${descHtml}
                    </td>
                </tr>

                <!-- Spacer -->
                <tr><td style="height:20px;"></td></tr>

                <!-- Details card -->
                <tr>
                    <td style="background:${surface};border:1px solid #2a2a30;border-radius:16px;padding:32px;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td style="padding:10px 0;border-bottom:1px solid #2a2a30;">
                                    <span style="color:${muted};font-size:12px;text-transform:uppercase;letter-spacing:0.1em;">Starts</span>
                                </td>
                                <td style="padding:10px 0;border-bottom:1px solid #2a2a30;text-align:right;">
                                    <span style="color:${white};font-size:13px;font-weight:600;">${fmt(d.startsAt)}</span>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:10px 0;border-bottom:1px solid #2a2a30;">
                                    <span style="color:${muted};font-size:12px;text-transform:uppercase;letter-spacing:0.1em;">Ends</span>
                                </td>
                                <td style="padding:10px 0;border-bottom:1px solid #2a2a30;text-align:right;">
                                    <span style="color:${white};font-size:13px;font-weight:600;">${fmt(d.endsAt)}</span>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:10px 0;border-bottom:1px solid #2a2a30;">
                                    <span style="color:${muted};font-size:12px;text-transform:uppercase;letter-spacing:0.1em;">Applies to</span>
                                </td>
                                <td style="padding:10px 0;border-bottom:1px solid #2a2a30;text-align:right;">
                                    <span style="color:${white};font-size:13px;">${scopeLines.join(" · ")}</span>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:10px 0;">
                                    <span style="color:${muted};font-size:12px;text-transform:uppercase;letter-spacing:0.1em;">Benefit</span>
                                </td>
                                <td style="padding:10px 0;text-align:right;">
                                    <span style="color:${effectClr};font-size:14px;font-weight:700;">${label}</span>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <!-- Spacer -->
                <tr><td style="height:24px;"></td></tr>

                <!-- CTA -->
                <tr>
                    <td style="text-align:center;padding-bottom:32px;">
                        <a href="${d.appUrl}/events"
                           style="display:inline-block;background:${gold};color:#0B0B0F;font-size:14px;font-weight:600;padding:14px 36px;border-radius:12px;text-decoration:none;letter-spacing:0.02em;">
                            View Event →
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
                        <p style="margin:0 0 6px;font-size:12px;color:#3f3f46;">© AURUM Premium Car Rental</p>
                        <p style="margin:0;font-size:11px;color:#3f3f46;">
                            You're receiving this because you opted in to promotional emails. ·
                            <a href="${d.appUrl}/profile" style="color:${muted};text-decoration:underline;">Manage preferences</a>
                        </p>
                    </td>
                </tr>

            </table>
        </td></tr>
    </table>
</body>
</html>`
}
