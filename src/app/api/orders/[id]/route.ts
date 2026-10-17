import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendResendEmail } from '@/lib/server/email';
import { orderStatusUpdateTemplate, renderNotificationTemplate } from '@/lib/server/email';
import { createAdminClient } from '@/lib/supabase';

const MAX_TITLE_LENGTH = 70;

function cleanProductNameForHeading(name: string): string {
  return name.replace(/\s*\([^)]*\)\s*$/, '');
}

function resolveProductImageUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  return `${supabaseUrl}/storage/v1/object/public${url}`;
}

function getPrimaryProductImageUrl(
  images: Array<{ url: string; is_primary: boolean; sort_order: number }>,
): string {
  if (!images || images.length === 0) return '';
  const primaryImage = images.find((img) => img.is_primary);
  const imageUrl = primaryImage?.url || images[0]?.url || '';
  return resolveProductImageUrl(imageUrl);
}

function buildOrderProductsSubject(
  items: Array<{ productName: string }>,
): string {
  const uniqueNames = Array.from(
    new Set(items.map((item) => cleanProductNameForHeading(item.productName))),
  );
  const subject = uniqueNames.join(', ');
  return subject.length > MAX_TITLE_LENGTH
    ? subject.substring(0, MAX_TITLE_LENGTH - 3) + '...'
    : subject;
}

