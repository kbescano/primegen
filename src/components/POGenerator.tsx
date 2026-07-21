'use client'

import { useMemo, useState } from 'react'

type LineItem = {
  description: string
  qty: number
  uom: string
  unitPrice: number
}

export type POInitial = {
  partyName?: string
  project?: string
  items?: LineItem[]
}

type POGeneratorProps = {
  title: string
  partyLabel: string // "Client" or "Supplier"
  apiPath: string // e.g. /api/supplier-purchase-orders
  partyFieldPrefix: 'client' | 'supplier'
  numberPlaceholder: string
  initial?: POInitial
}

const DEFAULT_TERMS = {
  delivery: 'Standard site access. Coordinate delivery schedule with the site engineer at least 24 hours in advance.',
  warranty: 'All goods must be brand new, free from defects, and conform to agreed specifications and industry standards.',
  rejection: 'All goods/services are subject to inspection upon delivery. Items found damaged, defective, or non-conforming to specifications may be rejected and must be replaced at the supplier\'s expense within 7 days.',
  compliance: 'Supplier personnel must adhere to all site health and safety regulations while on premises, including required PPE.',
}

const peso = (n: number) =>
  n.toLocaleString('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 })

export default function POGenerator({ title, partyLabel, apiPath, partyFieldPrefix, numberPlaceholder, initial }: POGeneratorProps) {
  const [meta, setMeta] = useState({
    poNumber: '',
    poDate: new Date().toISOString().slice(0, 10),
    project: initial?.project ?? '',
    deliveryDate: '',
    companyName: 'Primegen Trading Corporation',
    partyName: initial?.partyName ?? '',
    partyAddress: '',
  })
  const [items, setItems] = useState<LineItem[]>(
    initial?.items && initial.items.length > 0 ? initial.items : [{ description: '', qty: 1, uom: 'pcs', unitPrice: 0 }]
  )
  const [vatRate, setVatRate] = useState(12)
  const [paymentTerms, setPaymentTerms] = useState('Net 30')
  const [terms, setTerms] = useState(DEFAULT_TERMS)
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0), [items])
  const vat = useMemo(() => subtotal * (vatRate / 100), [subtotal, vatRate])
  const total = subtotal + vat

  function updateItem(index: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  function updateMeta(key: keyof typeof meta, value: string) {
    setMeta((prev) => ({ ...prev, [key]: value }))
  }

  async function savePO() {
    setSaving('saving')
    try {
      const res = await fetch(apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          poDate: meta.poDate,
          project: meta.project,
          deliveryDate: meta.deliveryDate,
          [`${partyFieldPrefix}Name`]: meta.partyName,
          [`${partyFieldPrefix}Address`]: meta.partyAddress,
          items,
          vatRate,
          paymentTerms,
          terms,
          status: 'draft',
        }),
      })
      if (!res.ok) throw new Error('Save failed')
      const created = await res.json()
      updateMeta('poNumber', created.doc.poNumber)
      setSaving('saved')
    } catch {
      setSaving('error')
    }
  }

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#149911]'
  const labelClass = 'block text-xs font-bold uppercase tracking-wide text-gray-600 mb-1'

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 bg-[#fdfffc]">
      {/* ===== FORM (hidden when printing) ===== */}
      <div className="print:hidden">
        <h1 className="text-2xl font-bold mb-1 text-[#01172f]">{title}</h1>
        <p className="text-sm text-gray-500 mb-8">Fill in the details below. Save to auto-generate the PO number, then use Print / Save as PDF to produce the final document.</p>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className={labelClass}>PO Number</label>
            <input className={inputClass} value={meta.poNumber} onChange={(e) => updateMeta('poNumber', e.target.value)} placeholder={numberPlaceholder} />
          </div>
          <div>
            <label className={labelClass}>PO Date</label>
            <input type="date" className={inputClass} value={meta.poDate} onChange={(e) => updateMeta('poDate', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Project Name / Site</label>
            <input className={inputClass} value={meta.project} onChange={(e) => updateMeta('project', e.target.value)} placeholder="e.g. Warehouse Expansion -- Batangas Site" />
          </div>
          <div>
            <label className={labelClass}>Delivery / Service Date</label>
            <input className={inputClass} value={meta.deliveryDate} onChange={(e) => updateMeta('deliveryDate', e.target.value)} placeholder="e.g. On or before Aug 15, 2026" />
          </div>
          <div>
            <label className={labelClass}>{partyLabel} Name</label>
            <input className={inputClass} value={meta.partyName} onChange={(e) => updateMeta('partyName', e.target.value)} placeholder={`${partyLabel} company name`} />
          </div>
          <div>
            <label className={labelClass}>{partyLabel} Address</label>
            <input className={inputClass} value={meta.partyAddress} onChange={(e) => updateMeta('partyAddress', e.target.value)} placeholder={`${partyLabel} address`} />
          </div>
        </div>

        <h2 className="text-lg font-bold mb-3 text-[#01172f]">Line Items</h2>
        <div className="flex flex-col gap-2 mb-2">
          {items.map((item, index) => (
            <div key={index} className="grid md:grid-cols-[1fr_80px_90px_130px_130px_40px] grid-cols-2 gap-2 items-center border md:border-0 border-gray-200 rounded md:rounded-none p-3 md:p-0 [&>input:first-child]:col-span-2 md:[&>input:first-child]:col-span-1">
              <input className={inputClass} value={item.description} onChange={(e) => updateItem(index, { description: e.target.value })} placeholder="Item description" />
              <input type="number" min={0} className={inputClass} value={item.qty} onChange={(e) => updateItem(index, { qty: Number(e.target.value) || 0 })} placeholder="Qty" />
              <input className={inputClass} value={item.uom} onChange={(e) => updateItem(index, { uom: e.target.value })} placeholder="UOM" />
              <input type="number" min={0} step="0.01" className={inputClass} value={item.unitPrice} onChange={(e) => updateItem(index, { unitPrice: Number(e.target.value) || 0 })} placeholder="Unit price" />
              <div className="text-sm text-right font-mono">{peso(item.qty * item.unitPrice)}</div>
              <button
                onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                disabled={items.length === 1}
                className="text-red-600 disabled:opacity-30 text-lg"
                aria-label="Remove line item"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() => setItems((prev) => [...prev, { description: '', qty: 1, uom: 'pcs', unitPrice: 0 }])}
          className="text-sm text-[#3D5F3B] border border-dashed border-gray-300 rounded px-4 py-2 mb-6"
        >
          + Add line item
        </button>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className={labelClass}>VAT Rate (%)</label>
            <input type="number" min={0} className={inputClass} value={vatRate} onChange={(e) => setVatRate(Number(e.target.value) || 0)} />
          </div>
          <div>
            <label className={labelClass}>Payment Terms</label>
            <input className={inputClass} value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="e.g. Net 30, 50% down payment" />
          </div>
        </div>

        <h2 className="text-lg font-bold mb-3 text-[#01172f]">Terms &amp; Conditions</h2>
        <div className="grid gap-4 mb-8">
          <div>
            <label className={labelClass}>Delivery / Site Access Instructions</label>
            <textarea rows={2} className={inputClass} value={terms.delivery} onChange={(e) => setTerms((p) => ({ ...p, delivery: e.target.value }))} />
          </div>
          <div>
            <label className={labelClass}>Warranty / Quality Standards</label>
            <textarea rows={2} className={inputClass} value={terms.warranty} onChange={(e) => setTerms((p) => ({ ...p, warranty: e.target.value }))} />
          </div>
          <div>
            <label className={labelClass}>Rejection Clause</label>
            <textarea rows={3} className={inputClass} value={terms.rejection} onChange={(e) => setTerms((p) => ({ ...p, rejection: e.target.value }))} />
          </div>
          <div>
            <label className={labelClass}>Compliance</label>
            <textarea rows={2} className={inputClass} value={terms.compliance} onChange={(e) => setTerms((p) => ({ ...p, compliance: e.target.value }))} />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4 [&>button]:w-full sm:[&>button]:w-auto">
          <button
            onClick={savePO}
            disabled={saving === 'saving'}
            className={`px-8 py-3 rounded border-2 font-bold disabled:opacity-50 transition-colors ${
              saving === 'saved' ? 'border-[#149911] text-[#149911]' : 'border-[#3D5F3B] text-[#3D5F3B]'
            }`}
          >
            {saving === 'saving' ? 'Saving...' : saving === 'saved' ? 'Saved ✓' : 'Save PO'}
          </button>
          <button
            onClick={() => window.print()}
            className="px-8 py-3 rounded bg-[#3D5F3B] text-white font-bold hover:bg-[#01172f] transition-colors"
          >
            Print / Save as PDF
          </button>
        </div>
        {saving === 'error' && (
          <p className="text-sm text-red-600 mb-8">
            Save failed -- check you&apos;re logged in and the collection exists.
          </p>
        )}

        <hr className="my-12" />
        <p className="text-xs uppercase tracking-wide font-bold text-gray-400 mb-6">Preview</p>
      </div>

      {/* ===== FORMAL PO DOCUMENT ===== */}
      <div className="bg-white border border-gray-200 rounded p-5 md:p-10 print:border-0 print:p-0 print:rounded-none">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start mb-10">
          <div>
            <h2 className="text-xl font-bold text-[#01172f]">{meta.companyName}</h2>
            <p className="text-sm text-gray-500">Construction Materials &amp; Services Trading</p>
          </div>
          <div className="text-left sm:text-right">
            <h3 className="text-2xl font-bold tracking-wide text-[#01172f]">PURCHASE ORDER</h3>
            <p className="text-sm">PO No: <span className="font-mono font-bold">{meta.poNumber || '________'}</span></p>
            <p className="text-sm">Date: {meta.poDate || '________'}</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 sm:gap-8 mb-8 text-sm">
          <div>
            <p className="font-bold uppercase text-xs tracking-wide text-gray-500 mb-1">{partyLabel}</p>
            <p className="font-bold">{meta.partyName || '________'}</p>
            <p className="whitespace-pre-line">{meta.partyAddress}</p>
          </div>
          <div>
            <p className="font-bold uppercase text-xs tracking-wide text-gray-500 mb-1">Project / Site</p>
            <p>{meta.project || '________'}</p>
            <p className="font-bold uppercase text-xs tracking-wide text-gray-500 mb-1 mt-3">Delivery / Service Date</p>
            <p>{meta.deliveryDate || '________'}</p>
          </div>
        </div>

        <div className="overflow-x-auto mb-8 -mx-1 px-1"><table className="w-full min-w-[560px] text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-black text-left">
              <th className="py-2 pr-2">Item Description</th>
              <th className="py-2 px-2 text-right">Qty</th>
              <th className="py-2 px-2">UOM</th>
              <th className="py-2 px-2 text-right">Unit Price</th>
              <th className="py-2 pl-2 text-right">Total Price</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-b border-gray-200">
                <td className="py-2 pr-2">{item.description || '--'}</td>
                <td className="py-2 px-2 text-right">{item.qty}</td>
                <td className="py-2 px-2">{item.uom}</td>
                <td className="py-2 px-2 text-right font-mono">{peso(item.unitPrice)}</td>
                <td className="py-2 pl-2 text-right font-mono">{peso(item.qty * item.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className="py-2 pr-2 text-right font-bold">Subtotal</td>
              <td className="py-2 pl-2 text-right font-mono">{peso(subtotal)}</td>
            </tr>
            <tr>
              <td colSpan={4} className="py-1 pr-2 text-right font-bold">VAT ({vatRate}%)</td>
              <td className="py-1 pl-2 text-right font-mono">{peso(vat)}</td>
            </tr>
            <tr className="border-t-2 border-black">
              <td colSpan={4} className="py-2 pr-2 text-right font-bold text-base">Total Amount Due</td>
              <td className="py-2 pl-2 text-right font-mono font-bold text-base">{peso(total)}</td>
            </tr>
          </tfoot>
        </table></div>

        <p className="text-sm mb-8"><span className="font-bold">Payment Terms:</span> {paymentTerms}</p>

        <div className="text-sm mb-12">
          <h4 className="font-bold uppercase text-xs tracking-wide text-gray-500 mb-3">Terms &amp; Conditions</h4>
          <ol className="list-decimal pl-5 flex flex-col gap-2">
            <li><span className="font-bold">Delivery / Site Access:</span> {terms.delivery}</li>
            <li><span className="font-bold">Warranty / Quality Standards:</span> {terms.warranty}</li>
            <li><span className="font-bold">Inspection &amp; Rejection:</span> {terms.rejection}</li>
            <li><span className="font-bold">Health &amp; Safety Compliance:</span> {terms.compliance}</li>
          </ol>
        </div>

        <div className="grid sm:grid-cols-2 gap-8 sm:gap-16 text-sm">
          <div>
            <div className="border-t border-black pt-2 mt-16">
              <p className="font-bold">Authorized By</p>
              <p className="text-gray-500">{meta.companyName}</p>
            </div>
          </div>
          <div>
            <div className="border-t border-black pt-2 mt-16">
              <p className="font-bold">Accepted By</p>
              <p className="text-gray-500">{meta.partyName || partyLabel}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
