import type { Metadata } from 'next';
import { SITE_CONFIG, PAGE_IMAGES } from './config';
import { buildMetadata, buildNoIndexMetadata } from './metadata';

// ═══════════════════════════════════════════════════════════════════
//  RUTE — All Pages Metadata
//  Import the relevant export in each page:
//    import { HOME_METADATA } from '@/lib/seo';
//    export const metadata = HOME_METADATA;
//
//  Per-page OG images: add files to public/
//  Image paths are defined in src/lib/seo/config.ts (PAGE_IMAGES)
// ═══════════════════════════════════════════════════════════════════

// ───────────────────────────────────────────────────────────────────
// ROOT — layout.tsx (title template + full base metadata)
// ───────────────────────────────────────────────────────────────────
export const ROOT_METADATA: Metadata = buildMetadata({
  title: SITE_CONFIG.name,
  description: SITE_CONFIG.description,
  keywords: [
    'Rute',
    'home services',
    'book home service',
    'buy home products',
    'electrician',
    'plumber',
    'painter',
    'cleaner',
    'handyman',
    'home maintenance',
    'online home shop',
  ],
  path: '',
  type: 'website',
  image: PAGE_IMAGES.home,
  // title: {
  //   template: `%s | ${SITE_CONFIG.name}`,
  //   default: SITE_CONFIG.name,
  // },
});

// ═══════════════════════════════════════════════════════════════════
//  PUBLIC PAGES — INDEXED
// ═══════════════════════════════════════════════════════════════════

// ───────────────────────────────────────────────────────────────────
// Home Page  /
// OG: public/home.jpg
// ───────────────────────────────────────────────────────────────────
export const HOME_METADATA: Metadata = buildMetadata({
  title: 'Book Home Services & Shop Products Online',
  description:
    'Rute connects you with trusted home service professionals and lets you shop quality home products — all in one place. Book electricians, plumbers, painters, cleaners, and more, or shop tools and accessories online.',
  keywords: [
    'Rute',
    'book home service',
    'home services online',
    'electrician near me',
    'plumber near me',
    'painter near me',
    'cleaner near me',
    'buy home products',
    'home maintenance',
    'professional home services South Africa',
  ],
  path: '',
  image: PAGE_IMAGES.home,
  type: 'website',
});

// ───────────────────────────────────────────────────────────────────
// About Page  /about
// ───────────────────────────────────────────────────────────────────
export const ABOUT_METADATA: Metadata = buildMetadata({
  title: 'About Us',
  description:
    'Learn about Rute — the South African platform connecting homeowners with vetted professionals for electrical, plumbing, painting, cleaning, and more services in Johannesburg and Pretoria.',
  keywords: [
    'about Rute',
    'Rute South Africa',
    'home services platform South Africa',
    'vetted professionals Johannesburg',
    'home services Pretoria',
    'trusted home services',
    'Rute mission',
  ],
  path: '/about',
  image: PAGE_IMAGES.home,
  type: 'website',
});

// ───────────────────────────────────────────────────────────────────
// Services Page  /services
// OG: public/services.jpg
// ───────────────────────────────────────────────────────────────────
export const SERVICES_METADATA: Metadata = buildMetadata({
  title: 'Our Services',
  description:
    'Explore all professional home services on Rute — electrical work, plumbing, painting, cleaning, gardening, and much more. Book a verified professional today and get it done right.',
  keywords: [
    'Rute services',
    'home services list',
    'book a service',
    'electrician service',
    'plumbing service',
    'painting service',
    'cleaning service',
    'home repair services',
    'home maintenance services South Africa',
  ],
  path: '/services',
  image: PAGE_IMAGES.services,
  type: 'website',
});

// ───────────────────────────────────────────────────────────────────
// Blogs Listing Page  /blogs
// OG: public/blogs.jpg
// ───────────────────────────────────────────────────────────────────
export const BLOGS_LIST_METADATA: Metadata = buildMetadata({
  title: 'Blog & Home Maintenance Tips',
  description:
    'Read expert tips, guides, and insights on home maintenance, DIY repairs, seasonal upkeep, and how to get the most from Rute’s professional home services.',
  keywords: [
    'Rute blog',
    'home maintenance tips',
    'DIY home repair',
    'electrician tips',
    'plumbing tips',
    'painting tips',
    'home upkeep guide',
    'home improvement advice',
  ],
  path: '/blogs',
  image: PAGE_IMAGES.blogs,
  type: 'website',
});

