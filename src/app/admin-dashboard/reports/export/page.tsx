import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayloadClient } from '@/lib/getPayloadClient'
import DateGranularityFilter from '@/components/DateGranularityFilter'
import ExportCenterClient from './ExportCenterClient'

export const dynamic = 'force-dynamic'

function currentMonthValue(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function getGranularityRange(granularity?: string, periodValue?: string): { start?: Date; end?: Date } {
  if (!granularity || !periodValue) return {}
  if (granularity === 'month') {
    const [y, m] = periodValue.split('-').map(Number)
    if (!y || !m) return {}
    return { start: new Date(y, m - 1, 1), end: new Date(y, m, 1) }
  }
  if (granularity === 'week') {
    const start = new Date(`${periodValue}T00:00:00`)
    if (isNaN(start.getTime())) return {}
    const end = new Date(start)
    end.setDate(start.getDate() + 7)
    return { start, end }
  }
  if (granularity === 'year') {
    const y = Number(periodValue)
    if (!y) return {}
    return { start: new Date(y, 0, 1), end: new Date(y + 1, 0, 1) }
  }
  return {}
}

export default async function ExportCenterPage({
  searchParams,
}: {
  searchParams: Promise<{ granularity?: string; periodValue?: string }>
}) {
  const payload = await getPayloadClient()
  const reqHeaders = await headers()
  const { user } = await payload.auth({ headers: reqHeaders })

  if (user?.role !== 'admin') {
    redirect('/admin-dashboard')
  }

  let { granularity, periodValue } = await searchParams
  if (!granularity) {
    granularity = 'month'
    periodValue = currentMonthValue()
  }
  const { start, end } = getGranularityRange(granularity, periodValue)

  const conditions: any[] = []
  if (start && end) {
    conditions.push({ orderDate: { greater_than_equal: start.toISOString() } })
    conditions.push({ orderDate: { less_than: end.toISOString() } })
  }

  const { docs } = await payload.find({
    collection: 'orders',
    where: conditions.length > 0 ? { and: conditions } : undefined,
    limit: 1000,
    sort: '-orderDate',
    depth: 0,
  })

  const periodLabel =
    granularity === 'month' && periodValue
      ? new Date(`${periodValue}-01`).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })
      : granularity === 'year'
        ? periodValue
        : granularity === 'week'
          ? `Week of ${periodValue}`
          : 'All Time'

  return (
    <div className="max-w-[900px] mx-auto py-6 px-6">
      <div className="mb-6">
        <DateGranularityFilter granularity={granularity || ''} periodValue={periodValue || ''} />
      </div>
      <ExportCenterClient orders={docs} periodLabel={periodLabel} />
    </div>
  )
}