import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/server/requireAdmin';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: categories, error } = await supabase
      .from('product_categories')
      .select('id, name, description')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 },
      );
    }

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const supabase = await createClient();

    const body = await request.json();
    const { name, description } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from('product_categories')
      .insert({
        name,
        description: description || null,
        is_active: true,
      })
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to create category' },
        { status: 500 },
      );
    }

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
