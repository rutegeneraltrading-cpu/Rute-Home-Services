import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from('products')
      .select(
        `
        id,
        name,
        slug,
        description,
        price,
        sale_price,
        brand,
        sku,
        attributes,
        stock,
        category_id,
        is_active,
        created_at,
        updated_at,
        images:product_images(id, url, sort_order, is_primary)
      `,
      )
      .eq('id', id)
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = await createAdminClient();

    const {
      slug,
      description,
      price,
      sale_price,
      brand,
      sku,
      attributes,
      stock,
      category_id,
      images,
      ...rest
    } = body || {};

    let parsedAttributes: Record<string, unknown> | null | undefined =
      attributes;
    if (typeof attributes === 'string' && attributes.trim()) {
      try {
        parsedAttributes = JSON.parse(attributes);
      } catch {
        return NextResponse.json(
          { error: 'Attributes must be valid JSON' },
          { status: 400 },
        );
      }
    }

    const imagesList: string[] = Array.isArray(images)
      ? images.filter(Boolean)
      : [];

    const { data, error } = await supabase
      .from('products')
      .update({
        ...rest,
        slug,
        description,
        price:
          price !== undefined && price !== '' ? parseFloat(price) : undefined,
        sale_price:
          sale_price !== undefined && sale_price !== ''
            ? parseFloat(sale_price)
            : sale_price === null
              ? null
              : undefined,
        brand: brand ?? undefined,
        sku: sku ?? undefined,
        attributes: parsedAttributes,
        stock:
          stock !== undefined && stock !== '' ? parseInt(stock, 10) : undefined,
        category_id,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (Array.isArray(images)) {
      await supabase.from('product_images').delete().eq('product_id', id);

      if (imagesList.length > 0) {
        const { error: imagesError } = await supabase
          .from('product_images')
          .insert(
            imagesList.map((url, index) => ({
              product_id: id,
              url,
              sort_order: index,
              is_primary: index === 0,
            })),
          );

        if (imagesError) {
          console.error('Error updating product images:', imagesError);
        }
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createAdminClient();

    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) throw error;

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 },
    );
  }
}
