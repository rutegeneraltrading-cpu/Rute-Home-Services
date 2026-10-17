import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';
// import { sendResendEmail } from '@/lib/server/email';
// import { orderCreatedTemplate } from '@/lib/server/email';

// const SUBJECT_MAX_LENGTH = 70;

// function cleanProductNameForHeading(name: string): string {
//   return String(name || '')
//     .replace(/\s*\([^)]*\)\s*$/g, '')
//     .trim();
// }

// function resolveProductImageUrl(url?: string): string | undefined {
//   if (!url) return undefined;
//   if (/^https?:\/\//i.test(url)) return url;

//   const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
//   if (!base) return undefined;

//   const normalizedPath = String(url)
//     .replace(/^\/+/, '')
//     .replace(/^storage\/v1\/object\/public\/products\//, '');

//   return `${base}/storage/v1/object/public/products/${normalizedPath}`;
// }

// function getPrimaryProductImageUrl(images: any[]): string | undefined {
//   const sortedImages = [...images].sort(
//     (a: any, b: any) =>
//       Number(a?.sort_order ?? 9999) - Number(b?.sort_order ?? 9999),
//   );
//   return sortedImages.find((img: any) => img?.is_primary)?.url;
// }

// function buildOrderProductsSubject(
//   items: Array<{ productName: string }>,
// ): string {
//   const products = Array.from(
//     new Set(
//       items
//         .map((item) => cleanProductNameForHeading(item.productName))
//         .filter(Boolean),
//     ),
//   );
//   const joined = products.join(', ') || 'Products';

//   if (joined.length <= SUBJECT_MAX_LENGTH) return joined;
//   return `${joined.slice(0, SUBJECT_MAX_LENGTH - 3).trimEnd()}...`;
// }

interface OrderItemPayload {
  product_id: string;
  quantity: number;
  price: number;
}

interface NewAddressPayload {
  label?: 'home' | 'office' | 'other';
  recipient_name?: string | null;
  phone?: string | null;
  line1: string;
  line2?: string | null;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
  is_primary?: boolean;
}

interface CreateOrderPayload {
  items: OrderItemPayload[];
  address_id?: string;
  new_address?: NewAddressPayload;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  notes?: string;
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

