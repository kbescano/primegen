'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'

type LineItem = {
  description: string
  qty: number
  unit: string
  unitPrice: number
  imageDataUrl?: string // client-side only -- never sent to the API, never saved
}

export type SupplierPOInitial = {
  supplierName?: string
  project?: string
  items?: LineItem[]
}

const peso = (n: number) =>
  n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function formatDisplayDate(iso: string) {
  if (!iso) return '________'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const day = String(d.getDate()).padStart(2, '0')
  const month = d.toLocaleString('en-US', { month: 'short' })
  const year = String(d.getFullYear()).slice(-2)
  return `${day}-${month}-${year}`
}

const TERMS = [
  'By acknowledging or fulfilling this PO, Seller agrees to be bound by these Terms, unless otherwise agreed to in writing by both parties. No other terms proposed by Seller shall apply.',
  'Prices stated in the PO are firm and not subject to change.',
  'If Seller anticipates a delay, they must inform the Buyer immediately.',
  'Buyer reserves the right to cancel the PO or impose penalties for late delivery.',
  "Goods/services not conforming to the PO may be rejected, and Buyer may return them at Seller's risk and Expense.",
  'Title and risk of loss remain with Seller until delivery and acceptance by Buyer at the specified destination.',
  'Seller shall keep confidential all non-public information disclosed by Buyer and use it solely for fulfilling the PO.',
  'This PO and these Terms constitute the entire agreement between Buyer and Seller and supersede all prior communications.',
]