export async function GET(
  _request: NextRequest,
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

    const { id: orderId } = await params;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 },
      );
    }

    let query = supabase
      .from('orders')
      .select(
        `*,
        profiles!user_id(
          id,
          full_name,
          email,
          phone
        )
      `,
      )
      .eq('id', orderId);

    if (profile.role !== 'admin') {
      query = query.eq('user_id', profile.id);
    }

    const { data: order, error: orderError } = await query.single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Fetch address separately if address_id exists
    let address = null;
    if (order.address_id) {
      const adminSupabase = await createAdminClient();
      const { data: addressData, error: addressError } = await adminSupabase
        .from('user_addresses')
        .select(
          'id, recipient_name, phone, line1, line2, city, state_province, postal_code, country',
        )
        .eq('id', order.address_id)
        .single();

      if (addressError) {
        console.error('Address fetch error:', addressError);
      }

      if (addressData) {
        address = addressData;
      }
    }

    const items = Array.isArray(order.items) ? order.items : [];
    const productIds = Array.from(
      new Set(
        items
          .map((item: { product_id?: string }) => item?.product_id)
          .filter(Boolean),
      ),
    ) as string[];

    let productMap = new Map<string, unknown>();

    if (productIds.length > 0) {
      const adminSupabase = await createAdminClient();
      const { data: products, error: productError } = await adminSupabase
        .from('products')
        .select(
          'id, name, sku, brand, price, sale_price, stock, images:product_images(id, url, sort_order, is_primary)',
        )
        .in('id', productIds);

      if (productError) {
        console.error('Product details fetch error:', productError);
      }

      productMap = new Map(
        (products || []).map((product) => [product.id, product]),
      );
    }

    const detailed_items = items.map(
      (item: { product_id: string; quantity: number; price: number }) => ({
        ...item,
        product: productMap.get(item.product_id) || null,
        line_total: Number(item.quantity || 0) * Number(item.price || 0),
      }),
    );
    console.log('address:', address, 'address_id:,', order.address_id);

    // Transform the response to match frontend expectations
    const transformedOrder = {
      ...order,
      profile: order.profiles || null,
      address: address,
      detailed_items,
    };

    // Remove the raw relations from the response
    delete transformedOrder.profiles;
    delete transformedOrder.user_addresses;

    return NextResponse.json({ order: transformedOrder });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function PATCH(
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

    // Only admin can update orders
    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: orderId } = await params;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { status, payment_status, refund_reason, refund_amount } = body;

    if (!status && !payment_status) {
      return NextResponse.json(
        { error: 'At least one field (status or payment_status) is required' },
        { status: 400 },
      );
    }

    const VALID_ORDER_STATUSES = [
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
    ];
    const VALID_PAYMENT_STATUSES = [
      'pending',
      'paid',
      'failed',
      'refunded',
      'cancelled',
    ];

    if (status && !VALID_ORDER_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }
    if (payment_status && !VALID_PAYMENT_STATUSES.includes(payment_status)) {
      return NextResponse.json(
        { error: 'Invalid payment_status value' },
        { status: 400 },
      );
    }

    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id, user_id, status, payment_status, total')
      .eq('id', orderId)
      .maybeSingle();

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // A refund only makes sense against money that was actually collected —
    // otherwise admin could "refund" an order that was never paid, creating
    // a false financial record.
    if (
      payment_status === 'refunded' &&
      existingOrder.payment_status !== 'paid' &&
      existingOrder.payment_status !== 'refunded'
    ) {
      return NextResponse.json(
        {
          error: `Cannot refund an order with payment status "${existingOrder.payment_status}" — only a paid order can be refunded.`,
        },
        { status: 400 },
      );
    }

    const fullAmount = Number(existingOrder.total || 0);
    const isNewRefund =
      payment_status === 'refunded' && existingOrder.payment_status !== 'refunded';
    // Defaults to a full refund; admin may enter a smaller amount for a
    // partial refund. Capped at the order's total so it can never record
    // refunding more than was actually paid.
    const refundAmount = isNewRefund
      ? typeof refund_amount === 'number' &&
        Number.isFinite(refund_amount) &&
        refund_amount > 0
        ? Math.min(refund_amount, fullAmount)
        : fullAmount
      : null;
    const isPartialRefund = refundAmount !== null && refundAmount < fullAmount;
    const refundReason = isNewRefund
      ? String(refund_reason || '').trim() || 'No reason provided'
      : null;

    const updateData: Record<string, string | number> = {};
    if (status) updateData.status = status;
    if (payment_status) updateData.payment_status = payment_status;
    if (isNewRefund) {
      updateData.refund_amount = refundAmount as number;
      updateData.refund_reason = refundReason as string;
    }

    const { data: order, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      console.error('Order update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 },
      );
    }

    if (isNewRefund) {
      const { data: refundCustomerProfile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', order.user_id)
        .maybeSingle();

      if (refundCustomerProfile?.email) {
        try {
          await sendResendEmail({
            to: refundCustomerProfile.email,
            subject: isPartialRefund
              ? 'Partial Refund Confirmed - Your Rute Order'
              : 'Refund Confirmed - Your Rute Order',
            html: renderNotificationTemplate({
              title: isPartialRefund
                ? 'Partial Refund Confirmed'
                : 'Refund Confirmed',
              notificationMessage:
                'A refund has been recorded for your order. If you paid by card, it may take a few days to reflect in your account.',
              sectionTitle: 'Refund details',
              details: [
                { label: 'Order ID', value: orderId },
                {
                  label: 'Amount Refunded',
                  value: `R${(refundAmount as number).toFixed(2)}`,
                },
                ...(isPartialRefund
                  ? [{ label: 'Original Total', value: `R${fullAmount.toFixed(2)}` }]
                  : []),
                { label: 'Reason', value: refundReason as string },
              ],
              ctaLink: `${process.env.NEXT_PUBLIC_APP_URL}/user/orders/${orderId}`,
              ctaText: 'View My Order',
              preheader: 'A refund has been recorded for your order.',
            }),
          });
        } catch (emailError) {
          console.error('Order refund confirmation email failed:', emailError);
        }
      }
    }

    const previousStatus = String(existingOrder?.status || 'pending');
    const updatedStatus = String(order.status || 'pending');

    if (status && previousStatus !== updatedStatus) {
      const { data: customerProfile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', order.user_id)
        .maybeSingle();

      if (customerProfile?.email) {
        try {
          // Fetch product details for status update email
          const { data: fullOrder } = await supabase
            .from('orders')
            .select('id, items')
            .eq('id', orderId)
            .maybeSingle();

          let orderItems: any[] = [];

          if (fullOrder?.items && Array.isArray(fullOrder.items)) {
            const productIds = fullOrder.items.map(
              (item: any) => item.product_id,
            );
            const { data: productsData } = await supabase
              .from('products')
              .select(
                'id, name, category_id, images:product_images(url, is_primary, sort_order)',
              )
              .in('id', productIds);

            console.log(
              '[Order Status Email][Point 18] productsData fetched',
              productsData,
            );

            const categoryIds = Array.from(
              new Set(
                (productsData || []).map((p) => p.category_id).filter(Boolean),
              ),
            ) as string[];

            const { data: categoriesData } = await supabase
              .from('product_categories')
              .select('id, name')
              .in('id', categoryIds);

            const productsMap = new Map(
              (productsData || []).map((p) => [p.id, p]),
            );
            const categoriesMap = new Map(
              (categoriesData || []).map((c) => [c.id, c.name]),
            );

            const imageMapping = new Map();
            (productsData || []).forEach((product: any) => {
              const imageUrl = getPrimaryProductImageUrl(product.images || []);
              if (imageUrl) {
                imageMapping.set(product.id, imageUrl);
              }
            });

            console.log(
              '[Order Status Email][Point 18] image mapping',
              imageMapping,
            );

            orderItems = (fullOrder.items || []).map((item: any) => {
              const product = productsMap.get(item.product_id);
              return {
                productName: product?.name || 'Product',
                quantity: item.quantity,
                price: item.price,
                category: product?.category_id
                  ? categoriesMap.get(product.category_id)
                  : undefined,
                imageUrl: imageMapping.get(item.product_id) || '',
              };
            });
          }

          const productSummary = buildOrderProductsSubject(orderItems);

          await sendResendEmail({
            to: customerProfile.email,
            subject: `Status Update - ${productSummary}`,
            html: orderStatusUpdateTemplate({
              customerName: customerProfile.full_name || 'Customer',
              orderId,
              items: orderItems,
              previousStatus,
              newStatus: updatedStatus,
              updatedAt: new Date().toLocaleString('en-ZA', {
                dateStyle: 'medium',
                timeStyle: 'short',
              }),
              detailsUrl: `${process.env.NEXT_PUBLIC_APP_URL}/user/orders/${orderId}`,
            }),
          });
        } catch (emailError) {
          console.error('Order status update email failed:', emailError);
        }
      }
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
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

    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: orderId } = await params;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 },
      );
    }

    const { error: deleteError } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (deleteError) {
      console.error('Order delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete order' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