// ───────────────────────────────────────────────────────────────────
// Shop Listing Page  /shop
// OG: public/shop.jpg
// ───────────────────────────────────────────────────────────────────
export const SHOP_METADATA: Metadata = buildMetadata({
  title: 'Shop Home Service Products',
  description:
    'Browse and buy quality home service products, tools, and accessories on Rute. Everything you need for home maintenance — electrician, plumbing, painting, and cleaning products delivered to your door.',
  keywords: [
    'Rute shop',
    'buy home products online',
    'home tools shop',
    'home accessories',
    'electrical products',
    'plumbing accessories',
    'cleaning products',
    'home maintenance tools South Africa',
  ],
  path: '/shop',
  image: PAGE_IMAGES.shop,
  type: 'website',
});

// ───────────────────────────────────────────────────────────────────
// Contact Us Page  /contact-us
// OG: public/contact.jpg
// ───────────────────────────────────────────────────────────────────
export const CONTACT_METADATA: Metadata = buildMetadata({
  title: 'Contact Us',
  description:
    'Have a question or need help? Contact the Rute team for support, service inquiries, or feedback. We are here to assist with all your home service and product needs.',
  keywords: [
    'contact Rute',
    'Rute customer support',
    'home services help',
    'get in touch',
    'service inquiry',
    'Rute support',
  ],
  path: '/contact-us',
  image: PAGE_IMAGES.contact,
  type: 'website',
});

// ───────────────────────────────────────────────────────────────────
// How It Works Page  /how-it-works
// OG: public/how-it-works.jpg
// ───────────────────────────────────────────────────────────────────
export const HOW_IT_WORKS_METADATA: Metadata = buildMetadata({
  title: 'How It Works',
  description:
    'Booking a home service on Rute is simple — choose your service, pick a time slot, and a verified professional arrives at your door. Discover how Rute works in 3 easy steps.',
  keywords: [
    'how Rute works',
    'how to book home service',
    'Rute booking process',
    'service booking steps',
    'book a professional online',
    'easy home service booking',
  ],
  path: '/how-it-works',
  image: PAGE_IMAGES.howItWorks,
  type: 'website',
});

// ───────────────────────────────────────────────────────────────────
// Booking Page  /booking
// OG: public/booking.jpg
// ───────────────────────────────────────────────────────────────────
export const BOOKING_METADATA: Metadata = buildMetadata({
  title: 'Book a Home Service',
  description:
    'Schedule your home service on Rute in minutes. Select your service, choose a preferred date and time, and confirm your booking with a verified professional.',
  keywords: [
    'book home service Rute',
    'schedule home service',
    'book appointment online',
    'book electrician',
    'book plumber',
    'book painter',
    'home service appointment South Africa',
  ],
  path: '/booking',
  image: PAGE_IMAGES.booking,
  type: 'website',
});

// ───────────────────────────────────────────────────────────────────
// Privacy Policy  /privacy-policy
// OG: public/privacy-policy.jpg
// ───────────────────────────────────────────────────────────────────
export const PRIVACY_POLICY_METADATA: Metadata = buildMetadata({
  title: 'Privacy Policy',
  description:
    'Read Rute’s privacy policy to understand how we collect, use, and protect your personal data when you use our home services and shop platform.',
  keywords: [
    'Rute privacy policy',
    'data protection',
    'personal data',
    'Rute data privacy',
  ],
  path: '/privacy-policy',
  image: PAGE_IMAGES.privacyPolicy,
  type: 'website',
});

// ───────────────────────────────────────────────────────────────────
// Refund Policy  /refund-policy
// OG: public/refund-policy.jpg
// ───────────────────────────────────────────────────────────────────
export const REFUND_POLICY_METADATA: Metadata = buildMetadata({
  title: 'Refund Policy',
  description:
    'Learn about Rute’s refund and cancellation policy for home services and product orders. Your satisfaction is our priority.',
  keywords: [
    'Rute refund policy',
    'cancellation policy',
    'home services refund',
    'money back',
  ],
  path: '/refund-policy',
  image: PAGE_IMAGES.refundPolicy,
  type: 'website',
});

// ───────────────────────────────────────────────────────────────────
// Terms & Conditions  /terms-and-conditions
// OG: public/terms.jpg
// ───────────────────────────────────────────────────────────────────
export const TERMS_METADATA: Metadata = buildMetadata({
  title: 'Terms & Conditions',
  description:
    'Read the terms and conditions governing the use of Rute’s home services and shop platform, including service agreements, payment terms, and user responsibilities.',
  keywords: [
    'Rute terms and conditions',
    'terms of service',
    'user agreement',
    'Rute platform terms',
  ],
  path: '/terms-and-conditions',
  image: PAGE_IMAGES.terms,
  type: 'website',
});

// ═══════════════════════════════════════════════════════════════════
//  PUBLIC PAGES — NOINDEX (transactional / state pages)
// ═══════════════════════════════════════════════════════════════════

