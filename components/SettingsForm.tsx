'use client'
import { useState } from 'react'
import { Business } from '@/types'

interface Props { business: Business }

export function SettingsForm({ business }: Props) {
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
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoUrl, setLogoUrl] = useState(business.logo_url || '')

  function update(field: string, val: string) {
    setForm(f => ({ ...f, [field]: val }))
    setSaved(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/business', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (res.ok) setSaved(true)
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
    }
    setLogoUploading(false)
  }

  return (
    <form onSubmit={handleSave}>
      <div className="card mb-4">
        <h2 className="font-semibold text-ink-700 mb-5">Maelezo ya Biashara</h2>

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
              {logoUploading ? 'Inapakia...' : '📷 Pakia Logo'}
              <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={logoUploading} />
            </label>
            <p className="text-xs text-ink-400 mt-1">PNG au JPG, max 5MB</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="input-label">Jina la Biashara *</label>
            <input className="input" type="text" required value={form.name}
              onChange={e => update('name', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="input-label">Anwani</label>
            <input className="input" type="text" placeholder="Dar es Salaam, Tanzania"
              value={form.address} onChange={e => update('address', e.target.value)} />
          </div>
          <div>
            <label className="input-label">Namba ya Simu</label>
            <input className="input" type="tel" placeholder="+255 7XX XXX XXX"
              value={form.phone} onChange={e => update('phone', e.target.value)} />
          </div>
          <div>
            <label className="input-label">Barua Pepe</label>
            <input className="input" type="email" placeholder="biashara@email.com"
              value={form.email} onChange={e => update('email', e.target.value)} />
          </div>
          <div>
            <label className="input-label">TIN (TRA Tax ID)</label>
            <input className="input font-mono" type="text" placeholder="XXX-XXX-XXX"
              value={form.tin} onChange={e => update('tin', e.target.value)} />
          </div>
          <div>
            <label className="input-label">VRN (VAT Registration)</label>
            <input className="input font-mono" type="text" placeholder="VAT reg number"
              value={form.vrn} onChange={e => update('vrn', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Inahifadhi...' : 'Hifadhi Mabadiliko'}
        </button>
        {saved && <span className="text-sm text-brand-600 font-medium">✓ Imehifadhiwa</span>}
      </div>
    </form>
  )
}
