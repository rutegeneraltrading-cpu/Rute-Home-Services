import crypto from 'crypto';

interface PayFastConfig {
  merchantId: string;
  merchantKey: string;
  passphrase: string;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
  sandbox?: boolean;
  signatureMode?: 'with-passphrase' | 'without-passphrase';
  signatureOrder?: 'insertion' | 'alphabetical';
}

interface PayFastPaymentData {
  merchant_id: string;
  merchant_key: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  name_first: string;
  name_last: string;
  email_address: string;
  cell_number?: string;
  item_name: string;
  item_description: string;
  amount: string;
  m_payment_id?: string;
  custom_str1?: string;
}

interface PayFastCallbackUrls {
  returnUrl?: string;
  cancelUrl?: string;
  notifyUrl?: string;
}

export class PayFastService {
  private config: PayFastConfig;
  private payweb_url = 'https://www.payfast.co.za/eng/process';
  private payweb_url_sandbox = 'https://sandbox.payfast.co.za/eng/process';

  constructor(config: PayFastConfig) {
    this.config = config;
  }

  private isDebugEnabled(): boolean {
    return process.env.PAYFAST_DEBUG_SIGNATURE === 'true';
  }

  /**
   * PayFast expects PHP-style urlencode (space => +)
   */
  private payFastEncode(value: string): string {
    return encodeURIComponent(value)
      .replace(/%20/g, '+')
      .replace(/!/g, '%21')
      .replace(/'/g, '%27')
      .replace(/\(/g, '%28')
      .replace(/\)/g, '%29')
      .replace(/\*/g, '%2A');
  }

  private buildDataString<T extends object>(
    data: T,
    order: 'insertion' | 'alphabetical' = this.config.signatureOrder ||
      'insertion',
  ): string {
    const entries = Object.entries(data as Record<string, unknown>)
      .filter(
        ([, value]) => value !== null && value !== undefined && value !== '',
      )
      .map(
        ([key, value]) =>
          [key, this.payFastEncode(String(value).trim())] as const,
      );

    const orderedEntries =
      order === 'alphabetical'
        ? [...entries].sort(([a], [b]) => a.localeCompare(b))
        : entries;

    return orderedEntries.map(([key, value]) => `${key}=${value}`).join('&');
  }

  /**
   * Generate PayFast signature
   */
  private generateSignature(data: Record<string, unknown>): string {
    return this.generateSignatureWithOptions(
      data,
      this.config.signatureMode || 'with-passphrase',
      this.config.signatureOrder || 'insertion',
    );
  }

  private generateSignatureWithOptions(
    data: Record<string, unknown>,
    mode: 'with-passphrase' | 'without-passphrase',
    order: 'insertion' | 'alphabetical',
  ): string {
    const dataString = this.buildDataString(data, order);
    const shouldUsePassphrase =
      mode !== 'without-passphrase' && !!this.config.passphrase;
    const queryString = shouldUsePassphrase
      ? `${dataString}&passphrase=${this.payFastEncode(this.config.passphrase)}`
      : dataString;

    if (this.isDebugEnabled()) {
      console.log('[PayFast Debug] Signature mode:', mode, '| Order:', order);
      console.log('[PayFast Debug] Hash input string:', queryString);
    }

    // Generate MD5 hash
    return crypto.createHash('md5').update(queryString).digest('hex');
  }

  /**
   * Generate PayFast payment URL
   */
  generatePaymentUrl(paymentData: PayFastPaymentData): string {
    // Add signature to payment data
    const signatureData = { ...paymentData };
    const signature = this.generateSignature(signatureData);

    // Build PayWeb URL with the exact same encoding strategy used for signature
    const baseParams = this.buildDataString(paymentData);
    const params = `${baseParams}&signature=${this.payFastEncode(signature)}`;

    const baseUrl = this.config.sandbox
      ? this.payweb_url_sandbox
      : this.payweb_url;
    return `${baseUrl}?${params}`;
  }

  /**
   * Validate webhook signature
   */
  validateWebhookSignature(
    webhookData: Record<string, unknown>,
    rawPayload?: string,
  ): boolean {
    const signature = webhookData.signature;
    if (!signature) return false;

    // Remove signature from data before hashing
    const dataForSignature = { ...webhookData };
    delete dataForSignature.signature;

    const providedSignature = String(signature).trim().toLowerCase();

    // Primary strategy (current env config)
    const primarySignature =
      this.generateSignature(dataForSignature).toLowerCase();
    if (primarySignature === providedSignature) return true;

    // Fallback strategies for ITN differences (sandbox/provider variance)
    const strategies: Array<
      ['with-passphrase' | 'without-passphrase', 'insertion' | 'alphabetical']
    > = [
      ['without-passphrase', 'insertion'],
      ['without-passphrase', 'alphabetical'],
      ['with-passphrase', 'insertion'],
      ['with-passphrase', 'alphabetical'],
    ];

    for (const [mode, order] of strategies) {
      const candidate = this.generateSignatureWithOptions(
        dataForSignature,
        mode,
        order,
      ).toLowerCase();
      if (candidate === providedSignature) {
        if (this.isDebugEnabled()) {
          console.log('[PayFast Webhook Debug] Signature matched fallback:', {
            mode,
            order,
          });
        }
        return true;
      }
    }

    // Raw-payload fallback (ITN provider canonical format)
    if (rawPayload) {
      const rawBase = rawPayload
        .split('&')
        .filter((pair) => !pair.startsWith('signature='))
        .join('&');

      const rawCandidates: string[] = [rawBase];

      if (this.config.passphrase) {
        rawCandidates.push(
          `${rawBase}&passphrase=${this.payFastEncode(this.config.passphrase)}`,
        );
        rawCandidates.push(`${rawBase}&passphrase=${this.config.passphrase}`);
      }

      for (const candidateSource of rawCandidates) {
        const candidate = crypto
          .createHash('md5')
          .update(candidateSource)
          .digest('hex')
          .toLowerCase();

        if (candidate === providedSignature) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Format amount (PayFast requires 2 decimal places)
   */
  formatAmount(amount: number): string {
    return (Math.round(amount * 100) / 100).toFixed(2);
  }

  /**
   * PayFast expects SA mobile format (e.g. 0821234567).
   * If invalid, omit cell_number because it is optional.
   */
  private normalizeCellNumber(phone?: string): string | undefined {
    if (!phone) return undefined;

    const digits = phone.replace(/\D/g, '');
    if (!digits) return undefined;

    // 0821234567
    if (/^0\d{9}$/.test(digits)) {
      return digits;
    }

    // +27821234567 or 27821234567 -> 0821234567
    if (/^27\d{9}$/.test(digits)) {
      return `0${digits.slice(2)}`;
    }

    // 0027821234567 -> 0821234567
    if (/^0027\d{9}$/.test(digits)) {
      return `0${digits.slice(4)}`;
    }

    return undefined;
  }

  /**
   * Build payment data object
   */
  buildPaymentData(
    bookingId: string,
    amount: number,
    customerName: string,
    customerLastName: string,
    customerEmail: string,
    customerPhone: string | undefined,
    serviceDescription: string,
    callbackUrls?: PayFastCallbackUrls,
  ): PayFastPaymentData {
    const normalizedCellNumber = this.normalizeCellNumber(customerPhone);

    return {
      merchant_id: this.config.merchantId,
      merchant_key: this.config.merchantKey,
      return_url: callbackUrls?.returnUrl || this.config.returnUrl,
      cancel_url: callbackUrls?.cancelUrl || this.config.cancelUrl,
      notify_url: callbackUrls?.notifyUrl || this.config.notifyUrl,
      name_first: customerName,
      name_last: customerLastName,
      email_address: customerEmail,
      cell_number: normalizedCellNumber,
      item_name: 'Service Booking',
      item_description: serviceDescription,
      amount: this.formatAmount(amount),
      m_payment_id: bookingId,
      custom_str1: bookingId,
    };
  }
}

/**
 * Get PayFast service instance
 */
export function getPayFastService(): PayFastService {
  const rawPassphrase =
    process.env.PAYFAST_PASSPHRASE || process.env.PAYFAST_PASSPHARSE || '';
  const passphrase = rawPassphrase.trim();

  const explicitSignatureMode = process.env.PAYFAST_SIGNATURE_MODE;
  const signatureMode: 'with-passphrase' | 'without-passphrase' =
    explicitSignatureMode === 'without-passphrase'
      ? 'without-passphrase'
      : explicitSignatureMode === 'with-passphrase'
        ? 'with-passphrase'
        : passphrase
          ? 'with-passphrase'
          : 'without-passphrase';
  // PayFast always verifies signatures using ksort (alphabetical order).
  // Default to alphabetical unless explicitly overridden to insertion.
  const signatureOrder =
    process.env.PAYFAST_SIGNATURE_ORDER === 'insertion'
      ? 'insertion'
      : 'alphabetical';

  const config: PayFastConfig = {
    merchantId:
      process.env.PAYFAST_MARCHANT_ID || process.env.PAYFAST_MERCHANT_ID || '',
    merchantKey:
      process.env.PAYFAST_MARCHANT_KEY ||
      process.env.PAYFAST_MERCHANT_KEY ||
      '',
    passphrase,
    returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/booking/payment-success`,
    cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/booking/payment-cancelled`,
    notifyUrl:
      process.env.PAYFAST_NOTIFY_URL ||
      `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/payfast/webhook`,
    sandbox: process.env.NODE_ENV !== 'production',
    signatureMode,
    signatureOrder,
  };

  const requiresPassphrase = config.signatureMode !== 'without-passphrase';

  if (
    !config.merchantId ||
    !config.merchantKey ||
    (requiresPassphrase && !config.passphrase)
  ) {
    throw new Error(
      'PayFast credentials not configured in environment variables',
    );
  }

  return new PayFastService(config);
}
