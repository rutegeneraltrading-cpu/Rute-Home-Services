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

export interface WorkerWelcomeEmailData {
  fullName: string;
  email: string;
  servicesCount: number;
  loginUrl: string;
}

export interface AdminCreatedUserEmailData {
  fullName: string;
  email: string;
  loginUrl: string;
  resetPasswordUrl: string;
}

export interface ContactFormAdminEmailData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  createdAt: string;
}
