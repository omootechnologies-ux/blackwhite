import { format, parseISO } from 'date-fns'

// ============================================================
// Formatting utilities
// ============================================================

export function formatTZS(amount: number): string {
  return 'TZS ' + Math.round(amount).toLocaleString('en-TZ')
}

export function formatDate(dateStr: string): string {
  try {
    const d = dateStr.includes('T') ? parseISO(dateStr) : new Date(dateStr + 'T00:00:00')
    return format(d, 'dd MMM yyyy')
  } catch {
    return dateStr
  }
}

export function monthLabel(month: string): string {
  // month = "2024-12"
  const [year, m] = month.split('-')
  const months = [
    'Januari', 'Februari', 'Machi', 'Aprili', 'Mei', 'Juni',
    'Julai', 'Agosti', 'Septemba', 'Oktoba', 'Novemba', 'Desemba',
  ]
  return `${months[parseInt(m) - 1]} ${year}`
}

export function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// Simple UUID for line items
export function uid(): string {
  return Math.random().toString(36).slice(2, 9)
}
