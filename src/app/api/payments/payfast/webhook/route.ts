import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getPayFastService } from '@/lib/server/payfast/payfast.service';
import { sendResendEmail } from '@/lib/server/email';
import { orderPaymentSuccessTemplate } from '@/lib/server/email';
import { bookingPaymentSuccessTemplate } from '@/lib/server/email';
import { additionalWorkPaymentSuccessTemplate } from '@/lib/server/email';
import { sendWhatsAppMessage, normalizeToE164 } from '@/lib/server/whatsapp/twilio';

const SUBJECT_MAX_LENGTH = 70;

function cleanProductNameForHeading(name: string): string {
  return String(name || '')
    .replace(/\s*\([^)]*\)\s*$/g, '')
    .trim();
}

function resolveProductImageUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return undefined;

  const normalizedPath = String(url)
    .replace(/^\/+/, '')
    .replace(/^storage\/v1\/object\/public\/products\//, '');

  return `${base}/storage/v1/object/public/products/${normalizedPath}`;
}

function getPrimaryProductImageUrl(images: any[]): string | undefined {
  const sortedImages = [...images].sort(
    (a: any, b: any) =>
      Number(a?.sort_order ?? 9999) - Number(b?.sort_order ?? 9999),
  );
  return sortedImages.find((img: any) => img?.is_primary)?.url;
}

function buildOrderProductsSubject(
  items: Array<{ productName: string }>,
): string {
  const products = Array.from(
    new Set(
      items
        .map((item) => cleanProductNameForHeading(item.productName))
        .filter(Boolean),
    ),
  );
  const joined = products.join(', ') || 'Products';

  if (joined.length <= SUBJECT_MAX_LENGTH) return joined;
  return `${joined.slice(0, SUBJECT_MAX_LENGTH - 3).trimEnd()}...`;
}

