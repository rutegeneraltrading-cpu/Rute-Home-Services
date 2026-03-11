import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';
import { sendEmail } from '@/lib/server/email/ses-mailer';
import { orderCreatedTemplate } from '@/lib/server/email';

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
    const {
      items,
      address_id,
      new_address,
      subtotal,
      tax,
      shipping,
      total,
      notes,
    } = body;

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

    if (
      !Number.isFinite(subtotal) ||
      !Number.isFinite(tax) ||
      !Number.isFinite(shipping) ||
      !Number.isFinite(total)
    ) {
      return NextResponse.json(
        { error: 'Invalid amount values' },
        { status: 400 },
      );
    }

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

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: profile.id,
        items: items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
        })),
        address_id: resolvedAddressId,
        status: 'pending',
        subtotal,
        tax,
        shipping,
        total,
        payment_status: 'pending',
        notes: notes || null,
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 },
      );
    }

    if (profile.email) {
      try {
        await sendEmail({
          to: profile.email,
          subject: `Order Created - ${order.id}`,
          html: orderCreatedTemplate({
            customerName: profile.full_name || 'Customer',
            orderId: order.id,
            itemsCount: items.length,
            total,
            paymentStatus: 'Pending',
            dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/user/orders`,
          }),
        });
      } catch (emailError) {
        console.error('Order created email send failed:', emailError);
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
