# Blackwhite — blackwhite.co.tz

Invoice na Payslip SaaS kwa biashara za Tanzania.

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
# Fill in your Supabase and Mongike credentials
```

### 3. Database Setup
Run `supabase/schema.sql` in your Supabase SQL editor.

Create storage buckets in Supabase dashboard:
- `documents` (private, 50MB) — for PDFs
- `logos` (public, 5MB) — for business logos

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

## Siku 5 za Kujenga (5-Day Build Plan)
- **Siku 1**: Auth + DB + Vercel deploy
- **Siku 2**: Invoice builder + PDF
- **Siku 3**: Payslip + PAYE calculator
- **Siku 4**: Mongike Mobile Money + WhatsApp share
- **Siku 5**: Settings + polish + first 3 customers

## Revenue Target
40 customers × TZS 25,000/month = **TZS 1,000,000/month**
