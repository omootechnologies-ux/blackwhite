import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-ink-950">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto">
        <div className="font-display text-xl text-white">
          Duka <span className="text-brand-400">Manager</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-ink-300 hover:text-white transition-colors">
            Ingia
          </Link>
          <Link
            href="/register"
            className="text-sm bg-brand-500 text-white px-4 py-2 rounded-lg hover:bg-brand-400 transition-colors font-medium"
          >
            Anza Bure
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-6 pt-20 pb-28 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-8 animate-fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
          Imetengenezwa kwa Tanzania
        </div>

        <h1 className="font-display text-5xl md:text-6xl text-white leading-tight mb-6 animate-fade-up">
          Invoice na Payslip
          <br />
          <span className="text-brand-400">kwa dakika moja.</span>
        </h1>

        <p className="text-ink-400 text-lg max-w-xl mx-auto mb-10 animate-fade-up" style={{ animationDelay: '80ms' }}>
          Tengeneza invoice za kitaalamu, hesabu mshahara na PAYE kiotomatiki,
          shiriki WhatsApp, pokea malipo M-Pesa. Hakuna mafunzo. Hakuna Excel.
        </p>

        <div className="flex items-center justify-center gap-3 animate-fade-up" style={{ animationDelay: '160ms' }}>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-brand-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-400 transition-colors"
          >
            Anza Bure — Siku 14
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <span className="text-xs text-ink-500">Kadi ya benki haihitajiki</span>
        </div>
      </div>

      {/* Feature cards */}
      <div className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger">
          {[
            {
              icon: '📄',
              title: 'Invoice za Kitaalamu',
              desc: 'Weka logo, TIN, VAT 18% kiotomatiki. PDF inayopakiwa sekunde moja.',
            },
            {
              icon: '💰',
              title: 'Payslip + PAYE',
              desc: 'Hesabu PAYE na NSSF kwa mujibu wa TRA. Cha mkono kikijulikana papo hapo.',
            },
            {
              icon: '📱',
              title: 'Shiriki WhatsApp',
              desc: 'Bonyeza moja — invoice inatumwa WhatsApp na kiungo cha M-Pesa kulipa.',
            },
          ].map((f) => (
            <div key={f.title} className="bg-ink-900 border border-ink-800 rounded-xl p-6 hover:border-ink-700 transition-colors">
              <div className="text-2xl mb-4">{f.icon}</div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-ink-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className="max-w-3xl mx-auto px-6 pb-24">
        <h2 className="font-display text-3xl text-white text-center mb-12">Bei</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Starter */}
          <div className="bg-ink-900 border border-ink-800 rounded-xl p-6">
            <div className="text-xs font-bold text-ink-400 uppercase tracking-widest mb-3">Starter</div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="font-display text-3xl text-white">15,000</span>
              <span className="text-ink-400 text-sm">TZS/mwezi</span>
            </div>
            <p className="text-xs text-ink-500 mb-6">~$6/month</p>
            <ul className="space-y-2.5 text-sm text-ink-300 mb-8">
              {['Invoice bila kikomo', 'PDF Download', 'Shiriki WhatsApp', 'VAT 18% kiotomatiki'].map(f => (
                <li key={f} className="flex items-center gap-2.5">
                  <span className="text-brand-400 text-xs">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/register" className="block w-full text-center py-2.5 rounded-lg border border-ink-700 text-sm text-white hover:bg-ink-800 transition-colors">
              Chagua Starter
            </Link>
          </div>

          {/* Business */}
          <div className="bg-brand-500 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-4 right-4 text-xs font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">Inayopendwa</div>
            <div className="text-xs font-bold text-brand-200 uppercase tracking-widest mb-3">Business</div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="font-display text-3xl text-white">35,000</span>
              <span className="text-brand-200 text-sm">TZS/mwezi</span>
            </div>
            <p className="text-xs text-brand-200 mb-6">~$14/month</p>
            <ul className="space-y-2.5 text-sm text-brand-100 mb-8">
              {[
                'Yote ya Starter',
                'Payslip + PAYE + NSSF',
                'Kiungo cha M-Pesa kwenye invoice',
                'Wateja bila kikomo',
                'Ripoti ya mwezi',
              ].map(f => (
                <li key={f} className="flex items-center gap-2.5">
                  <span className="text-white text-xs">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/register" className="block w-full text-center py-2.5 rounded-lg bg-white text-brand-700 font-semibold text-sm hover:bg-brand-50 transition-colors">
              Chagua Business
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-ink-800 py-8 text-center">
        <p className="text-xs text-ink-600">
          © {new Date().getFullYear()} Duka Manager · blackwhite.co.tz · Dar es Salaam, Tanzania
        </p>
      </div>
    </div>
  )
}
