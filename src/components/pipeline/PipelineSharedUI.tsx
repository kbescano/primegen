import Link from "next/link";
import { peso, orderBreakdown, orderMarkupTotal, orderTrueNetProfit } from "@/lib/pipelineUtils";

export function TabSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <h2 className="text-[15px] font-semibold tracking-tight text-gray-900 mb-6 pb-3 border-b border-gray-100">
        {title}
      </h2>
      {children}
    </div>
  );
}

export function SummaryRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2.5 md:py-3 border-b border-gray-50 last:border-0 gap-1.5 sm:gap-3">
      <span className="text-[12px] font-medium text-gray-500 flex-shrink-0">
        {label}
      </span>
      <span className={`text-[13px] ${mono ? "font-mono tracking-tight" : ""} font-medium text-gray-900 sm:text-right break-words`}>
        {value}
      </span>
    </div>
  );
}

export function EmptyStep({ text, ctaLabel, href }: { text: string; ctaLabel?: string; href?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 md:p-12 bg-[#fbfbfd] rounded-3xl border border-dashed border-gray-200 text-center">
      <p className="text-[13px] text-gray-500 font-medium mb-5">{text}</p>
      {ctaLabel && href && (
        <Link href={href} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#1d1d1f] text-white hover:bg-gray-800 transition-all text-[11px] font-medium w-full sm:w-auto shadow-sm">
          {ctaLabel} &rarr;
        </Link>
      )}
    </div>
  );
}

export function InstantSelect({ value, options, onChange, colorMap, disabled }: any) {
  const isValidValue = options.some((o: any) => o.value === value);
  const currentVal = isValidValue ? value : options[0].value;
  const colorClass = colorMap[currentVal] || "bg-gray-100 text-gray-600";

  return (
    <div className="relative w-full sm:w-auto">
      <select
        value={currentVal}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full sm:w-[160px] appearance-none pr-8 pl-4 py-2 text-[11px] font-medium rounded-full cursor-pointer focus:outline-none ring-1 ring-inset ring-transparent focus:ring-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${colorClass}`}
      >
        {options.map((o: any) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 opacity-40">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </div>
  );
}

export function FinancialSummary({ localOrder }: { localOrder: any }) {
  if (!localOrder) return null;

  // 1. Calculate Revenue & VAT
  const subtotal = (localOrder.items || []).reduce((sum: number, i: any) => sum + (Number(i.qty) || 0) * (Number(i.unitPrice) || 0), 0);
  const discount = Number(localOrder.discountAmount) || 0;
  const delivery = Number(localOrder.deliveryFee) || 0;
  const netRev = subtotal - discount + delivery;
  const totalGross = netRev;

  // 2. Calculate Receivables
  const amountPaid = Number(localOrder.amountPaid) || 0;
  const isPartial = localOrder.paymentStatus === 'partial' || localOrder.paymentStatus === 'partial';
  const receivables = isPartial 
    ? totalGross - amountPaid 
    : (localOrder.paymentStatus === 'paid' ? 0 : totalGross);

  // 3. Calculate Expenses & Profit
  const cogs = (localOrder.items || []).reduce((sum: number, i: any) => sum + (Number(i.qty) || 0) * (Number(i.unitCost) || 0), 0);
  const opex = (localOrder.opex || []).reduce((sum: number, exp: any) => sum + (exp.status === 'liquidated' ? Number(exp.amount) || 0 : 0), 0);
  const profit = netRev - cogs - opex;

  return (
    <div className="w-full lg:w-[320px] bg-[#fbfbfd] rounded-2xl border border-gray-100 p-5 shrink-0 flex flex-col shadow-sm">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Financial Summary</h3>
      
      <div className="flex flex-col gap-2 mb-3">
        <div className="flex justify-between items-center">
          <span className="text-[12px] text-gray-500">Subtotal</span>
          <span className="text-[12px] font-mono text-gray-700">{peso(subtotal)}</span>
        </div>
        
        {discount > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-[12px] text-gray-500">Discount</span>
            <span className="text-[12px] font-mono text-red-500">-{peso(discount)}</span>
          </div>
        )}
        
        {delivery > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-[12px] text-gray-500">Delivery Fee</span>
            <span className="text-[12px] font-mono text-gray-700">+{peso(delivery)}</span>
          </div>
        )}

      </div>

      <div className="h-[1px] w-full bg-gray-200/60 mb-3" />

      <div className="flex justify-between items-center mb-4">
        <span className="text-[12px] font-semibold text-gray-900">Gross Revenue</span>
        <span className="text-[13px] font-mono font-bold text-gray-900">{peso(totalGross)}</span>
      </div>

      <div className="flex flex-col gap-2 mb-4 bg-amber-50/50 -mx-2 px-2 py-2.5 rounded-lg border border-amber-100/50">
        {isPartial && (
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] text-amber-600/80">Amount Paid</span>
            <span className="text-[11px] font-mono text-amber-600/80">-{peso(amountPaid)}</span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-[12px] font-semibold text-amber-600">Receivables (Unpaid)</span>
          <span className="text-[13px] font-mono font-semibold text-amber-600">{peso(receivables)}</span>
        </div>
      </div>
      
      <div className="flex flex-col gap-2 mb-3">
        <div className="flex justify-between items-center">
          <span className="text-[12px] text-gray-500">Total COGS</span>
          <span className="text-[12px] font-mono text-gray-700">-{peso(cogs)}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-[12px] text-gray-500">Liquidated OPEX</span>
          <span className="text-[12px] font-mono text-gray-700">-{peso(opex)}</span>
        </div>
      </div>

      <div className="h-[1px] w-full bg-gray-200/60 my-3" />
      
      <div className="flex justify-between items-center">
        <span className="text-[13px] font-bold text-gray-900">Net Profit</span>
        <span className={`text-[15px] font-mono font-bold tracking-tight ${profit >= 0 ? 'text-[#149911]' : 'text-red-600'}`}>
          {peso(profit)}
        </span>
      </div>
    </div>
  );
}