export const CART_METADATA: Metadata = buildNoIndexMetadata('Your Cart');
export const CHECKOUT_METADATA: Metadata = buildNoIndexMetadata('Checkout');
export const SUCCESS_METADATA: Metadata =
  buildNoIndexMetadata('Order Confirmed');
export const CANCELLED_METADATA: Metadata =
  buildNoIndexMetadata('Order Cancelled');
export const WORKER_REGISTER_METADATA: Metadata = buildNoIndexMetadata(
  'Worker Registration',
);

// ═══════════════════════════════════════════════════════════════════
//  AUTH PAGES
// ═══════════════════════════════════════════════════════════════════

export const LOGIN_METADATA: Metadata = buildNoIndexMetadata('Login');
export const SIGNUP_METADATA: Metadata = buildNoIndexMetadata('Sign Up');
export const FORGOT_PASSWORD_METADATA: Metadata =
  buildNoIndexMetadata('Forgot Password');
export const RESET_PASSWORD_METADATA: Metadata =
  buildNoIndexMetadata('Reset Password');

// Worker registration can be indexed — good for recruitment SEO
export const REGISTER_WORKER_METADATA: Metadata = buildMetadata({
  title: 'Register as a Worker',
  description:
    "Join Rute's network of verified home service professionals. Register as a worker and start accepting bookings for electrical, plumbing, painting, cleaning, and more.",
  keywords: [
    'become a Rute worker',
    'register as professional',
    'join Rute',
    'work as electrician',
    'work as plumber',
    'home services worker registration South Africa',
    'professional service provider',
  ],
  path: '/register/worker',
  image: PAGE_IMAGES.registerWorker,
  type: 'website',
});

// ═══════════════════════════════════════════════════════════════════
//  ADMIN PAGES — All noindex (double protection with robots.ts)
// ═══════════════════════════════════════════════════════════════════

export const ADMIN_DASHBOARD_METADATA: Metadata =
  buildNoIndexMetadata('Admin Dashboard');
export const ADMIN_BOOKINGS_METADATA: Metadata =
  buildNoIndexMetadata('Manage Bookings');
export const ADMIN_BOOKING_DETAIL_METADATA: Metadata =
  buildNoIndexMetadata('Booking Detail');
export const ADMIN_ORDERS_METADATA: Metadata =
  buildNoIndexMetadata('Manage Orders');
export const ADMIN_ORDER_DETAIL_METADATA: Metadata =
  buildNoIndexMetadata('Order Detail');
export const ADMIN_SERVICES_METADATA: Metadata =
  buildNoIndexMetadata('Manage Services');
export const ADMIN_NEW_SERVICE_METADATA: Metadata =
  buildNoIndexMetadata('Add New Service');
export const ADMIN_PRODUCTS_METADATA: Metadata =
  buildNoIndexMetadata('Manage Products');
export const ADMIN_NEW_PRODUCT_METADATA: Metadata =
  buildNoIndexMetadata('Add New Product');
export const ADMIN_WORKERS_METADATA: Metadata =
  buildNoIndexMetadata('Manage Workers');
export const ADMIN_WORKER_DETAIL_METADATA: Metadata =
  buildNoIndexMetadata('Worker Detail');
export const ADMIN_USERS_METADATA: Metadata =
  buildNoIndexMetadata('Manage Users');
export const ADMIN_CONTACTS_METADATA: Metadata =
  buildNoIndexMetadata('Contact Messages');
export const ADMIN_REPORTS_METADATA: Metadata = buildNoIndexMetadata('Reports');
export const ADMIN_REVENUE_METADATA: Metadata = buildNoIndexMetadata('Revenue');
export const ADMIN_PROFILE_METADATA: Metadata =
  buildNoIndexMetadata('Admin Profile');

// ═══════════════════════════════════════════════════════════════════
//  USER DASHBOARD PAGES — All noindex
// ═══════════════════════════════════════════════════════════════════

export const USER_OVERVIEW_METADATA: Metadata =
  buildNoIndexMetadata('My Account');
export const USER_DASHBOARD_METADATA: Metadata =
  buildNoIndexMetadata('Dashboard');
export const USER_BOOKINGS_METADATA: Metadata =
  buildNoIndexMetadata('My Bookings');
export const USER_BOOKING_DETAIL_METADATA: Metadata =
  buildNoIndexMetadata('Booking Detail');
export const USER_ORDERS_METADATA: Metadata = buildNoIndexMetadata('My Orders');
export const USER_ORDER_DETAIL_METADATA: Metadata =
  buildNoIndexMetadata('Order Detail');
export const USER_PAYMENT_HISTORY_METADATA: Metadata =
  buildNoIndexMetadata('Payment History');
export const USER_PROFILE_METADATA: Metadata =
  buildNoIndexMetadata('My Profile');
