'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'

type Expense = {
  id: number | string
  label: string
  amount: number
  month: number
  year: number
  notes: string
  createdByName: string
  createdAt: string
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const peso = (n: number) =>
  '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const fieldClass =
  'w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#149911] focus:ring-2 focus:ring-[#149911]/10 transition-all'
const labelClass = 'block text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5'

export default function ExpensesManager({
  expenses,
  monthTotals,
  activeMonth,
  activeYear,
  currentYear,
  currentMonth,
}: {
  expenses: Expense[]
  monthTotals: number[]
  activeMonth: string
  activeYear: string
  currentYear: number
  currentMonth: number
}) {
  const router = useRouter()
  const pathname = usePathname()

  const years = Array.from({ length: currentYear - 2023 + 2 }, (_, i) => 2023 + i)

  // New entries default to the month being viewed (or this month when viewing all)
  const defaultMonth = activeMonth === 'all' ? currentMonth : Number(activeMonth)
  const defaultYear = activeYear === 'all' ? currentYear : Number(activeYear)

  const [editingId, setEditingId] = useState<number | string | null>(null)
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')
  const [month, setMonth] = useState<number>(defaultMonth)
  const [year, setYear] = useState<number>(defaultYear)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | string | null>(null)

  const total = expenses.reduce((sum, e) => sum + e.amount, 0)
  const yearTotal = monthTotals.reduce((sum, v) => sum + v, 0)

  function go(nextMonth: string, nextYear: string) {
    const params = new URLSearchParams()
    params.set('month', nextMonth)
    params.set('year', nextYear)
    router.push(`${pathname}?${params.toString()}`)
  }

  function resetForm() {
    setEditingId(null)
    setLabel('')
    setAmount('')
    setNotes('')
    setMonth(defaultMonth)
    setYear(defaultYear)
    setError('')
  }

  function startEdit(e: Expense) {
    setEditingId(e.id)
    setLabel(e.label)
    setAmount(String(e.amount))
    setMonth(e.month)
    setYear(e.year)
    setNotes(e.notes)
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    setError('')
    const amountNum = Number(amount)
    if (!label.trim()) return setError('Enter a label for the expense.')
    if (!Number.isFinite(amountNum) || amountNum <= 0) return setError('Enter an amount greater than zero.')

    setSaving(true)
    try {
      const res = await fetch(editingId ? `/api/additional-expenses/${editingId}` : '/api/additional-expenses', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ label: label.trim(), amount: amountNum, month, year, notes: notes.trim() }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.errors?.[0]?.data?.errors?.[0]?.message || data?.errors?.[0]?.message || `Could not save (server returned ${res.status}).`)
        return
      }
      resetForm()
      router.refresh()
    } catch {
      setError('Could not save -- network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number | string) {
    setError('')
    try {
      const res = await fetch(`/api/additional-expenses/${id}`, { method: 'DELETE', credentials: 'include' })
      if (!res.ok) {
        setError(`Could not delete (server returned ${res.status}).`)
        return
      }
      setConfirmDeleteId(null)
      if (editingId === id) resetForm()
      router.refresh()
    } catch {
      setError('Could not delete -- network error. Please try again.')
    }
  }

  const card = 'bg-white border border-gray-100 rounded-3xl p-5 sm:p-6 md:p-8 shadow-sm w-full'
  const periodLabel =
    activeMonth === 'all'
      ? activeYear === 'all' ? 'All time' : `All of ${activeYear}`
      : `${MONTHS[Number(activeMonth) - 1]} ${activeYear === 'all' ? '' : activeYear}`.trim()

  return (
    <div className="w-full max-w-[1000px] mx-auto antialiased pb-10">
      <Link
        href="/admin-dashboard/reports"
        className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-gray-500 hover:text-gray-900 transition-colors mb-5"
      >
        &larr; Back to Reports
      </Link>

      <div className="mb-8">
        <h1 className="text-[26px] md:text-[32px] font-semibold tracking-tight text-gray-900 leading-none mb-3">
          Additional Expenses
        </h1>
        <p className="text-[13px] sm:text-[14px] text-gray-500 font-medium sm:max-w-[640px]">
          Company expenses that aren&apos;t tied to one order, like rent, salaries or utilities. Each month&apos;s total is
          deducted from Net Profit on the Reports page and added as its own sheet in the Excel export.
        </p>
      </div>

      {/* Add / edit */}
      <form onSubmit={handleSubmit} className={`${card} mb-6`}>
        <h2 className="text-[12px] sm:text-[13px] font-semibold uppercase tracking-wider text-gray-400 mb-5">
          {editingId ? 'Edit expense' : 'Add expense'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-5">
            <label className={labelClass} htmlFor="exp-label">Label</label>
            <input id="exp-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Office rent" className={fieldClass} />
          </div>
          <div className="md:col-span-3">
            <label className={labelClass} htmlFor="exp-amount">Amount (&#8369;)</label>
            <input
              id="exp-amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className={fieldClass}
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass} htmlFor="exp-month">Month</label>
            <select id="exp-month" value={month} onChange={(e) => setMonth(Number(e.target.value))} className={fieldClass}>
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className={labelClass} htmlFor="exp-year">Year</label>
            <select id="exp-year" value={year} onChange={(e) => setYear(Number(e.target.value))} className={fieldClass}>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="md:col-span-12">
            <label className={labelClass} htmlFor="exp-notes">Note (optional)</label>
            <input id="exp-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything worth remembering about this expense" className={fieldClass} />
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-[12px] font-medium text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#149911] text-white hover:bg-[#103900] transition-all text-[13px] font-medium shadow-sm disabled:opacity-50"
          >
            {saving ? 'Saving...' : editingId ? 'Save changes' : 'Add expense'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all text-[13px] font-medium"
            >
              Cancel edit
            </button>
          )}
        </div>
      </form>

      {/* Filters + month strip */}
      <div className={`${card} mb-6`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <h2 className="text-[12px] sm:text-[13px] font-semibold uppercase tracking-wider text-gray-400">
            {periodLabel} &middot; {expenses.length} entr{expenses.length === 1 ? 'y' : 'ies'}
          </h2>
          <div className="flex gap-2.5">
            <select
              value={activeMonth}
              onChange={(e) => go(e.target.value, activeYear)}
              className="bg-white border border-gray-200 rounded-full pl-4 pr-8 py-2 text-[12px] font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 shadow-sm"
            >
              <option value="all">All Months</option>
              {MONTHS.map((m, i) => <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>)}
            </select>
            <select
              value={activeYear}
              onChange={(e) => go(activeMonth, e.target.value)}
              className="bg-white border border-gray-200 rounded-full pl-4 pr-8 py-2 text-[12px] font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 shadow-sm"
            >
              <option value="all">All Years</option>
              {years.map((y) => <option key={y} value={String(y)}>{y}</option>)}
            </select>
          </div>
        </div>

        {activeYear !== 'all' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mb-6">
            {MONTHS.map((m, i) => {
              const key = String(i + 1).padStart(2, '0')
              const isActive = activeMonth === key
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => go(isActive ? 'all' : key, activeYear)}
                  className={`text-left rounded-xl px-3 py-2.5 border transition-all ${
                    isActive ? 'bg-[#1d1d1f] border-[#1d1d1f] text-white' : 'bg-gray-50/70 border-gray-100 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className={`block text-[9px] font-semibold uppercase tracking-wider ${isActive ? 'text-gray-400' : 'text-gray-400'}`}>
                    {m.slice(0, 3)}
                  </span>
                  <span className="block text-[12px] font-semibold font-mono truncate">{peso(monthTotals[i])}</span>
                </button>
              )
            })}
          </div>
        )}

        {expenses.length === 0 ? (
          <div className="border border-dashed border-gray-200 rounded-2xl py-12 text-center">
            <p className="text-[13px] text-gray-400 font-medium">No additional expenses for this period yet.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {expenses.map((e) => (
              <div
                key={e.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 border-b border-gray-50 last:border-0 ${
                  editingId === e.id ? 'bg-[#149911]/5 -mx-3 px-3 rounded-xl' : ''
                }`}
              >
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-gray-900 truncate">{e.label}</p>
                  <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                    {MONTHS[e.month - 1]} {e.year}
                    {e.createdByName ? ` · added by ${e.createdByName}` : ''}
                  </p>
                  {e.notes && <p className="text-[12px] text-gray-500 mt-1 break-words">{e.notes}</p>}
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                  <span className="text-[15px] font-semibold font-mono text-red-500">-{peso(e.amount)}</span>
                  {confirmDeleteId === e.id ? (
                    <span className="flex items-center gap-2 text-[11px]">
                      <span className="text-gray-500 font-medium">Delete?</span>
                      <button type="button" onClick={() => handleDelete(e.id)} className="font-semibold text-red-600 hover:text-red-800">Yes</button>
                      <button type="button" onClick={() => setConfirmDeleteId(null)} className="font-semibold text-gray-500 hover:text-gray-800">No</button>
                    </span>
                  ) : (
                    <span className="flex items-center gap-3 text-[11px]">
                      <button type="button" onClick={() => startEdit(e)} className="font-semibold text-blue-600 hover:text-blue-800">Edit</button>
                      <button type="button" onClick={() => setConfirmDeleteId(e.id)} className="font-semibold text-gray-400 hover:text-red-600">Delete</button>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 pt-5 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="text-[12px] font-semibold text-gray-500">
            Total ({periodLabel.toLowerCase()})
          </p>
          <p className="text-[20px] font-semibold font-mono text-red-500">-{peso(total)}</p>
        </div>
        {activeYear !== 'all' && activeMonth !== 'all' && (
          <p className="text-[11px] text-gray-400 font-medium mt-1 sm:text-right">{activeYear} total so far: {peso(yearTotal)}</p>
        )}
      </div>
    </div>
  )
}
