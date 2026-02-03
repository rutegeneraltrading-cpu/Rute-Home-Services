import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from('product_categories')
      .update({
        name,
        description: description || null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating product category:', error);
    return NextResponse.json(
      { error: 'Failed to update product category' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { error: productsError } = await supabase
      .from('products')
      .delete()
      .eq('category_id', id);

    if (productsError) throw productsError;

    const { error: categoryError } = await supabase
      .from('product_categories')
      .delete()
      .eq('id', id);

    if (categoryError) throw categoryError;

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting product category:', error);
    return NextResponse.json(
      { error: 'Failed to delete product category' },
      { status: 500 },
    );
  }
}
