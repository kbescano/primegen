import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayloadClient } from '@/lib/getPayloadClient'
import { findAll } from '@/lib/findAll'
import ExpensesManager from './ExpensesManager'

export const dynamic = 'force-dynamic'

export default async function AdditionalExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>
}) {
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: await headers() })
  if (user?.role !== 'admin') redirect('/admin-dashboard')

  const params = await searchParams
  const now = new Date()
  const activeMonth = params.month || String(now.getMonth() + 1).padStart(2, '0')
  const activeYear = params.year || String(now.getFullYear())

  // Everything in the selected year (or all years); the month filter and the
  // per-month totals strip are both derived from it.
  const { docs } = await findAll(payload, {
    collection: 'additional-expenses',
    where: activeYear === 'all' ? undefined : { year: { equals: Number(activeYear) } },
    sort: ['-year', '-month', '-createdAt'],
    depth: 0,
  })

  const rows = (docs as any[]).map((e) => ({
    id: e.id,
    label: e.label as string,
    amount: Number(e.amount) || 0,
    month: Number(e.month),
    year: Number(e.year),
    notes: (e.notes as string) || '',
    createdByName: (e.createdByName as string) || '',
    createdAt: e.createdAt as string,
  }))

  const monthTotals = Array.from({ length: 12 }, (_, i) =>
    rows.filter((r) => r.month === i + 1).reduce((sum, r) => sum + r.amount, 0)
  )
  const visible = activeMonth === 'all' ? rows : rows.filter((r) => r.month === Number(activeMonth))

  return (
    <ExpensesManager
      expenses={visible}
      monthTotals={monthTotals}
      activeMonth={activeMonth}
      activeYear={activeYear}
      currentYear={now.getFullYear()}
      currentMonth={now.getMonth() + 1}
    />
  )
}
