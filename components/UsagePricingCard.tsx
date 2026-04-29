'use client'

import { useI18n } from '@/components/i18n/LanguageProvider'
import { USAGE_REQUEST_PRICE_TZS } from '@/lib/pricing'
import { formatTZS } from '@/lib/utils'

export function UsagePricingCard() {
  const { t } = useI18n()

  return (
    <div className="card">
      <h2 className="font-semibold text-ink-700 mb-4">{t('payg.title')}</h2>

      <div className="bg-brand-50 rounded-lg p-4 border border-brand-100">
        <p className="text-xs font-bold text-brand-600 uppercase tracking-wide mb-1">
          {t('payg.model')}
        </p>
        <p className="text-2xl font-bold text-brand-800">
          {formatTZS(USAGE_REQUEST_PRICE_TZS)}
        </p>
        <p className="text-sm text-brand-600">{t('payg.perRequest')}</p>
      </div>

      <div className="mt-4 pt-4 border-t border-ink-100 space-y-3">
        <p className="text-sm text-ink-600">{t('payg.onlyWhen')}</p>

        <div className="space-y-2 text-sm text-ink-600">
          <div className="flex items-start gap-2">
            <span className="text-brand-600">✓</span>
            <span>{t('payg.actionGenerate')}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-brand-600">✓</span>
            <span>{t('payg.actionSend')}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-brand-600">✓</span>
            <span>{t('payg.actionShare')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
