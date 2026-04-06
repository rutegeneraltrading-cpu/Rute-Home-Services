// ─────────────────────────────────────────────────────────────────
// Central SEO Configuration — Rute
// Update SITE_URL when domain is finalised.
// ─────────────────────────────────────────────────────────────────

function normalizeSiteUrl(rawUrl?: string): string {
  const fallbackUrl = 'https://www.rute.co.za';

  if (!rawUrl?.trim()) {
    return fallbackUrl;
  }

  const trimmedUrl = rawUrl.trim();
  const withProtocol = /^https?:\/\//i.test(trimmedUrl)
    ? trimmedUrl
    : `https://${trimmedUrl}`;

  try {
    const parsedUrl = new URL(withProtocol);

    if (
      parsedUrl.hostname === 'rute.co.za' ||
      parsedUrl.hostname === 'ww.rute.co.za'
    ) {
      parsedUrl.hostname = 'www.rute.co.za';
    }

    return parsedUrl.toString().replace(/\/$/, '');
  } catch {
    return fallbackUrl;
  }
}

export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_APP_URL);
export const SITEMAP_URL = `${SITE_URL}/sitemap.xml`;

export const SITE_CONFIG = {
  name: 'Rute',
  tagline: 'Book Home Services & Shop Products Online',
  description:
    'Rute connects you with trusted home service professionals and lets you shop quality home products — all in one place. Book electricians, plumbers, painters, cleaners, and more, or shop tools and accessories online.',
  url: SITE_URL,
  logo: `${SITE_URL}/rute.webp`,
  // Default fallback OG image (used when no page-specific image is set)
  ogImage: `${SITE_URL}/default.webp`,
  twitterHandle: '@RuteSA',
  siteName: 'Rute',
  locale: 'en_ZA',
  contact: {
    email: 'admin@rute.co.za',
    phone: '+27000000000',
  },
  social: {
    facebook: 'https://www.facebook.com/RuteSA',
    instagram: 'https://www.instagram.com/RuteSA',
    twitter: 'https://twitter.com/RuteSA',
    whatsapp: 'https://wa.me/27000000000',
  },
} as const;

// ─────────────────────────────────────────────────────────────────
// Per-page OG Image Paths
// Place actual image files in: public/
// Recommended size: 1200 x 630 px  |  Format: .webp or .webp
// These are passed as `image` param to buildMetadata() in pages-metadata.ts
// ─────────────────────────────────────────────────────────────────
export const PAGE_IMAGES = {
  // Public pages
  home: `${SITE_URL}/default.webp`,
  services: `${SITE_URL}/services.webp`,
  blogs: `${SITE_URL}/blogs.webp`,
  shop: `${SITE_URL}/shop.webp`,
  contact: `${SITE_URL}/contact.webp`,
  howItWorks: `${SITE_URL}/how-it-works.webp`,
  booking: `${SITE_URL}/booking.webp`,
  privacyPolicy: `${SITE_URL}/privacy-policy.webp`,
  refundPolicy: `${SITE_URL}/refund-policy.webp`,
  terms: `${SITE_URL}/terms.webp`,
  // Auth pages
  registerWorker: `${SITE_URL}/register-worker.webp`,
} as const;

// ─────────────────────────────────────────────────────────────────
// JSON-LD Structured Data — Organization + LocalBusiness
// ─────────────────────────────────────────────────────────────────
export const STRUCTURED_DATA = [
  {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'LocalBusiness'],
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    logo: SITE_CONFIG.logo,
    description: SITE_CONFIG.description,
    email: SITE_CONFIG.contact.email,
    telephone: SITE_CONFIG.contact.phone,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: SITE_CONFIG.contact.phone,
      email: SITE_CONFIG.contact.email,
      contactType: 'Customer Service',
      areaServed: 'ZA',
      availableLanguage: 'English',
    },
    areaServed: {
      '@type': 'Country',
      name: 'South Africa',
    },
    sameAs: [
      SITE_CONFIG.social.facebook,
      SITE_CONFIG.social.instagram,
      SITE_CONFIG.social.twitter,
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_CONFIG.url}/services?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  },
];
