'use client'

import { useState } from 'react'
import type { Payslip } from '@/types'
import { useI18n } from '@/components/i18n/LanguageProvider'

interface Props {
  payslip: Payslip
}

export function PayslipActions({ payslip }: Props) {
  const { t } = useI18n()
  const [loading, setLoading] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function readError(res: Response, fallback: string) {
    const data = await res.json().catch(() => null)
    return data?.error || fallback
  }

  function fileSafeName(value: string) {
    return value.trim().replace(/[^a-z0-9-]+/gi, '-').replace(/^-|-$/g, '') || 'employee'
  }

  async function downloadPDF() {
    setLoading('pdf')
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch(`/api/payslips/${payslip.id}/pdf`)
      if (!res.ok) throw new Error(await readError(res, t('payslips.downloadFailed')))

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `payslip-${fileSafeName(payslip.employee_name)}-${payslip.month}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('payslips.downloadFailed'))
    } finally {
      setLoading(null)
    }
  }

  function openPDF() {
    setError(null)
    setSuccess(null)
    window.open(`/api/payslips/${payslip.id}/pdf`, '_blank', 'noopener,noreferrer')
  }

  async function sendEmail() {
    const to = email.trim()
    if (!to) {
      setSuccess(null)
      setError(t('payslips.emailRequired'))
      return
    }

    setLoading('email')
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch(`/api/payslips/${payslip.id}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: to }),
      })

      if (!res.ok) throw new Error(await readError(res, t('payslips.emailFailed')))
      setSuccess(t('payslips.emailSent'))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('payslips.emailFailed'))
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-col items-end gap-2 min-w-[320px]">
      {(error || success) && (
        <p className={`text-xs text-right ${error ? 'text-red-500' : 'text-brand-600'}`}>
          {error || success}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" onClick={downloadPDF} disabled={loading === 'pdf'} className="btn-secondary text-xs">
          {loading === 'pdf' ? t('payslips.downloading') : t('payslips.downloadPdf')}
        </button>
        <button type="button" onClick={openPDF} className="btn-secondary text-xs">
          {t('payslips.openPdf')}
        </button>
      </div>

      <div className="flex w-full gap-2">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={t('invoices.emailPlaceholder')}
          className="input h-8 text-xs"
        />
        <button
          type="button"
          onClick={sendEmail}
          disabled={loading === 'email'}
          className="btn-secondary text-xs whitespace-nowrap"
        >
          {loading === 'email' ? t('payslips.sending') : t('payslips.emailPdf')}
        </button>
      </div>
    </div>
  )
}
