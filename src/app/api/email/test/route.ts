import { NextResponse } from 'next/server';
import {
  sendEmail,
  verifyEmailConnection,
} from '@/lib/server/email/ses-mailer';

export async function GET() {
  try {
    // First verify connection
    const isConnected = await verifyEmailConnection();

    if (!isConnected) {
      return NextResponse.json(
        { error: 'SMTP connection failed' },
        { status: 500 },
      );
    }

    // Send test email
    const result = await sendEmail({
      to: process.env.AWS_SES_FROM_EMAIL!, // Send to same verified email for testing
      subject: 'RUTE - Test Email from SES',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #16a34a;">✅ Email Setup Successful!</h1>
          <p>This is a test email from your RUTE Home Services platform.</p>
          <p>AWS SES integration is working correctly.</p>
          <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="font-size: 14px; color: #6b7280;">
            Sent at: ${new Date().toLocaleString()}<br>
            From: ${process.env.AWS_SES_FROM_EMAIL}<br>
            Region: ${process.env.AWS_SES_REGION}
          </p>
        </div>
      `,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully!',
        messageId: result.messageId,
        sentTo: process.env.AWS_SES_FROM_EMAIL,
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to send test email' },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