function buildBookingServiceSubject(
  serviceName: string,
  serviceCategory?: string,
): string {
  const fullName = serviceCategory
    ? `${serviceName} - ${serviceCategory}`
    : serviceName;
  return fullName.length > SUBJECT_MAX_LENGTH
    ? fullName.substring(0, SUBJECT_MAX_LENGTH - 3) + '...'
    : fullName;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient();
    const skipSignatureValidation =
      process.env.PAYFAST_SKIP_SIGNATURE_VALIDATION === 'true' &&
      process.env.NODE_ENV !== 'production';

    // Get raw body for signature validation
    const text = await request.text();
    const webhookData = Object.fromEntries(new URLSearchParams(text));

    const referenceId = webhookData.m_payment_id || webhookData.custom_str1;

    // Validate webhook signature
    const payfast = getPayFastService();
    const isValid = payfast.validateWebhookSignature(webhookData, text);

    if (!isValid && !skipSignatureValidation) {
      console.error('Invalid PayFast webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    if (!referenceId) {
      return NextResponse.json(
        { error: 'Reference ID not found in webhook' },
        { status: 400 },
      );
    }

    // Get payment status
    const paymentStatus = String(
      webhookData.payment_status || '',
    ).toUpperCase();
    const transactionId = webhookData.pf_payment_id;

    let bookingStatus = 'pending';
    let orderStatus = 'pending';
    let dbPaymentStatus = 'failed';

    // Determine status based on PayFast payment_status
    if (paymentStatus === 'COMPLETE') {
      // Payment successful
      dbPaymentStatus = 'paid';
      bookingStatus = 'confirmed';
      orderStatus = 'confirmed';
    } else if (paymentStatus === 'PENDING') {
      // Payment pending (process ongoing)
      dbPaymentStatus = 'pending';
    } else if (paymentStatus === 'FAILED' || paymentStatus === 'CANCELLED') {
      // Payment cancelled or failed
      dbPaymentStatus = 'failed';
      bookingStatus = 'cancelled';
      orderStatus = 'cancelled';
    }

    // ── Check if this is an additional work payment ──────────────────────────
    const { data: existingAdditionalWork } = await supabase
      .from('booking_additional_works')
      .select(
        'id, booking_id, description, fee, status, bookings(id, user_id, profiles!user_id(full_name, email, phone), services(name))',
      )
      .eq('id', referenceId)
      .maybeSingle();

    if (existingAdditionalWork) {
      const wasAlreadyPaid = existingAdditionalWork.status === 'paid';

      if (dbPaymentStatus === 'paid' && !wasAlreadyPaid) {
        const { error: updateAWError } = await supabase
          .from('booking_additional_works')
          .update({
            status: 'paid',
            payfast_transaction_id: transactionId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', referenceId);

        if (updateAWError) {
          console.error('Error updating additional work:', updateAWError);
          return NextResponse.json(
            { error: 'Failed to update additional work' },
            { status: 500 },
          );
        }

        // Add additional work fee to booking total_price
        const { data: currentBooking } = await supabase
          .from('bookings')
          .select('total_price')
          .eq('id', existingAdditionalWork.booking_id)
          .single();

        if (currentBooking) {
          const newTotal =
            Number(currentBooking.total_price || 0) +
            Number(existingAdditionalWork.fee || 0);
          await supabase
            .from('bookings')
            .update({
              total_price: newTotal,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingAdditionalWork.booking_id);
        }

        // Gather details for notifications
        const booking = Array.isArray(existingAdditionalWork.bookings)
          ? existingAdditionalWork.bookings[0]
          : existingAdditionalWork.bookings;

        const profile = Array.isArray((booking as any)?.profiles)
          ? (booking as any).profiles[0]
          : (booking as any)?.profiles;

        const service = Array.isArray((booking as any)?.services)
          ? (booking as any).services[0]
          : (booking as any)?.services;

        const customerName = profile?.full_name || 'Customer';
        const customerEmail = profile?.email || null;
        const bookingId = existingAdditionalWork.booking_id;
        const fee = Number(existingAdditionalWork.fee || 0);
        const description = existingAdditionalWork.description;
        const serviceName = service?.name || 'Service Booking';

        const adminEmail =
          process.env.ADMIN_BOOKING_EMAIL ||
          process.env.AWS_SES_FROM_EMAIL ||
          '';

        // Fetch assigned worker for WhatsApp notification
        const { data: workerAssignment } = await supabase
          .from('booking_assignments')
          .select('workers(profiles(full_name, email, phone))')
          .eq('booking_id', bookingId)
          .in('status', ['accepted', 'pending'])
          .limit(1)
          .maybeSingle();

        const workerProfile = (() => {
          const w = (workerAssignment as any)?.workers;
          const wp = Array.isArray(w?.profiles) ? w.profiles[0] : w?.profiles;
          return wp || null;
        })();

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';

        // Email to customer
        if (customerEmail) {
          try {
            await sendResendEmail({
              to: customerEmail,
              subject: `Additional Work Payment Confirmed - ${serviceName}`,
              html: additionalWorkPaymentSuccessTemplate({
                audience: 'user',
                customerName,
                bookingId,
                additionalWorkId: referenceId,
                description,
                fee,
                serviceName,
                transactionId,
                dashboardUrl: `${appUrl}/user/bookings/${bookingId}`,
              }),
            });
          } catch (e) {
            console.error('Additional work user email failed:', e);
          }
        }

        // Email to admin
        if (adminEmail) {
          try {
            await sendResendEmail({
              to: adminEmail,
              subject: `Additional Work Payment Received - ${serviceName}`,
              html: additionalWorkPaymentSuccessTemplate({
                audience: 'admin',
                customerName,
                bookingId,
                additionalWorkId: referenceId,
                description,
                fee,
                serviceName,
                transactionId,
                dashboardUrl: `${appUrl}/admin/bookings`,
              }),
            });
          } catch (e) {
            console.error('Additional work admin email failed:', e);
          }
        }

        // Email to worker
        if (workerProfile?.email) {
          try {
            await sendResendEmail({
              to: workerProfile.email,
              subject: `Additional Work Payment Received - ${serviceName}`,
              html: additionalWorkPaymentSuccessTemplate({
                audience: 'worker',
                customerName,
                bookingId,
                additionalWorkId: referenceId,
                description,
                fee,
                serviceName,
                transactionId,
                dashboardUrl: `${appUrl}/admin/bookings`,
              }),
            });
          } catch (e) {
            console.error('Additional work worker email failed:', e);
          }
        }

        // WhatsApp to worker
        if (workerProfile?.phone) {
          try {
            const workerPhone = normalizeToE164(workerProfile.phone);
            if (workerPhone) {
              await sendWhatsAppMessage({
                to: workerPhone,
                body: `Additional work payment received!\n\nBooking: ${bookingId.slice(0, 8)}\nService: ${serviceName}\nDescription: ${description}\nAmount: R${fee.toFixed(2)}\n\nThe customer has paid for additional work. Please proceed accordingly.`,
              });
            }
          } catch (e) {
            console.error('Additional work WhatsApp to worker failed:', e);
          }
        }
      } else if (
        (dbPaymentStatus === 'failed' || paymentStatus === 'CANCELLED') &&
        !wasAlreadyPaid
      ) {
        await supabase
          .from('booking_additional_works')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('id', referenceId);
      }

      return NextResponse.json(
        { success: true, message: 'Additional work webhook processed' },
        { status: 200 },
      );
    }
    // ── End additional work block ─────────────────────────────────────────────

    const { data: existingBooking, error: existingBookingError } =
      await supabase
        .from('bookings')
        .select(
          'id, total_price, payment_status, profiles!user_id(full_name, email)',
        )
        .eq('id', referenceId)
        .maybeSingle();

    if (existingBookingError) {
      console.error('Error fetching existing booking:', existingBookingError);
    }

    const bookingWasPaidBefore = existingBooking?.payment_status === 'paid';

    // Update booking with payment information
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        payment_status: dbPaymentStatus,
        status: bookingStatus,
        payfast_transaction_id: transactionId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', referenceId)
      .select('id, status, payment_status, payfast_transaction_id')
      .maybeSingle();

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return NextResponse.json(
        { error: 'Failed to update booking' },
        { status: 500 },
      );
    }

    if (updatedBooking) {
      const bookingIsPaidNow = dbPaymentStatus === 'paid';

      if (bookingIsPaidNow && !bookingWasPaidBefore && existingBooking) {
        const profile = Array.isArray(existingBooking.profiles)
          ? existingBooking.profiles[0]
          : existingBooking.profiles;

        const customerName = profile?.full_name || 'Customer';
        const customerEmail = profile?.email || null;
        const adminEmail =
          process.env.ADMIN_BOOKING_EMAIL ||
          process.env.AWS_SES_FROM_EMAIL ||
          '';
        const paidAt = new Date().toLocaleString('en-ZA', {
          dateStyle: 'medium',
          timeStyle: 'short',
        });

        // Fetch full booking details for email
        const { data: bookingDetails } = await supabase
          .from('bookings')
          .select(
            'id, service_id, address, unit_or_flat, notes, booking_date, booking_time, total_price, selected_options, selected_variants',
          )
          .eq('id', referenceId)
          .maybeSingle();

        let serviceDetails: any = { name: 'Service' };

        if (bookingDetails?.service_id) {
          const { data: serviceData } = await supabase
            .from('services')
            .select('id, name, category_id')
            .eq('id', bookingDetails.service_id)
            .maybeSingle();

          if (serviceData) {
            serviceDetails.name = serviceData.name;

            if (serviceData.category_id) {
              const { data: categoryData } = await supabase
                .from('service_categories')
                .select('name')
                .eq('id', serviceData.category_id)
                .maybeSingle();
              serviceDetails.category = categoryData?.name;
            }

            // Fetch selected options details
            if (bookingDetails.selected_options?.length > 0) {
              const { data: optionsData } = await supabase
                .from('service_options')
                .select('id, name, description, price')
                .in('id', bookingDetails.selected_options);

              serviceDetails.options = (optionsData || []).map((opt) => ({
                name: opt.name,
                description: opt.description,
                price: opt.price,
              }));
            }

            // Fetch selected requirements details
            if (bookingDetails.selected_variants?.length > 0) {
              const { data: variantsData } = await supabase
                .from('service_requirements')
                .select('id, name, type, price')
                .in('id', bookingDetails.selected_variants);

              serviceDetails.requirements = (variantsData || []).map((v) => ({
                name: v.name,
                type: v.type,
                price: v.price,
              }));
            }
          }
        }

        if (customerEmail) {
          try {
            const serviceSubject = buildBookingServiceSubject(
              serviceDetails.name,
              serviceDetails.category,
            );

            await sendResendEmail({
              to: customerEmail,
              subject: `Payment Successful - ${serviceSubject}`,
              html: bookingPaymentSuccessTemplate({
                audience: 'user',
                customerName,
                bookingId: referenceId,
                service: serviceDetails,
                address: String(bookingDetails?.address || ''),
                unitOrFlat:
                  String(bookingDetails?.unit_or_flat || '').trim() ||
                  undefined,
                notes: String(bookingDetails?.notes || '').trim() || undefined,
                bookingDate: String(bookingDetails?.booking_date || ''),
                bookingTime: String(bookingDetails?.booking_time || ''),
                total: Number(existingBooking.total_price || 0),
                transactionId: webhookData.pf_payment_id,
                dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/user/bookings/${referenceId}`,
              }),
            });
          } catch (emailError) {
            console.error(
              'Booking payment success user email failed:',
              emailError,
            );
          }
        }

        if (adminEmail) {
          try {
            const serviceSubject = buildBookingServiceSubject(
              serviceDetails.name,
              serviceDetails.category,
            );

            await sendResendEmail({
              to: adminEmail,
              subject: `Booking Payment Received - ${serviceSubject}`,
              html: bookingPaymentSuccessTemplate({
                audience: 'admin',
                customerName,
                bookingId: referenceId,
                service: serviceDetails,
                address: String(bookingDetails?.address || ''),
                unitOrFlat:
                  String(bookingDetails?.unit_or_flat || '').trim() ||
                  undefined,
                notes: String(bookingDetails?.notes || '').trim() || undefined,
                bookingDate: String(bookingDetails?.booking_date || ''),
                bookingTime: String(bookingDetails?.booking_time || ''),
                total: Number(existingBooking.total_price || 0),
                transactionId: webhookData.pf_payment_id,
                dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/bookings`,
              }),
            });
          } catch (emailError) {
            console.error(
              'Booking payment success admin email failed:',
              emailError,
            );
          }
        }
      }

      return NextResponse.json(
        { success: true, message: 'Booking webhook processed' },
        { status: 200 },
      );
    }

    const { data: existingOrder, error: existingOrderError } = await supabase
      .from('orders')
      .select('id, total, payment_status, profiles!user_id(full_name, email)')
      .eq('id', referenceId)
      .maybeSingle();

    if (existingOrderError) {
      console.error('Error fetching existing order:', existingOrderError);
    }

    const wasPaidBefore = existingOrder?.payment_status === 'paid';

    const { data: updatedOrder, error: orderUpdateError } = await supabase
      .from('orders')
      .update({
        payment_status: dbPaymentStatus,
        status: orderStatus,
        payfast_transaction_id: transactionId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', referenceId)
      .select('id, status, payment_status, payfast_transaction_id')
      .maybeSingle();

    if (orderUpdateError) {
      console.error('Error updating order:', orderUpdateError);
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 },
      );
    }

    if (!updatedOrder) {
      return NextResponse.json(
        { error: 'No booking/order found for provided reference id' },
        { status: 404 },
      );
    }

    const isPaidNow = dbPaymentStatus === 'paid';

    if (isPaidNow && !wasPaidBefore && existingOrder) {
      const profile = Array.isArray(existingOrder.profiles)
        ? existingOrder.profiles[0]
        : existingOrder.profiles;

      const customerName = profile?.full_name || 'Customer';
      const customerEmail = profile?.email || null;
      const adminEmail =
        process.env.ADMIN_ORDER_EMAIL || process.env.AWS_SES_FROM_EMAIL || '';

      // Fetch full order details for email
      const { data: orderDetails } = await supabase
        .from('orders')
        .select('id, items')
        .eq('id', referenceId)
        .maybeSingle();

      let orderItems: any[] = [];

      if (orderDetails?.items && Array.isArray(orderDetails.items)) {
        const productIds = orderDetails.items.map(
          (item: any) => item.product_id,
        );
        const { data: productsData } = await supabase
          .from('products')
          .select(
            'id, name, category_id, images:product_images(url, is_primary, sort_order)',
          )
          .in('id', productIds);

        const categoryIds = Array.from(
          new Set(
            (productsData || []).map((p) => p.category_id).filter(Boolean),
          ),
        ) as string[];

        const { data: categoriesData } = await supabase
          .from('product_categories')
          .select('id, name')
          .in('id', categoryIds);

        const productsMap = new Map((productsData || []).map((p) => [p.id, p]));
        const categoriesMap = new Map(
          (categoriesData || []).map((c) => [c.id, c.name]),
        );

        orderItems = (orderDetails.items || []).map((item: any) => {
          const product = productsMap.get(item.product_id);
          const images = Array.isArray((product as any)?.images)
            ? [...(product as any).images]
            : [];
          const primaryImage = getPrimaryProductImageUrl(images);
          const resolvedImageUrl = resolveProductImageUrl(primaryImage);

          console.log('[Order Email][Point 9] image mapping:', {
            referenceId,
            transactionId: transactionId || null,
            productId: item.product_id,
            productName: product?.name || 'Product',
            imageCount: images.length,
            primaryImageRaw: primaryImage || null,
            resolvedImageUrl: resolvedImageUrl || null,
          });

          return {
            productName: product?.name || 'Product',
            quantity: item.quantity,
            price: item.price,
            category: product?.category_id
              ? categoriesMap.get(product.category_id)
              : undefined,
            imageUrl: resolvedImageUrl,
          };
        });
      }

      const productSummary = buildOrderProductsSubject(orderItems);

      if (customerEmail) {
        try {
          await sendResendEmail({
            to: customerEmail,
            subject: `Payment Successful - ${productSummary}`,
            html: orderPaymentSuccessTemplate({
              audience: 'user',
              customerName,
              orderId: referenceId,
              items: orderItems,
              total: Number(existingOrder.total || 0),
              transactionId,
              dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/user/orders/${referenceId}`,
            }),
          });
        } catch (emailError) {
          console.error('Order payment success user email failed:', emailError);
        }
      }

      if (adminEmail) {
        try {
          await sendResendEmail({
            to: adminEmail,
            subject: `Order Payment Received - ${productSummary}`,
            html: orderPaymentSuccessTemplate({
              audience: 'admin',
              customerName,
              orderId: referenceId,
              items: orderItems,
              total: Number(existingOrder.total || 0),
              transactionId,
              dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/orders/${referenceId}`,
            }),
          });
        } catch (emailError) {
          console.error(
            'Order payment success admin email failed:',
            emailError,
          );
        }
      }
    }

    return NextResponse.json(
      { success: true, message: 'Order webhook processed' },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error processing PayFast webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 },
    );
  }
}
