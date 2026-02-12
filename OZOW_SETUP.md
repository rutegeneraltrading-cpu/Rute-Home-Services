# Ozow Payment Gateway Integration

## Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Ozow Configuration
OZOW_SITE_CODE=your_site_code
OZOW_PRIVATE_KEY=your_private_key
OZOW_API_KEY=your_api_key
OZOW_IS_TEST=true

# Base URL for callbacks
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Setup Steps

### 1. Get Ozow Credentials

1. Sign up at [Ozow.com](https://ozow.com)
2. Navigate to your merchant dashboard
3. Get your:
   - Site Code
   - Private Key
   - API Key
4. Use test mode for development (`OZOW_IS_TEST=true`)

### 2. Configure Webhook URLs

In your Ozow dashboard, configure the following webhook URLs:

- **Notify URL**: `https://yourdomain.com/api/ozow/notify`
- **Success URL**: `https://yourdomain.com/checkout?status=success`
- **Cancel URL**: `https://yourdomain.com/checkout?status=cancelled`
- **Error URL**: `https://yourdomain.com/checkout?status=error`

### 3. Database Schema

Ensure your `orders` table has the following columns:

```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS transaction_reference VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_response JSONB;
```

## Flow

1. User completes checkout form
2. Order is created in database with status `pending`
3. Payment request is sent to Ozow with order details
4. User is redirected to Ozow payment page
5. User completes payment
6. Ozow sends notification to `/api/ozow/notify` webhook
7. Order status is updated based on payment result
8. User is redirected back to success/error page

## Security

- All payment requests include a SHA512 hash for verification
- Webhook notifications are validated using the same hash
- Private keys are stored as environment variables (never in code)
- HTTPS is required for production

## Testing

Use Ozow's test mode:

- Set `OZOW_IS_TEST=true`
- Use test bank account details provided by Ozow
- Test different payment scenarios (success, cancel, error)

## Production Checklist

- [ ] Set `OZOW_IS_TEST=false`
- [ ] Use production Ozow credentials
- [ ] Configure production webhook URLs with HTTPS
- [ ] Test end-to-end payment flow
- [ ] Monitor webhook logs for errors
- [ ] Set up proper error handling and user notifications
