import { NextRequest, NextResponse, after } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getPayFastService } from '@/lib/server/payfast/payfast.service';
import { logBookingEvent } from '@/lib/server/bookingEvents';
import { sendResendEmail } from '@/lib/server/email';
import { orderPaymentSuccessTemplate } from '@/lib/server/email';
import { bookingPaymentSuccessTemplate } from '@/lib/server/email';
import { renderNotificationTemplate } from '@/lib/server/email';
import { additionalWorkPaymentSuccessTemplate } from '@/lib/server/email';
import {
  sendWhatsAppMessage,
  sendWhatsAppTemplateMessage,
  normalizeToE164,
} from '@/lib/server/whatsapp/twilio';

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

// Sanity-checks the amount PayFast says was actually paid (`amount_gross`)
// against what our own record expects. The amount PayFast sends to this
// booking/order's PayFast request is already sourced server-side from the
// DB (never the client) at payment-link generation time, so under normal
// operation this should always match — a mismatch here is a signal
// something drifted (e.g. price edited between link generation and payment)
// or a bug regression, not proof of fraud on its own (a genuinely-tampered
// amount would fail signature validation before ever reaching this check).
// So this logs/flags for admin review rather than blocking the payment —
// refusing to confirm a booking/order PayFast has already charged the
// customer for would leave a paying customer stuck, which is worse than a
// false alarm. Tolerance absorbs harmless float/rounding differences.
function checkPaidAmount(
  expected: number,
  webhookData: Record<string, string>,
): { ok: boolean; received: number } {
  const received = Number(webhookData.amount_gross);
  const ok = Number.isFinite(received) && Math.abs(received - expected) <= 0.01;
  return { ok, received };
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
        const awAmountCheck = checkPaidAmount(
          Number(existingAdditionalWork.fee || 0),
          webhookData,
        );
        if (!awAmountCheck.ok) {
          console.error(
            `[PayFast ITN] Amount mismatch on additional work ${referenceId}: expected ${existingAdditionalWork.fee}, PayFast reported ${awAmountCheck.received}`,
          );
        }

        // Atomic compare-and-swap: only this request's update can win the
        // 'pending_payment' -> 'paid' transition. Guards against duplicate/
        // concurrent PayFast ITN retries double-adding the fee to total_price
        // below (the earlier `wasAlreadyPaid` check alone isn't enough since
        // two concurrent requests can both read status as not-yet-paid).
        const { data: claimedAW, error: updateAWError } = await supabase
          .from('booking_additional_works')
          .update({
            status: 'paid',
            payfast_transaction_id: transactionId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', referenceId)
          .eq('status', 'pending_payment')
          .select('id')
          .maybeSingle();

        if (updateAWError) {
          console.error('Error updating additional work:', updateAWError);
          return NextResponse.json(
            { error: 'Failed to update additional work' },
            { status: 500 },
          );
        }

        if (!claimedAW) {
          // Lost the race to a concurrent/duplicate ITN — already handled.
          return NextResponse.json(
            { success: true, message: 'Additional work already processed' },
            { status: 200 },
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

        await logBookingEvent({
          bookingId: existingAdditionalWork.booking_id,
          eventType: 'additional_work_paid',
          actorType: 'system',
          description: awAmountCheck.ok
            ? `Additional work paid: ${existingAdditionalWork.description}`
            : `Additional work paid: ${existingAdditionalWork.description} — ⚠ amount mismatch: expected R${Number(existingAdditionalWork.fee).toFixed(2)}, PayFast reported R${awAmountCheck.received.toFixed(2)}`,
          metadata: {
            fee: existingAdditionalWork.fee,
            payfast_transaction_id: transactionId,
            amount_mismatch: !awAmountCheck.ok,
            payfast_reported_amount: awAmountCheck.received,
          },
        });

        // Notifications are slow (multiple DB lookups + email/WhatsApp sends).
        // Run them after the response is sent so PayFast gets a fast 200 for
        // the ITN — a slow response can make PayFast treat delivery as failed.
        after(async () => {
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

        const adminEmail = process.env.ADMIN_FROM || '';

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
            const paymentReceivedTemplateSid =
              process.env.TWILIO_TEMPLATE_PAYMENT_RECEIVED_SID;
            if (workerPhone && paymentReceivedTemplateSid) {
              await sendWhatsAppTemplateMessage({
                to: workerPhone,
                contentSid: paymentReceivedTemplateSid,
                contentVariables: {
                  '1': bookingId.slice(0, 8),
                  '2': serviceName,
                  '3': description,
                  '4': fee.toFixed(2),
                },
              });
            } else if (workerPhone) {
              await sendWhatsAppMessage({
                to: workerPhone,
                body: `Additional work payment received!\n\nBooking: ${bookingId.slice(0, 8)}\nService: ${serviceName}\nDescription: ${description}\nAmount: R${fee.toFixed(2)}\n\nThe customer has paid for additional work. Please proceed accordingly.\n\nReply STOP to opt out.`,
              });
            }
          } catch (e) {
            console.error('Additional work WhatsApp to worker failed:', e);
          }
        }
        });
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
    const bookingWasFailedBefore = existingBooking?.payment_status === 'failed';
    const bookingWasPendingBefore = existingBooking?.payment_status === 'pending';

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

      if (bookingIsPaidNow && !bookingWasPaidBefore) {
        const bookingAmountCheck = checkPaidAmount(
          Number(existingBooking?.total_price || 0),
          webhookData,
        );
        if (!bookingAmountCheck.ok) {
          console.error(
            `[PayFast ITN] Amount mismatch on booking ${referenceId}: expected ${existingBooking?.total_price}, PayFast reported ${bookingAmountCheck.received}`,
          );
        }

        await logBookingEvent({
          bookingId: referenceId,
          eventType: 'payment_confirmed',
          actorType: 'system',
          description: bookingAmountCheck.ok
            ? 'Payment confirmed by PayFast'
            : `Payment confirmed by PayFast — ⚠ amount mismatch: expected R${Number(existingBooking?.total_price || 0).toFixed(2)}, PayFast reported R${bookingAmountCheck.received.toFixed(2)}`,
          metadata: {
            payfast_transaction_id: transactionId,
            amount_mismatch: !bookingAmountCheck.ok,
            payfast_reported_amount: bookingAmountCheck.received,
          },
        });
      } else if (dbPaymentStatus === 'failed' && !bookingWasFailedBefore) {
        await logBookingEvent({
          bookingId: referenceId,
          eventType: 'payment_failed',
          actorType: 'system',
          description: 'Payment failed or was cancelled',
        });

        if (existingBooking) {
          const profile = Array.isArray(existingBooking.profiles)
            ? existingBooking.profiles[0]
            : existingBooking.profiles;
          const customerEmail = profile?.email;

          if (customerEmail) {
            after(async () => {
              try {
                await sendResendEmail({
                  to: customerEmail,
                  subject: 'Payment Unsuccessful - Your Rute Booking',
                  html: renderNotificationTemplate({
                    title: 'Payment Unsuccessful',
                    notificationMessage:
                      'Your payment for this booking was not completed. Your booking has not been confirmed — please try paying again from your bookings page.',
                    sectionTitle: 'Booking details',
                    details: [
                      { label: 'Booking ID', value: referenceId },
                      { label: 'Payment Status', value: 'Failed' },
                    ],
                    ctaLink: `${process.env.NEXT_PUBLIC_APP_URL}/user/bookings/${referenceId}`,
                    ctaText: 'View My Booking',
                    preheader: 'Your payment could not be completed.',
                  }),
                });
              } catch (emailError) {
                console.error(
                  'Payment failed customer email failed:',
                  emailError,
                );
              }
            });
          }
        }
      } else if (dbPaymentStatus === 'pending' && !bookingWasPendingBefore) {
        await logBookingEvent({
          bookingId: referenceId,
          eventType: 'payment_pending',
          actorType: 'system',
          description: 'Payment is pending',
        });
      }

      if (bookingIsPaidNow && !bookingWasPaidBefore && existingBooking) {
        // Run notifications after the response is sent — see comment above.
        after(async () => {
        const profile = Array.isArray(existingBooking.profiles)
          ? existingBooking.profiles[0]
          : existingBooking.profiles;

        const customerName = profile?.full_name || 'Customer';
        const customerEmail = profile?.email || null;
        const adminEmail = process.env.ADMIN_FROM || '';
        const paidAt = new Date().toLocaleString('en-ZA', {
          dateStyle: 'medium',
          timeStyle: 'short',
        });

        // Fetch full booking details for email
        const { data: bookingDetails } = await supabase
          .from('bookings')
          .select(
            'id, service_id, address, unit_or_flat, notes, booking_date, booking_time, total_price, selected_options, selected_variants, app_fee, priority_status, priority_fee',
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
                app_fee: Number(bookingDetails?.app_fee || 0) || undefined,
                priority_status: bookingDetails?.priority_status ?? undefined,
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
                app_fee: Number(bookingDetails?.app_fee || 0) || undefined,
                priority_status: bookingDetails?.priority_status ?? undefined,
              }),
            });
          } catch (emailError) {
            console.error(
              'Booking payment success admin email failed:',
              emailError,
            );
          }
        }
        });
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
      const orderAmountCheck = checkPaidAmount(
        Number(existingOrder.total || 0),
        webhookData,
      );
      if (!orderAmountCheck.ok) {
        console.error(
          `[PayFast ITN] Amount mismatch on order ${referenceId}: expected ${existingOrder.total}, PayFast reported ${orderAmountCheck.received}`,
        );
      }

      // Run notifications after the response is sent — see comment above.
      after(async () => {
      const profile = Array.isArray(existingOrder.profiles)
        ? existingOrder.profiles[0]
        : existingOrder.profiles;

      const customerName = profile?.full_name || 'Customer';
      const customerEmail = profile?.email || null;
      const adminEmail = process.env.ADMIN_FROM || '';

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
      });
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
