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

export function InstantSelect({ value, options, onChange, colorMap }: any) {
  const isValidValue = options.some((o: any) => o.value === value);
  const currentVal = isValidValue ? value : options[0].value;
  const colorClass = colorMap[currentVal] || "bg-gray-100 text-gray-600";

  return (
    <div className="relative w-full sm:w-auto">
      <select
        value={currentVal}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full sm:w-[160px] appearance-none pr-8 pl-4 py-2 text-[11px] font-medium rounded-full cursor-pointer focus:outline-none ring-1 ring-inset ring-transparent focus:ring-gray-200 transition-all ${colorClass}`}
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
  const breakdown = orderBreakdown(localOrder);
  const markup = orderMarkupTotal(localOrder);
  const trueNet = orderTrueNetProfit(localOrder);

  return (
    <div className="flex flex-col gap-2 w-full lg:w-[280px] bg-[#fbfbfd] p-4 rounded-xl border border-gray-100 flex-shrink-0">
      <div className="flex items-center justify-between w-full">
        <p className="text-[11px] font-medium text-gray-500">Subtotal</p>
        <p className="text-[12px] text-gray-900 font-medium">{peso(breakdown.subtotal)}</p>
      </div>
      {breakdown.discountAmount > 0 && (
        <div className="flex items-center justify-between w-full">
          <p className="text-[11px] font-medium text-gray-500">Discount</p>
          <p className="text-[12px] text-gray-900 font-medium">-{peso(breakdown.discountAmount)}</p>
        </div>
      )}
      {breakdown.deliveryFee > 0 && (
        <div className="flex items-center justify-between w-full">
          <p className="text-[11px] font-medium text-gray-500">Delivery</p>
          <p className="text-[12px] text-gray-900 font-medium">{peso(breakdown.deliveryFee)}</p>
        </div>
      )}
      {breakdown.vatAmount > 0 && (
        <div className="flex items-center justify-between w-full">
          <p className="text-[11px] font-medium text-gray-500">VAT ({breakdown.vatRate}%)</p>
          <p className="text-[12px] text-gray-900 font-medium">{peso(breakdown.vatAmount)}</p>
        </div>
      )}
      <div className="flex items-center justify-between w-full pt-2 mt-1 border-t border-gray-100">
        <p className="text-[12px] font-semibold text-gray-900">Total Revenue</p>
        <p className="text-[16px] font-semibold tracking-tight text-gray-900">{peso(breakdown.total)}</p>
      </div>

      <div className="flex items-center justify-between w-full pt-3 mt-1 border-t border-dashed border-gray-200">
        <p className="text-[11px] font-medium text-gray-500">Gross Markup</p>
        <p className="text-[12px] font-medium text-gray-900">{peso(markup)}</p>
      </div>
      {(breakdown.liquidatedOpex > 0 || breakdown.pendingOpex > 0) && (
        <div className="flex items-center justify-between w-full pt-1">
          <p className="text-[11px] font-medium text-gray-500">Less: OPEX</p>
          <div className="text-right">
            <p className="text-[12px] font-medium text-red-500">-{peso(breakdown.liquidatedOpex)}</p>
            {breakdown.pendingOpex > 0 && (
              <p className="text-[9px] text-amber-500 font-medium mt-0.5">(+ {peso(breakdown.pendingOpex)} pending)</p>
            )}
          </div>
        </div>
      )}
      <div className="flex items-center justify-between w-full pt-2 mt-1 border-t border-gray-100">
        <p className="text-[12px] font-semibold text-[#149911]">True Net Profit</p>
        <p className="text-[16px] font-semibold tracking-tight text-[#149911]">{peso(trueNet)}</p>
      </div>
    </div>
  );
}