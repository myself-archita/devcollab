# Deployment Guide

## Stack

- Frontend: static HTML/CSS/JavaScript served by Express
- Backend: Node.js + Express
- Database: PostgreSQL
- Billing: Stripe Checkout in test mode

## Required Environment Variables

```env
NODE_ENV=production
PORT=3000
POSTGRES_URL=postgres://user:password@host:5432/devcollab
SESSION_TTL_DAYS=7
BCRYPT_ROUNDS=12
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_...
STRIPE_SUCCESS_URL=https://your-domain.com/?billing=success
STRIPE_CANCEL_URL=https://your-domain.com/?billing=cancel
```

## Vercel Notes

- Use a managed Postgres provider or Vercel Postgres.
- Set `POSTGRES_URL` in project environment variables.
- Set `STRIPE_SECRET_KEY` with your Stripe test secret key.
- Set `STRIPE_PRICE_ID` to the test-mode subscription price you created in Stripe.
- Keep `NODE_ENV=production` so the session cookie is marked `Secure` in production.

## Local Development

1. Start PostgreSQL locally or with Docker.
2. Copy `.env.example` to `.env`.
3. Run `npm install`.
4. Start the app with `npm run dev`.

## Payment Flow

- The app now redirects to Stripe Checkout instead of simulating billing.
- After payment completion, update the billing record from a webhook or admin action if you want automatic plan activation.
- For a hackathon demo, Stripe Checkout test mode is enough to prove a real payment gateway integration.
