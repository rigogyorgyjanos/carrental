export interface KmPurchaseEmailData {
    userName:    string
    userEmail:   string
    carBrand:    string
    carName:     string
    kmAmount:    number
    pricePaid:   number
    totalKm:     number
    bookingId:   string
    appUrl:      string
}

export function kmPurchaseConfirmationHtml(d: KmPurchaseEmailData): string {
    const gold    = "#C9A84C"
    const dark    = "#0B0B0F"
    const surface = "#141418"
    const muted   = "#6B7280"
    const white   = "#F5F5F0"
    const emerald = "#34D399"

    const profileUrl = `${d.appUrl}/profile`

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Extra Km Activated — AURUM</title>
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
                        <div style="font-size:48px;margin-bottom:16px;">📏</div>
                        <h1 style="margin:0 0 8px;color:${white};font-size:26px;font-weight:300;letter-spacing:0.02em;">
                            +${d.kmAmount} km Activated
                        </h1>
                        <p style="margin:0;color:${muted};font-size:14px;">
                            Hi ${d.userName}, your extra km package has been added to your active rental.
                        </p>
                    </td>
                </tr>

                <!-- Spacer -->
                <tr><td style="height:20px;"></td></tr>

                <!-- Vehicle + km details -->
                <tr>
                    <td style="background:${surface};border:1px solid #2a2a30;border-radius:16px;padding:32px;">
                        <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.2em;color:${gold};text-transform:uppercase;">Vehicle</p>
                        <h2 style="margin:0 0 24px;font-size:22px;font-weight:300;color:${white};">${d.carBrand} ${d.carName}</h2>

                        <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td style="padding:10px 0;border-bottom:1px solid #2a2a30;color:${muted};font-size:13px;">
                                    Package purchased
                                </td>
                                <td style="padding:10px 0;border-bottom:1px solid #2a2a30;color:${emerald};font-size:13px;font-weight:600;text-align:right;">
                                    +${d.kmAmount} km
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:10px 0;border-bottom:1px solid #2a2a30;color:${muted};font-size:13px;">
                                    Amount charged
                                </td>
                                <td style="padding:10px 0;border-bottom:1px solid #2a2a30;color:${white};font-size:13px;text-align:right;">
                                    €${d.pricePaid.toFixed(2)}
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:14px 0 0;color:${white};font-size:15px;font-weight:600;">
                                    Total included km
                                </td>
                                <td style="padding:14px 0 0;color:${gold};font-size:18px;font-weight:700;text-align:right;">
                                    ${d.totalKm.toLocaleString()} km
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <!-- Spacer -->
                <tr><td style="height:20px;"></td></tr>

                <!-- Non-refundable notice -->
                <tr>
                    <td style="background:#1a140a;border:1px solid #92400e40;border-radius:16px;padding:20px 24px;">
                        <p style="margin:0;font-size:13px;color:#fbbf24cc;line-height:1.6;">
                            ⚠ <strong>Non-refundable.</strong> Unused km from this package will not be reimbursed upon vehicle return.
                        </p>
                    </td>
                </tr>

                <!-- Spacer -->
                <tr><td style="height:20px;"></td></tr>

                <!-- CTA -->
                <tr>
                    <td style="text-align:center;padding:8px 0 32px;">
                        <a href="${profileUrl}"
                           style="display:inline-block;background:${gold};color:#0B0B0F;font-size:14px;font-weight:600;padding:14px 36px;border-radius:12px;text-decoration:none;letter-spacing:0.02em;">
                            View Profile →
                        </a>
                    </td>
                </tr>

                <!-- Footer -->
                <tr>
                    <td style="text-align:center;padding-bottom:16px;">
                        <p style="margin:0;font-size:12px;color:#3f3f46;">
                            © AURUM Premium Car Rental · Booking ref: ${d.bookingId}
                        </p>
                    </td>
                </tr>

            </table>
        </td></tr>
    </table>
</body>
</html>`
}
