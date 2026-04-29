export class EmailConfigurationError extends Error {
  constructor(message = 'Email sending is not configured. Set EMAIL_WEBHOOK_URL in your environment.') {
    super(message)
    this.name = 'EmailConfigurationError'
  }
}

type DocumentEmail = {
  to: string
  subject: string
  text: string
  html?: string
  pdfUrl: string
  filename?: string
  documentType: 'invoice' | 'payslip'
  documentId: string
  replyTo?: string | null
}

export function assertEmailConfigured() {
  if (!process.env.EMAIL_WEBHOOK_URL) {
    throw new EmailConfigurationError()
  }
}

export function escapeEmailHtml(value: string | number | null | undefined) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function sendDocumentEmail(payload: DocumentEmail) {
  assertEmailConfigured()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (process.env.EMAIL_WEBHOOK_AUTH_HEADER) {
    headers.Authorization = process.env.EMAIL_WEBHOOK_AUTH_HEADER
  }

  const response = await fetch(process.env.EMAIL_WEBHOOK_URL!, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      provider: 'blackwhite-webhook',
      from: process.env.EMAIL_FROM || 'Blackwhite <no-reply@blackwhite.co.tz>',
      to: payload.to,
      reply_to: payload.replyTo || undefined,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
      attachments: [
        {
          filename: payload.filename || `${payload.documentType}-${payload.documentId}.pdf`,
          url: payload.pdfUrl,
          content_type: 'application/pdf',
        },
      ],
      pdf_url: payload.pdfUrl,
      document_type: payload.documentType,
      document_id: payload.documentId,
    }),
  })

  if (!response.ok) {
    const message = await response.text().catch(() => '')
    throw new Error(
      `Email webhook failed with status ${response.status}${message ? `: ${message.slice(0, 200)}` : ''}`
    )
  }

  return { ok: true }
}
