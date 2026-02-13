import type {
  BookingEmailData,
  OrderEmailData,
  ContactEmailData,
} from '@/lib/types/email';

const baseStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
  .header { background: linear-gradient(135deg, #16a34a 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
  .header h1 { margin: 0; font-size: 28px; }
  .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
  .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; border-radius: 0 0 8px 8px; }
  .button { display: inline-block; background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  .info-box { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0; }
  .item-row { border-bottom: 1px solid #e5e7eb; padding: 10px 0; }
  .total { font-size: 18px; font-weight: bold; color: #16a34a; margin-top: 15px; }
`;

export function bookingConfirmationTemplate(data: BookingEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Booking Confirmed!</h1>
        </div>
        <div class="content">
          <p>Hi ${data.customerName},</p>
          <p>Your booking has been confirmed. Here are the details:</p>
          
          <div class="info-box">
            <p><strong>Booking Number:</strong> ${data.bookingNumber}</p>
            <p><strong>Service:</strong> ${data.serviceName}</p>
            <p><strong>Worker:</strong> ${data.workerName}</p>
            <p><strong>Date:</strong> ${data.date}</p>
            <p><strong>Time:</strong> ${data.time}</p>
            <p><strong>Address:</strong> ${data.address}</p>
            <p class="total">Total: R${data.totalPrice.toFixed(2)}</p>
          </div>

          <p>Our professional will arrive at your location on time. You will receive a notification when they're on the way.</p>
          
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/user/bookings" class="button">View Booking Details</a>
          
          <p>If you have any questions, feel free to contact us.</p>
          <p>Best regards,<br><strong>RUTE Team</strong></p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} RUTE Home Services. All rights reserved.</p>
          <p>Office 45, Long Street, Cape Town, 8001, South Africa</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function orderConfirmationTemplate(data: OrderEmailData): string {
  const itemsList = data.items
    .map(
      (item) => `
    <div class="item-row">
      <strong>${item.name}</strong> × ${item.quantity} 
      <span style="float: right;">R${(item.price * item.quantity).toFixed(2)}</span>
    </div>
  `,
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📦 Order Confirmed!</h1>
        </div>
        <div class="content">
          <p>Hi ${data.customerName},</p>
          <p>Thank you for your order! Here are the details:</p>
          
          <div class="info-box">
            <p><strong>Order Number:</strong> ${data.orderNumber}</p>
            <p><strong>Estimated Delivery:</strong> ${data.estimatedDelivery}</p>
            <p><strong>Shipping Address:</strong><br>${data.shippingAddress}</p>
          </div>

          <h3>Order Items:</h3>
          ${itemsList}
          <p class="total">Total: R${data.totalPrice.toFixed(2)}</p>

          <p>We'll send you another email when your order ships.</p>
          
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/user/orders" class="button">Track Your Order</a>
          
          <p>Best regards,<br><strong>RUTE Team</strong></p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} RUTE Home Services. All rights reserved.</p>
          <p>support@rute.com | +27 21 123 4567</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function contactFormTemplate(data: ContactEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📧 New Contact Form Submission</h1>
        </div>
        <div class="content">
          <p><strong>From:</strong> ${data.name}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          ${data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ''}
          
          <div class="info-box">
            <p><strong>Message:</strong></p>
            <p>${data.message.replace(/\n/g, '<br>')}</p>
          </div>

          <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">
            This email was sent from the RUTE contact form.
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} RUTE Home Services</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function welcomeEmailTemplate(name: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>👋 Welcome to RUTE!</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>Welcome to RUTE Home Services! We're excited to have you on board.</p>
          
          <div class="info-box">
            <p>With RUTE, you can:</p>
            <ul>
              <li>Book trusted home service professionals</li>
              <li>Shop for quality home products</li>
              <li>Track your orders and bookings</li>
              <li>Get reliable support when you need it</li>
            </ul>
          </div>

          <a href="${process.env.NEXT_PUBLIC_APP_URL}/services" class="button">Browse Services</a>
          
          <p>If you have any questions, our support team is here to help.</p>
          <p>Best regards,<br><strong>RUTE Team</strong></p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} RUTE Home Services. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
