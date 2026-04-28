'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Business } from '@/types'
import { uid, formatTZS } from '@/lib/utils'
import { VAT_RATE } from '@/lib/tax'

interface LineItem {
  id: string
  description: string
  qty: number
  unit_price: number
}

interface Props {
  business: Business
}

export function InvoiceForm({ business }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [client, setClient] = useState({
    client_name: '', client_phone: '', client_email: '',
    client_address: '', client_tin: '',
  })
  const [items, setItems] = useState<LineItem[]>([
    { id: uid(), description: '', qty: 1, unit_price: 0 }
  ])
  const [notes, setNotes] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [vatRate, setVatRate] = useState(VAT_RATE)

  const subtotal = items.reduce((s, i) => s + i.qty * i.unit_price, 0)
  const vatAmount = Math.round(subtotal * (vatRate / 100))
  const total = subtotal + vatAmount

  function addItem() {
    setItems(prev => [...prev, { id: uid(), description: '', qty: 1, unit_price: 0 }])
  }

  function removeItem(id: string) {
    if (items.length === 1) return
    setItems(prev => prev.filter(i => i.id !== id))
  }

  function updateItem(id: string, field: keyof LineItem, val: string | number) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: val } : i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!client.client_name.trim()) { setError('Jina la mteja linahitajika'); return }
    if (items.some(i => !i.description.trim())) { setError('Maelezo ya bidhaa yote yanahitajika'); return }

    setLoading(true)
    setError(null)

    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...client,
        items,
        notes,
        due_date: dueDate || null,
        vat_rate: vatRate,
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      setError(err.error || 'Tatizo limetokea')
      setLoading(false)
      return
    }

    const invoice = await res.json()
    router.push(`/dashboard/invoices/${invoice.id}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Client details */}
      <div className="card">
        <h2 className="font-semibold text-ink-700 mb-5">Maelezo ya Mteja</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="input-label">Jina la Mteja *</label>
            <input
              className="input" type="text" required
              placeholder="Jina kamili la mteja au kampuni"
              value={client.client_name}
              onChange={e => setClient(c => ({ ...c, client_name: e.target.value }))}
            />
          </div>
          <div>
            <label className="input-label">Namba ya Simu</label>
            <input
              className="input" type="tel"
              placeholder="+255 7XX XXX XXX"
              value={client.client_phone}
              onChange={e => setClient(c => ({ ...c, client_phone: e.target.value }))}
            />
          </div>
          <div>
            <label className="input-label">Barua Pepe</label>
            <input
              className="input" type="email"
              placeholder="mteja@email.com"
              value={client.client_email}
              onChange={e => setClient(c => ({ ...c, client_email: e.target.value }))}
            />
          </div>
          <div>
            <label className="input-label">Anwani</label>
            <input
              className="input" type="text"
              placeholder="Dar es Salaam, Tanzania"
              value={client.client_address}
              onChange={e => setClient(c => ({ ...c, client_address: e.target.value }))}
            />
          </div>
          <div>
            <label className="input-label">TIN ya Mteja</label>
            <input
              className="input" type="text"
              placeholder="TIN (kama ipo)"
              value={client.client_tin}
              onChange={e => setClient(c => ({ ...c, client_tin: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* Line items */}
      <div className="card">
        <h2 className="font-semibold text-ink-700 mb-5">Bidhaa / Huduma</h2>

        <div className="space-y-3">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 px-1">
            <div className="col-span-5 text-xs font-semibold text-ink-400 uppercase tracking-wide">Maelezo</div>
            <div className="col-span-2 text-xs font-semibold text-ink-400 uppercase tracking-wide">Idadi</div>
            <div className="col-span-3 text-xs font-semibold text-ink-400 uppercase tracking-wide">Bei (TZS)</div>
            <div className="col-span-2 text-xs font-semibold text-ink-400 uppercase tracking-wide text-right">Jumla</div>
          </div>

          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-5">
                <input
                  className="input" type="text" required
                  placeholder="Bidhaa au huduma"
                  value={item.description}
                  onChange={e => updateItem(item.id, 'description', e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <input
                  className="input" type="number" min="1" required
                  value={item.qty}
                  onChange={e => updateItem(item.id, 'qty', Number(e.target.value))}
                />
              </div>
              <div className="col-span-3">
                <input
                  className="input" type="number" min="0" required
                  placeholder="0"
                  value={item.unit_price || ''}
                  onChange={e => updateItem(item.id, 'unit_price', Number(e.target.value))}
                />
              </div>
              <div className="col-span-1 text-right">
                <span className="text-sm font-mono text-ink-700">
                  {(item.qty * item.unit_price).toLocaleString()}
                </span>
              </div>
              <div className="col-span-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  disabled={items.length === 1}
                  className="text-ink-300 hover:text-red-500 transition-colors text-lg disabled:opacity-20"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addItem}
          className="mt-4 text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
        >
          + Ongeza bidhaa
        </button>

        {/* Totals */}
        <div className="mt-6 pt-4 border-t border-ink-100 flex justify-end">
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between text-ink-500">
              <span>Jumla Ndogo</span>
              <span className="font-mono">{formatTZS(subtotal)}</span>
            </div>
            <div className="flex justify-between text-ink-500 items-center">
              <div className="flex items-center gap-2">
                <span>VAT</span>
                <select
                  className="text-xs border border-ink-200 rounded px-1 py-0.5"
                  value={vatRate}
                  onChange={e => setVatRate(Number(e.target.value))}
                >
                  <option value={18}>18%</option>
                  <option value={0}>0% (Exempt)</option>
                </select>
              </div>
              <span className="font-mono">{formatTZS(vatAmount)}</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-2 border-t border-ink-200 text-ink-900">
              <span>JUMLA KUU</span>
              <span className="font-mono text-brand-700">{formatTZS(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes and due date */}
      <div className="card">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="input-label">Tarehe ya Mwisho wa Kulipa</label>
            <input
              className="input" type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <label className="input-label">Maelezo ya Ziada (Optional)</label>
            <textarea
              className="input resize-none" rows={3}
              placeholder="Masharti ya malipo, shukrani, au maelezo mengine..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pb-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary"
        >
          Rudi
        </button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Inahifadhi...' : 'Hifadhi Invoice →'}
        </button>
      </div>
    </form>
  )
}
