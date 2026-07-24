'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import ClientPickerModal from '@/components/ClientPickerModal'

type LineItem = {
  qty: number
  unit: string
  description: string
  unitPrice: number
  imageDataUrl?: string
}

export type QuotationInitial = {
  id?: string | number
  quotationNumber?: string
  quotationDate?: string
  customerName?: string
  company?: string
  address?: string
  contactNumber?: string
  salesPerson?: string
  vatRate?: number
  discountAmount?: number
  deliveryFee?: number
  sourceRequestId?: string
  items?: LineItem[]
}

const peso = (n: number) =>
  n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const BASE_TERMS = [
  '', // dynamic -- filled in at render time based on the VAT checkbox
  'This quotation is valid for 7 days from the date of issue. Prices and availability are subject to change without prior notice after this period.',
  'Full Payment before Delivery; Delivery will be arranged upon confirmation of full payment.',
  'Delivery timelines are estimates and depend on product availability and logistics. We shall not be held liable for delays due to causes beyond our control, including but not limited to supplier delays, transportation issues, or force majeure events.',
  'Ownership of products shall remain with Primegen Trading Corp. until full payment is received. Risk passes to the buyer upon delivery or collection.',
  'Cancellations must be made in writing within 1 day of order placement. Returns are subject to approval and may incur restocking fees. Custom or special-order items are non-returnable.',
  "Products supplied are covered by manufacturer's warranty only, subject to their terms and conditions. No additional warranties are expressed or implied unless agreed upon in writing.",
  'Proceeding with this quotation constitutes acceptance of these terms and conditions in full.',
  'Refund Processing. Approved refunds (if any) will be processed within 7–14 working days via the original mode of payment.',
]

