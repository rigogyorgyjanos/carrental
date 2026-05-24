export interface BookingEmailData {
    userName:        string
    userEmail:       string
    carName:         string
    carBrand:        string
    startDate:       string   // pre-formatted e.g. "12 Jun 2025"
    endDate:         string
    totalDays:       number
    pricePerDay:     number
    subtotal:        number
    discountAmount:  number   // 0 if none
    discountPct:     number   // 0–100
    serviceFee:      number
    totalPrice:      number
    deposit:         number | null
    xpToEarn:        number
    tierName:        string
    bookingId:       string
    appUrl:          string
}

export function bookingConfirmationHtml(d: BookingEmailData): string {
    const gold   = "#C9A84C"
    const dark   = "#0B0B0F"
    const surface = "#141418"
    const muted  = "#6B7280"
    const white  = "#F5F5F0"

    const confirmUrl = `${d.appUrl}/bookings/${d.bookingId}/confirm`

    const discountRow = d.discountPct > 0 ? `
        <tr>
            <td style="padding: 8px 0; color: ${muted}; font-size: 13px;">Loyalty discount (${d.discountPct}% — ${d.tierName})</td>
            <td style="padding: 8px 0; color: #34D399; font-size: 13px; text-align: right;">−€${d.discountAmount.toFixed(2)}</td>
        </tr>` : ""

    const depositRow = d.deposit ? `
        <tr>
            <td style="padding: 8px 0; color: ${muted}; font-size: 13px;">Refundable deposit</td>
            <td style="padding: 8px 0; color: ${white}; font-size: 13px; text-align: right;">€${d.deposit.toFixed(2)}</td>
        </tr>` : ""

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Booking Confirmed — AURUM</title>
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

                <!-- Hero card -->
                <tr>
                    <td style="background:${surface};border:1px solid #2a2a30;border-radius:16px;padding:40px;text-align:center;">
                        <div style="font-size:48px;margin-bottom:16px;">🎉</div>
                        <h1 style="margin:0 0 8px;color:${white};font-size:26px;font-weight:300;letter-spacing:0.02em;">
                            Booking Confirmed
                        </h1>
                        <p style="margin:0;color:${muted};font-size:14px;">
                            Hi ${d.userName}, your reservation is pending confirmation from our team.
                        </p>
                    </td>
                </tr>

                <!-- Spacer -->
                <tr><td style="height:20px;"></td></tr>

                <!-- Car + dates card -->
                <tr>
                    <td style="background:${surface};border:1px solid #2a2a30;border-radius:16px;padding:32px;">
                        <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.2em;color:${gold};text-transform:uppercase;">Vehicle</p>
                        <h2 style="margin:0 0 20px;font-size:22px;font-weight:300;color:${white};">${d.carBrand} ${d.carName}</h2>

                        <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td width="50%" style="padding-right:12px;">
                                    <div style="background:#1e1e24;border:1px solid #2a2a30;border-radius:12px;padding:14px;">
                                        <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:${muted};">Check-in</p>
                                        <p style="margin:0;font-size:15px;font-weight:600;color:${white};">${d.startDate}</p>
                                    </div>
                                </td>
                                <td width="50%" style="padding-left:12px;">
                                    <div style="background:#1e1e24;border:1px solid #2a2a30;border-radius:12px;padding:14px;">
                                        <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:${muted};">Check-out</p>
                                        <p style="margin:0;font-size:15px;font-weight:600;color:${white};">${d.endDate}</p>
                                    </div>
                                </td>
                            </tr>
                        </table>

                        <p style="margin:16px 0 0;font-size:13px;color:${muted};text-align:center;">
                            ${d.totalDays} day${d.totalDays > 1 ? "s" : ""} · €${d.pricePerDay}/day
                        </p>
                    </td>
                </tr>

                <!-- Spacer -->
                <tr><td style="height:20px;"></td></tr>

                <!-- Price breakdown -->
                <tr>
                    <td style="background:${surface};border:1px solid #2a2a30;border-radius:16px;padding:32px;">
                        <p style="margin:0 0 20px;font-size:11px;letter-spacing:0.2em;color:${gold};text-transform:uppercase;">Price Breakdown</p>

                        <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td style="padding: 8px 0; color: ${muted}; font-size: 13px;">€${d.pricePerDay} × ${d.totalDays} day${d.totalDays > 1 ? "s" : ""}</td>
                                <td style="padding: 8px 0; color: ${white}; font-size: 13px; text-align: right;">€${d.subtotal.toFixed(2)}</td>
                            </tr>
                            ${discountRow}
                            <tr>
                                <td style="padding: 8px 0; color: ${muted}; font-size: 13px;">Service fee</td>
                                <td style="padding: 8px 0; color: ${white}; font-size: 13px; text-align: right;">€${d.serviceFee.toFixed(2)}</td>
                            </tr>
                            ${depositRow}
                            <tr>
                                <td colspan="2" style="padding-top:16px;border-top:1px solid #2a2a30;"></td>
                            </tr>
                            <tr>
                                <td style="padding-top: 8px; color: ${white}; font-size: 16px; font-weight: 600;">Total</td>
                                <td style="padding-top: 8px; color: ${gold}; font-size: 20px; font-weight: 700; text-align: right;">€${d.totalPrice.toFixed(2)}</td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <!-- Spacer -->
                <tr><td style="height:20px;"></td></tr>

                <!-- XP badge -->
                ${d.xpToEarn > 0 ? `
                <tr>
                    <td style="background:#1c1a0f;border:1px solid ${gold}30;border-radius:16px;padding:24px;text-align:center;">
                        <span style="font-size:20px;">◆</span>
                        <p style="margin:8px 0 4px;font-size:16px;font-weight:600;color:${gold};">+${d.xpToEarn} XP to earn</p>
                        <p style="margin:0;font-size:13px;color:${muted};">You'll receive this XP when your rental is completed.</p>
                    </td>
                </tr>
                <tr><td style="height:20px;"></td></tr>` : ""}

                <!-- CTA -->
                <tr>
                    <td style="text-align:center;padding:8px 0 32px;">
                        <a href="${confirmUrl}"
                           style="display:inline-block;background:${gold};color:#0B0B0F;font-size:14px;font-weight:600;padding:14px 36px;border-radius:12px;text-decoration:none;letter-spacing:0.02em;">
                            View Booking →
                        </a>
                    </td>
                </tr>

                <!-- Footer -->
                <tr>
                    <td style="text-align:center;padding-bottom:16px;">
                        <p style="margin:0;font-size:12px;color:#3f3f46;">
                            © AURUM Premium Car Rental · You're receiving this because you made a booking.
                        </p>
                    </td>
                </tr>

            </table>
        </td></tr>
    </table>
</body>
</html>`
}
