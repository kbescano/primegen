'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'

type LineItem = {
  qty: number
  unit: string
  description: string
  unitPrice: number
  imageDataUrl?: string
}

export type QuotationInitial = {
  customerName?: string
  company?: string
  address?: string
  contactNumber?: string
  items?: LineItem[]
}

const peso = (n: number) =>
  n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const TERMS = [
  'All prices are quoted in Peso and are Inclusive of VAT, delivery charges, and other applicable taxes, unless otherwise specified. Prices are based on current material costs and may be adjusted due to market fluctuations.',
  'This quotation is valid for 7 days from the date of issue. Prices and availability are subject to change without prior notice after this period.',
  'Full Payment before Delivery; Delivery will be arranged upon confirmation of full payment.',
  'Delivery timelines are estimates and depend on product availability and logistics. We shall not be held liable for delays due to causes beyond our control, including but not limited to supplier delays, transportation issues, or force majeure events.',
  'Ownership of materials shall remain with Primegen Trading Corp. until full payment is received. Risk passes to the buyer upon delivery or collection.',
  'Cancellations must be made in writing within 1 day of order placement. Returns are subject to approval and may incur restocking fees. Custom or special-order items are non-returnable.',
  "Materials supplied are covered by manufacturer's warranty only, subject to their terms and conditions. No additional warranties are expressed or implied unless agreed upon in writing.",
  'Proceeding with this quotation constitutes acceptance of these terms and conditions in full.',
  'Refund Processing. Approved refunds (if any) will be processed within 7–14 working days via the original mode of payment.',
]

