import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';
import { fetchBlogs } from '@/lib/server/contentful';
import { createAdminClient } from '@/lib/supabase';

// ─────────────────────────────────────────────────────────────────
// Static public routes
// ─────────────────────────────────────────────────────────────────
const STATIC_ROUTES = [
  { path: '', priority: 1.0, changeFrequency: 'weekly' as const },
  { path: '/services', priority: 0.9, changeFrequency: 'weekly' as const },
  { path: '/blogs', priority: 0.8, changeFrequency: 'daily' as const },
  { path: '/shop', priority: 0.8, changeFrequency: 'daily' as const },
  { path: '/booking', priority: 0.9, changeFrequency: 'weekly' as const },
  { path: '/contact-us', priority: 0.7, changeFrequency: 'monthly' as const },
  { path: '/how-it-works', priority: 0.7, changeFrequency: 'monthly' as const },
  {
    path: '/privacy-policy',
    priority: 0.3,
    changeFrequency: 'yearly' as const,
  },
  { path: '/refund-policy', priority: 0.3, changeFrequency: 'yearly' as const },
  {
    path: '/terms-and-conditions',
    priority: 0.3,
    changeFrequency: 'yearly' as const,
  },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // ── Static pages ──────────────────────────────────────────────
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map(
    ({ path, priority, changeFrequency }) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      changeFrequency,
      priority,
    }),
  );

  // ── Dynamic blog pages ─────────────────────────────────────────
  let blogEntries: MetadataRoute.Sitemap = [];
  try {
    const blogs = await fetchBlogs();
    blogEntries = blogs
      .filter((blog: { slug?: string }) => blog.slug)
      .map((blog: { slug: string; updatedAt?: string }) => ({
        url: `${SITE_URL}/blogs/${blog.slug}`,
        lastModified: blog.updatedAt ? new Date(blog.updatedAt) : now,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
  } catch {
    // Contentful unavailable — skip blog entries gracefully
  }

  // ── Dynamic product pages ──────────────────────────────────────
  let productEntries: MetadataRoute.Sitemap = [];
  try {
    const supabase = await createAdminClient();
    const { data: products } = await supabase
      .from('products')
      .select('slug, updated_at')
      .not('slug', 'is', null);

    if (products) {
      productEntries = products.map(
        (product: { slug: string; updated_at?: string }) => ({
          url: `${SITE_URL}/shop/${product.slug}`,
          lastModified: product.updated_at ? new Date(product.updated_at) : now,
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        }),
      );
    }
  } catch {
    // Supabase unavailable — skip product entries gracefully
  }

  return [...staticEntries, ...blogEntries, ...productEntries];
}
