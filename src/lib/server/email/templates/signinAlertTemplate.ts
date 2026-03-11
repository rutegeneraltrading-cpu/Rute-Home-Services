import { SigninAlertEmailData } from '@/lib/types';
import { baseStyles } from './baseStyles';

export function signinAlertTemplate(data: SigninAlertEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 New Sign-in Alert</h1>
        </div>
        <div class="content">
          <p>Hi ${data.name},</p>
          <p>Your account was signed in successfully.</p>
          <div class="info-box">
            <p><strong>Time:</strong> ${data.loginTime}</p>
            <p><strong>Device:</strong> ${data.device || 'Unknown device'}</p>
            <p><strong>IP:</strong> ${data.ipAddress || 'Unknown IP'}</p>
            ${data.location ? `<p><strong>Location:</strong> ${data.location}</p>` : ''}
          </div>
          <p>If this wasn't you, reset your password immediately.</p>
          <a href="${data.resetPasswordUrl}" class="button">Reset Password</a>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} RUTE Home Services. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
