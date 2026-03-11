import { ResetPasswordChangedEmailData } from '@/lib/types';
import { baseStyles } from './baseStyles';

export function resetPasswordChangedTemplate(
  data: ResetPasswordChangedEmailData,
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Password Changed</h1>
        </div>
        <div class="content">
          <p>Hi ${data.name},</p>
          <p>Your password was changed successfully.</p>
          <div class="info-box">
            <p><strong>Changed at:</strong> ${data.changedAt}</p>
          </div>
          <p>If this was not you, reset your password immediately:</p>
          <a href="${data.resetPasswordUrl}" class="button">Secure Account</a>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} RUTE Home Services. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
