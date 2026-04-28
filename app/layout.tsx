import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://blackwhite.co.tz'),
  title: 'Blackwhite — Invoices & Payslips for Tanzania',
  description:
    'Tengeneza invoice na payslip za kitaalamu kwa sekunde. Shiriki WhatsApp. Pokea malipo ya M-Pesa.',
  keywords: 'invoice, payslip, Tanzania, M-Pesa, TRA, biashara',
  openGraph: {
    title: 'Blackwhite',
    description: 'Invoice na Payslip kwa biashara yako ya Tanzania',
    url: 'https://blackwhite.co.tz',
    siteName: 'Blackwhite',
    locale: 'sw_TZ',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sw">
      <body className="font-sans bg-ink-50 text-ink-900 antialiased">
        {children}
      </body>
    </html>
  )
}
