'use client'

import { useRouter, usePathname } from 'next/navigation'

function getLastMonths(count: number): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = []
  const now = new Date()
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('en-PH', { year: 'numeric', month: 'long' })
    out.push({ value, label })
  }
  return out
}

export default function MonthSelect({ current }: { current: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const months = getLastMonths(12)

  return (
    <select
      value={current}
      onChange={(e) => router.push(`${pathname}?month=${e.target.value}`)}
      className="text-[12px] font-bold uppercase tracking-wide px-4 py-2.5 border border-[#01172f]/15 bg-white text-[#01172f] hover:border-[#01172f]/30 focus:outline-none focus:border-[#149911] transition-colors cursor-pointer"
    >
      <option value="all">All Time</option>
      {months.map((m) => (
        <option key={m.value} value={m.value}>
          {m.label}
        </option>
      ))}
    </select>
  )
}
