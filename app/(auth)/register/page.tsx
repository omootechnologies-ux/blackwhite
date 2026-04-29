'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSafeRedirectPath } from '@/lib/auth/redirect'
import { createBrowserClient } from '@/lib/supabase/client'
import { getAuthCallbackUrl } from '@/lib/site-url'
import { useI18n } from '@/components/i18n/LanguageProvider'

export default function RegisterPage() {
  const { t } = useI18n()
  const router = useRouter()
  const supabase = createBrowserClient()
  const [form, setForm] = useState({
    email: '', password: '', businessName: '', phone: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loginHref, setLoginHref] = useState('/login')

  useEffect(() => {
    const nextPath = getSafeRedirectPath(new URLSearchParams(window.location.search).get('next'))

    if (nextPath !== '/dashboard') {
      setLoginHref(`/login?next=${encodeURIComponent(nextPath)}`)
    }
  }, [])

  function update(field: string, val: string) {
    setForm((f) => ({ ...f, [field]: val }))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    const nextPath = getSafeRedirectPath(new URLSearchParams(window.location.search).get('next'))

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: getAuthCallbackUrl(window.location.origin, nextPath),
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
      router.replace(nextPath)
      router.refresh()
      return
    }

    setSuccess(t('auth.register.success'))
    setLoading(false)
  }

  return (
    <div className="bg-ink-900 border border-ink-800 rounded-2xl p-8 animate-fade-up">
      <h1 className="font-display text-2xl text-white mb-1">{t('auth.register.title')}</h1>
      <p className="text-sm text-ink-400 mb-8">{t('auth.register.subtitle')}</p>

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
          <label className="input-label text-ink-400">{t('auth.register.businessName')}</label>
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
          <label className="input-label text-ink-400">{t('auth.register.phone')}</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            placeholder="2557XXXXXXXX"
            className="input bg-ink-950 border-ink-700 text-white placeholder:text-ink-600 focus:border-brand-500"
          />
        </div>
        <div>
          <label className="input-label text-ink-400">{t('auth.register.email')}</label>
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
          <label className="input-label text-ink-400">{t('auth.register.password')}</label>
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
          {loading ? t('auth.register.loading') : t('auth.register.button')}
        </button>
      </form>

      <p className="text-center text-xs text-ink-600 mt-5">
        {t('auth.register.terms')}
      </p>

      <p className="text-center text-sm text-ink-500 mt-4">
        {t('auth.register.hasAccount')}{' '}
        <Link href={loginHref} className="text-brand-400 hover:text-brand-300 font-medium">
          {t('auth.register.loginLink')}
        </Link>
      </p>
    </div>
  )
}
