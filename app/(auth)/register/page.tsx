'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createBrowserClient()
  const [form, setForm] = useState({
    email: '', password: '', businessName: '', phone: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function update(field: string, val: string) {
    setForm((f) => ({ ...f, [field]: val }))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        data: {
          business_name: form.businessName,
          phone: form.phone,
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.session) {
      router.push('/dashboard')
      router.refresh()
      return
    }

    setSuccess('Tumekutumia barua pepe ya uthibitisho. Bofya kiungo kisha uingie.')
    setLoading(false)
  }

  return (
    <div className="bg-ink-900 border border-ink-800 rounded-2xl p-8 animate-fade-up">
      <h1 className="font-display text-2xl text-white mb-1">Anza leo — Bure</h1>
      <p className="text-sm text-ink-400 mb-8">Siku 14 za majaribio. Hakuna kadi ya benki.</p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-3 rounded-lg mb-6">
          {success}
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="input-label text-ink-400">Jina la Biashara</label>
          <input
            type="text"
            value={form.businessName}
            onChange={(e) => update('businessName', e.target.value)}
            placeholder="e.g. Duka la Hassan"
            required
            className="input bg-ink-950 border-ink-700 text-white placeholder:text-ink-600 focus:border-brand-500"
          />
        </div>
        <div>
          <label className="input-label text-ink-400">Namba ya Simu</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            placeholder="2557XXXXXXXX"
            className="input bg-ink-950 border-ink-700 text-white placeholder:text-ink-600 focus:border-brand-500"
          />
        </div>
        <div>
          <label className="input-label text-ink-400">Barua Pepe</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            placeholder="wewe@biashara.com"
            required
            className="input bg-ink-950 border-ink-700 text-white placeholder:text-ink-600 focus:border-brand-500"
          />
        </div>
        <div>
          <label className="input-label text-ink-400">Nywila</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            placeholder="Nywila (angalau herufi 8)"
            minLength={8}
            required
            className="input bg-ink-950 border-ink-700 text-white placeholder:text-ink-600 focus:border-brand-500"
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-2">
          {loading ? 'Inaunda akaunti...' : 'Anza Bure →'}
        </button>
      </form>

      <p className="text-center text-xs text-ink-600 mt-5">
        Kwa kuendelea, unakubali{' '}
        <Link href="/terms" className="text-ink-500 hover:text-ink-400">masharti ya matumizi</Link>
      </p>

      <p className="text-center text-sm text-ink-500 mt-4">
        Una akaunti?{' '}
        <Link href="/login" className="text-brand-400 hover:text-brand-300 font-medium">
          Ingia
        </Link>
      </p>
    </div>
  )
}
