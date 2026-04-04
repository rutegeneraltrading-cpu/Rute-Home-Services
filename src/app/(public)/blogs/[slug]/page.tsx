import type { Metadata } from 'next';
import NotFound from '@/app/not-found';
import { getServerSideData } from '@/lib/client';
import { buildMetadata } from '@/lib/seo';
import { SingleBlogsPage } from '@/components/pages/public';

const parseKeywords = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return ['Rute blog', 'home maintenance tips'];
};

const toAbsoluteImageUrl = (value?: string): string | undefined => {
  if (!value) return undefined;
  const absoluteUrl =
    value.startsWith('http://') || value.startsWith('https://')
      ? value
      : value.startsWith('//')
        ? `https:${value}`
        : value;

  // Social crawlers often skip very large images.
  // For Contentful assets, generate a lightweight OG-friendly version.
  if (absoluteUrl.includes('images.ctfassets.net')) {
    const url = new URL(absoluteUrl);
    url.searchParams.set('w', '1200');
    url.searchParams.set('h', '630');
    url.searchParams.set('fit', 'fill');
    url.searchParams.set('fm', 'jpg');
    url.searchParams.set('q', '80');
    return url.toString();
  }

  return absoluteUrl;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await getServerSideData({ path: 'blogs', slug });
  const blog = data;

  if (!blog) {
    return buildMetadata({
      title: 'Blog Post Not Found',
      description: 'The blog post you are looking for does not exist.',
      path: `/blogs/${slug}`,
      type: 'article',
      noIndex: true,
    });
  }

  const title = blog.meta_title || blog.title || 'Blog Post';
  const description =
    blog.meta_description ||
    blog.short_desc ||
    'Read this expert article from Rute.';
  const ogTitle = blog.op_title || title;
  const ogDescription = blog.op_description || description;
  const image = toAbsoluteImageUrl(
    blog.op_image?.fields?.file?.url || blog.image?.fields?.file?.url,
  );

  return buildMetadata({
    title,
    description,
    keywords: parseKeywords(blog.meta_tags),
    path: `/blogs/${slug}`,
    image,
    type: 'article',
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      image,
      type: 'article',
    },
    twitter: {
      title: ogTitle,
      description: ogDescription,
      image,
    },
  });
}

const SingleBlog = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;
  const { data } = await getServerSideData({ path: 'blogs', slug });
  const blog = data;

  if (!blog) return <NotFound />;

  return <SingleBlogsPage blog={blog} />;
};

export default SingleBlog;
