# Blackwhite — blackwhite.co.tz

Invoice and payslip app for Tanzanian businesses with pay-as-you-go document requests.

## Stack
- **Frontend + API**: Next.js 14 (App Router)
- **Database + Auth**: Supabase (Postgres + Auth + Storage)
- **PDF**: Puppeteer + @sparticuz/chromium
- **Payments**: Mongike Mobile Money (M-Pesa, Airtel, Tigo)
- **Styling**: Tailwind CSS
- **Hosting**: Vercel

## Kuanza (Getting Started)

### 1. Install
```bash
npm install
```

### 2. Environment Variables
```bash
cp .env.example .env.local
# Fill in your Supabase, Mongike, and email credentials
```

### 3. Database Setup
Run `supabase/schema.sql` in your Supabase SQL editor.

Create storage buckets in Supabase dashboard:
- `documents` (public, 50MB) — generated invoice and payslip PDFs that can be shared by link
- `business-logos` (public, 5MB) — uploaded business logos

If you already have the old `logos` bucket, keep it temporarily while migrating existing logo files. New uploads use `business-logos`.

In Supabase Auth URL configuration, set:
- Site URL: `https://YOUR_DOMAIN`
- Redirect URLs:
  - `https://YOUR_DOMAIN/api/auth/callback`
  - `https://YOUR_DOMAIN/dashboard`
  - `http://localhost:3000/api/auth/callback`
  - `http://localhost:3000/dashboard`

For Vercel production, add these environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_BASE_URL=https://YOUR_DOMAIN`
- `MONGIKE_API_KEY`
- `MONGIKE_BASE_URL=https://mongike.com/api/v1`
- `EMAIL_WEBHOOK_URL`
- `EMAIL_WEBHOOK_AUTH_HEADER` (optional)
- `EMAIL_FROM` (optional)

### 4. Run locally
```bash
npm run dev
```

### 5. Deploy
```bash
# Connect to Vercel
npx vercel

# Add environment variables in Vercel dashboard
# Point blackwhite.co.tz to Vercel
```

## Local PDF (Development)
For local development, PDF generation requires Google Chrome installed.
For production on Vercel, `@sparticuz/chromium` is used automatically.

**Alternative**: Deploy to a DigitalOcean Droplet ($6/mo) and use full Puppeteer — simpler setup.

## Mongike Setup
1. Create a Mongike account
2. Generate your API key and add `MONGIKE_API_KEY`
3. Keep `MONGIKE_BASE_URL=https://mongike.com/api/v1`

Paid usage requests cost **TZS 2,000** each. The app records payment attempts in `usage_payments` when the table exists.

## Email Sharing
Email delivery is delegated to `EMAIL_WEBHOOK_URL`. The app posts document metadata, a public PDF URL, and an attachment descriptor for the generated PDF. Set `EMAIL_WEBHOOK_AUTH_HEADER` if your webhook requires an authorization header.

## Pay-As-You-Go Model
There are no monthly plans in the app. Users pay TZS 2,000 when generating, sending, or sharing invoice and payslip PDFs.
