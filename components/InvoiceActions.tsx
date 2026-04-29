'use client'
import { useState } from 'react'
import { Invoice } from '@/types'
import { useI18n } from '@/components/i18n/LanguageProvider'

interface Props {
  invoice: Invoice
}

export function InvoiceActions({ invoice }: Props) {
  const { t } = useI18n()
  const [loading, setLoading] = useState<string | null>(null)
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [email, setEmail] = useState(invoice.client_email || '')

  function setFailure(message: string) {
    setSuccess(null)
    setError(message)
  }

  async function readError(res: Response, fallback: string) {
    const data = await res.json().catch(() => null)
    return data?.error || fallback
  }

  async function downloadPDF() {
    setLoading('pdf')
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/pdf`)
      if (!res.ok) throw new Error(await readError(res, t('invoices.downloadFailed')))
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${invoice.number}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setFailure(err instanceof Error ? err.message : t('invoices.downloadFailed'))
    } finally {
      setLoading(null)
    }
  }

  function openPDF() {
    setError(null)
    setSuccess(null)
    window.open(`/api/invoices/${invoice.id}/pdf`, '_blank', 'noopener,noreferrer')
  }

  async function sendInvoice() {
    setLoading('send')
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!res.ok) throw new Error(await readError(res, t('invoices.whatsappFailed')))
      const data = await res.json()
      setWhatsappUrl(data.whatsappUrl)
      setSuccess(t('invoices.paymentStarted'))
    } catch (err) {
      setFailure(err instanceof Error ? err.message : t('invoices.whatsappFailed'))
    } finally {
      setLoading(null)
    }
  }

  async function sendEmail() {
    const to = email.trim()
    if (!to) {
      setFailure(t('invoices.emailRequired'))
      return
    }

    setLoading('email')
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch(`/api/invoices/${invoice.id}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: to }),
      })

      if (!res.ok) throw new Error(await readError(res, t('invoices.emailFailed')))
      setSuccess(t('invoices.emailSent'))
    } catch (err) {
      setFailure(err instanceof Error ? err.message : t('invoices.emailFailed'))
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {error && (
        <span className="text-xs text-red-500 text-right">{error}</span>
      )}
      {success && (
        <span className="text-xs text-brand-600 text-right">{success}</span>
      )}

      {whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors"
        >
          {t('invoices.sentWhatsapp')}
        </a>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        <button
          onClick={downloadPDF}
          disabled={loading === 'pdf'}
          className="btn-secondary text-sm"
        >
          {loading === 'pdf' ? t('invoices.downloading') : t('invoices.downloadPdf')}
        </button>

        <button
          type="button"
          onClick={openPDF}
          className="btn-secondary text-sm"
        >
          {t('invoices.openPdf')}
        </button>

        {invoice.status !== 'paid' && (
          <button
            onClick={sendInvoice}
            disabled={loading === 'send'}
            className="btn-primary text-sm"
          >
            {loading === 'send' ? t('invoices.sending') : t('invoices.shareWhatsapp')}
          </button>
        )}

        {invoice.status === 'paid' && (
          <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-100 text-brand-700 text-sm font-semibold rounded-lg">
            {t('common.status.paid')}
          </span>
        )}
      </div>

      <div className="flex w-full max-w-md gap-2">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={t('invoices.emailPlaceholder')}
          className="input h-9 text-sm"
        />
        <button
          type="button"
          onClick={sendEmail}
          disabled={loading === 'email'}
          className="btn-secondary text-sm whitespace-nowrap"
        >
          {loading === 'email' ? t('invoices.sending') : t('invoices.emailPdf')}
        </button>
      </div>
    </div>
  )
}
