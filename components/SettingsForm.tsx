'use client'
import { useState } from 'react'
import { Business } from '@/types'
import { useI18n } from '@/components/i18n/LanguageProvider'

interface Props { business: Business }

export function SettingsForm({ business }: Props) {
  const { t } = useI18n()
  const [form, setForm] = useState({
    name: business.name || '',
    address: business.address || '',
    phone: business.phone || '',
    email: business.email || '',
    tin: business.tin || '',
    vrn: business.vrn || '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoUrl, setLogoUrl] = useState(business.logo_url || '')

  function update(field: string, val: string) {
    setForm(f => ({ ...f, [field]: val }))
    setSaved(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const res = await fetch('/api/business', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (res.ok) setSaved(true)
    else {
      const data = await res.json().catch(() => ({}))
      setError(data.error || t('common.error'))
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoUploading(true)
    const formData = new FormData()
    formData.append('logo', file)
    const res = await fetch('/api/business', { method: 'POST', body: formData })
    if (res.ok) {
      const data = await res.json()
      setLogoUrl(data.logo_url)
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error || t('common.error'))
    }
    setLogoUploading(false)
  }

  return (
    <form onSubmit={handleSave}>
      <div className="card mb-4">
        <h2 className="font-semibold text-ink-700 mb-5">{t('settings.businessInfo')}</h2>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-5">
            {error}
          </div>
        )}

        {/* Logo upload */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-ink-100">
          <div className="w-16 h-16 rounded-xl border-2 border-dashed border-ink-300 flex items-center justify-center overflow-hidden bg-ink-50">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-ink-400">{form.name.charAt(0)}</span>
            )}
          </div>
          <div>
            <label className="btn-secondary cursor-pointer text-sm">
              {logoUploading ? t('settings.logoUploading') : t('settings.logoUpload')}
              <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={logoUploading} />
            </label>
            <p className="text-xs text-ink-400 mt-1">{t('settings.logoHelp')}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="input-label">{t('settings.businessName')} *</label>
            <input className="input" type="text" required value={form.name}
              onChange={e => update('name', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="input-label">{t('common.address')}</label>
            <input className="input" type="text" placeholder="Dar es Salaam, Tanzania"
              value={form.address} onChange={e => update('address', e.target.value)} />
          </div>
          <div>
            <label className="input-label">{t('common.phone')}</label>
            <input className="input" type="tel" placeholder="+255 7XX XXX XXX"
              value={form.phone} onChange={e => update('phone', e.target.value)} />
          </div>
          <div>
            <label className="input-label">{t('settings.email')}</label>
            <input className="input" type="email" placeholder="biashara@email.com"
              value={form.email} onChange={e => update('email', e.target.value)} />
          </div>
          <div>
            <label className="input-label">{t('common.tin')}</label>
            <input className="input font-mono" type="text" placeholder="XXX-XXX-XXX"
              value={form.tin} onChange={e => update('tin', e.target.value)} />
          </div>
          <div>
            <label className="input-label">{t('common.vrn')}</label>
            <input className="input font-mono" type="text" placeholder="VAT reg number"
              value={form.vrn} onChange={e => update('vrn', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? t('common.saving') : t('settings.saveChanges')}
        </button>
        {saved && <span className="text-sm text-brand-600 font-medium">✓ {t('settings.saved')}</span>}
      </div>
    </form>
  )
}