export default function QuotationGenerator({
  initial,
  showBackToList = false,
  showClientPicker = false,
}: {
  initial?: QuotationInitial
  showBackToList?: boolean
  showClientPicker?: boolean
}) {
  const [quotationNumber, setQuotationNumber] = useState(initial?.quotationNumber ?? '')
  const [quotationDate, setQuotationDate] = useState(initial?.quotationDate ?? new Date().toISOString().slice(0, 10))
  const [customerName, setCustomerName] = useState(initial?.customerName ?? '')
  const [company, setCompany] = useState(initial?.company ?? '')
  const [address, setAddress] = useState(initial?.address ?? '')
  const [contactNumber, setContactNumber] = useState(initial?.contactNumber ?? '')
  const [salesPerson, setSalesPerson] = useState(initial?.salesPerson ?? '')
  const [items, setItems] = useState<LineItem[]>(
    initial?.items && initial.items.length > 0
      ? initial.items
      : [{ qty: 1, unit: 'pcs', description: '', unitPrice: 0 }]
  )
  const [hasVat, setHasVat] = useState((initial?.vatRate ?? 12) > 0)
  const [vatRate, setVatRate] = useState(initial?.vatRate && initial.vatRate > 0 ? initial.vatRate : 12)
  const [discountAmount, setDiscountAmount] = useState(initial?.discountAmount ?? 0) // flat peso amount, not a percentage
  const [deliveryFee, setDeliveryFee] = useState(initial?.deliveryFee ?? 0)
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [saveErrorDetail, setSaveErrorDetail] = useState('')
  const [pickerOpen, setPickerOpen] = useState(showClientPicker)
  const sourceRequestId = initial?.sourceRequestId // set once at creation time, never user-editable

  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0), [items])
  const hasDiscount = discountAmount > 0
  const hasDeliveryFee = deliveryFee > 0
  // Order: Subtotal -> less Discount -> plus Delivery Fee -> VAT applied to that combined figure -> Total
  const netAfterDiscount = subtotal - discountAmount
  const netWithDelivery = netAfterDiscount + deliveryFee
  const vat = useMemo(() => (hasVat ? netWithDelivery * (vatRate / 100) : 0), [netWithDelivery, vatRate, hasVat])
  const total = netWithDelivery + vat

  const terms = useMemo(() => {
    const copy = [...BASE_TERMS]
    copy[0] = `All prices are quoted in Peso and are ${
      hasVat ? 'Inclusive' : 'Exclusive'
    } of VAT, delivery charges, and other applicable taxes, unless otherwise specified. Prices are based on current material costs and may be adjusted due to market fluctuations.`
    return copy
  }, [hasVat])

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

  const isEditing = Boolean(initial?.id)

  function handleSelectClient(c: { name: string; company?: string; address?: string; phone?: string }) {
    setCustomerName(c.name)
    setCompany(c.company ?? '')
    setAddress(c.address ?? '')
    setContactNumber(c.phone ?? '')
    setPickerOpen(false)
  }

  async function upsertClientRecord() {
    if (!customerName) return
    try {
      const findRes = await fetch(
        `/api/clients?where[name][equals]=${encodeURIComponent(customerName)}&limit=1`,
        { credentials: 'include' }
      )
      const findData = await findRes.json()
      const existing = findData?.docs?.[0]
      const clientPayload = {
        name: customerName,
        company,
        address,
        phone: contactNumber,
        status: 'active',
      }
      if (existing) {
        await fetch(`/api/clients/${existing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(clientPayload),
        })
      } else {
        await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(clientPayload),
        })
      }
    } catch {
      // non-critical -- never block the quotation save flow if this fails
    }
  }

  async function saveQuotation() {
    setSaving('saving')
    try {
      const url = isEditing ? `/api/client-quotations/${initial?.id}` : '/api/client-quotations'
      const method = isEditing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          quotationDate,
          customerName,
          company,
          address,
          contactNumber,
          salesPerson,
          items: items.map(({ imageDataUrl, ...rest }) => rest),
          vatRate: hasVat ? vatRate : 0,
          discountAmount,
          deliveryFee,
          sourceRequestId,
          status: 'draft',
        }),
      })
      if (!res.ok) {
        let detail = `HTTP ${res.status}`
        try {
          const errBody = await res.json()
          detail = errBody?.errors?.[0]?.message || errBody?.message || detail
        } catch {}
        throw new Error(detail)
      }
      const saved = await res.json()
      setQuotationNumber(saved.doc.quotationNumber)
      await upsertClientRecord()
      setSaving('saved')
    } catch (err: any) {
      setSaving('error')
      setSaveErrorDetail(err?.message || 'Unknown error')
    }
  }

  const inputClass =
    'w-full px-3.5 py-2.5 border border-gray-300 rounded text-sm text-[#01172f] placeholder:text-gray-400 hover:border-[#01172f]/30 focus:outline-none focus:border-[#149911] focus:ring-1 focus:ring-[#149911]/25 transition-all duration-200'
  const labelClass = 'block text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-1.5'

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 bg-[#fdfffc]">
      {pickerOpen && (
        <ClientPickerModal onSelect={handleSelectClient} onSkip={() => setPickerOpen(false)} />
      )}
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
    .quotation-print-doc {
      zoom: 0.8;
    }
  }
      `}</style>

      {/* ===== FORM (hidden when printing) ===== */}
      <div className="print:hidden">
        <div className="mb-8">
          {showBackToList && (
            <Link
              href="/admin-dashboard/client-quotation"
              className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.1em] text-[#01172f]/50 hover:text-[#149911] transition-colors mb-4"
            >
              &larr; Back to Client Quotations
            </Link>
          )}
          <div className="w-8 h-[3px] bg-[#149911] mb-4" />
          <h1 className="text-2xl font-black uppercase tracking-tight text-[#01172f] mb-2">
            {isEditing ? 'Edit Client Quotation' : 'Client Quotation Generator'}
          </h1>
          <p className="text-sm text-gray-500 max-w-[560px]">
            Fill in the details below. Save to auto-generate the quotation number, then use Print /
            Save as PDF to send to the client.
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
            <label className={labelClass}>Quotation Date</label>
            <input
              type="date"
              className={inputClass}
              value={quotationDate}
              onChange={(e) => setQuotationDate(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Quotation #</label>
            <input
              className={`${inputClass} font-mono`}
              value={quotationNumber}
              onChange={(e) => setQuotationNumber(e.target.value)}
              placeholder="Auto-generated on save (YYYY-#####)"
            />
          </div>
          <div>
            <label className={labelClass}>Customer Name</label>
            <input
              className={inputClass}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Melai / Melanie"
            />
          </div>
          <div>
            <label className={labelClass}>Company</label>
            <input
              className={inputClass}
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Client's company"
            />
          </div>
          <div>
            <label className={labelClass}>Address</label>
            <input
              className={inputClass}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Caloocan City"
            />
          </div>
          <div>
            <label className={labelClass}>Contact Number</label>
            <input
              className={inputClass}
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              placeholder="+639..."
            />
          </div>
          <div>
            <label className={labelClass}>Sales Person</label>
            <input
              className={inputClass}
              value={salesPerson}
              onChange={(e) => setSalesPerson(e.target.value)}
              placeholder="e.g. Nira"
            />
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
              <div className="grid grid-cols-2 md:grid-cols-[70px_90px_1fr_120px_120px_36px] gap-2 items-center">
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
                  className={`${inputClass} col-span-2 md:col-span-1`}
                  value={item.description}
                  onChange={(e) => updateItem(index, { description: e.target.value })}
                  placeholder="Description"
                />
                <input
                  type="text"
                  className={inputClass}
                  value={item.unitPrice}
                  onChange={(e) => updateItem(index, { unitPrice: Number(e.target.value) || 0 })}
                  placeholder="Unit price"
                />
                <div className="text-sm text-right font-mono text-[#01172f] font-medium">
                  {peso(item.qty * item.unitPrice)}
                </div>
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
                    <img
                      src={item.imageDataUrl}
                      alt=""
                      className="h-10 w-10 object-contain border border-gray-200 rounded flex-shrink-0"
                    />
                    <button
                      type="button"
                      onClick={() => handleImageSelect(index, null)}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() =>
            setItems((prev) => [...prev, { qty: 1, unit: 'pcs', description: '', unitPrice: 0 }])
          }
          className="text-sm text-[#3D5F3B] border border-dashed border-gray-300 rounded px-4 py-2.5 mb-8 hover:border-[#149911] hover:bg-[#149911]/[0.03] transition-all duration-200"
        >
          + Add line item
        </button>

        {/* Discount + Delivery Fee + VAT controls */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8 max-w-[660px]">
          <div>
            <label className={labelClass}>Discount (₱)</label>
            <input
              type="text"
              className={inputClass}
              value={discountAmount}
              onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className={labelClass}>Delivery Fee (₱)</label>
            <input
              type="text"
              className={inputClass}
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(Number(e.target.value) || 0)}
              placeholder="0.00"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wide text-gray-500">VAT Rate (%)</label>
              <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasVat}
                  onChange={(e) => setHasVat(e.target.checked)}
                  className="w-3.5 h-3.5 accent-[#149911] cursor-pointer"
                />
                Apply
              </label>
            </div>
            <input
              type="text"
              className={`${inputClass} ${!hasVat ? 'opacity-40 pointer-events-none' : ''}`}
              value={vatRate}
              onChange={(e) => setVatRate(Number(e.target.value) || 0)}
              disabled={!hasVat}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4 [&>button]:w-full sm:[&>button]:w-auto">
          <button
            onClick={saveQuotation}
            disabled={saving === 'saving'}
            className={`px-8 py-3 rounded border-2 font-bold disabled:opacity-50 transition-all duration-300 hover:-translate-y-0.5 ${
              saving === 'saved'
                ? 'border-[#149911] text-[#149911]'
                : 'border-[#3D5F3B] text-[#3D5F3B] hover:shadow-[0_10px_30px_-10px_rgba(16,57,0,0.4)]'
            }`}
          >
            {saving === 'saving' ? 'Saving...' : saving === 'saved' ? 'Saved ✓' : isEditing ? 'Update Quotation' : 'Save Quotation'}
          </button>
          <button
            onClick={() => window.print()}
            className="px-8 py-3 rounded bg-[#3D5F3B] text-white font-bold hover:bg-[#01172f] hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-10px_rgba(1,23,47,0.4)] transition-all duration-300"
          >
            Print / Save as PDF
          </button>
        </div>
        {saving === 'error' && (
          <p className="text-sm text-red-600 mb-8">
            Save failed: {saveErrorDetail || "please check you're logged in and try again."}
          </p>
        )}

        <hr className="my-12 border-gray-200" />
        <div className="flex items-center gap-3 mb-6">
          <span className="text-xs uppercase tracking-wide font-bold text-gray-400">Preview</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
      </div>

      {/* ===== FORMAL QUOTATION DOCUMENT -- True WYSIWYG Print Preview ===== */}
      <div className="w-full overflow-x-auto pb-4">
        <div className="quotation-print-doc bg-white border border-gray-200 rounded p-8 print:border-0 print:p-0 print:rounded-none text-[#01172f] min-w-[794px] shadow-[0_20px_60px_-20px_rgba(1,23,47,0.15)] print:shadow-none">
          {/* Header: logo + company block, title + date/number */}
          <div className="flex flex-row justify-between items-start gap-3 mb-4">
            <div className="flex gap-1.5 items-center">
              <div className="relative w-44 h-44 flex-shrink-0 overflow-hidden">
                <Image
                  src="/branding/primegen_trading_logo.png"
                  alt="Primegen Trading Corporation"
                  fill
                  className="object-contain scale-[1.1]"
                />
              </div>
              <div>
                <h2 className="text-xl font-black leading-none text-[#103900] tracking-tight">PRIMEGEN</h2>
                <p className="text-[11px] font-bold tracking-[0.2em] text-[#01172f] mt-0 mb-1.5">
                  TRADING CORPORATION
                </p>
                <div className="w-full max-w-[240px] h-[2px] bg-[#149911] mb-1.5" />
                <p className="text-[9px] font-bold text-[#103900] leading-snug max-w-[240px] m-0">
                  SOUTHERN CITY HOMES, YG BUILDING, CEBU ST, 4 TANZANG LUMA, IMUS, 4103 CAVITE,
                  PHILIPPINES
                </p>
                <p className="text-[9px] font-bold text-[#103900] m-0 mt-1">
                  0917-185-9127 / 0917-133-9515 / 046-8860853
                </p>
                <p className="text-[9px] font-bold text-[#103900] m-0 mt-1">SALES@PRIMEGENTRADINGCORP.COM</p>
              </div>
            </div>

            <div className="text-right w-auto">
              <h3 className="text-xl font-bold text-[#3D5F3B] mb-1">
                FORMAL QUOTATION
              </h3>
              <table className="text-xs ml-auto mt-0">
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-2 py-0.5 font-bold bg-gray-50">DATE</td>
                    <td className="border border-gray-300 px-3 py-0.5">{quotationDate || '________'}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-2 py-0.5 font-bold bg-gray-50">
                      QUOTATION #
                    </td>
                    <td className="border border-gray-300 px-3 py-0.5 font-mono">
                      {quotationNumber || '________'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Customer block */}
          <div className="mb-3">
            <div className="bg-[#3D5F3B] text-white text-xs font-bold uppercase tracking-wide px-3 py-1">
              Customer
            </div>
            <div className="text-xs py-1 flex flex-col gap-0.5">
              <p>
                <span className="font-bold">Name: </span>
                {customerName || '________'}
              </p>
              <p>
                <span className="font-bold">Company: </span>
                {company || '________'}
              </p>
              <p>
                <span className="font-bold">Address: </span>
                {address || '________'}
              </p>
              <p>
                <span className="font-bold">Contact Number: </span>
                {contactNumber || '________'}
              </p>
            </div>
          </div>

          {/* Line items table */}
          <div>
            <table className="w-full text-xs mb-2 border-collapse">
              <thead>
                <tr className="bg-[#3D5F3B] text-white text-xs uppercase tracking-wide">
                  <th className="py-1.5 px-2 text-left w-[70px]">Qty</th>
                  <th className="py-1.5 px-2 text-left w-[90px]">Unit</th>
                  <th className="py-1.5 px-2 text-left">Description</th>
                  <th className="py-1.5 px-2 text-right w-[120px]">Unit Price</th>
                  <th className="py-1.5 px-2 text-right w-[120px]">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
                    <td className="py-1.5 px-2 border-b border-gray-100">{item.qty}</td>
                    <td className="py-1.5 px-2 border-b border-gray-100">{item.unit}</td>
                    <td className="py-1.5 px-2 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <span>{item.description || '--'}</span>
                        {item.imageDataUrl && (
                          <img
                            src={item.imageDataUrl}
                            alt=""
                            className="h-8 w-auto object-contain flex-shrink-0"
                          />
                        )}
                      </div>
                    </td>
                    <td className="py-1.5 px-2 border-b border-gray-100 text-right font-mono">
                      {peso(item.unitPrice)}
                    </td>
                    <td className="py-1.5 px-2 border-b border-gray-100 text-right font-mono">
                      {peso(item.qty * item.unitPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals -- Discount, Delivery Fee, and VAT rows are conditional */}
          <div className="flex justify-end mt-10 mb-4">
            <table className="text-xs w-full max-w-[280px]">
              <tbody>
                <tr>
                  <td className="py-1 px-2 bg-[#e8f0e5]">Subtotal</td>
                  <td className="py-1 px-2 bg-[#e8f0e5] text-right font-mono">{peso(subtotal)}</td>
                </tr>
                {hasDiscount && (
                  <tr>
                    <td className="py-1 px-2">Discount</td>
                    <td className="py-1 px-2 text-right font-mono">-{peso(discountAmount)}</td>
                  </tr>
                )}
                {hasDeliveryFee && (
                  <tr>
                    <td className="py-1 px-2">Delivery Fee</td>
                    <td className="py-1 px-2 text-right font-mono">{peso(deliveryFee)}</td>
                  </tr>
                )}
                {hasVat && (
                  <tr>
                    <td className="py-1 px-2">VAT ({vatRate}%)</td>
                    <td className="py-1 px-2 text-right font-mono">{peso(vat)}</td>
                  </tr>
                )}
                <tr className="border-t-2 border-[#3D5F3B]">
                  <td className="py-1.5 px-2 font-bold text-sm bg-[#e8f0e5]">TOTAL</td>
                  <td className="py-1.5 px-2 font-bold text-sm text-right font-mono bg-[#e8f0e5]">
                    ₱{peso(total)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Terms & signature */}
          <div className="grid grid-cols-[1fr_260px] gap-4 mt-10 mb-2 text-[9px] leading-snug break-inside-avoid">
            <div>
              <p className="font-bold text-[10px] uppercase tracking-wide mb-1">Terms &amp; Condition</p>
              <ol className="list-decimal pl-4 flex flex-col gap-0.5 text-gray-700">
                {terms.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ol>
            </div>
            <div>
              <p className="font-bold text-[10px] uppercase tracking-wide mb-4">Customer Conforme:</p>
              <div className="border-t border-black w-full mb-2" />
              <p className="text-gray-600">
                This is to certify that all details in this quotation are correct (name, address,
                items, specifications, quantity, price)
              </p>
            </div>
          </div>

          {/* Bank details */}
          <div className="border-t border-black pt-1 break-inside-avoid mt-10">
            <p className="text-center font-bold text-[10px] uppercase tracking-wide mb-2">
              Bank Transfer Details
            </p>
            <div className="grid grid-cols-4 gap-3 gap-x-4 text-[8px]">
              <div>
                <p className="font-bold">BANK:</p>
                <p>ASIA UNITED BANK</p>
                <p className="mt-0.5">ACCOUNT NAME:</p>
                <p>PRIMEGEN TRADING CORPORATION</p>
                <p className="mt-0.5">ACCOUNT NUMBER:</p>
                <p>102-01-000648-3</p>
              </div>
              <div>
                <p className="font-bold">G-CASH / MAYA</p>
                <p className="mt-0.5">LEAH R. SAYNES</p>
                <p>09617812908</p>
              </div>
              <div>
                <p className="font-bold">PNB</p>
                <p className="mt-0.5">MICHAEL P. SAYNES</p>
                <p>50110044450</p>
              </div>
              <div>
                <p className="font-bold">BANCO DE ORO (SM AURA BRANCH)</p>
                <p className="mt-0.5">MICHAEL P. SAYNES</p>
                <p>008010019955</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
