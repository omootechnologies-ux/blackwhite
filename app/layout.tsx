import type { Metadata } from 'next'
import { DM_Sans, DM_Mono, Playfair_Display } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['300', '400', '500', '600', '700'],
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'Duka Manager — Invoices & Payslips for Tanzania',
  description:
    'Tengeneza invoice na payslip za kitaalamu kwa sekunde. Shiriki WhatsApp. Pokea malipo ya M-Pesa.',
  keywords: 'invoice, payslip, Tanzania, M-Pesa, TRA, biashara',
  openGraph: {
    title: 'Duka Manager',
    description: 'Invoice na Payslip kwa biashara yako ya Tanzania',
    url: 'https://blackwhite.co.tz',
    siteName: 'Duka Manager',
    locale: 'sw_TZ',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sw" className={`${dmSans.variable} ${dmMono.variable} ${playfair.variable}`}>
      <body className="font-sans bg-ink-50 text-ink-900 antialiased">
        {children}
      </body>
    </html>
  )
}
