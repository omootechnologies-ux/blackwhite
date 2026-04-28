'use client'
import { Subscription } from '@/types'
import { formatDate } from '@/lib/utils'

interface Props { subscription: Subscription | null }

export function SubscriptionCard({ subscription }: Props) {
  const planLabels: Record<string, string> = { starter: 'Starter', business: 'Business' }
  const statusLabels: Record<string, string> = { trial: 'Majaribio', active: 'Amilifu', expired: 'Imeisha' }

  const isTrialActive = subscription?.status === 'trial' &&
    subscription.trial_ends_at &&
    new Date(subscription.trial_ends_at) > new Date()

  const daysLeft = subscription?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / 86400000))
    : 0

  return (
    <div className="card">
      <h2 className="font-semibold text-ink-700 mb-4">Usajili Wako</h2>

      {!subscription ? (
        <div>
          <p className="text-sm text-ink-500 mb-4">Huna usajili. Chagua mpango hapa chini.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-brand-50 rounded-lg p-4">
            <p className="text-xs font-bold text-brand-600 uppercase tracking-wide mb-1">Mpango wa Sasa</p>
            <p className="text-lg font-bold text-brand-800">{planLabels[subscription.plan] || subscription.plan}</p>
            <p className="text-sm text-brand-600">{statusLabels[subscription.status] || subscription.status}</p>
          </div>

          {isTrialActive && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-amber-700 mb-0.5">Majaribio</p>
              <p className="text-sm text-amber-600">
                Siku <strong>{daysLeft}</strong> zimebaki
              </p>
              <p className="text-xs text-amber-500 mt-1">
                Inaisha: {formatDate(subscription.trial_ends_at)}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-ink-100">
        <p className="text-xs font-semibold text-ink-500 mb-3">Mipango Inayopatikana</p>
        <div className="space-y-2">
          <div className="border border-ink-200 rounded-lg p-3">
            <div className="flex justify-between items-baseline">
              <span className="text-sm font-semibold">Starter</span>
              <span className="text-sm font-bold text-ink-700">TZS 15,000/mo</span>
            </div>
            <p className="text-xs text-ink-400 mt-0.5">Invoice, PDF, WhatsApp</p>
          </div>
          <div className="border-2 border-brand-300 bg-brand-50 rounded-lg p-3">
            <div className="flex justify-between items-baseline">
              <span className="text-sm font-semibold text-brand-700">Business</span>
              <span className="text-sm font-bold text-brand-700">TZS 35,000/mo</span>
            </div>
            <p className="text-xs text-brand-500 mt-0.5">+ Payslip, PAYE, M-Pesa link</p>
          </div>
        </div>
        <a
          href="https://wa.me/255700000000?text=Nataka%20kulipia%20Blackwhite"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary w-full justify-center mt-3 text-sm"
        >
          📱 Lipia via WhatsApp
        </a>
        <p className="text-xs text-center text-ink-400 mt-2">Tunakubali M-Pesa, Airtel, Tigo</p>
      </div>
    </div>
  )
}
