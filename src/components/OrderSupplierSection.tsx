'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AssignSuppliersModal from '@/components/AssignSuppliersModal'
import MergeSuppliersModal from '@/components/MergeSuppliersModal'
import CollectionStatusSelect from '@/components/CollectionStatusSelect'

type OrderItem = {
  description: string
  qty: number
  unit: string
  assignedPOId?: string
}

type LinkedPO = {
  id: string | number
  poNumber: string
  supplierName?: string
  supplierCompany?: string
  supplierAddress?: string
  supplierPhone?: string
  status: string
  items?: { description: string; qty: number; unit: string; unitPrice: number }[]
  preparedBy?: string
}

const PO_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'issued', label: 'Issued' },
  { value: 'fulfilled', label: 'Fulfilled' },
  { value: 'cancelled', label: 'Cancelled' },
]

// Apple-style soft colors for badges
const PO_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  issued: 'bg-[#149911]/10 text-[#149911]',
  fulfilled: 'bg-[#149911] text-white',
  cancelled: 'bg-red-50 text-red-600',
}

function isPOComplete(po: LinkedPO): boolean {
  return (
    (po.items || []).length > 0 &&
    (po.items || []).every((i) => Number(i.unitPrice) > 0 && Boolean(i.description?.trim())) &&
    Boolean(po.supplierName?.trim()) &&
    Boolean(po.supplierCompany?.trim()) &&
    Boolean(po.supplierAddress?.trim()) &&
    Boolean(po.supplierPhone?.trim()) &&
    Boolean(po.preparedBy?.trim())
  )
}

