# Stripe Setup Guide

This guide configures Stripe for the current stack:
- Frontend: React + Vite
- Backend: Express
- Checkout API: /api/stripe/create-checkout-session
- Webhook API: /api/stripe/webhook

## 1. Create Stripe Products and Prices
In Stripe Dashboard:
1. Go to Product Catalog.
2. Create product: Monthly Plan.
3. Add recurring price with interval Monthly.
4. Create product: Yearly Plan.
5. Add recurring price with interval Yearly and discounted amount.
6. Copy both Price IDs.

Example Price IDs:
- Monthly: price_xxx
- Yearly: price_yyy

## 2. Configure Environment Variables
Set these backend env vars (where you run server/src/server.js):

- STRIPE_SECRET_KEY=sk_test_...
- STRIPE_WEBHOOK_SECRET=whsec_...
- STRIPE_PRICE_MONTHLY=price_xxx
- STRIPE_PRICE_YEARLY=price_yyy
- APP_BASE_URL=http://localhost:5173

Status in this workspace:
- Root .env has been created with the provided backend Stripe values.
- Root .env.local has been created with the provided VITE_STRIPE_PUBLISHABLE_KEY value.
- Backend now loads .env automatically from server/src/server.js using dotenv.

Optional existing vars still required by your app:
- API_PORT=4000
- CORS_ORIGIN=http://localhost:5173

## 3. Start Application
In workspace root:

1. Start API:
npm run dev:api

2. Start frontend:
npm run dev

## 4. Register Webhook Endpoint
### Production
In Stripe Dashboard -> Developers -> Webhooks:
- Endpoint URL: https://yourdomain.com/api/stripe/webhook
- Events to send:
  - checkout.session.completed
  - customer.subscription.updated
  - customer.subscription.deleted
  - invoice.payment_failed

Copy signing secret to STRIPE_WEBHOOK_SECRET.

### Local Testing with Stripe CLI
Install Stripe CLI, then run:

stripe login
stripe listen --forward-to http://localhost:4000/api/stripe/webhook

Copy printed webhook signing secret into STRIPE_WEBHOOK_SECRET.

## 5. Test Checkout Flow
1. Login as a user in the app.
2. Open /subscribe.
3. Click Subscribe on Monthly or Yearly.
4. Confirm redirect to Stripe Checkout page.
5. Complete payment using a Stripe test card.

Recommended test card:
- Card number: 4242 4242 4242 4242
- Any future expiry date
- Any CVC
- Any postal code

Expected result:
- Redirect to /subscribe/success
- Auto redirect to /dashboard after ~3 seconds
- Subscription status should become active after webhook processing

## 6. Test Cancelled Flow
1. Start checkout from /subscribe.
2. Click Back/Cancel on Stripe page.

Expected result:
- Redirect to /subscribe/cancelled
- Back to Subscribe button works

## 7. Test Webhook Event Handling
Use Stripe CLI to trigger events:

1. checkout.session.completed
- Trigger by completing checkout normally.
- Expected:
  - Local subscription set to active
  - Renewal date populated
  - Stripe customer/subscription ids saved

2. customer.subscription.updated
- In Stripe dashboard change subscription state/period.
- Expected:
  - Local renewal date/status updated

3. customer.subscription.deleted
- Cancel subscription from Stripe dashboard.
- Expected:
  - Local status set to cancellation

4. invoice.payment_failed
- Use Stripe test scenarios for payment failure and retry flow.
- Expected:
  - Local status set to lapsed

## 8. API Endpoints Implemented
Backend routes:
- POST /api/stripe/create-checkout-session
- POST /api/stripe/cancel-subscription
- POST /api/stripe/webhook

## 9. Troubleshooting
1. Error: Stripe price is not configured
- Check STRIPE_PRICE_MONTHLY and STRIPE_PRICE_YEARLY values.

2. Error: STRIPE_WEBHOOK_SECRET is not configured
- Set webhook secret from Stripe Dashboard or Stripe CLI output.

3. Webhook signature verification failed
- Ensure endpoint path is exactly /api/stripe/webhook.
- Ensure raw body is forwarded unchanged.
- Ensure correct secret for current environment.

4. Checkout redirects but status does not update
- Confirm webhook delivery in Stripe Dashboard Events.
- Confirm API server is reachable and logs no webhook errors.

5. CORS/network errors from frontend
- Confirm API server is running on expected port.
- Confirm CORS_ORIGIN allows frontend origin.

## 10. QA Acceptance Checklist
- Monthly checkout succeeds and activates subscription.
- Yearly checkout succeeds and activates subscription.
- Success page redirects to dashboard after 3 seconds.
- Cancelled page is shown for cancelled checkout.
- Webhook updates local status for completed/updated/deleted/payment_failed.
- Cancel at period end endpoint marks subscription as cancellation.
- No card details are stored in local app storage or database.
