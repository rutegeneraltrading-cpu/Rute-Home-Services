import NotFound from '@/app/not-found';
import { getServerSideData } from '@/lib/client';
import { SingleBlogsPage } from '@/components/pages/public';

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
