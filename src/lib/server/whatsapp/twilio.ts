const E164_PHONE_REGEX = /^\+[1-9]\d{7,14}$/;

export interface WhatsAppMessageInput {
  to: string;
  body: string;
}

export function normalizeToE164(value?: string | null): string | null {
  const raw = String(value || '').trim();
  if (!raw) return null;

  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;

  const normalized = `+${digits}`;
  return E164_PHONE_REGEX.test(normalized) ? normalized : null;
}

export async function sendWhatsAppMessage({
  to,
  body,
}: WhatsAppMessageInput): Promise<void> {
  const isEnabled = String(
    process.env.WHATSAPP_NOTIFICATIONS_ENABLED || 'false',
  ).toLowerCase();

  if (!['true', '1', 'yes', 'on'].includes(isEnabled)) {
    return;
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !from) {
    throw new Error('Missing Twilio WhatsApp configuration in environment');
  }

  const normalizedTo = normalizeToE164(to);
  if (!normalizedTo) {
    throw new Error('Invalid recipient phone for WhatsApp');
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const payload = new URLSearchParams({
    From: from.startsWith('whatsapp:') ? from : `whatsapp:${from}`,
    To: `whatsapp:${normalizedTo}`,
    Body: body,
  });

  const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString(
    'base64',
  );

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: payload.toString(),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(
      `Twilio WhatsApp send failed (${response.status}): ${errText}`,
    );
  }
}
