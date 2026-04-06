// ─────────────────────────────────────────────────────────────────
// SEO Module — Public API
// Usage: import { HOME_METADATA, SERVICES_METADATA, ... } from '@/lib/seo'
// ─────────────────────────────────────────────────────────────────

export { SITE_CONFIG, SITE_URL, SITEMAP_URL, STRUCTURED_DATA } from './config';
export { buildMetadata, buildNoIndexMetadata } from './metadata';
export * from './pages-metadata';
