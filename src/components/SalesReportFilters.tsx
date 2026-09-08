'use client'

import { useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { FULFILLMENT_OPTIONS } from '@/lib/pipelineUtils'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function buildMonthOptions() {
  return MONTH_NAMES.map((l, i) => ({ v: String(i + 1).padStart(2, '0'), l }))
}

function buildYearOptions() {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: currentYear - 2023 + 2 }, (_, i) => String(2023 + i))
}

const selectClass =
  'appearance-none bg-white border border-gray-200 rounded-full pl-5 pr-9 py-2 text-[13px] font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 cursor-pointer shadow-sm'

// Was previously a plain <form method="GET"> auto-submitted by an inline
// <script>, which relied on the browser to run that script fresh on every
// navigation -- unreliable enough in practice (didn't always reflect the
// new filter right away) that it's worth switching to the same
// router.push-driven pattern every other filter in this app already uses
// (see DateGranularityFilter.tsx), which doesn't have that problem.
export default function SalesReportFilters({
  activeMonth,
  activeYear,
  activeStatus,
}: {
  activeMonth: string
  activeYear: string
  activeStatus: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  function navigate(key: 'month' | 'year' | 'status', value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set(key, value)
    // Wrapped in a transition so isPending flips true for exactly as long
    // as the server component is re-fetching -- router.push alone doesn't
    // expose that, which is what made the previous filter feel like
    // nothing happened until the new data suddenly showed up.
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  const filterMonths = buildMonthOptions()
  const filterYears = buildYearOptions()

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <div className="relative">
        <select
          value={activeMonth}
          onChange={(e) => navigate('month', e.target.value)}
          disabled={isPending}
          className={`${selectClass} disabled:opacity-50 disabled:cursor-wait`}
        >
          <option value="all">All Months</option>
          {filterMonths.map((m) => (
            <option key={m.v} value={m.v}>{m.l}</option>
          ))}
        </select>
      </div>
      <div className="relative">
        <select
          value={activeYear}
          onChange={(e) => navigate('year', e.target.value)}
          disabled={isPending}
          className={`${selectClass} disabled:opacity-50 disabled:cursor-wait`}
        >
          <option value="all">All Years</option>
          {filterYears.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
      <div className="relative">
        <select
          value={activeStatus}
          onChange={(e) => navigate('status', e.target.value)}
          disabled={isPending}
          className={`${selectClass} disabled:opacity-50 disabled:cursor-wait`}
        >
          <option value="all">All Statuses</option>
          {FULFILLMENT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>
      {isPending && (
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400">
          <span className="w-3 h-3 border-2 border-gray-300 border-t-[#149911] rounded-full animate-spin" />
          Updating…
        </span>
      )}
    </div>
  )
}
