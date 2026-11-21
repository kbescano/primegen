'use client'

import { useState } from 'react'
import { downloadExcelSummary } from '@/lib/generateExcelSummary'

const peso = (n: number) =>
  '\u20B1' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function ExportCenterClient({
  orders,
  periodLabel,
  expenses,
  expensesNote,
}: {
  orders: any[]
  periodLabel?: string
  expenses?: any[]
  expensesNote?: string
}) {
  const [downloading, setDownloading] = useState(false)
  const safeOrders = orders || []
  const safeExpenses = expenses || []
  const expensesTotal = safeExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0)

  async function handleDownload() {
    setDownloading(true)
    try {
      await downloadExcelSummary(safeOrders, periodLabel, safeExpenses, expensesNote)
    } catch (e) {
      console.error('Failed to generate export:', e)
    } finally {
      setDownloading(false)
    }
  }

  const totals = safeOrders.reduce(
    (acc, o) => {
      const items = o.items || []
      const subtotal = items.reduce(
        (s: number, i: any) => s + (Number(i.qty) || 0) * (Number(i.unitPrice) || 0),
        0
      )
      const netRev = subtotal - (Number(o.discountAmount) || 0) + (Number(o.deliveryFee) || 0)
      const gross = netRev + netRev * ((Number(o.vatRate) || 0) / 100)
      const cogs = items.reduce((s: number, i: any) => s + (Number(i.qty) || 0) * (Number(i.unitCost) || 0), 0)
      const liquidatedOpex = (o.opex || []).reduce(
        (s: number, e: any) => s + (e.status === 'liquidated' ? Number(e.amount) || 0 : 0),
        0
      )
      acc.gross += gross
      acc.profit += netRev - cogs - liquidatedOpex
      return acc
    },
    { gross: 0, profit: 0 }
  )

  return (
    <div className="max-w-[900px] mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-black uppercase tracking-tight text-[#01172f] mb-1">Export Center</h1>
        <p className="text-xs text-gray-500 font-medium">
          Download a formatted Excel report covering executive summary, sales performance, per-order detail, and additional expenses.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Orders in Range</p>
          <p className="text-2xl font-black text-[#01172f]">{safeOrders.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Gross Revenue</p>
          <p className="text-2xl font-black text-[#01172f] font-mono">{peso(totals.gross)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Additional Expenses</p>
          <p className="text-2xl font-black text-red-500 font-mono">-{peso(expensesTotal)}</p>
          <p className="text-[10px] text-gray-400 font-medium mt-1">
            {expensesNote || `${safeExpenses.length} entr${safeExpenses.length === 1 ? 'y' : 'ies'} in range`}
          </p>
        </div>
      </div>

      <button
        onClick={handleDownload}
        disabled={downloading || (safeOrders.length === 0 && safeExpenses.length === 0)}
        className="w-full sm:w-auto px-8 py-3.5 bg-[#149911] text-white text-[12px] font-bold uppercase tracking-widest rounded-xl hover:bg-[#103900] transition-colors disabled:opacity-50 shadow-sm"
      >
        {downloading ? 'Generating...' : 'Download Excel Report'}
      </button>
    </div>
  )
}