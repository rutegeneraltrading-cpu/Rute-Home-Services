import type { Metadata } from 'next';
import { BlogsPage } from '@/components/pages';
import { BLOGS_LIST_METADATA } from '@/lib/seo';

export const metadata: Metadata = BLOGS_LIST_METADATA;

const Blogs = () => {
  return <BlogsPage />;
};

export default Blogs;
