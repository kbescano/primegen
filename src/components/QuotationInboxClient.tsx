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
import { usePathname, useSearchParams } from 'next/navigation'
import StatusSelect from '@/components/StatusSelect'
import AssignStaffSelect from '@/components/AssignStaffSelect'
import AddUpdateNote from '@/components/AddUpdateNotes'
import DateGranularityFilter from '@/components/DateGranularityFilter'

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

function normalizeStatus(value: string | null | undefined): string | undefined {
  return value && VALID_STATUSES.has(value) ? value : undefined
}

function assignedToId(assignedTo: any): string | undefined {
  if (!assignedTo) return undefined
  return typeof assignedTo === 'object' ? String(assignedTo?.id) : String(assignedTo)
}

type StaffOption = { id: string; name: string; email: string }

export default function QuotationInboxClient({
  requests,
  staffOptions,
  isAdmin,
  currentUserName,
  initialStatus,
  initialStaff,
  granularity,
  periodValue,
}: {
  requests: any[] // each pre-annotated server-side with `.stageLabel`
  staffOptions: StaffOption[]
  isAdmin: boolean
  currentUserName: string
  initialStatus?: string
  initialStaff?: string
  granularity: string
  periodValue: string
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [activeStatus, setActiveStatus] = useState<string | undefined>(normalizeStatus(initialStatus))
  const [activeStaff, setActiveStaff] = useState<string | undefined>(initialStaff)

  // Sync state if the user uses the browser Back/Forward buttons
  useEffect(() => {
    setActiveStatus(normalizeStatus(searchParams.get('status')))
    setActiveStaff(searchParams.get('staff') || undefined)
  }, [searchParams])

  // Silently update the URL so links remain shareable, without triggering a
  // Next.js navigation or server re-render (same as ProductCatalog's
  // toggleCategory / SearchBar).
  function syncUrl(next: { status?: string; staff?: string }) {
    const params = new URLSearchParams(searchParams.toString())
    const nextStatus = 'status' in next ? next.status : activeStatus
    const nextStaff = 'staff' in next ? next.staff : activeStaff
    if (nextStatus) params.set('status', nextStatus)
    else params.delete('status')
    if (nextStaff) params.set('staff', nextStaff)
    else params.delete('staff')
    const qs = params.toString()
    window.history.replaceState(null, '', qs ? `${pathname}?${qs}` : pathname)
  }

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

  const filteredRequests = useMemo(() => {
    return requests.filter((q) => {
      const matchesStatus = !activeStatus || q.status === activeStatus
      const matchesStaff = !activeStaff || assignedToId(q.assignedTo) === activeStaff
      return matchesStatus && matchesStaff
    })
  }, [requests, activeStatus, activeStaff])

  return (
    <div className="w-full max-w-[900px] mx-auto py-6 overflow-x-hidden text-gray-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-6">
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
              : ""}{" "}
            in this period.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredRequests.map((q: any) => (
            <div
              key={q.id}
              className="bg-white border border-gray-100 rounded-lg p-3.5 sm:p-4 transition-colors hover:border-gray-200 overflow-hidden"
            >
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
                <div className="w-auto shrink-0">
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
                <div className="mb-3">
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
                            className="flex items-center justify-between gap-2 text-[10.5px] text-gray-600 min-w-0"
                          >
                            <span className="font-medium text-gray-800 truncate min-w-0">
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

                <AddUpdateNote
                  requestId={q.id}
                  existingNotes={q.statusUpdates || []}
                  currentUserName={currentUserName}
                />

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
            </div>
          ))}
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
