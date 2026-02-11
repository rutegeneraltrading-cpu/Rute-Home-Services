import { NextRequest } from 'next/server';
import { fetchBlogs, getFilteredBlogs } from '@/lib/server/contentful';

export async function POST(request: NextRequest) {
  try {
    const { filter, category, slug } = await request.json();
    const blogs = await fetchBlogs();
    const response = getFilteredBlogs({
      blogs,
      slug,
      filter,
      category,
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: response,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch blogs';
    return new Response(JSON.stringify({ success: false, message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
