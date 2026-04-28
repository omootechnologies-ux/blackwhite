'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Business } from '@/types'
import { calculatePayroll } from '@/lib/tax'
import { formatTZS, currentMonth, uid } from '@/lib/utils'

interface Props { business: Business }

interface Extra { id: string; name: string; amount: number }

export function PayslipForm({ business }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [employeeName, setEmployeeName] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [position, setPosition] = useState('')
  const [month, setMonth] = useState(currentMonth())
  const [basicSalary, setBasicSalary] = useState<number>(0)
  const [allowances, setAllowances] = useState<Extra[]>([])
  const [deductions, setDeductions] = useState<Extra[]>([])

  const payroll = calculatePayroll(
    basicSalary,
    allowances.map(a => ({ name: a.name, amount: a.amount })),
    deductions.map(d => ({ name: d.name, amount: d.amount })),
  )

  function addAllowance() {
    setAllowances(p => [...p, { id: uid(), name: '', amount: 0 }])
  }
  function addDeduction() {
    setDeductions(p => [...p, { id: uid(), name: '', amount: 0 }])
  }

  function updateExtra(list: Extra[], setList: any, id: string, field: string, val: any) {
    setList(list.map((e: Extra) => e.id === id ? { ...e, [field]: val } : e))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!employeeName.trim()) { setError('Jina la mfanyakazi linahitajika'); return }
    if (basicSalary <= 0) { setError('Mshahara lazima uwe zaidi ya 0'); return }

    setLoading(true)
    setError(null)

    const res = await fetch('/api/payslips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employee_name: employeeName,
        employee_id: employeeId,
        position,
        month,
        basic_salary: basicSalary,
        allowances: allowances.map(a => ({ name: a.name, amount: a.amount })),
        other_deductions: deductions.map(d => ({ name: d.name, amount: d.amount })),
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      setError(err.error || 'Tatizo limetokea')
      setLoading(false)
      return
    }

    const payslip = await res.json()
    if (payslip.pdf_url) {
      window.open(payslip.pdf_url, '_blank')
    }
    setSuccess(true)
    setTimeout(() => router.push('/dashboard/payslips'), 1500)
  }

  if (success) {
    return (
      <div className="card text-center py-16">
        <div className="text-4xl mb-4">✅</div>
        <h2 className="font-display text-xl text-ink-800 mb-2">Payslip Imeundwa!</h2>
        <p className="text-sm text-ink-500">PDF inafunguka… inarudisha kwenye orodha</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
      )}

      {/* Employee Info */}
      <div className="card">
        <h2 className="font-semibold text-ink-700 mb-5">Maelezo ya Mfanyakazi</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="input-label">Jina Kamili *</label>
            <input className="input" type="text" required placeholder="Jina la mfanyakazi"
              value={employeeName} onChange={e => setEmployeeName(e.target.value)} />
          </div>
          <div>
            <label className="input-label">Namba ya Mfanyakazi</label>
            <input className="input" type="text" placeholder="EMP-001"
              value={employeeId} onChange={e => setEmployeeId(e.target.value)} />
          </div>
          <div>
            <label className="input-label">Cheo / Nafasi</label>
            <input className="input" type="text" placeholder="Meneja, Keshia, n.k."
              value={position} onChange={e => setPosition(e.target.value)} />
          </div>
          <div>
            <label className="input-label">Mwezi *</label>
            <input className="input" type="month" required
              value={month} onChange={e => setMonth(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Salary */}
      <div className="card">
        <h2 className="font-semibold text-ink-700 mb-5">Mshahara</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="mb-4">
              <label className="input-label">Mshahara wa Msingi (TZS) *</label>
              <input className="input font-mono text-lg" type="number" min="0" required
                placeholder="0" value={basicSalary || ''}
                onChange={e => setBasicSalary(Number(e.target.value))} />
            </div>

            {/* Allowances */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-ink-400 uppercase tracking-wide">Posho (Allowances)</span>
                <button type="button" onClick={addAllowance}
                  className="text-xs text-brand-600 hover:text-brand-700 font-medium">+ Ongeza</button>
              </div>
              {allowances.map(a => (
                <div key={a.id} className="flex gap-2 mb-2">
                  <input className="input flex-1" type="text" placeholder="Jina la posho"
                    value={a.name} onChange={e => updateExtra(allowances, setAllowances, a.id, 'name', e.target.value)} />
                  <input className="input w-32 font-mono" type="number" min="0" placeholder="0"
                    value={a.amount || ''} onChange={e => updateExtra(allowances, setAllowances, a.id, 'amount', Number(e.target.value))} />
                  <button type="button" onClick={() => setAllowances(p => p.filter(x => x.id !== a.id))}
                    className="text-ink-300 hover:text-red-500 px-2">×</button>
                </div>
              ))}
            </div>

            {/* Extra deductions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-ink-400 uppercase tracking-wide">Makato Mengine</span>
                <button type="button" onClick={addDeduction}
                  className="text-xs text-brand-600 hover:text-brand-700 font-medium">+ Ongeza</button>
              </div>
              {deductions.map(d => (
                <div key={d.id} className="flex gap-2 mb-2">
                  <input className="input flex-1" type="text" placeholder="Jina la makato"
                    value={d.name} onChange={e => updateExtra(deductions, setDeductions, d.id, 'name', e.target.value)} />
                  <input className="input w-32 font-mono" type="number" min="0" placeholder="0"
                    value={d.amount || ''} onChange={e => updateExtra(deductions, setDeductions, d.id, 'amount', Number(e.target.value))} />
                  <button type="button" onClick={() => setDeductions(p => p.filter(x => x.id !== d.id))}
                    className="text-ink-300 hover:text-red-500 px-2">×</button>
                </div>
              ))}
            </div>
          </div>

          {/* Live preview */}
          <div className="bg-ink-50 rounded-xl p-5 space-y-2 text-sm">
            <p className="text-xs font-bold text-ink-400 uppercase tracking-wide mb-3">Muhtasari wa Malipo</p>
            <div className="flex justify-between"><span className="text-ink-500">Mshahara Msingi</span><span className="font-mono">{formatTZS(payroll.basic_salary)}</span></div>
            {payroll.allowances_total > 0 && (
              <div className="flex justify-between"><span className="text-ink-500">Posho</span><span className="font-mono">+ {formatTZS(payroll.allowances_total)}</span></div>
            )}
            <div className="flex justify-between font-semibold border-t border-ink-200 pt-2 mt-2">
              <span>Gross</span><span className="font-mono">{formatTZS(payroll.gross)}</span>
            </div>
            <div className="h-px bg-ink-200 my-2" />
            <div className="flex justify-between text-red-600"><span>PAYE</span><span className="font-mono">- {formatTZS(payroll.paye)}</span></div>
            <div className="flex justify-between text-red-600"><span>NSSF (Mfanyakazi 5%)</span><span className="font-mono">- {formatTZS(payroll.nssf_employee)}</span></div>
            {payroll.other_deductions_total > 0 && (
              <div className="flex justify-between text-red-600"><span>Makato mengine</span><span className="font-mono">- {formatTZS(payroll.other_deductions_total)}</span></div>
            )}
            <div className="bg-brand-500 text-white rounded-lg p-3 mt-3 flex justify-between items-center">
              <span className="font-semibold text-sm">Cha Mkono (Net)</span>
              <span className="font-mono font-bold text-lg">{formatTZS(payroll.net_pay)}</span>
            </div>
            <p className="text-xs text-ink-400 mt-2">
              NSSF Mwajiri (5%): {formatTZS(payroll.nssf_employer)} — hautoi kwenye mshahara
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pb-8">
        <button type="button" onClick={() => router.back()} className="btn-secondary">Rudi</button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Inaunda PDF...' : 'Unda Payslip + PDF →'}
        </button>
      </div>
    </form>
  )
}
