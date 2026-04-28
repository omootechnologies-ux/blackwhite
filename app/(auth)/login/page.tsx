'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createBrowserClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? 'Barua pepe au nywila si sahihi.'
        : error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="bg-ink-900 border border-ink-800 rounded-2xl p-8 animate-fade-up">
      <h1 className="font-display text-2xl text-white mb-1">Karibu tena</h1>
      <p className="text-sm text-ink-400 mb-8">Ingia kwenye akaunti yako</p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="input-label text-ink-400">Barua Pepe</label>
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
          <label className="input-label text-ink-400">Nywila</label>
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
          {loading ? 'Inaingia...' : 'Ingia'}
        </button>
      </form>

      <p className="text-center text-sm text-ink-500 mt-6">
        Bado huna akaunti?{' '}
        <Link href="/register" className="text-brand-400 hover:text-brand-300 font-medium">
          Jisajili bure
        </Link>
      </p>
    </div>
  )
}
