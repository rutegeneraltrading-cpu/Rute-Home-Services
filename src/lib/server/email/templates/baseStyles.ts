export const baseStyles = `
  body {
    margin: 0;
    padding: 0;
    background: #f8fafc;
    color: #0f172a;
    font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.55;
  }
  .wrapper {
    width: 100%;
    padding: 28px 14px;
    box-sizing: border-box;
  }
  .card {
    max-width: 640px;
    margin: 0 auto;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 4px 16px rgba(2, 8, 23, 0.06);
  }
  .topbar {
    height: 4px;
    background: #22c55e;
  }
  .header {
    padding: 26px 24px 16px;
    border-bottom: 1px solid #f1f5f9;
  }
  .brand {
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #16a34a;
    margin-bottom: 6px;
  }
  .title {
    margin: 0;
    font-size: 24px;
    line-height: 1.2;
    color: #020617;
    font-weight: 700;
  }
  .content {
    padding: 20px 24px 10px;
    color: #0f172a;
    font-size: 15px;
  }
  .muted {
    color: #475569;
    font-size: 14px;
  }
  .info-box {
    margin: 18px 0;
    border: 1px solid #dcfce7;
    background: #f0fdf4;
    border-radius: 10px;
    overflow: hidden;
  }
  .info-row {
    padding: 11px 14px;
    border-bottom: 1px solid #dcfce7;
    font-size: 14px;
  }
  .info-row:last-child {
    border-bottom: none;
  }
  .label {
    color: #166534;
    font-weight: 600;
    margin-right: 8px;
  }
  .value {
    color: #14532d;
    word-break: break-word;
  }
  .button-wrap {
    margin: 22px 0 12px;
  }
  .button {
    display: inline-block;
    background: #0f172a;
    color: #ffffff !important;
    text-decoration: none;
    border-radius: 10px;
    padding: 12px 18px;
    font-size: 14px;
    font-weight: 600;
  }
  .button-accent {
    background: #16a34a;
  }
  .divider {
    height: 1px;
    background: #f1f5f9;
    margin: 16px 0;
  }
  .footer {
    padding: 16px 24px 22px;
    border-top: 1px solid #f1f5f9;
    background: #fcfcfd;
  }
  .footer-links {
    margin: 0 0 10px;
    font-size: 12px;
    color: #64748b;
  }
  .footer-links a {
    color: #0f172a;
    text-decoration: none;
    margin: 0 8px;
  }
  .social-links {
    margin: 0 0 8px;
    font-size: 12px;
    color: #64748b;
  }
  .social-links a {
    color: #16a34a;
    text-decoration: none;
    margin: 0 8px;
  }
  .copyright {
    margin: 0;
    font-size: 12px;
    color: #94a3b8;
  }
`;