export default function OrderSupplierSection({
  orderId,
  items,
  linkedPOs,
  allowStatusChange = false,
}: {
  orderId: string | number
  items: OrderItem[]
  linkedPOs: LinkedPO[]
  allowStatusChange?: boolean
}) {
  const router = useRouter()
  const [choiceOpen, setChoiceOpen] = useState(false)
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [mergeModalOpen, setMergeModalOpen] = useState(false)

  const hasUnassigned = items.some((i) => !i.assignedPOId)
  
  // If there is only 1 PO overall, we only show the PO controls on the 1st row.
  const isSinglePO = linkedPOs.length <= 1

  const poById: Record<string, LinkedPO> = {}
  for (const po of linkedPOs) poById[String(po.id)] = po

  function handleButtonClick() {
    if (linkedPOs.length === 0) {
      setChoiceOpen(true)
    } else {
      setAssignModalOpen(true)
    }
  }

  // Used to ensure the PO details only render on the first item for that specific PO when in single-mode
  const renderedPOs = new Set<string>()

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <h3 className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
          Supplier Purchase Orders ({linkedPOs.length})
        </h3>
        
        {/* Hide manage/merge buttons entirely in Step 4 (when allowStatusChange is true) */}
        {!allowStatusChange && (
          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
            {linkedPOs.length > 1 && (
              <button
                onClick={() => setMergeModalOpen(true)}
                className="w-full sm:w-auto text-[11px] font-semibold px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-full transition-colors duration-200"
              >
                Merge into One Supplier
              </button>
            )}
            <button
              onClick={handleButtonClick}
              className="w-full sm:w-auto text-[11px] font-semibold px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-full transition-colors duration-200"
            >
              {linkedPOs.length === 0
                ? '+ Create Supplier PO'
                : hasUnassigned
                ? '+ Add Another Supplier'
                : 'Manage Suppliers'}
            </button>
          </div>
        )}
      </div>

      {linkedPOs.length === 0 ? (
        <p className="text-[13px] text-gray-400 italic">No supplier POs yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Mapping loop putting Items and POs directly inline on the same row */}
          {items.map((item, i) => {
            const po = item.assignedPOId ? poById[item.assignedPOId] : undefined
            
            // Logic: If Single PO, only show controls on the 1st row. If Multiple POs, show on every row.
            const showPOControls = po ? (isSinglePO ? !renderedPOs.has(String(po.id)) : true) : false
            if (po) renderedPOs.add(String(po.id))

            return (
              <div key={i} className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 bg-[#fbfbfd] rounded-2xl border border-gray-100 transition-shadow hover:shadow-sm">
                <span className="text-gray-900 font-medium text-[13px] break-words">
                  <span className="font-mono text-gray-400 mr-2">{item.qty} {item.unit}</span>
                  <span className="mx-2 text-gray-200">|</span>
                  {item.description}
                </span>
                
                {po ? (
                  showPOControls ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between sm:justify-end gap-3 flex-shrink-0 pt-3 md:pt-0 border-t border-gray-100 md:border-transparent">
                      <span className="text-[12px] font-semibold text-[#149911]">{po.supplierName}</span>
                      
                      {allowStatusChange && isPOComplete(po) ? (
                        <CollectionStatusSelect
                          collection="supplier-purchase-orders"
                          id={po.id}
                          status={po.status}
                          options={PO_STATUS_OPTIONS}
                          colorClassMap={PO_STATUS_COLORS}
                        />
                      ) : (
                        <span
                          className={`text-[10px] font-semibold tracking-wide px-3 py-1.5 text-center w-full sm:w-auto rounded-full ${
                            !allowStatusChange ? 'bg-gray-100 text-gray-600' : 'bg-amber-50 text-amber-600'
                          }`}
                          title={!allowStatusChange ? 'Status updates unlock in Step 4' : 'Fill in unit prices before this PO can move past Draft'}
                        >
                          {!allowStatusChange ? po.status : isPOComplete(po) ? po.status : 'Incomplete'}
                        </span>
                      )}
                      
                      {/* Change Edit to Print in Step 4, append mode=print to URL */}
                      {po.status !== 'fulfilled' && (
                        <Link
                          href={`/admin-dashboard/supplier-po?orderId=${orderId}&id=${po.id}${allowStatusChange ? '&mode=print' : ''}`}
                          className="text-[11px] font-medium text-blue-600 hover:text-blue-800 transition-colors text-center w-full sm:w-auto py-1 sm:py-0"
                        >
                          {allowStatusChange ? 'Print \u2192' : 'Edit \u2192'}
                        </Link>
                      )}
                    </div>
                  ) : (
                    // Blank space keeper for subsequent items of the same PO to maintain visual alignment
                    <div className="hidden md:block w-full sm:w-auto"></div>
                  )
                ) : (
                  <span className="text-[12px] font-medium text-gray-400 italic flex-shrink-0 pt-3 md:pt-0">
                    Unassigned
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Choice Prompt Modal (Apple-style Popover) */}
      {choiceOpen && (
        <div className="fixed inset-0 bg-[#1d1d1f]/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4 antialiased">
          <div className="bg-white max-w-sm w-full flex flex-col rounded-[2rem] shadow-[0_24px_48px_rgba(0,0,0,0.15)] overflow-hidden ring-1 ring-white/50">
            
            <div className="p-6 md:p-8 border-b border-gray-100 shrink-0">
              <h2 className="text-[18px] md:text-[20px] font-semibold tracking-tight text-gray-900 mb-2">
                Supplier Routing
              </h2>
              <p className="text-[13px] text-gray-500 leading-relaxed">
                Are all these items coming from one single supplier, or are you splitting them across multiple vendors?
              </p>
            </div>
            
            <div className="p-6 md:p-8 bg-[#fbfbfd] flex flex-col gap-3 shrink-0">
              <button
                onClick={() => router.push(`/admin-dashboard/supplier-po?orderId=${orderId}`)}
                className="w-full py-3.5 rounded-full text-[13px] font-medium bg-[#149911] text-white hover:bg-[#103900] transition-colors focus:outline-none shadow-sm"
              >
                One Single Supplier
              </button>
              <button
                onClick={() => {
                  setChoiceOpen(false)
                  setAssignModalOpen(true)
                }}
                className="w-full py-3.5 rounded-full text-[13px] font-medium bg-[#1d1d1f] text-white hover:bg-gray-800 transition-colors focus:outline-none shadow-sm"
              >
                Multiple Suppliers
              </button>
              <button
                onClick={() => setChoiceOpen(false)}
                className="w-full py-3 rounded-full text-[13px] font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors focus:outline-none mt-1"
              >
                Cancel
              </button>
            </div>
            
          </div>
        </div>
      )}

      {assignModalOpen && (
        <AssignSuppliersModal
          orderId={orderId}
          items={items}
          linkedPOs={linkedPOs}
          onClose={() => setAssignModalOpen(false)}
        />
      )}
      
      {mergeModalOpen && (
        <MergeSuppliersModal
          orderId={orderId}
          orderItems={items}
          linkedPOs={linkedPOs}
          onClose={() => setMergeModalOpen(false)}
        />
      )}
    </div>
  )
}