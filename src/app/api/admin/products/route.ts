import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: products, error } = await supabase
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
        is_active,
        created_at,
        category:product_categories(id, name),
        images:product_images(id, url, sort_order, is_primary)
      `,
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 },
      );
    }

    return NextResponse.json(products);
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
    const supabase = await createClient();

    // Check auth
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
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
    } = body;

    // Validate required fields
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
      .insert({
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
        stock: parseInt(stock) || 0,
        is_active: true,
      })
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to create product' },
        { status: 500 },
      );
    }

    const createdProduct = data[0];

    if (createdProduct && imagesList.length > 0) {
      const { error: imagesError } = await supabase
        .from('product_images')
        .insert(
          imagesList.map((url, index) => ({
            product_id: createdProduct.id,
            url,
            sort_order: index,
            is_primary: index === 0,
          })),
        );

      if (imagesError) {
        console.error('Supabase images error:', imagesError);
      }
    }

    return NextResponse.json(createdProduct);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
