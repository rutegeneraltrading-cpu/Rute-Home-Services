export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface SigninAlertEmailData {
  name: string;
  loginTime: string;
  device?: string;
  ipAddress?: string;
  location?: string;
  resetPasswordUrl: string;
}

export interface ResetPasswordChangedEmailData {
  name: string;
  changedAt: string;
  resetPasswordUrl: string;
}