export default function QuotationGenerator({ initial }: { initial?: QuotationInitial }) {
  const [quotationNumber, setQuotationNumber] = useState('')
  const [quotationDate, setQuotationDate] = useState(new Date().toISOString().slice(0, 10))
  const [customerName, setCustomerName] = useState(initial?.customerName ?? '')
  const [company, setCompany] = useState(initial?.company ?? '')
  const [address, setAddress] = useState(initial?.address ?? '')
  const [contactNumber, setContactNumber] = useState(initial?.contactNumber ?? '')
  const [items, setItems] = useState<LineItem[]>(
    initial?.items && initial.items.length > 0
      ? initial.items
      : [{ qty: 1, unit: 'pcs', description: '', unitPrice: 0 }]
  )
  const [vatRate, setVatRate] = useState(12)
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0), [items])
  const vat = useMemo(() => subtotal * (vatRate / 100), [subtotal, vatRate])
  const total = subtotal + vat

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

  async function saveQuotation() {
    setSaving('saving')
    try {
      const res = await fetch('/api/client-quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          quotationDate,
          customerName,
          company,
          address,
          contactNumber,
          items: items.map(({ imageDataUrl, ...rest }) => rest),
          vatRate,
          status: 'draft',
        }),
      })
      if (!res.ok) throw new Error('Save failed')
      const created = await res.json()
      setQuotationNumber(created.doc.quotationNumber)
      setSaving('saved')
    } catch {
      setSaving('error')
    }
  }

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#149911]'
  const labelClass = 'block text-xs font-bold uppercase tracking-wide text-gray-600 mb-1'

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 bg-[#fdfffc]">
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
        <h1 className="text-2xl font-bold mb-1 text-[#01172f]">Client Quotation Generator</h1>
        <p className="text-sm text-gray-500 mb-8">
          Fill in the details below. Save to auto-generate the quotation number, then use Print /
          Save as PDF to send to the client.
        </p>
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 mb-8">
          Before printing: in the print dialog, open &quot;More settings&quot; and uncheck
          &quot;Headers and footers&quot; -- that removes the browser&apos;s own URL/date/page-number
          strip, which can&apos;t be controlled from the page itself.
        </p>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
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
              className={inputClass}
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
        </div>

        <h2 className="text-lg font-bold mb-3 text-[#01172f]">Line Items</h2>
        <div className="flex flex-col gap-3 mb-2">
          {items.map((item, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3 md:p-4">
              <div className="grid grid-cols-2 md:grid-cols-[70px_90px_1fr_120px_120px_36px] gap-2 items-center">
                <input
                  type="text"
                  min={0}
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
                  min={0}
                  step="0.01"
                  className={inputClass}
                  value={item.unitPrice}
                  onChange={(e) => updateItem(index, { unitPrice: Number(e.target.value) || 0 })}
                  placeholder="Unit price"
                />
                <div className="text-sm text-right font-mono">
                  {peso(item.qty * item.unitPrice)}
                </div>
                <button
                  onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                  disabled={items.length === 1}
                  className="col-span-2 md:col-span-1 text-red-600 disabled:opacity-30 text-lg justify-self-end md:justify-self-auto"
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
                  <span className="px-3 py-1.5 border border-dashed border-gray-300 rounded text-[#103900] whitespace-nowrap">
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
                      className="text-xs text-red-600"
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
          className="text-sm text-[#103900] border border-dashed border-gray-300 rounded px-4 py-2 mb-6"
        >
          + Add line item
        </button>

        <div className="mb-6 max-w-[200px]">
          <label className={labelClass}>VAT Rate (%)</label>
          <input
            type="text"
            min={0}
            className={inputClass}
            value={vatRate}
            onChange={(e) => setVatRate(Number(e.target.value) || 0)}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4 [&>button]:w-full sm:[&>button]:w-auto">
          <button
            onClick={saveQuotation}
            disabled={saving === 'saving'}
            className={`px-8 py-3 rounded border-2 font-bold disabled:opacity-50 transition-colors ${
              saving === 'saved'
                ? 'border-[#149911] text-[#149911]'
                : 'border-[#103900] text-[#103900]'
            }`}
          >
            {saving === 'saving' ? 'Saving...' : saving === 'saved' ? 'Saved ✓' : 'Save Quotation'}
          </button>
          <button
            onClick={() => window.print()}
            className="px-8 py-3 rounded bg-[#103900] text-white font-bold hover:bg-[#01172f] transition-colors"
          >
            Print / Save as PDF
          </button>
        </div>
        {saving === 'error' && (
          <p className="text-sm text-red-600 mb-8">Save failed -- check you&apos;re logged in.</p>
        )}

        <hr className="my-12" />
        <p className="text-xs uppercase tracking-wide font-bold text-gray-400 mb-6">Preview</p>
      </div>

      {/* ===== FORMAL QUOTATION DOCUMENT -- True WYSIWYG Print Preview ===== */}
      <div className="w-full overflow-x-auto pb-4">
        <div className="quotation-print-doc bg-white border border-gray-200 rounded p-8 print:border-0 print:p-0 print:rounded-none text-[#01172f] min-w-[794px]">
          {/* Header: logo + company block, title + date/number */}
          <div className="flex flex-row justify-between items-start gap-3 mb-4">
            <div className="flex gap-3 items-start">
              <div className="relative w-12 h-12 flex-shrink-0">
                <Image
                  src="/branding/primegen-logo.jpg"
                  alt="Primegen Trading Corporation"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h2 className="text-base font-bold leading-tight text-[#103900]">PRIMEGEN</h2>
                <p className="text-[10px] font-semibold tracking-widest text-gray-600 mb-1">
                  TRADING CORPORATION
                </p>
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

            <div className="text-right w-auto">
              <h3 className="text-xl font-bold text-[#103900] mb-1">
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
            <div className="bg-[#103900] text-white text-xs font-bold uppercase tracking-wide px-3 py-1">
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
                <tr className="bg-[#103900] text-white text-xs uppercase tracking-wide">
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

          {/* Totals */}
          <div className="flex justify-end mt-10 mb-4">
            <table className="text-xs w-full max-w-[280px]">
              <tbody>
                <tr>
                  <td className="py-1 px-2 bg-[#e8f0e5]">Subtotal</td>
                  <td className="py-1 px-2 bg-[#e8f0e5] text-right font-mono">{peso(subtotal)}</td>
                </tr>
                <tr>
                  <td className="py-1 px-2">VAT</td>
                  <td className="py-1 px-2 text-right font-mono">{peso(vat)}</td>
                </tr>
                <tr className="border-t-2 border-[#103900]">
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
                {TERMS.map((t, i) => (
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