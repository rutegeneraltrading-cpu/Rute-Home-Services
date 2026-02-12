import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export async function GET() {
  try {
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
        category:product_categories(id, name),
        images:product_images(id, url, sort_order, is_primary)
      `,
      )
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ products: data || [] });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = await createAdminClient();

    const {
      name,
      slug,
      description,
      price,
      sale_price,
      brand,
      sku,
      attributes,
      category_id,
      stock,
      images,
    } = body || {};

    if (!name || !price || !category_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    let parsedAttributes: Record<string, unknown> | null = null;
    if (typeof attributes === 'string' && attributes.trim()) {
      try {
        parsedAttributes = JSON.parse(attributes);
      } catch {
        return NextResponse.json(
          { error: 'Attributes must be valid JSON' },
          { status: 400 },
        );
      }
    } else if (attributes && typeof attributes === 'object') {
      parsedAttributes = attributes;
    }

    const imagesList: string[] = Array.isArray(images)
      ? images.filter(Boolean)
      : [];

    const slugValue = slug?.trim() ? slug : slugify(name);

    const { data, error } = await supabase
      .from('products')
      .insert([
        {
          name,
          slug: slugValue,
          description: description || null,
          price: parseFloat(price),
          sale_price:
            sale_price !== undefined && sale_price !== ''
              ? parseFloat(sale_price)
              : null,
          brand: brand || null,
          sku: sku || null,
          attributes: parsedAttributes,
          category_id,
          stock: parseInt(stock, 10) || 0,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    if (data && imagesList.length > 0) {
      const { error: imagesError } = await supabase
        .from('product_images')
        .insert(
          imagesList.map((url, index) => ({
            product_id: data.id,
            url,
            sort_order: index,
            is_primary: index === 0,
          })),
        );

      if (imagesError) {
        console.error('Error creating product images:', imagesError);
      }
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 },
    );
  }
}