export default function SupplierPOGenerator({ initial }: { initial?: SupplierPOInitial }) {
  const [poNumber, setPoNumber] = useState('')
  const [poDate, setPoDate] = useState(new Date().toISOString().slice(0, 10))
  const [supplierName, setSupplierName] = useState(initial?.supplierName ?? '')
  const [companyName, setCompanyName] = useState('')
  const [streetAddress, setStreetAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [preparedBy, setPreparedBy] = useState('')
  const [preparedByRole, setPreparedByRole] = useState('Sales Rep.')
  const [items, setItems] = useState<LineItem[]>(
    initial?.items && initial.items.length > 0
      ? initial.items
      : [{ description: '', qty: 1, unit: 'pcs', unitPrice: 0 }]
  )
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0), [items])
  const total = subtotal

  function updateItem(index: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  function handleImageSelect(index: number, file: File | null) {
    if (!file) {
      updateItem(index, { imageDataUrl: undefined })
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      updateItem(index, { imageDataUrl: reader.result as string })
    }
    reader.readAsDataURL(file)
  }

  async function savePO() {
    setSaving('saving')
    try {
      const res = await fetch('/api/supplier-purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          poDate,
          supplierName,
          supplierAddress: [companyName, streetAddress, phone].filter(Boolean).join('\n'),
          preparedBy,
          preparedByRole,
          items: items.map(({ imageDataUrl, ...rest }) => rest), // strip client-only image before saving
          status: 'draft',
        }),
      })
      if (!res.ok) throw new Error('Save failed')
      const created = await res.json()
      setPoNumber(created.doc.poNumber)
      setSaving('saved')
    } catch {
      setSaving('error')
    }
  }

  const inputClass =
    'w-full px-3.5 py-2.5 border border-gray-300 rounded text-sm text-[#01172f] placeholder:text-gray-400 hover:border-[#01172f]/30 focus:outline-none focus:border-[#149911] focus:ring-1 focus:ring-[#149911]/25 transition-all duration-200'
  const labelClass = 'block text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-1.5'

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 bg-[#fdfffc]">
      {/* Print setup: page sizing + force background colors to print + scale down for one-page fit */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 8mm;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .po-print-doc {
            zoom: 0.8;
          }
        }
      `}</style>

      {/* ===== FORM (hidden when printing) ===== */}
      <div className="print:hidden">
        <div className="mb-8">
          <div className="w-8 h-[3px] bg-[#149911] mb-4" />
          <h1 className="text-2xl font-black uppercase tracking-tight text-[#01172f] mb-2">
            Supplier Purchase Order
          </h1>
          <p className="text-sm text-gray-500 max-w-[560px]">
            Fill in the details below. Save to auto-generate the PO number, then use Print / Save as
            PDF to send to the supplier.
          </p>
        </div>

        <p className="flex items-start gap-2.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-4 py-3 mb-8">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>
            Before printing: in the print dialog, open &quot;More settings&quot; and uncheck
            &quot;Headers and footers&quot; -- that removes the browser&apos;s own URL/date/page-number
            strip, which can&apos;t be controlled from the page itself.
          </span>
        </p>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div>
            <label className={labelClass}>PO Date</label>
            <input type="date" className={inputClass} value={poDate} onChange={(e) => setPoDate(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>PO #</label>
            <input className={`${inputClass} font-mono`} value={poNumber} onChange={(e) => setPoNumber(e.target.value)} placeholder="Auto-generated on save (YYYY-#########)" />
          </div>
          <div>
            <label className={labelClass}>Supplier Name</label>
            <input className={inputClass} value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="e.g. NORTHMETAL" />
          </div>
          <div>
            <label className={labelClass}>Company Name</label>
            <input className={inputClass} value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g. NORTHMETAL" />
          </div>
          <div>
            <label className={labelClass}>Street Address</label>
            <input className={inputClass} value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} placeholder="e.g. Caloocan" />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+639..." />
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-base font-black uppercase tracking-tight text-[#01172f]">Line Items</h2>
          <span className="text-xs font-mono text-gray-400">{items.length}</span>
        </div>
        <div className="flex flex-col gap-3 mb-2">
          {items.map((item, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-3 md:p-4 transition-shadow duration-300 hover:shadow-[0_8px_24px_-8px_rgba(1,23,47,0.1)] hover:border-gray-300"
            >
              <div className="grid grid-cols-2 md:grid-cols-[1fr_70px_90px_120px_120px_36px] gap-2 items-center">
                <input
                  className={`${inputClass} col-span-2 md:col-span-1`}
                  value={item.description}
                  onChange={(e) => updateItem(index, { description: e.target.value })}
                  placeholder="Description"
                />
                <input
                  type="text"
                  className={inputClass}
                  value={item.qty}
                  onChange={(e) => updateItem(index, { qty: Number(e.target.value) || 0 })}
                  placeholder="Qty"
                />
                <input
                  className={inputClass}
                  value={item.unit}
                  onChange={(e) => updateItem(index, { unit: e.target.value })}
                  placeholder="Unit"
                />
                <input
                  type="text"
                  className={inputClass}
                  value={item.unitPrice}
                  onChange={(e) => updateItem(index, { unitPrice: Number(e.target.value) || 0 })}
                  placeholder="Price"
                />
                <div className="text-sm text-right font-mono text-[#01172f] font-medium">{peso(item.qty * item.unitPrice)}</div>
                <button
                  onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                  disabled={items.length === 1}
                  className="col-span-2 md:col-span-1 text-gray-400 hover:text-red-600 disabled:opacity-0 disabled:pointer-events-none transition-colors text-lg justify-self-end md:justify-self-auto"
                  aria-label="Remove line item"
                >
                  &times;
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-gray-100">
                <label className="text-xs text-gray-500 flex items-center gap-2 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageSelect(index, e.target.files?.[0] ?? null)}
                  />
                  <span className="px-3 py-1.5 border border-dashed border-gray-300 rounded text-[#3D5F3B] hover:border-[#149911] hover:bg-[#149911]/[0.03] transition-all duration-200 whitespace-nowrap">
                    {item.imageDataUrl ? 'Change spec image' : '+ Add spec image (optional)'}
                  </span>
                </label>
                {item.imageDataUrl && (
                  <>
                    <img src={item.imageDataUrl} alt="" className="h-10 w-10 object-contain border border-gray-200 rounded flex-shrink-0" />
                    <button type="button" onClick={() => handleImageSelect(index, null)} className="text-xs text-red-600 hover:text-red-700">
                      Remove
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => setItems((prev) => [...prev, { description: '', qty: 1, unit: 'pcs', unitPrice: 0 }])}
          className="text-sm text-[#3D5F3B] border border-dashed border-gray-300 rounded px-4 py-2.5 mb-8 hover:border-[#149911] hover:bg-[#149911]/[0.03] transition-all duration-200"
        >
          + Add line item
        </button>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div>
            <label className={labelClass}>Prepared By (Name)</label>
            <input className={inputClass} value={preparedBy} onChange={(e) => setPreparedBy(e.target.value)} placeholder="e.g. Nira" />
          </div>
          <div>
            <label className={labelClass}>Prepared By (Role)</label>
            <input className={inputClass} value={preparedByRole} onChange={(e) => setPreparedByRole(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4 [&>button]:w-full sm:[&>button]:w-auto">
          <button
            onClick={savePO}
            disabled={saving === 'saving'}
            className={`px-8 py-3 rounded border-2 font-bold disabled:opacity-50 transition-all duration-300 hover:-translate-y-0.5 ${
              saving === 'saved'
                ? 'border-[#149911] text-[#149911]'
                : 'border-[#3D5F3B] text-[#3D5F3B] hover:shadow-[0_10px_30px_-10px_rgba(16,57,0,0.4)]'
            }`}
          >
            {saving === 'saving' ? 'Saving...' : saving === 'saved' ? 'Saved ✓' : 'Save PO'}
          </button>
          <button
            onClick={() => window.print()}
            className="px-8 py-3 rounded bg-[#3D5F3B] text-white font-bold hover:bg-[#01172f] hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-10px_rgba(1,23,47,0.4)] transition-all duration-300"
          >
            Print / Save as PDF
          </button>
        </div>
        {saving === 'error' && <p className="text-sm text-red-600 mb-8">Save failed -- check you&apos;re logged in.</p>}

        <hr className="my-12 border-gray-200" />
        <div className="flex items-center gap-3 mb-6">
          <span className="text-xs uppercase tracking-wide font-bold text-gray-400">Preview</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
      </div>

      {/* ===== FORMAL PURCHASE ORDER DOCUMENT -- untouched from the working, print-tested version ===== */}
      <div className="po-print-doc bg-white border border-gray-200 rounded p-5 md:p-10 print:border-0 print:p-0 print:rounded-none text-[#01172f] shadow-[0_20px_60px_-20px_rgba(1,23,47,0.15)] print:shadow-none">

        {/* Header: logo + company block, PO banner + PO#/date box */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 print:gap-3 mb-6 print:mb-3">
          <div className="flex gap-3 items-start">
            <div className="relative w-16 h-16 print:w-12 print:h-12 flex-shrink-0">
              <Image src="/branding/primegen-logo.jpg" alt="Primegen Trading Corporation" fill className="object-contain" />
            </div>
            <div>
              <h2 className="text-lg print:text-base font-bold leading-tight text-[#3D5F3B]">PRIMEGEN</h2>
              <p className="text-[10px] font-semibold tracking-widest text-gray-600">TRADING CORPORATION</p>
               <p className="text-[9px] text-gray-500 leading-snug max-w-[220px]">
                SOUTHERN CITY HOMES, YG BUILDING, CEBU ST, 4 TANZANG LUMA, IMUS, 4103 CAVITE,
                PHILIPPINES
              </p>
              <p className="text-[9px] text-gray-500">
                0917-185-9127 / 0917-133-9515 / 046-8860853
              </p>
              <p className="text-[9px] text-gray-500">SALES@PRIMEGENTRADINGCORP.COM</p>
            </div>
          </div>

          <div className="text-left sm:text-right w-full sm:w-auto">
            <span className="inline-block bg-[#3D5F3B] text-white text-sm print:text-xs font-bold tracking-wide px-4 print:px-3 py-1.5 print:py-1 mb-3 print:mb-2">
              PURCHASE ORDER
            </span>
            <table className="text-sm print:text-xs ml-0 sm:ml-auto mt-2 sm:mt-0">
              <tbody>
                <tr>
                  <td className="px-2 py-0.5 font-bold text-right">PO#:</td>
                  <td className="px-2 py-0.5 font-mono">{poNumber || '________'}</td>
                </tr>
                <tr>
                  <td className="px-2 py-0.5 font-bold text-right">DATE:</td>
                  <td className="px-2 py-0.5">{formatDisplayDate(poDate)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Supplier block */}
        <div className="mb-6 print:mb-3">
          <div className="w-16 h-2 bg-[#3D5F3B] mb-2 print:mb-1" />
          <div className="text-sm print:text-xs flex flex-col gap-0.5">
            <p>NAME: {supplierName || '________'}</p>
            <p>COMPANY NAME: {companyName || '________'}</p>
            <p>STREET ADDRESS: {streetAddress || '________'}</p>
            <p>PHONE: {phone || '________'}</p>
          </div>
        </div>

        {/* Line items table -- Description first, no VAT */}
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-sm print:text-xs mb-2 border-collapse min-w-[600px] md:min-w-full print:min-w-0">
            <thead>
              <tr className="bg-[#3D5F3B] text-white text-xs uppercase tracking-wide">
                <th className="py-3.5 print:py-1.5 px-4 print:px-2 text-left">Description</th>
                <th className="py-3.5 print:py-1.5 px-4 print:px-2 text-right w-[70px]">Qty.</th>
                <th className="py-3.5 print:py-1.5 px-4 print:px-2 text-right w-[120px]">Price</th>
                <th className="py-3.5 print:py-1.5 px-4 print:px-2 text-right w-[120px]">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
                  <td className="py-3.5 print:py-1.5 px-4 print:px-2 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <span>{item.description || '--'}</span>
                      {item.imageDataUrl && (
                        <img src={item.imageDataUrl} alt="" className="h-16 print:h-8 w-auto object-contain flex-shrink-0" />
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 print:py-1.5 px-4 print:px-2 border-b border-gray-100 text-right">{item.qty}</td>
                  <td className="py-3.5 print:py-1.5 px-4 print:px-2 border-b border-gray-100 text-right font-mono">₱{peso(item.unitPrice)}</td>
                  <td className="py-3.5 print:py-1.5 px-4 print:px-2 border-b border-gray-100 text-right font-mono">₱{peso(item.qty * item.unitPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals -- Subtotal + Total only, no VAT */}
        <div className="flex justify-end mt-10 mb-10">
          <table className="text-sm print:text-xs w-full max-w-[280px]">
            <tbody>
              <tr>
                <td className="py-2.5 print:py-1 px-4 print:px-2 bg-[#e8f0e5]">SUBTOTAL</td>
                <td className="py-2.5 print:py-1 px-4 print:px-2 bg-[#e8f0e5] text-right font-mono">₱{peso(subtotal)}</td>
              </tr>
              <tr className="border-t-2 border-[#3D5F3B]">
                <td className="py-3.5 print:py-1.5 px-4 print:px-2 font-bold text-base print:text-sm bg-[#e8f0e5]">TOTAL</td>
                <td className="py-3.5 print:py-1.5 px-4 print:px-2 font-bold text-base print:text-sm text-right font-mono bg-[#e8f0e5]">₱{peso(total)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Terms and Condition */}
        <div className="mt-10 mb-10 print:mb-4 text-[11px] print:text-[9px] leading-relaxed print:leading-snug print:break-inside-avoid">
          <div className="bg-[#3D5F3B] text-white text-xs print:text-[10px] font-bold uppercase tracking-wide px-3 py-1.5 print:py-1 mb-3 print:mb-2">
            Terms and Condition
          </div>
          <ol className="list-decimal pl-4 flex flex-col gap-1.5 print:gap-0.5 text-gray-700">
            {TERMS.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ol>
        </div>

        {/* Prepared By */}
        <div className="text-sm print:text-xs print:break-inside-avoid mt-10 ">
          <p className="font-bold mb-8 print:mb-4">PREPARED BY:</p>
          <div className="border-t border-black w-[220px] mb-1" />
          <p className="font-bold">{preparedBy || '________'}</p>
          <p className="text-gray-600 text-xs print:text-[10px] uppercase tracking-wide">{preparedByRole}</p>
        </div>
      </div>
    </div>
  )
}
