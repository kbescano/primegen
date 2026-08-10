'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

function getMonday(d: Date): Date {
  const day = d.getDay() // 0=Sun ... 6=Sat
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
    params.delete('page') // reset to page 1 on filter change
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

  // Missing/empty granularity defaults to "this month" -- not "all time".
  const effectiveGranularity = granularity || 'month'
  const isAllTime = effectiveGranularity === 'all'
  const isMonth = effectiveGranularity === 'month'
  const isWeek = effectiveGranularity === 'week'
  const isYear = effectiveGranularity === 'year'

  const selectClass = (active: boolean) =>
    `text-[12px] font-bold uppercase tracking-wide px-3 py-2 border bg-white cursor-pointer transition-colors ${
      active ? 'border-[#149911] text-[#01172f]' : 'border-[#01172f]/15 text-[#01172f]/50'
    }`

  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div>
        <label className="block text-[9px] font-bold uppercase tracking-[0.15em] text-[#01172f]/35 mb-1">
          &nbsp;
        </label>
        <button
          type="button"
          onClick={navigateAllTime}
          className={`text-[12px] font-bold uppercase tracking-wide px-3 py-2 border transition-colors ${
            isAllTime ? 'bg-[#01172f] border-[#01172f] text-white' : 'bg-white border-[#01172f]/15 text-[#01172f]/50 hover:border-[#01172f]/40'
          }`}
        >
          All Time
        </button>
      </div>
      <div>
        <label className="block text-[9px] font-bold uppercase tracking-[0.15em] text-[#01172f]/35 mb-1">
          Month
        </label>
        <select
          value={isMonth ? (periodValue || defaultMonth) : defaultMonth}
          onChange={(e) => e.target.value && navigate('month', e.target.value)}
          className={selectClass(isMonth)}
        >
          <option value="" disabled>
            Select month...
          </option>
          {monthOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-[9px] font-bold uppercase tracking-[0.15em] text-[#01172f]/35 mb-1">
          Week 
        </label>
        <select
          // No default selection -- sits on the placeholder until the
          // person explicitly picks a week, rather than silently defaulting
          // to "this week" in the background.
          value={isWeek ? periodValue : ''}
          onChange={(e) => e.target.value && navigate('week', e.target.value)}
          className={selectClass(isWeek)}
        >
          <option value="" disabled>
            Select week...
          </option>
          {weekOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-[9px] font-bold uppercase tracking-[0.15em] text-[#01172f]/35 mb-1">
          Year
        </label>
        <select
          value={isYear ? periodValue : defaultYear}
          onChange={(e) => e.target.value && navigate('year', e.target.value)}
          className={selectClass(isYear)}
        >
          <option value="" disabled>
            Select year...
          </option>
          {yearOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}