import { FC } from 'react';

import { getServerSideData } from '@/lib/client';
import { BlogCard } from '@/components/common';

interface RelatedBlogsProps {
  category: string;
  id: string;
}

const RelatedBlogs: FC<RelatedBlogsProps> = async ({ category, id }) => {
  const result = await getServerSideData({ category, path: 'blogs' });
  const data = result?.data || [];
  const filteredData = data.filter((item: any) => item.id !== id);

  if (filteredData.length === 0) {
    return <p>Related data not found!</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-medium">Related Blogs...</h2>
      <BlogCard data={filteredData} col="4" />
    </div>
  );
};

export default RelatedBlogs;
