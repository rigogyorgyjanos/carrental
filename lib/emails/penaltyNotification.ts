interface PenaltyEmailParams {
    recipientName:  string | null
    recipientEmail: string
    issuedBy:       string        // company name or "AURUM Admin"
    reason:         string
    amount:         number
    paymentUrl:     string
    appUrl:         string
}

export function penaltyNotificationHtml(p: PenaltyEmailParams): string {
    const name       = p.recipientName ?? "Valued Customer"
    const amountFmt  = `€${p.amount.toFixed(2)}`
    const year       = new Date().getFullYear()

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Penalty Notice — AURUM</title>
</head>
<body style="margin:0;padding:0;background:#0B0B0F;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B0B0F;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom:32px;">
              <p style="margin:0;color:#C9A84C;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;font-weight:700;">◆ AURUM</p>
            </td>
          </tr>

          <!-- Title card -->
          <tr>
            <td style="background:#1A1A22;border:1px solid #2A2A35;border-radius:16px;padding:32px;">
              <p style="margin:0 0 8px;color:#EF4444;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;font-weight:700;">PENALTY NOTICE</p>
              <h1 style="margin:0 0 24px;color:#F5F5F0;font-size:24px;font-weight:300;line-height:1.3;">
                A fine has been issued to your account
              </h1>

              <p style="margin:0 0 20px;color:#9CA3AF;font-size:14px;line-height:1.6;">
                Dear ${name},<br/><br/>
                A penalty has been issued on your AURUM account by <strong style="color:#F5F5F0;">${escHtml(p.issuedBy)}</strong>.
                Please review the details below and complete payment at your earliest convenience.
              </p>

              <!-- Details box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B0B0F;border:1px solid #2A2A35;border-radius:12px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #2A2A35;">
                          <p style="margin:0;color:#6B7280;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;">Issued by</p>
                          <p style="margin:4px 0 0;color:#F5F5F0;font-size:14px;">${escHtml(p.issuedBy)}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #2A2A35;">
                          <p style="margin:0;color:#6B7280;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;">Reason</p>
                          <p style="margin:4px 0 0;color:#F5F5F0;font-size:14px;line-height:1.6;">${escHtml(p.reason)}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;">
                          <p style="margin:0;color:#6B7280;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;">Amount Due</p>
                          <p style="margin:4px 0 0;color:#EF4444;font-size:24px;font-weight:700;">${amountFmt}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA button -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background:#EF4444;border-radius:10px;">
                    <a href="${p.paymentUrl}" style="display:inline-block;padding:14px 32px;color:#FFFFFF;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.05em;">
                      Pay Fine Now — ${amountFmt}
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;color:#6B7280;font-size:12px;line-height:1.6;">
                If you believe this fine was issued in error, please contact us by replying to this email or visiting your account dashboard.
                Unpaid fines may affect your ability to make future bookings.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;text-align:center;">
              <p style="margin:0;color:#4B5563;font-size:11px;">
                © ${year} AURUM Luxury Rentals ·
                <a href="${p.appUrl}" style="color:#C9A84C;text-decoration:none;">Visit site</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function escHtml(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
}