    const body: CreateOrderPayload = await request.json();
    const { items, address_id, new_address, tax, shipping, notes } = body;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('auth_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 },
      );
    }

    // Validate required fields
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Order items are required' },
        { status: 400 },
      );
    }

    if (!Number.isFinite(tax) || !Number.isFinite(shipping)) {
      return NextResponse.json(
        { error: 'Invalid amount values' },
        { status: 400 },
      );
    }

    // Prices, quantities, and the subtotal/total are never trusted from the
    // client — they're recomputed here from the real `products` row, so a
    // tampered request body (e.g. price set to 0.01) can't under-charge an
    // order.
    const productIds = Array.from(
      new Set(items.map((item) => item.product_id).filter(Boolean)),
    );

    if (productIds.length === 0) {
      return NextResponse.json({ error: 'Invalid order items' }, { status: 400 });
    }

    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('id, price, sale_price, stock, is_active')
      .in('id', productIds);

    if (productsError) {
      console.error('Products lookup error:', productsError);
      return NextResponse.json(
        { error: 'Failed to validate order items' },
        { status: 500 },
      );
    }

    const productMap = new Map((productsData || []).map((p) => [p.id, p]));
    const verifiedItems: OrderItemPayload[] = [];

    for (const item of items) {
      const product = productMap.get(item.product_id);
      const quantity = Number(item.quantity);

      if (!product || !product.is_active) {
        return NextResponse.json(
          { error: 'One or more items are no longer available' },
          { status: 400 },
        );
      }

      if (!Number.isInteger(quantity) || quantity < 1) {
        return NextResponse.json(
          { error: 'Invalid item quantity' },
          { status: 400 },
        );
      }

      if (quantity > Number(product.stock ?? 0)) {
        return NextResponse.json(
          { error: 'One or more items exceed available stock' },
          { status: 409 },
        );
      }

      const effectivePrice = Number(
        product.sale_price ?? product.price ?? 0,
      );

      verifiedItems.push({
        product_id: item.product_id,
        quantity,
        price: effectivePrice,
      });
    }

    const verifiedSubtotal = verifiedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const verifiedTotal = verifiedSubtotal + tax + shipping;

    if (!address_id && !new_address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 },
      );
    }

    let resolvedAddressId = address_id;

    if (resolvedAddressId) {
      const { data: existingAddress, error: addressError } = await supabase
        .from('user_addresses')
        .select('id')
        .eq('id', resolvedAddressId)
        .eq('profile_id', profile.id)
        .maybeSingle();

      if (addressError || !existingAddress) {
        return NextResponse.json(
          { error: 'Selected address is invalid' },
          { status: 400 },
        );
      }
    }

    if (!resolvedAddressId && new_address) {
      if (
        !new_address.line1 ||
        !new_address.city ||
        !new_address.state_province ||
        !new_address.postal_code ||
        !new_address.country
      ) {
        return NextResponse.json(
          { error: 'Missing required address fields' },
          { status: 400 },
        );
      }

      const { data: createdAddress, error: createAddressError } = await supabase
        .from('user_addresses')
        .insert({
          profile_id: profile.id,
          label: new_address.label || 'other',
          recipient_name: new_address.recipient_name || null,
          phone: new_address.phone || null,
          line1: new_address.line1,
          line2: new_address.line2 || null,
          city: new_address.city,
          state_province: new_address.state_province,
          postal_code: new_address.postal_code,
          country: new_address.country,
          is_primary: !!new_address.is_primary,
        })
        .select('id')
        .single();

      if (createAddressError || !createdAddress) {
        console.error('Address creation error:', createAddressError);
        return NextResponse.json(
          { error: 'Failed to save address' },
          { status: 500 },
        );
      }

      resolvedAddressId = createdAddress.id;
    }

    // Create the order and decrement stock atomically in a single DB
    // transaction (see migration `create_atomic_order_creation_function`).
    // This is the authoritative stock guard — it closes the race the
    // earlier per-item `quantity > stock` check above can't: two concurrent
    // requests for the last unit can both pass that check, but only one can
    // win the atomic decrement inside the function.
    const adminSupabase = await createAdminClient();
    const { data: order, error: orderError } = await adminSupabase.rpc(
      'create_order_atomic',
      {
        p_user_id: profile.id,
        p_items: verifiedItems,
        p_address_id: resolvedAddressId,
        p_subtotal: verifiedSubtotal,
        p_tax: tax,
        p_shipping: shipping,
        p_total: verifiedTotal,
        p_notes: notes || null,
      },
    );

    if (orderError) {
      if (String(orderError.message || '').includes('INSUFFICIENT_STOCK')) {
        return NextResponse.json(
          { error: 'One or more items are no longer in stock' },
          { status: 409 },
        );
      }
      console.error('Order creation error:', orderError);
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 },
      );
    }

    // Email sending is temporarily disabled for order creation.
    // if (profile.email) {
    //   try {
    //     // Fetch product details for email
    //     const productIds = items.map((item) => item.product_id);
    //     const { data: productsData } = await supabase
    //       .from('products')
    //       .select(
    //         'id, name, category_id, images:product_images(url, is_primary, sort_order)',
    //       )
    //       .in('id', productIds);

    //     const categoryIds = Array.from(
    //       new Set(
    //         (productsData || []).map((p) => p.category_id).filter(Boolean),
    //       ),
    //     ) as string[];

    //     const { data: categoriesData } = await supabase
    //       .from('product_categories')
    //       .select('id, name')
    //       .in('id', categoryIds);

    //     const productsMap = new Map((productsData || []).map((p) => [p.id, p]));
    //     const categoriesMap = new Map(
    //       (categoriesData || []).map((c) => [c.id, c.name]),
    //     );

    //     const orderItems = items.map((item) => {
    //       const product = productsMap.get(item.product_id);
    //       const images = Array.isArray((product as any)?.images)
    //         ? [...(product as any).images]
    //         : [];
    //       const primaryImage = getPrimaryProductImageUrl(images);
    //       const resolvedImageUrl = resolveProductImageUrl(primaryImage);

    //       console.log('[Order Email][Point 8] image mapping:', {
    //         orderId: order.id,
    //         productId: item.product_id,
    //         productName: product?.name || 'Product',
    //         imageCount: images.length,
    //         primaryImageRaw: primaryImage || null,
    //         resolvedImageUrl: resolvedImageUrl || null,
    //       });

    //       return {
    //         productName: product?.name || 'Product',
    //         quantity: item.quantity,
    //         price: item.price,
    //         category: product?.category_id
    //           ? categoriesMap.get(product.category_id)
    //           : undefined,
    //         imageUrl: resolvedImageUrl,
    //       };
    //     });

    //     const productSummary = buildOrderProductsSubject(orderItems);

    //     await sendResendEmail({
    //       to: profile.email,
    //       subject: `Order Created - ${productSummary}`,
    //       html: orderCreatedTemplate({
    //         customerName: profile.full_name || 'Customer',
    //         orderId: order.id,
    //         items: orderItems,
    //         total,
    //         paymentStatus: 'Pending',
    //         dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/user/orders`,
    //       }),
    //     });
    //   } catch (emailError) {
    //     console.error('Order created email send failed:', emailError);
    //   }
    // }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const supabase = await createClient();

    // Check auth
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('auth_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 },
      );
    }

    let query = supabase.from('orders').select(`
      *,
      profiles!user_id(
        id,
        full_name,
        email,
        phone
      )
    `);

    if (profile.role !== 'admin') {
      query = query.eq('user_id', profile.id);
    }

    const { data: ordersData, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 },
      );
    }

    // Fetch addresses for all orders with address_id
    const addressIds = Array.from(
      new Set(
        (ordersData || [])
          .map((o: { address_id?: string }) => o?.address_id)
          .filter(Boolean),
      ),
    ) as string[];

    let addressMap = new Map<string, unknown>();

    if (addressIds.length > 0) {
      const adminSupabase = await createAdminClient();
      const { data: addresses, error: addressError } = await adminSupabase
        .from('user_addresses')
        .select('id, line1, line2, city, state_province, postal_code, country')
        .in('id', addressIds);

      if (addressError) {
        console.error('Addresses fetch error:', addressError);
      }

      if (addresses) {
        addressMap = new Map(
          addresses.map((addr: { id: string }) => [addr.id, addr]),
        );
      }
    }

    // Transform the response to match frontend expectations
    const orders = (ordersData || []).map((order) => ({
      ...order,
      profile: order.profiles || null,
      address: order.address_id
        ? addressMap.get(order.address_id) || null
        : null,
    }));

    // Remove the raw relations from each order
    orders.forEach((order) => {
      delete order.profiles;
      delete order.user_addresses;
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
