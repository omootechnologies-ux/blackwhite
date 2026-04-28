export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="font-display text-2xl text-white">
            Duka <span className="text-brand-400">Manager</span>
          </a>
        </div>
        {children}
      </div>
    </div>
  )
}
