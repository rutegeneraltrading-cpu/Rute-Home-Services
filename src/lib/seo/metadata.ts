import type { Metadata } from 'next';
import { SITE_CONFIG } from './config';

// ─────────────────────────────────────────────────────────────────
// buildMetadata() — Central helper to generate page metadata
// Usage: export const metadata = buildMetadata({ ... })
// ─────────────────────────────────────────────────────────────────

interface BuildMetadataOptions {
  /** Page title — will be combined with site template */
  title: string;
  /** Page description (max ~160 chars recommended) */
  description: string;
  /** Keywords for this specific page */
  keywords?: string[];
  /** Page path relative to root e.g. '/services' */
  path?: string;
  /** OG image URL — defaults to SITE_CONFIG.ogImage */
  image?: string;
  /** OG type — defaults to 'website' */
  type?: 'website' | 'article';
  /** Override robots — defaults to index+follow */
  noIndex?: boolean;
  /** Optional Open Graph overrides per page */
  openGraph?: {
    title?: string;
    description?: string;
    image?: string;
    type?: 'website' | 'article';
    url?: string;
  };
  /** Optional Twitter card overrides per page */
  twitter?: {
    title?: string;
    description?: string;
    image?: string;
    card?: 'summary' | 'summary_large_image';
  };
}

export function buildMetadata({
  title,
  description,
  keywords = [],
  path = '',
  image,
  type = 'website',
  noIndex = false,
  openGraph,
  twitter,
}: BuildMetadataOptions): Metadata {
  const canonicalUrl = `${SITE_CONFIG.url}${path}`;
  const ogImage = openGraph?.image || image || SITE_CONFIG.ogImage;
  const twitterImage = twitter?.image || ogImage;
  const ogType = openGraph?.type || type;

  return {
    title,
    description,
    keywords,
    authors: [{ name: SITE_CONFIG.name }],
    creator: SITE_CONFIG.name,
    publisher: SITE_CONFIG.name,
    referrer: 'origin-when-cross-origin',
    metadataBase: new URL(SITE_CONFIG.url),
    other: {
      image: ogImage,
    },
    alternates: {
      canonical: canonicalUrl,
    },

    openGraph: {
      title: openGraph?.title || title,
      description: openGraph?.description || description,
      url: openGraph?.url || canonicalUrl,
      siteName: SITE_CONFIG.siteName,
      locale: SITE_CONFIG.locale,
      type: ogType,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },

    twitter: {
      card: twitter?.card || 'summary_large_image',
      title: twitter?.title || openGraph?.title || title,
      description:
        twitter?.description || openGraph?.description || description,
      site: SITE_CONFIG.twitterHandle,
      images: [twitterImage],
    },

    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

// ─────────────────────────────────────────────────────────────────
// Reusable noIndex-only metadata (for cart, checkout, dashboards)
// ─────────────────────────────────────────────────────────────────
export function buildNoIndexMetadata(title: string): Metadata {
  return {
    title,
    robots: { index: false, follow: false },
    metadataBase: new URL(SITE_CONFIG.url),
    other: {
      image: SITE_CONFIG.ogImage,
    },
  };
}
