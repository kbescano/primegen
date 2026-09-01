'use client'

// Same "fetch once, filter client-side" pattern as ProductCatalog.tsx: the
// server component fetches the full set of requests for the current date
// window one time, and Status/Staff -- both small, fixed-cardinality
// dimensions, exactly like the category checkboxes on /products -- filter
// that already-fetched list in memory. Clicking a pill or picking a staff
// member no longer re-hits the database at all; only changing the date
// window does (see DateGranularityFilter), because that's what actually
// changes which rows need to be fetched in the first place.

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import StatusSelect from '@/components/StatusSelect'
import AssignStaffSelect from '@/components/AssignStaffSelect'
import AddUpdateNote from '@/components/AddUpdateNotes'
import DateGranularityFilter from '@/components/DateGranularityFilter'
import ActionItemsPanel from '@/components/ActionItemsPanel'
import CreateRFQModal from '@/components/CreateRFQModal'

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'quote-sent', label: 'Quote Sent' },
  { value: 'informal-quote', label: 'Informal Quote' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
]
const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  processing: 'Processing',
  'quote-sent': 'Quote Sent',
  'informal-quote': 'Informal Quote',
  completed: 'Completed',
  rejected: 'Rejected',
}
const filterPills = [{ value: '', label: 'All' }, ...STATUS_OPTIONS]
const VALID_STATUSES = new Set(STATUS_OPTIONS.map((s) => s.value))

// Order + labels for the small "This Week" / "This Month" overview panel.
// Same statuses as the filter pills, "rejected" just reads as "Cancelled"
// here to match how staff talk about it. Each gets its own color so the
// row reads at a glance, same badge language as everywhere else in the app.
const OVERVIEW_ROWS: { value: string; label: string; color: string }[] = [
  { value: 'pending', label: 'Pending', color: 'bg-amber-50 text-amber-700' },
  { value: 'processing', label: 'Processing', color: 'bg-blue-50 text-blue-700' },
  { value: 'informal-quote', label: 'Informal', color: 'bg-purple-50 text-purple-700' },
  { value: 'quote-sent', label: 'Quote Sent', color: 'bg-cyan-50 text-cyan-700' },
  { value: 'completed', label: 'Completed', color: 'bg-emerald-50 text-emerald-700' },
  { value: 'rejected', label: 'Cancelled', color: 'bg-rose-50 text-rose-700' },
]

