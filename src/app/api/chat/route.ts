import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createAdminClient, createClient } from '@/lib/supabase';
import { ALLOWED_POSTAL_CODE_RANGES } from '@/lib/config/serviceAreas';
import {
  FAQS_TEXT,
  TERMS_TEXT,
  REFUND_POLICY_TEXT,
  PRIVACY_POLICY_TEXT,
  ABOUT_TEXT,
} from '@/lib/config/staticContent';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: Message[];
  sessionId?: string;
}

async function fetchBusinessContext() {
  try {
  const supabase = await createAdminClient();

  const [servicesRes, productsRes] = await Promise.all([
    supabase
      .from('services')
      .select(
        `
        id, name, description, base_price, duration_minutes, is_active,
        platform_fee, priority_fee,
        category:service_categories(name, charge_type),
        options:service_options(name, description, price, is_required, type)
      `
      )
      .eq('is_active', true)
      .order('created_at', { ascending: false }),

    supabase
      .from('products')
      .select(
        'id, name, description, price, sale_price, brand, stock, category:product_categories(name)'
      )
      .gt('stock', 0)
      .order('created_at', { ascending: false }),
  ]);

  const services = servicesRes.data || [];
  const products = productsRes.data || [];

  const servicesText = services
    .map((s: any) => {
      const category = s.category?.name || 'General';
      const chargeType = s.category?.charge_type || 'hourly';
      const options = (s.options || [])
        .map(
          (o: any) =>
            `    - ${o.name}: R${o.price}${o.is_required ? ' (required)' : ''}`
        )
        .join('\n');

      return `
Service: ${s.name}
  Category: ${category}
  Description: ${s.description || 'N/A'}
  Base Price: R${s.base_price} (${chargeType})
  Duration: ${s.duration_minutes} minutes
  Platform Fee: R${s.platform_fee || 0}
  Priority/Instant Booking Fee: R${s.priority_fee || 0}
${options ? `  Add-ons:\n${options}` : ''}`.trim();
    })
    .join('\n\n');

  const productsText = products
    .map((p: any) => {
      const category = p.category?.name || 'General';
      const price = p.sale_price
        ? `R${p.sale_price} (on sale from R${p.price})`
        : `R${p.price}`;
      return `Product: ${p.name} | Category: ${category} | Price: ${price} | Brand: ${p.brand || 'N/A'} | In Stock: ${p.stock} units`;
    })
    .join('\n');

  return { servicesText, productsText };
  } catch (err) {
    console.error('fetchBusinessContext error:', err);
    return { servicesText: '', productsText: '' };
  }
}

async function fetchUserContext() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const supabaseAdmin = await createAdminClient();

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email')
      .eq('auth_id', user.id)
      .single();

    if (!profile) return null;

    // Fetch bookings and orders in parallel
    const [bookingsRes, ordersRes] = await Promise.all([
      supabaseAdmin
        .from('bookings')
        .select('id, service_id, status, payment_status, booking_date, booking_time, total_price, notes, created_at')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10),
      supabaseAdmin
        .from('orders')
        .select('id, status, payment_status, total, created_at, items')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    const bookings = bookingsRes.data || [];
    const orders = ordersRes.data || [];

    // Enrich bookings with service names
    const serviceIds = [...new Set(bookings.map((b: any) => b.service_id).filter(Boolean))];
    let serviceMap: Record<string, string> = {};
    if (serviceIds.length > 0) {
      const { data: services } = await supabaseAdmin
        .from('services')
        .select('id, name')
        .in('id', serviceIds);
      (services || []).forEach((s: any) => { serviceMap[s.id] = s.name; });
    }

    // Enrich orders with product names from items JSON column
    const allProductIds = [...new Set(
      orders.flatMap((o: any) => (o.items || []).map((i: any) => i.product_id).filter(Boolean))
    )];
    let productMap: Record<string, string> = {};
    if (allProductIds.length > 0) {
      const { data: products } = await supabaseAdmin
        .from('products')
        .select('id, name')
        .in('id', allProductIds);
      (products || []).forEach((p: any) => { productMap[p.id] = p.name; });
    }

    const bookingsText = bookings.length === 0
      ? 'No bookings found.'
      : bookings.map((b: any) => {
          const serviceName = serviceMap[b.service_id] || 'Service';
          return `- Booking #${b.id.slice(0, 8)}: ${serviceName} | Status: ${b.status} | Payment: ${b.payment_status} | Date: ${b.booking_date} at ${b.booking_time} | Total: R${b.total_price}${b.notes ? ` | Notes: ${b.notes}` : ''}`;
        }).join('\n');

    const ordersText = orders.length === 0
      ? 'No orders found.'
      : orders.map((o: any) => {
          const itemsList = (o.items || [])
            .map((i: any) => `${productMap[i.product_id] || 'Product'} x${i.quantity ?? i.qty ?? 1}`)
            .join(', ');
          return `- Order #${o.id.slice(0, 8)}: Status: ${o.status} | Payment: ${o.payment_status} | Total: R${o.total} | Items: ${itemsList || 'N/A'} | Date: ${new Date(o.created_at).toLocaleDateString('en-ZA')}`;
        }).join('\n');

    return { name: profile.full_name || 'Customer', bookingsText, ordersText };
  } catch (err) {
    console.error('fetchUserContext error:', err);
    return null;
  }
}

