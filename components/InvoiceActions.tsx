'use client'
import { useState } from 'react'
import { Invoice } from '@/types'

interface Props {
  invoice: Invoice
}

export function InvoiceActions({ invoice }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function downloadPDF() {
    setLoading('pdf')
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/pdf`)
      if (!res.ok) throw new Error('PDF imeshindwa')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${invoice.number}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(null)
    }
  }

  async function sendInvoice() {
    setLoading('send')
    setError(null)
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: invoice.number,
          amount: invoice.total,
          customerPhone: invoice.client_phone,
          customerName: invoice.client_name,
          customerEmail: invoice.client_email,
        }),
      })
      if (!res.ok) throw new Error('Kutuma kumeshindwa')
      const data = await res.json()
      setWhatsappUrl(data.whatsappUrl)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {error && (
        <span className="text-xs text-red-500">{error}</span>
      )}

      {whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors"
        >
          <span>📱</span> Fungua WhatsApp
        </a>
      )}

      <button
        onClick={downloadPDF}
        disabled={loading === 'pdf'}
        className="btn-secondary text-sm"
      >
        {loading === 'pdf' ? 'Inaandaa...' : '⬇ PDF'}
      </button>

      {invoice.status !== 'paid' && (
        <button
          onClick={sendInvoice}
          disabled={loading === 'send'}
          className="btn-primary text-sm"
        >
          {loading === 'send' ? 'Inatuma...' : '📱 Tuma WhatsApp + M-Pesa'}
        </button>
      )}

      {invoice.status === 'paid' && (
        <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-100 text-brand-700 text-sm font-semibold rounded-lg">
          ✓ Imelipwa
        </span>
      )}
    </div>
  )
}
