import { createAdminClient } from '@/lib/supabase/server';

export type BookingEventType =
  | 'created'
  | 'payment_confirmed'
  | 'payment_failed'
  | 'payment_pending'
  | 'worker_assigned'
  | 'updated'
  | 'additional_work_paid'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export type BookingEventActorType = 'system' | 'admin' | 'worker' | 'customer';

interface LogBookingEventInput {
  bookingId: string;
  eventType: BookingEventType;
  actorType?: BookingEventActorType;
  actorLabel?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Append one row to the booking_events audit log.
 *
 * Deliberately fire-and-log, never fire-and-throw: a booking's history is
 * secondary to the operation that produced it, so a logging failure here
 * must never break booking creation, payment processing, assignment, etc.
 * Errors are swallowed after being logged to the console.
 */
export async function logBookingEvent({
  bookingId,
  eventType,
  actorType = 'system',
  actorLabel,
  description,
  metadata,
}: LogBookingEventInput): Promise<void> {
  try {
    const supabase = await createAdminClient();
    const { error } = await supabase.from('booking_events').insert({
      booking_id: bookingId,
      event_type: eventType,
      actor_type: actorType,
      actor_label: actorLabel || null,
      description: description || null,
      metadata: metadata || null,
    });

    if (error) {
      console.error('logBookingEvent insert failed:', error, {
        bookingId,
        eventType,
      });
    }
  } catch (error) {
    console.error('logBookingEvent threw:', error, { bookingId, eventType });
  }
}
