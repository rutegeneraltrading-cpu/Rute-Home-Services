interface NotificationDetailRow {
  label: string;
  value: string;
}

interface RenderNotificationTemplateOptions {
  title: string;
  notificationMessage: string;
  sectionTitle: string;
  details: NotificationDetailRow[];
  ctaLink: string;
  ctaText: string;
  preheader?: string;
  customHtml?: string;
}

export function renderNotificationTemplate({
  title,
  notificationMessage,
  sectionTitle,
  details,
  ctaLink,
  ctaText,
  preheader,
  customHtml,
}: RenderNotificationTemplateOptions): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '#';
  const year = new Date().getFullYear();

  const detailsRows = details
    .map(
      (row) => `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; vertical-align: top; width: 38%; color: #64748b; font-size: 13px; font-weight: 600;">${escapeHtml(row.label)}</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; vertical-align: top; color: #0f172a; font-size: 14px; font-weight: 500; word-break: break-word;">${escapeHtml(row.value)}</td>
        </tr>
      `,
    )
    .join('');

  return `
<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f3f3f3; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
    <div style="display:none; font-size:1px; line-height:1px; color:#f3f3f3; max-height:0; max-width:0; opacity:0; overflow:hidden;">${escapeHtml(preheader || notificationMessage)}</div>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f3f3f3; margin:0; padding:24px 0;">
      <tr>
        <td align="center" style="padding:0 12px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px; background:#ffffff; border:1px solid #e5e7eb; border-radius:12px; overflow:hidden;">
            <tr>
              <td style="padding:20px 24px 14px; border-bottom:1px solid #f1f5f9;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="left" style="font-size:24px; line-height:28px; color:#111827; font-weight:700;">
                      <span style="color:#111827; font-weight:700;">RUTE</span><span style="color:#16a34a; font-weight:700;">.</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:18px 24px 6px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:0 10px 10px 0; overflow:hidden;">
                  <tr>
                    <td style="padding:14px 16px; border-left:4px solid #22c55e; border-radius:0 10px 10px 0; font-size:15px; line-height:22px; color:#0f172a; font-weight:700;">
                      ${escapeHtml(notificationMessage)}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:6px 24px 4px;">
                <h1 style="margin:10px 0 8px; font-size:22px; line-height:28px; color:#0f172a; font-weight:700;">${escapeHtml(title)}</h1>
              </td>
            </tr>

            <tr>
              <td style="padding:0 24px 4px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate; border-spacing:0; background:#e5e7eb; border-radius:10px;">
                  <tr>
                    <td style="padding:1px; border-radius:10px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate; border-spacing:0; background:#ffffff; border-radius:9px;">
                        <tr>
                          <td style="padding:14px 16px; border-bottom:1px solid #f1f5f9; background:#ffffff; border-radius:9px 9px 0 0; font-size:14px; font-weight:700; color:#0f172a;">
                            ${escapeHtml(sectionTitle)}
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:0 16px 2px; background:#ffffff; border-radius:0 0 9px 9px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                              ${detailsRows}
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            ${
              customHtml
                ? `<tr>
              <td style="padding:12px 24px 0;">
                ${customHtml}
              </td>
            </tr>`
                : ''
            }

            <tr>
              <td align="center" style="padding:22px 24px 24px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="center" bgcolor="#16a34a" style="border-radius:10px;">
                      <a href="${escapeHtml(ctaLink)}" style="display:inline-block; padding:12px 22px; color:#ffffff; font-size:14px; line-height:14px; font-weight:700; text-decoration:none; border-radius:10px;">
                        ${escapeHtml(ctaText)}
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="background:#f8fafc; border-top:1px solid #e5e7eb; padding:16px 24px 20px; text-align:center;">
                <p style="margin:0 0 8px; font-size:12px; color:#64748b;">
                  <a href="${appUrl}/contact-us" style="color:#111827; text-decoration:none; margin:0 8px;">Support</a>
                  <a href="${appUrl}/privacy-policy" style="color:#111827; text-decoration:none; margin:0 8px;">Privacy Policy</a>
                  <a href="${appUrl}/terms-and-conditions" style="color:#111827; text-decoration:none; margin:0 8px;">Terms</a>
                </p>
                <p style="margin:0 0 6px; font-size:12px; color:#94a3b8;">RUTE, South Africa</p>
                <p style="margin:0; font-size:12px; color:#94a3b8;">© ${year} RUTE. All rights reserved.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
