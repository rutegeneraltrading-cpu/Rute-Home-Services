export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface BookingEmailData {
  customerName: string;
  bookingNumber: string;
  serviceName: string;
  workerName: string;
  date: string;
  time: string;
  totalPrice: number;
  address: string;
}

export interface OrderEmailData {
  customerName: string;
  orderNumber: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  totalPrice: number;
  shippingAddress: string;
  estimatedDelivery: string;
}

export interface ContactEmailData {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}
