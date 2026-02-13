import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/server/email/ses-mailer';
import {
  bookingConfirmationTemplate,
  orderConfirmationTemplate,
  contactFormTemplate,
  welcomeEmailTemplate,
} from '@/lib/server/email/templates';
import type {
  BookingEmailData,
  OrderEmailData,
  ContactEmailData,
} from '@/lib/types/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, to, data } = body;

    if (!type || !to) {
      return NextResponse.json(
        { error: 'Missing required fields: type, to' },
        { status: 400 },
      );
    }

    let subject = '';
    let html = '';

    switch (type) {
      case 'booking-confirmation':
        subject = `Booking Confirmed - ${(data as BookingEmailData).bookingNumber}`;
        html = bookingConfirmationTemplate(data as BookingEmailData);
        break;

      case 'order-confirmation':
        subject = `Order Confirmed - ${(data as OrderEmailData).orderNumber}`;
        html = orderConfirmationTemplate(data as OrderEmailData);
        break;

      case 'contact-form':
        subject = `New Contact Form: ${(data as ContactEmailData).name}`;
        html = contactFormTemplate(data as ContactEmailData);
        break;

      case 'welcome':
        subject = 'Welcome to RUTE Home Services!';
        html = welcomeEmailTemplate(data.name);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid email type' },
          { status: 400 },
        );
    }

    const result = await sendEmail({
      to,
      subject,
      html,
    });

    if (result.success) {
      return NextResponse.json(
        { success: true, messageId: result.messageId },
        { status: 200 },
      );
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
