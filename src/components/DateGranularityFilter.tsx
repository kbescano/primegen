'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

function getMonday(d: Date): Date {
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(d)
  monday.setDate(d.getDate() + diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

function buildMonthOptions() {
  const now = new Date()
  const options: { value: string; label: string }[] = []
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('en-PH', { month: 'long' })
    options.push({ value, label })
  }
  return options
}

function buildWeekOptions() {
  const now = new Date()
  const thisMonday = getMonday(now)
  const options: { value: string; label: string }[] = []
  for (let i = 0; i < 12; i++) {
    const monday = new Date(thisMonday)
    monday.setDate(thisMonday.getDate() - i * 7)
    const value = monday.toISOString().slice(0, 10)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    const label = `${monday.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })} \u2013 ${sunday.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}`
    options.push({ value, label: i === 0 ? `${label} (This Week)` : label })
  }
  return options
}

function buildYearOptions() {
  const now = new Date()
  const options: { value: string; label: string }[] = []
  for (let i = 0; i < 5; i++) {
    const year = now.getFullYear() - i
    options.push({ value: String(year), label: String(year) })
  }
  return options
}

export default function DateGranularityFilter({
  granularity,
  periodValue,
}: {
  granularity: string
  periodValue: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function navigate(newGranularity: string, newValue: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('granularity', newGranularity)
    params.set('periodValue', newValue)
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  function navigateAllTime() {
    const params = new URLSearchParams(searchParams.toString())
    params.set('granularity', 'all')
    params.delete('periodValue')
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  const monthOptions = buildMonthOptions()
  const weekOptions = buildWeekOptions()
  const yearOptions = buildYearOptions()

  const defaultMonth = monthOptions[0]?.value || ''
  const defaultYear = yearOptions[0]?.value || ''

  const effectiveGranularity = granularity || 'month'
  const isAllTime = effectiveGranularity === 'all'
  const isMonth = effectiveGranularity === 'month'
  const isWeek = effectiveGranularity === 'week'
  const isYear = effectiveGranularity === 'year'
  const isDay = effectiveGranularity === 'day'

  // ✨ Same visual language as Staff/Status/Source: flat text, thin
  // underline, no box/border/background. Active state is just a colored
  // underline + darker text, not a filled pill.
  const selectClass = (active: boolean) =>
    `text-[12px] font-medium bg-transparent border-0 border-b pb-0.5 pr-5 focus:outline-none cursor-pointer appearance-none transition-colors ${
      active ? 'border-[#149911] text-gray-900' : 'border-gray-200 text-gray-500'
    }`

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
      <button
        type="button"
        onClick={navigateAllTime}
        className={`text-[12px] font-medium bg-transparent border-0 border-b pb-0.5 transition-colors ${
          isAllTime ? 'border-[#149911] text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'
        }`}
      >
        All Time
      </button>

      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Day</span>
        <input
          type="date"
          value={isDay ? (periodValue || '') : ''}
          onChange={(e) => e.target.value && navigate('day', e.target.value)}
          className={selectClass(isDay)}
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Month</span>
        <select
          value={isMonth ? (periodValue || defaultMonth) : defaultMonth}
          onChange={(e) => e.target.value && navigate('month', e.target.value)}
          className={selectClass(isMonth)}
        >
          <option value="" disabled>Select month...</option>
          {monthOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Week</span>
        <select
          value={isWeek ? periodValue : ''}
          onChange={(e) => e.target.value && navigate('week', e.target.value)}
          className={selectClass(isWeek)}
        >
          <option value="" disabled>Select week...</option>
          {weekOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Year</span>
        <select
          value={isYear ? periodValue : defaultYear}
          onChange={(e) => e.target.value && navigate('year', e.target.value)}
          className={selectClass(isYear)}
        >
          <option value="" disabled>Select year...</option>
          {yearOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}