function OverviewPanel({
  weekOverview,
  monthOverview,
}: {
  weekOverview: Record<string, number>
  monthOverview: Record<string, number>
}) {
  const rows = [
    { title: 'This Week', counts: weekOverview },
    { title: 'This Month', counts: monthOverview },
  ]
  return (
    <div className="shrink-0 w-full md:w-auto">
      {/* Desktop / tablet: the compact table. There's room to lay all 7
          columns out flat, so no scrolling is ever needed here either. */}
      <table className="hidden sm:table border-collapse">
        <thead>
          <tr>
            <th className="pb-1.5 pr-3" />
            {OVERVIEW_ROWS.map((row) => (
              <th
                key={row.value}
                className="pb-1.5 px-1 text-[8.5px] font-semibold uppercase tracking-wide text-gray-400 whitespace-nowrap"
              >
                {row.label}
              </th>
            ))}
            <th className="pb-1.5 pl-2 text-[8.5px] font-semibold uppercase tracking-wide text-gray-400 whitespace-nowrap border-l border-gray-100">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ title, counts }) => (
            <tr key={title}>
              <td className="pr-3 py-0.5 text-[9.5px] font-semibold text-gray-500 whitespace-nowrap">
                {title}
              </td>
              {OVERVIEW_ROWS.map((row) => (
                <td key={row.value} className="px-1 py-0.5 text-center">
                  <span
                    className={`inline-flex items-center justify-center min-w-[22px] px-1.5 py-0.5 rounded-full text-[10px] font-bold ${row.color}`}
                  >
                    {counts[row.value] ?? 0}
                  </span>
                </td>
              ))}
              <td className="pl-2 py-0.5 text-center border-l border-gray-100">
                <span className="inline-flex items-center justify-center min-w-[22px] px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#01172f]/5 text-[#01172f]">
                  {OVERVIEW_ROWS.reduce((sum, row) => sum + (counts[row.value] ?? 0), 0)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile: badges wrap onto multiple lines instead of scrolling
          sideways -- each one carries its own label since there's no
          shared column header to lean on once it's not a table. */}
      <div className="flex sm:hidden flex-col gap-2">
        {rows.map(({ title, counts }) => {
          const total = OVERVIEW_ROWS.reduce((sum, row) => sum + (counts[row.value] ?? 0), 0)
          return (
            <div key={title} className="flex flex-wrap items-center gap-1.5">
              <span className="text-[9.5px] font-semibold text-gray-500 shrink-0">{title}</span>
              {OVERVIEW_ROWS.map((row) => (
                <span
                  key={row.value}
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9.5px] font-bold whitespace-nowrap ${row.color}`}
                >
                  <span className="font-medium opacity-70">{row.label}</span>
                  {counts[row.value] ?? 0}
                </span>
              ))}
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9.5px] font-bold whitespace-nowrap bg-[#01172f]/5 text-[#01172f]">
                <span className="font-medium opacity-70">Total</span>
                {total}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function normalizeStatus(value: string | null | undefined): string | undefined {
  return value && VALID_STATUSES.has(value) ? value : undefined
}

function assignedToId(assignedTo: any): string | undefined {
  if (!assignedTo) return undefined
  return typeof assignedTo === 'object' ? String(assignedTo?.id) : String(assignedTo)
}

// Same in-memory filtering as Status/Staff -- `needle` is already
// lowercased and trimmed by the caller. Covers what sales would actually
// search by: customer, contact info, the requested items, and the note
// they left themselves.
function matchesRequestSearch(q: any, needle: string): boolean {
  const parts: string[] = [q.customerName, q.phone, q.email, q.message]
  if (Array.isArray(q.items)) {
    for (const item of q.items) {
      const material = item?.material
      parts.push(typeof material === 'object' ? material?.name : undefined)
      parts.push(item?.sizeDescription)
    }
  }
  return parts
    .filter(Boolean)
    .some((p) => String(p).toLowerCase().includes(needle))
}

type StaffOption = { id: string; name: string; email: string }

// The full content of one request -- shared between the inbox list (where
// it sits inside a clickable card) and the detail modal (opened by that
// click, or by a deep link like /admin-dashboard?id=123), so the two never
// drift out of sync.
function RequestCardBody({
  q,
  isAdmin,
  staffOptions,
  currentUserName,
}: {
  q: any
  isAdmin: boolean
  staffOptions: StaffOption[]
  currentUserName: string
}) {
  return (
    <>
      {/* Top Bar: Customer Info & Status Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-gray-50">
        <div className="w-full min-w-0">
          <h3 className="text-[13px] font-semibold text-gray-900 mb-0.5 break-words">
            {q.customerName || "Anonymous"}
          </h3>
          <p className="text-[10px] text-gray-400 truncate">
            {q.email || "No email provided"}
          </p>
          <p className="text-[10px] text-gray-400 truncate">
            {q.phone || "No phone provided"}
          </p>
        </div>
        <div className="w-auto shrink-0" onClick={(e) => e.stopPropagation()}>
          <div className="flex flex-wrap items-center gap-1.5">
            {isAdmin && (
              <AssignStaffSelect
                requestId={q.id}
                currentAssignedTo={assignedToId(q.assignedTo)}
                staffOptions={staffOptions}
              />
            )}
            <StatusSelect id={q.id} status={q.status} />
          </div>
        </div>
      </div>

      {q.facebookLink && (
        <div className="mb-3" onClick={(e) => e.stopPropagation()}>
          <a
            href={q.facebookLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-600 hover:text-blue-800 underline underline-offset-2 transition-colors"
          >
            View Facebook Link →
          </a>
        </div>
      )}

      {/* Pipeline Stage Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50/70 rounded px-3 py-2 mb-3 text-[10.5px]">
        <span className="text-gray-500">
          Stage: <span className="text-emerald-600 font-medium">{q.stageLabel}</span>
        </span>
        <Link
          href={`/admin-dashboard/pipeline/${q.id}`}
          onClick={(e) => e.stopPropagation()}
          className="text-[10px] font-medium text-gray-500 hover:text-[#01172f] transition-colors"
        >
          View Order Workflow →
        </Link>
      </div>

      {/* Items & Message Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
        {/* Left Column: Requested Items */}
        <div className="min-w-0">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-300 mb-1.5">
            Requested Items ({Array.isArray(q.items) ? q.items.length : 0})
          </p>
          {Array.isArray(q.items) && q.items.length > 0 ? (
            <div className="flex flex-col gap-1">
              {q.items.map((item: any, i: number) => {
                const material = item.material;
                const matName =
                  typeof material === "object"
                    ? material?.name
                    : material;
                const matUnit =
                  typeof material === "object" ? material?.unit : "";
                return (
                  <div
                    key={i}
                    className="flex items-start justify-between gap-2 text-[10.5px] text-gray-600 min-w-0"
                  >
                    <span className="font-medium text-gray-800 break-words min-w-0">
                      {matName || "Unnamed Material"}
                      {item.sizeDescription ? ` — ${item.sizeDescription}` : ""}
                    </span>
                    <span className="font-mono text-gray-400 shrink-0">
                      {item.quantity} {matUnit}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[10.5px] text-gray-300 italic">No items listed</p>
          )}
        </div>

        <div onClick={(e) => e.stopPropagation()}>
          <AddUpdateNote
            requestId={q.id}
            existingNotes={q.statusUpdates || []}
            currentUserName={currentUserName}
          />
        </div>

        {/* Right Column: Customer Message */}
        <div className="min-w-0">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-300 mb-1.5">
            Customer Note
          </p>
          {q.message ? (
            <div className="border-l-2 border-emerald-200 bg-gray-50/70 p-2.5 rounded-r overflow-hidden">
              <p className="text-[10.5px] text-gray-500 italic leading-relaxed break-words">
                &quot;{q.message}&quot;
              </p>
            </div>
          ) : (
            <p className="text-[10.5px] text-gray-300 italic">No message attached</p>
          )}
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="mt-3 pt-2.5 border-t border-gray-50 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[9.5px] text-gray-300">
          Submitted {new Date(q.createdAt).toLocaleString()}
        </p>
        <span className="text-[9px] font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
          via {q.source || "website"}
        </span>
      </div>
    </>
  )
}

export default function QuotationInboxClient({
  requests,
  staffOptions,
  isAdmin,
  currentUserName,
  initialStatus,
  initialStaff,
  granularity,
  periodValue,
  actionItems,
  weekOverview,
  monthOverview,
  products,
}: {
  requests: any[] // each pre-annotated server-side with `.stageLabel`
  staffOptions: StaffOption[]
  isAdmin: boolean
  currentUserName: string
  initialStatus?: string
  initialStaff?: string
  granularity: string
  periodValue: string
  actionItems: any[]
  weekOverview: Record<string, number>
  monthOverview: Record<string, number>
  products: { id: string; name: string; unit: string }[]
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()

  // No cron for the stale-request alerts (see checkStaleRequestAlerts) --
  // that check runs server-side on every page load instead, so this just
  // re-triggers a load periodically for anyone who leaves the inbox open
  // rather than making them manually refresh to notice anything.
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [router])

  const [activeStatus, setActiveStatus] = useState<string | undefined>(normalizeStatus(initialStatus))
  const [activeStaff, setActiveStaff] = useState<string | undefined>(initialStaff)
  // Which request's modal is open, driven by `?id=` -- this is what lets an
  // Action Item's link, or any other shared URL, open straight to one
  // specific request (see the stale-request cron, which links here).
  const [openId, setOpenId] = useState<string | undefined>(searchParams.get('id') || undefined)
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('q') || '')

  // Sync state if the user uses the browser Back/Forward buttons
  useEffect(() => {
    setActiveStatus(normalizeStatus(searchParams.get('status')))
    setActiveStaff(searchParams.get('staff') || undefined)
    setOpenId(searchParams.get('id') || undefined)
    setSearchQuery(searchParams.get('q') || '')
  }, [searchParams])

  // Silently update the URL so links remain shareable, without triggering a
  // Next.js navigation or server re-render (same as ProductCatalog's
  // toggleCategory / SearchBar).
  function syncUrl(next: { status?: string; staff?: string; id?: string; q?: string }) {
    const params = new URLSearchParams(searchParams.toString())
    const nextStatus = 'status' in next ? next.status : activeStatus
    const nextStaff = 'staff' in next ? next.staff : activeStaff
    const nextId = 'id' in next ? next.id : openId
    const nextQuery = 'q' in next ? next.q : searchQuery
    if (nextStatus) params.set('status', nextStatus)
    else params.delete('status')
    if (nextStaff) params.set('staff', nextStaff)
    else params.delete('staff')
    if (nextId) params.set('id', nextId)
    else params.delete('id')
    if (nextQuery) params.set('q', nextQuery)
    else params.delete('q')
    const qs = params.toString()
    window.history.replaceState(null, '', qs ? `${pathname}?${qs}` : pathname)
  }

  // Filtering itself is instant (in-memory), same as Status/Staff -- only
  // the URL write is debounced, so typing doesn't spam replaceState.
  useEffect(() => {
    const timer = setTimeout(() => syncUrl({ q: searchQuery || undefined }), 400)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  function handleStatusClick(value: string) {
    const next = value || undefined
    setActiveStatus(next)
    syncUrl({ status: next })
  }

  function handleStaffChange(value: string) {
    const next = value || undefined
    setActiveStaff(next)
    syncUrl({ staff: next })
  }

  function openRequest(id: string | number) {
    const next = String(id)
    setOpenId(next)
    syncUrl({ id: next })
  }

  function closeRequest() {
    setOpenId(undefined)
    syncUrl({ id: undefined })
  }

  // Matched against the full `requests` list, not `filteredRequests` -- a
  // deep link should open the card even if the current Status/Staff pills
  // would otherwise hide it.
  const openRequestDoc = openId ? requests.find((r) => String(r.id) === openId) : undefined

  const filteredRequests = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase()
    return requests.filter((q) => {
      const matchesStatus = !activeStatus || q.status === activeStatus
      const matchesStaff = !activeStaff || assignedToId(q.assignedTo) === activeStaff
      const matchesSearch = !needle || matchesRequestSearch(q, needle)
      return matchesStatus && matchesStaff && matchesSearch
    })
  }, [requests, activeStatus, activeStaff, searchQuery])

  return (
    <div className="w-full max-w-[900px] mx-auto py-6 overflow-x-hidden text-gray-700">
      {/* Header */}
      {/* Encode an inquiry that came in by phone/walk-in instead of the
          website form -- lands in this same inbox, assigned to whoever's
          logged in (see /api/quotation-requests). */}
      <div className="mb-5 flex align-self-right justify-end">
        <CreateRFQModal products={products} assignToSelf />
      </div>
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
        <div className="w-full">
          <h1 className="text-lg font-semibold text-gray-900 mb-0.5 truncate">
            Quotation Requests
          </h1>
          <p className="text-[11px] text-gray-400 w-full max-w-[600px] leading-relaxed">
            Requests submitted from the website. Follow up by phone or email,
            then update status — quotes are always sent by your team directly, never automatically.
            <span className="text-gray-500 font-medium">
              {' '}
              {filteredRequests.length === requests.length
                ? `${requests.length} total.`
                : `${filteredRequests.length} of ${requests.length} shown.`}
            </span>
          </p>
        </div>

        <OverviewPanel weekOverview={weekOverview} monthOverview={monthOverview} />
      </div>

      <ActionItemsPanel items={actionItems} isAdmin={isAdmin} staffOptions={staffOptions} />

      {/* Search */}
      <div className="relative mb-4">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, phone, email, or item..."
          className="w-full pl-9 pr-8 py-2 text-[12px] text-gray-700 placeholder:text-gray-300 bg-gray-50/70 border border-gray-100 rounded-lg focus:outline-none focus:border-[#149911] focus:bg-white transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Filter Section */}
      <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-3 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 shrink-0">Status</span>
          <div className="flex flex-wrap gap-1">
            {filterPills.map((pill) => {
              const isActive = (activeStatus || '') === pill.value
              return (
                <button
                  key={pill.value || 'all'}
                  type="button"
                  onClick={() => handleStatusClick(pill.value)}
                  className={`text-[10px] font-medium px-2.5 py-1 rounded-full transition-colors ${
                    isActive
                      ? 'bg-[#01172f] text-white'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {pill.label}
                </button>
              )
            })}
          </div>
        </div>

        {isAdmin && staffOptions.length > 0 && (
          <>
            <div className="hidden sm:block w-px h-4 bg-gray-200" />
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 shrink-0">
                Staff
              </span>
              <select
                value={activeStaff || ''}
                onChange={(e) => handleStaffChange(e.target.value)}
                className="text-[12px] font-medium text-gray-700 bg-transparent border-0 border-b border-gray-200 pb-0.5 pr-5 focus:outline-none focus:border-[#149911] cursor-pointer appearance-none"
              >
                <option value="">All Staff</option>
                {staffOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name || s.email}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        <div className="hidden sm:block w-px h-4 bg-gray-200" />

        <DateGranularityFilter
          granularity={granularity}
          periodValue={periodValue}
        />
      </div>

      {/* Quotation Cards */}
      {filteredRequests.length === 0 ? (
        <div className="border border-dashed border-gray-200 py-10 text-center rounded-lg">
          <p className="text-[11px] text-gray-400">
            No quotation requests
            {activeStatus
              ? ` with status "${STATUS_LABELS[activeStatus]}"`
              : ""}
            {activeStaff
              ? ` assigned to ${
                  staffOptions.find((s) => s.id === activeStaff)?.name ||
                  staffOptions.find((s) => s.id === activeStaff)?.email ||
                  "that staff member"
                }`
              : ""}
            {searchQuery ? ` matching "${searchQuery}"` : ""}{" "}
            in this period.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredRequests.map((q: any) => (
            <div
              key={q.id}
              onClick={() => openRequest(q.id)}
              className="bg-white border border-gray-100 rounded-lg p-3.5 sm:p-4 transition-colors hover:border-gray-200 hover:shadow-sm cursor-pointer overflow-hidden"
            >
              <RequestCardBody
                q={q}
                isAdmin={isAdmin}
                staffOptions={staffOptions}
                currentUserName={currentUserName}
              />
            </div>
          ))}
        </div>
      )}

      {openRequestDoc && (
        <div
          className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center p-4"
          onClick={closeRequest}
        >
          <div
            className="bg-white max-w-2xl w-full rounded-2xl shadow-2xl p-4 sm:p-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-[13px] font-semibold text-gray-900">Quotation Request</h2>
              <button
                onClick={closeRequest}
                className="text-gray-400 hover:text-gray-700 text-[13px] leading-none"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <RequestCardBody
              q={openRequestDoc}
              isAdmin={isAdmin}
              staffOptions={staffOptions}
              currentUserName={currentUserName}
            />
          </div>
        </div>
      )}

      {/* Admin Link Footer */}
      <p className="mt-6 text-[11px] text-gray-400 text-center">
        For internal notes or bulk edits, use the{" "}
        <Link
          href="/admin/collections/quotation-requests"
          className="text-emerald-600 font-medium hover:text-[#01172f] transition-colors underline underline-offset-2"
        >
          full CMS admin view
        </Link>
        .
      </p>
    </div>
  )
}