async function saveChatHistory(
  sessionId: string,
  role: string,
  content: string
) {
  try {
    const supabase = await createAdminClient();
    await supabase
      .from('chat_sessions')
      .insert({ session_id: sessionId, role, content });
  } catch {
    // Non-critical — don't fail the request if history save fails
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'AI service is not configured.' },
        { status: 500 }
      );
    }

    const body: ChatRequest = await request.json();
    const { messages, sessionId } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Please provide at least one message.' },
        { status: 400 }
      );
    }

    // Fetch live data from Supabase + user context (if logged in)
    const [{ servicesText, productsText }, userContext] = await Promise.all([
      fetchBusinessContext(),
      fetchUserContext(),
    ]);

    const serviceAreasText = ALLOWED_POSTAL_CODE_RANGES
      .map((r) => `- ${r.label} (postal codes ${r.from}–${r.to})`)
      .join('\n');

    const userSection = userContext
      ? `
--- LOGGED-IN CUSTOMER ---
You are speaking with: ${userContext.name}
Only share this customer's data with them. Never reveal another customer's data.

THEIR RECENT BOOKINGS:
${userContext.bookingsText}

THEIR RECENT ORDERS:
${userContext.ordersText}

When they ask about "my booking", "my order", "my status" — answer using the data above.
For booking details page: [View My Bookings](/user/bookings)
For order details page: [View My Orders](/user/orders)
`
      : '';

    const systemPrompt = `You are a helpful AI assistant for a Home Services company based in South Africa. You help customers with questions about services, products, bookings, and general inquiries.

IMPORTANT RULES:
1. Only answer questions related to our business (services, products, bookings, pricing, areas, policies)
2. Use ONLY the data provided below — never make up prices, services, or areas
3. Be friendly, concise, and helpful — no emojis
4. When mentioning a page on our website, always format it as a markdown link: [Page Name](/path)
   Examples: [Book a Service](/booking), [Contact Us](/contact-us), [Shop](/shop)
5. For questions outside our business scope, politely say you can only help with our services
6. If a guest (not logged in) asks about their bookings or orders, ask them to log in first
7. You HAVE full context of the current conversation — you CAN answer meta-questions like "what did I ask before?", "do you remember our chat?", "what was my last question?"
8. When showing bookings or orders data, ALWAYS use a markdown table with proper headers
9. Booking table columns: Booking ID | Service | Status | Payment | Date | Total
10. Order table columns: Order ID | Items | Status | Payment | Date | Total${userSection ? '' : '\n11. The current user is NOT logged in — do not reference any account data'}

--- SERVICE AREAS (South Africa only) ---
We currently service the following areas:
${serviceAreasText}

--- OUR SERVICES ---
${servicesText || 'No services currently available.'}

--- OUR PRODUCTS (In Stock) ---
${productsText || 'No products currently available.'}

--- WEBSITE PAGES ---
- Book a service: [Book Now](/booking)
- Shop products: [Shop](/shop)
- Contact us: [Contact Us](/contact-us)
- Refund policy: [Refund Policy](/refund-policy)
- Privacy policy: [Privacy Policy](/privacy-policy)
- How it works: [How It Works](/how-it-works)
- About us: [About Rute](/about)
- Terms & conditions: [Terms & Conditions](/terms-and-conditions)

--- FREQUENTLY ASKED QUESTIONS ---
${FAQS_TEXT}

--- ABOUT RUTE ---
${ABOUT_TEXT}

--- TERMS & CONDITIONS ---
${TERMS_TEXT}

--- REFUND POLICY ---
${REFUND_POLICY_TEXT}

--- PRIVACY POLICY ---
${PRIVACY_POLICY_TEXT}${userSection}`;

    // Only pass user/assistant roles to Claude (filter out system)
    const chatMessages = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-10)
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: chatMessages,
    });

    const aiMessage =
      response.content[0]?.type === 'text' ? response.content[0].text : '';

    if (!aiMessage) {
      return NextResponse.json(
        { error: 'No response generated.' },
        { status: 500 }
      );
    }

    // Save to Supabase chat history (non-blocking)
    if (sessionId) {
      const lastUserMsg = messages.filter((m) => m.role === 'user').slice(-1)[0];
      if (lastUserMsg) {
        saveChatHistory(sessionId, 'user', lastUserMsg.content);
      }
      saveChatHistory(sessionId, 'assistant', aiMessage);
    }

    return NextResponse.json({ message: aiMessage, role: 'assistant' });
  } catch (error) {
    console.error('Chat API error:', error);

    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `AI service error: ${error.message}` },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
