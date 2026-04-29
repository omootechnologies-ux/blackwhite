'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSafeRedirectPath } from '@/lib/auth/redirect'
import { createBrowserClient } from '@/lib/supabase/client'
import { useI18n } from '@/components/i18n/LanguageProvider'

export default function LoginPage() {
  const { t } = useI18n()
  const router = useRouter()
  const supabase = createBrowserClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [registerHref, setRegisterHref] = useState('/register')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const nextPath = getSafeRedirectPath(params.get('next'))

    if (nextPath !== '/dashboard') {
      setRegisterHref(`/register?next=${encodeURIComponent(nextPath)}`)
    }

    if (params.get('error') === 'confirmation_failed') {
      setError(t('auth.login.confirmationFailed'))
    }
  }, [t])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? t('auth.login.invalid')
        : error.message)
      setLoading(false)
      return
    }

    const nextPath = getSafeRedirectPath(new URLSearchParams(window.location.search).get('next'))
    router.replace(nextPath)
    router.refresh()
  }

  return (
    <div className="bg-ink-900 border border-ink-800 rounded-2xl p-8 animate-fade-up">
      <h1 className="font-display text-2xl text-white mb-1">{t('auth.login.title')}</h1>
      <p className="text-sm text-ink-400 mb-8">{t('auth.login.subtitle')}</p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="input-label text-ink-400">{t('auth.register.email')}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="wewe@biashara.com"
            required
            className="input bg-ink-950 border-ink-700 text-white placeholder:text-ink-600 focus:border-brand-500"
          />
        </div>
        <div>
          <label className="input-label text-ink-400">{t('auth.register.password')}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="input bg-ink-950 border-ink-700 text-white placeholder:text-ink-600 focus:border-brand-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full justify-center mt-2"
        >
          {loading ? t('auth.login.loading') : t('auth.login.button')}
        </button>
      </form>

      <p className="text-center text-sm text-ink-500 mt-6">
        {t('auth.login.noAccount')}{' '}
        <Link href={registerHref} className="text-brand-400 hover:text-brand-300 font-medium">
          {t('auth.login.signupLink')}
        </Link>
      </p>
    </div>
  )
}
