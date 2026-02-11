import client from './client';

export const fetchBlogs = async () => {
  try {
    const response = await client.getEntries({
      content_type: 'blogs',
    });

    return response.items.map((item: any) => ({
      id: item.sys.id,
      slug: item.fields.slug,
      title: item.fields.title,
      short_desc: item.fields.shortDesc,
      read_time: item.fields.readTime,
      category: item.fields.category,
      image: item.fields.image,
      content: item.fields.content,
      auther: item.fields.auther,
      auther_role: item.fields.autherRole,
      auther_image: item.fields.autherImage,
      meta_title: item.fields.metaTitle,
      meta_description: item.fields.metaDescription,
      meta_tags: item.fields.metaTags,
      op_title: item.fields.opTitle,
      op_description: item.fields.opDescription,
      op_image: item.fields.opImage,
      createdAt: item.sys.createdAt,
      updatedAt: item.sys.updatedAt,
    }));
  } catch (error) {
    console.error('Error fetching blogs from Contentful:', error);
    throw new Error('Failed to fetch blogs.');
  }
};
