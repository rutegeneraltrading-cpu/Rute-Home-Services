interface GetFilteredBlogs {
  blogs: any[];
  slug?: string;
  filter?: string;
  category?: string;
}

export function getFilteredBlogs({
  blogs,
  slug,
  filter = '',
  category = 'All',
}: GetFilteredBlogs) {
  if (slug) {
    const foundBlog = blogs.find(
      (blog) => blog.slug === slug || blog.id === slug,
    );
    return foundBlog || null;
  }

  let result = blogs;

  if (category && category !== 'All') {
    result = result.filter(
      (blog) => blog.category?.toLowerCase() === category.toLowerCase(),
    );
  }

  const normalizedFilter = filter.trim().toLowerCase();
  if (normalizedFilter) {
    result = result.filter((blog) => {
      return (
        blog.title?.toLowerCase().includes(normalizedFilter) ||
        blog.short_desc?.toLowerCase().includes(normalizedFilter) ||
        blog.category?.toLowerCase().includes(normalizedFilter)
      );
    });
  }

  return result;
}
