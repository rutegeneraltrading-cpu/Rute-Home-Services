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

export interface ContactFormUserEmailData {
  name: string;
  subject: string;
  message: string;
  submittedAt: string;
}

export interface OrderItemDetail {
  productName: string;
  quantity: number;
  price: number;
  category?: string;
  imageUrl?: string;
}

export interface OrderCreatedEmailData {
  customerName: string;
  orderId: string;
  items: OrderItemDetail[];
  total: number;
  paymentStatus: string;
  dashboardUrl: string;
}

export interface OrderPaymentSuccessEmailData {
  customerName: string;
  orderId: string;
  items: OrderItemDetail[];
  total: number;
  audience?: 'user' | 'admin';
  transactionId?: string;
  dashboardUrl: string;
}

export interface ServiceOptionDetail {
  name: string;
  description?: string;
  price?: number;
}

export interface ServiceVariantDetail {
  name: string;
  type?: string;
  price?: number;
}

export interface ServiceRequirementDetail {
  name: string;
  type?: string;
  price?: number;
}

export interface BookingServiceDetail {
  name: string;
  category?: string;
  options?: ServiceOptionDetail[];
  requirements?: ServiceRequirementDetail[];
  // Backward-compatible alias
  variants?: ServiceVariantDetail[];
}

export interface BookingCreatedEmailData {
  customerName: string;
  bookingId: string;
  service: BookingServiceDetail;
  address?: string;
  unitOrFlat?: string;
  notes?: string;
  bookingDate: string;
  bookingTime: string;
  total: number;
  paymentStatus: string;
  detailsUrl?: string;
  dashboardUrl?: string;
}

export interface BookingPaymentSuccessEmailData {
  customerName: string;
  bookingId: string;
  service: BookingServiceDetail;
  address?: string;
  unitOrFlat?: string;
  notes?: string;
  bookingDate: string;
  bookingTime: string;
  total: number;
  audience?: 'user' | 'admin';
  transactionId?: string;
  detailsUrl?: string;
  dashboardUrl?: string;
}

export interface WorkerProfileDetail {
  name: string;
  image?: string;
  email?: string;
  phone?: string;
}

export interface BookingAssignmentAcceptedEmailData {
  customerName: string;
  bookingId: string;
  service: BookingServiceDetail;
  address?: string;
  unitOrFlat?: string;
  notes?: string;
  bookingDate: string;
  bookingTime: string;
  worker: WorkerProfileDetail;
}

export interface BookingStatusUpdateEmailData {
  customerName: string;
  bookingId: string;
  service: BookingServiceDetail;
  address?: string;
  unitOrFlat?: string;
  notes?: string;
  bookingDate: string;
  bookingTime: string;
  previousStatus: string;
  newStatus: string;
  updatedAt: string;
  detailsUrl: string;
}

export interface OrderStatusUpdateEmailData {
  customerName: string;
  orderId: string;
  items: OrderItemDetail[];
  previousStatus: string;
  newStatus: string;
  updatedAt: string;
  detailsUrl: string;
}

export interface BookingUpdatedByCustomerEmailData {
  recipientName: string;
  customerName: string;
  bookingId: string;
  service: BookingServiceDetail;
  address: string;
  unitOrFlat?: string;
  notes?: string;
  bookingDate: string;
  bookingTime: string;
  audience: 'admin' | 'worker';
  updatedAt: string;
}
