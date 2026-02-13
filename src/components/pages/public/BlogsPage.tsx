'use client';

import { useGet } from '@/lib/client/hooks';
import { Loading } from '@/components/common';
import { IBlogs } from '@/lib/types';
import { BlogCard, BlogsHeader } from '@/components/common';

const BlogsPage = () => {
  const {
    formMethods,
    data,
    suggestions,
    handleKeyPress,
    handleSearchClick,
    loading,
    setCategory,
    category,
    originalData,
  } = useGet<IBlogs>({
    path: 'blogs',
  });

  if (loading) return <Loading />;

  return (
    <div className="bg-slate-50">
      <BlogsHeader
        formMethods={formMethods}
        suggestions={suggestions}
        onSearchClick={handleSearchClick}
        handleKeyPress={handleKeyPress}
        allData={originalData}
        selectedCategory={category}
        onCategoryChange={setCategory}
      />
      <div className="container mx-auto py-10 xl:px-0 px-4">
        <BlogCard data={data} loading={loading} />
      </div>
    </div>
  );
};

export default BlogsPage;
