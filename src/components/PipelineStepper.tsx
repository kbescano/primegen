"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import OrderSupplierSection from "@/components/OrderSupplierSection";
import OrderOpexSection from "@/components/OrderOpexSection";

type StepKey =
  | "quotation"
  | "confirmation"
  | "supplierPO"
  | "fulfilled"
  | "delivery"
  | "closed";

const STEPS: { key: StepKey; label: string }[] = [
  { key: "quotation", label: "Create Quotation" },
  { key: "confirmation", label: "Quotation Approval" },
  { key: "supplierPO", label: "Create PO" },
  { key: "fulfilled", label: "Order Fulfilled" },
  { key: "delivery", label: "Track Delivery" },
  { key: "closed", label: "Confirm Completed" },
];

const FULFILLMENT_OPTIONS = [
  { value: "preparing", label: "Preparing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const FULFILLMENT_COLORS: Record<string, string> = {
  preparing: "bg-amber-50 text-amber-700",
  shipped: "bg-purple-50 text-purple-700",
  delivered: "bg-[#149911] text-white",
  cancelled: "bg-red-50 text-red-600",
};

const PAYMENT_OPTIONS = [
  { value: "unpaid", label: "Unpaid" },
  { value: "partial", label: "Partial" },
  { value: "paid", label: "Paid" },
];

const PAYMENT_COLORS: Record<string, string> = {
  unpaid: "bg-gray-100 text-gray-600",
  partial: "bg-amber-50 text-amber-700",
  paid: "bg-[#149911] text-white",
};

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  confirmed: "bg-[#149911] text-white",
  order_confirmed: "bg-[#149911] text-white",
};

const peso = (n: number) =>
  "\u20B1" +
  n.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const BASE_TERMS = [
  "",
  "This quotation is valid for 7 days from the date of issue. Prices and availability are subject to change without prior notice after this period.",
  "Full Payment before Delivery; Delivery will be arranged upon confirmation of full payment.",
  "Delivery timelines are estimates and depend on product availability and logistics. We shall not be held liable for delays due to causes beyond our control, including but not limited to supplier delays, transportation issues, or force majeure events.",
  "Ownership of products shall remain with Primegen Trading Corp. until full payment is received. Risk passes to the buyer upon delivery or collection.",
  "Cancellations must be made in writing within 1 day of order placement. Returns are subject to approval and may incur restocking fees. Custom or special-order items are non-returnable.",
  "Products supplied are covered by manufacturer's warranty only, subject to their terms and conditions. No additional warranties are expressed or implied unless agreed upon in writing.",
  "Proceeding with this quotation constitutes acceptance of these terms and conditions in full.",
  "Refund Processing. Approved refunds (if any) will be processed within 7–14 working days via the original mode of payment.",
];

function getQuotationTerms(hasVat: boolean) {
  const copy = [...BASE_TERMS];
  copy[0] = `All prices are quoted in Peso and are ${
    hasVat ? "Inclusive" : "Exclusive"
  } of VAT, delivery charges, and other applicable taxes, unless otherwise specified. Prices are based on current material costs and may be adjusted due to market fluctuations.`;
  return copy;
}

function quotationTotal(q: any): number {
  const subtotal = (q.items || []).reduce(
    (sum: number, i: any) =>
      sum + (Number(i.qty) || 0) * (Number(i.unitPrice) || 0),
    0,
  );
  const afterDiscount = subtotal - (Number(q.discountAmount) || 0);
  const withDelivery = afterDiscount + (Number(q.deliveryFee) || 0);
  return withDelivery + withDelivery * ((Number(q.vatRate) || 0) / 100);
}

function orderBreakdown(o: any) {
  const subtotal = (o.items || []).reduce(
    (sum: number, i: any) =>
      sum + (Number(i.qty) || 0) * (Number(i.unitPrice) || 0),
    0,
  );
  const discountAmount = Number(o.discountAmount) || 0;
  const deliveryFee = Number(o.deliveryFee) || 0;
  const afterDiscount = subtotal - discountAmount;
  const withDelivery = afterDiscount + deliveryFee;
  const vatRate = Number(o.vatRate) || 0;
  const vatAmount = withDelivery * (vatRate / 100);
  const total = withDelivery + vatAmount;

  const liquidatedOpex = (o.opex || []).reduce(
    (sum: number, exp: any) =>
      sum + (exp.status === "liquidated" ? Number(exp.amount) || 0 : 0),
    0,
  );

  const pendingOpex = (o.opex || []).reduce(
    (sum: number, exp: any) =>
      sum + (exp.status === "pending" ? Number(exp.amount) || 0 : 0),
    0,
  );

  return {
    subtotal,
    discountAmount,
    deliveryFee,
    vatRate,
    vatAmount,
    total,
    liquidatedOpex,
    pendingOpex,
  };
}

// FIX: Aligned Gross Markup math perfectly with ReportsPage / ExportCenter
function orderMarkupTotal(o: any): number {
  const subtotal = (o.items || []).reduce(
    (sum: number, i: any) =>
      sum + (Number(i.qty) || 0) * (Number(i.unitPrice) || 0),
    0,
  );
  const discountAmount = Number(o.discountAmount) || 0;
  const deliveryFee = Number(o.deliveryFee) || 0;
  const netRevenue = subtotal - discountAmount + deliveryFee;

  const cogs = (o.items || []).reduce(
    (sum: number, i: any) =>
      sum + (Number(i.qty) || 0) * (Number(i.unitCost) || 0),
    0,
  );

  return netRevenue - cogs;
}

// FIX: Aligned True Net Profit perfectly with ReportsPage / ExportCenter
function orderTrueNetProfit(o: any): number {
  const markup = orderMarkupTotal(o);
  const liquidatedOpex = (o.opex || []).reduce(
    (sum: number, exp: any) =>
      sum + (exp.status === "liquidated" ? Number(exp.amount) || 0 : 0),
    0,
  );
  return markup - liquidatedOpex;
}

export default function PipelineStepper({
  request,
  quotation,
  order,
  linkedPOs,
  completedSteps,
  currentStep,
}: {
  request: any;
  quotation: any | null;
  order: any | null;
  linkedPOs: any[];
  completedSteps: Record<StepKey, boolean>;
  currentStep: StepKey;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<StepKey>(currentStep);
  const [userHighest, setUserHighest] = useState(0);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  const [localOrder, setLocalOrder] = useState(order);

  const isQuotationApprovedOrBeyond =
    ["quotation_approved", "order_confirmed"].includes(quotation?.status) ||
    !!order;

  useEffect(() => {
    setLocalOrder(order);
    if (order && isCreatingOrder) {
      setIsCreatingOrder(false);
    }
  }, [order]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const updateTabFromUrl = () => {
        const params = new URLSearchParams(window.location.search);
        const stepParam = params.get("step") as StepKey;
        if (stepParam && STEPS.some((s) => s.key === stepParam)) {
          setActiveTab(stepParam);
        }
      };

      updateTabFromUrl();
      window.addEventListener("popstate", updateTabFromUrl);
      return () => window.removeEventListener("popstate", updateTabFromUrl);
    }
  }, []);

  useEffect(() => {
    const activeIdx = STEPS.findIndex((s) => s.key === activeTab);
    setUserHighest((prev) => Math.max(prev, activeIdx));
  }, [activeTab]);

  const baseUnlockedIndex = STEPS.findIndex((s) => s.key === currentStep);
  let maxUnlocked = baseUnlockedIndex;

  STEPS.forEach((step, i) => {
    if (completedSteps[step.key]) {
      maxUnlocked = Math.max(maxUnlocked, i + 1);
    }
  });

  if (isQuotationApprovedOrBeyond) {
    maxUnlocked = Math.max(maxUnlocked, 2);
  }

  const finalUnlockedIndex = Math.max(maxUnlocked, userHighest);

  function handleTabChange(newStep: StepKey) {
    setActiveTab(newStep);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("step", newStep);
      window.history.pushState({}, "", url.toString());
    }
  }

  async function handleConfirmOrder() {
    if (!quotation?.id) return;
    setIsCreatingOrder(true);

    try {
      const res = await fetch(`/api/client-quotations/${quotation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "order_confirmed" }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        const err = await res.json();
        alert(`Failed to confirm order: ${err?.message || "Server error"}`);
        setIsCreatingOrder(false);
      }
    } catch (e) {
      console.error(e);
      setIsCreatingOrder(false);
    }
  }

  async function handleUpdateOrderField(field: string, value: any) {
    if (!localOrder?.id) return;
    setLocalOrder((prev: any) => (prev ? { ...prev, [field]: value } : prev));
    try {
      const res = await fetch(`/api/orders/${localOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) router.refresh();
    } catch (e) {
      console.error(e);
    }
  }

  function InstantSelect({ value, options, onChange, colorMap }: any) {
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
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>
    );
  }

  function renderFinancialSummary() {
    if (!localOrder) return null;
    const breakdown = orderBreakdown(localOrder);
    const markup = orderMarkupTotal(localOrder);
    const trueNet = orderTrueNetProfit(localOrder);

    return (
      <div className="flex flex-col gap-2 w-full lg:w-[280px] bg-[#fbfbfd] p-4 rounded-xl border border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between w-full">
          <p className="text-[11px] font-medium text-gray-500">Subtotal</p>
          <p className="text-[12px] text-gray-900 font-medium">
            {peso(breakdown.subtotal)}
          </p>
        </div>
        {breakdown.discountAmount > 0 && (
          <div className="flex items-center justify-between w-full">
            <p className="text-[11px] font-medium text-gray-500">Discount</p>
            <p className="text-[12px] text-gray-900 font-medium">
              -{peso(breakdown.discountAmount)}
            </p>
          </div>
        )}
        {breakdown.deliveryFee > 0 && (
          <div className="flex items-center justify-between w-full">
            <p className="text-[11px] font-medium text-gray-500">Delivery</p>
            <p className="text-[12px] text-gray-900 font-medium">
              {peso(breakdown.deliveryFee)}
            </p>
          </div>
        )}
        {breakdown.vatAmount > 0 && (
          <div className="flex items-center justify-between w-full">
            <p className="text-[11px] font-medium text-gray-500">
              VAT ({breakdown.vatRate}%)
            </p>
            <p className="text-[12px] text-gray-900 font-medium">
              {peso(breakdown.vatAmount)}
            </p>
          </div>
        )}
        <div className="flex items-center justify-between w-full pt-2 mt-1 border-t border-gray-100">
          <p className="text-[12px] font-semibold text-gray-900">
            Total Revenue
          </p>
          <p className="text-[16px] font-semibold tracking-tight text-gray-900">
            {peso(breakdown.total)}
          </p>
        </div>

        <div className="flex items-center justify-between w-full pt-3 mt-1 border-t border-dashed border-gray-200">
          <p className="text-[11px] font-medium text-gray-500">Gross Markup</p>
          <p className="text-[12px] font-medium text-gray-900">
            {peso(markup)}
          </p>
        </div>
        {(breakdown.liquidatedOpex > 0 || breakdown.pendingOpex > 0) && (
          <div className="flex items-center justify-between w-full pt-1">
            <p className="text-[11px] font-medium text-gray-500">Less: OPEX</p>
            <div className="text-right">
              <p className="text-[12px] font-medium text-red-500">
                -{peso(breakdown.liquidatedOpex)}
              </p>
              {breakdown.pendingOpex > 0 && (
                <p className="text-[9px] text-amber-500 font-medium mt-0.5">
                  (+ {peso(breakdown.pendingOpex)} pending)
                </p>
              )}
            </div>
          </div>
        )}
        <div className="flex items-center justify-between w-full pt-2 mt-1 border-t border-gray-100">
          <p className="text-[12px] font-semibold text-[#149911]">
            True Net Profit
          </p>
          <p className="text-[16px] font-semibold tracking-tight text-[#149911]">
            {peso(trueNet)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col h-full relative">
      {/* 🌊 APPLE-STYLE STICKY GRID STEPPER */}
      <div className="sticky top-0 z-[50] w-full bg-[#fbfbfd]/90 backdrop-blur-xl pt-3 pb-2 md:pt-4 md:pb-3 border-b border-gray-200/50 shadow-sm shrink-0">
        <div className="w-full max-w-[900px] mx-auto px-4">
          <div className="grid grid-cols-3 sm:flex sm:flex-nowrap items-start w-full gap-y-6 sm:gap-y-0 relative">
            {STEPS.map((step, i) => {
              let done = completedSteps[step.key];
              if (step.key === "quotation" && quotation) done = true;
              if (step.key === "confirmation" && isQuotationApprovedOrBeyond)
                done = true;

              const isActive = activeTab === step.key;
              const isLast = i === STEPS.length - 1;
              const isDisabled = i > finalUnlockedIndex;
              const hideLineMobile = (i + 1) % 3 === 0;

              return (
                <div
                  key={step.key}
                  className="relative w-full sm:flex-1 flex flex-col items-center group"
                >
                  {!isLast && (
                    <div
                      className={`absolute top-[10px] left-[50%] w-full h-[2px] transition-colors duration-500 z-0 ${hideLineMobile ? "hidden sm:block" : "block"} ${
                        done
                          ? "bg-[#149911]"
                          : isDisabled
                            ? "bg-gray-100"
                            : "bg-gray-200"
                      }`}
                    />
                  )}

                  <button
                    onClick={() => !isDisabled && handleTabChange(step.key)}
                    disabled={isDisabled}
                    className={`relative z-10 flex flex-col items-center gap-1.5 w-full focus:outline-none transition-all duration-300 ${
                      isDisabled
                        ? "cursor-not-allowed opacity-40 grayscale"
                        : "cursor-pointer"
                    }`}
                  >
                    <div
                      className={`flex items-center justify-center w-[22px] h-[22px] rounded-full text-[9px] font-semibold transition-all duration-300 ${
                        done
                          ? "bg-[#149911] text-white ring-4 ring-[#fbfbfd]"
                          : isActive
                            ? "bg-[#1d1d1f] text-white ring-4 ring-gray-200/50 scale-110 shadow-sm"
                            : "bg-white border-2 border-gray-200 text-gray-400 group-hover:border-gray-300 group-hover:text-gray-600"
                      }`}
                    >
                      {done ? (
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="4"
                        >
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      ) : (
                        i + 1
                      )}
                    </div>
                    <span
                      className={`text-[9px] font-medium tracking-tight text-center leading-[1.2] transition-colors w-full px-1 max-w-[90px] break-words ${
                        isActive
                          ? "text-[#1d1d1f] font-semibold"
                          : done
                            ? "text-gray-700"
                            : "text-gray-400"
                      }`}
                    >
                      {step.label}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 📑 TAB CONTENT CONTAINER */}
      <div className="w-full flex-1 p-3 sm:p-5 md:p-6">
        <div className="bg-white rounded-2xl border border-gray-100/80 p-5 md:p-6 shadow-[0_2px_20px_rgba(0,0,0,0.02)] max-w-[1000px] mx-auto">
          {/* ======================= STEP 1 ======================= */}
          {activeTab === "quotation" && (
            <TabSection title="Step 1: Create Quotation">
              {quotation ? (
                <div className="flex flex-col gap-1.5">
                  <SummaryRow
                    label="Quotation #"
                    value={quotation.quotationNumber}
                    mono
                  />
                  <SummaryRow
                    label="Status"
                    value={quotation.status.replace("_", " ")}
                  />
                  <SummaryRow label="Customer" value={quotation.customerName} />

                  {localOrder ? (
                    (() => {
                      const subtotal = (quotation.items || []).reduce(
                        (sum: number, i: any) =>
                          sum +
                          (Number(i.qty) || 0) * (Number(i.unitPrice) || 0),
                        0,
                      );
                      const discountAmount =
                        Number(quotation.discountAmount) || 0;
                      const deliveryFee = Number(quotation.deliveryFee) || 0;
                      const netAfterDiscount = subtotal - discountAmount;
                      const netWithDelivery = netAfterDiscount + deliveryFee;
                      const hasVat = (Number(quotation.vatRate) || 0) > 0;
                      const vatRate = Number(quotation.vatRate) || 0;
                      const vat = hasVat
                        ? netWithDelivery * (vatRate / 100)
                        : 0;
                      const total = netWithDelivery + vat;
                      const terms = getQuotationTerms(hasVat);
                      const qDate = quotation.quotationDate
                        ? new Date(quotation.quotationDate).toLocaleDateString(
                            "en-PH",
                            { year: "numeric", month: "short", day: "numeric" },
                          )
                        : "________";

                      return (
                        <div className="mt-6 border-t border-gray-100 pt-5">
                          <p className="text-[11px] font-medium text-gray-500 mb-4">
                            Confirmed Quotation Preview
                          </p>

                          <div className="w-full overflow-x-auto pb-4">
                            <div className="quotation-print-doc bg-white border border-gray-200 rounded-2xl p-6 text-[#01172f] min-w-[794px] shadow-sm">
                              <div className="flex flex-row justify-between items-start gap-3 mb-4">
                                <div className="flex gap-1.5 items-center">
                                  <div className="relative w-36 h-36 flex-shrink-0 overflow-hidden">
                                    <Image
                                      src="/branding/primegen_trading_logo.png"
                                      alt="Primegen Trading Corporation"
                                      fill
                                      className="object-contain scale-[1.1]"
                                    />
                                  </div>
                                  <div>
                                    <h2 className="text-lg font-black leading-none text-[#103900] tracking-tight">
                                      PRIMEGEN
                                    </h2>
                                    <p className="text-[10px] font-bold tracking-[0.2em] text-[#01172f] mt-0 mb-1.5">
                                      TRADING CORPORATION
                                    </p>
                                    <div className="w-full max-w-[200px] h-[2px] bg-[#149911] mb-1.5" />
                                    <p className="text-[8px] font-bold text-[#103900] leading-snug max-w-[200px] m-0">
                                      SOUTHERN CITY HOMES, YG BUILDING, CEBU ST,
                                      4 TANZANG LUMA, IMUS, 4103 CAVITE,
                                      PHILIPPINES
                                    </p>
                                    <p className="text-[8px] font-bold text-[#103900] m-0 mt-1">
                                      0917-185-9127 / 0917-133-9515 /
                                      046-8860853
                                    </p>
                                    <p className="text-[8px] font-bold text-[#103900] m-0 mt-1">
                                      SALES@PRIMEGENTRADINGCORP.COM
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right w-auto">
                                  <h3 className="text-lg font-bold text-[#3D5F3B] mb-1">
                                    FORMAL QUOTATION
                                  </h3>
                                  <table className="text-[10px] ml-auto mt-0">
                                    <tbody>
                                      <tr>
                                        <td className="border border-gray-300 px-2 py-0.5 font-bold bg-gray-50">
                                          DATE
                                        </td>
                                        <td className="border border-gray-300 px-2 py-0.5">
                                          {qDate}
                                        </td>
                                      </tr>
                                      <tr>
                                        <td className="border border-gray-300 px-2 py-0.5 font-bold bg-gray-50">
                                          QUOTATION #
                                        </td>
                                        <td className="border border-gray-300 px-2 py-0.5 font-mono">
                                          {quotation.quotationNumber ||
                                            "________"}
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                              <div className="mb-3">
                                <div className="bg-[#3D5F3B] text-white text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-sm">
                                  Customer
                                </div>
                                <div className="text-[10px] py-1 flex flex-col gap-0.5">
                                  <p>
                                    <span className="font-bold">Name: </span>
                                    {quotation.customerName || "________"}
                                  </p>
                                  <p>
                                    <span className="font-bold">Company: </span>
                                    {quotation.company || "________"}
                                  </p>
                                  <p>
                                    <span className="font-bold">Address: </span>
                                    {quotation.address || "________"}
                                  </p>
                                  <p>
                                    <span className="font-bold">
                                      Contact Number:{" "}
                                    </span>
                                    {quotation.contactNumber || "________"}
                                  </p>
                                </div>
                              </div>

                              <div>
                                <table className="w-full text-[10px] mb-2 border-collapse">
                                  <thead>
                                    <tr className="bg-[#3D5F3B] text-white text-[10px] uppercase tracking-wide">
                                      <th className="py-1 px-2 text-left w-[60px]">
                                        Qty
                                      </th>
                                      <th className="py-1 px-2 text-left w-[80px]">
                                        Unit
                                      </th>
                                      <th className="py-1 px-2 text-left">
                                        Description
                                      </th>
                                      <th className="py-1 px-2 text-right w-[100px]">
                                        Unit Price
                                      </th>
                                      <th className="py-1 px-2 text-right w-[100px]">
                                        Amount
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(quotation.items || []).map(
                                      (item: any, i: number) => {
                                        const price =
                                          Number(item.unitPrice) || 0;
                                        const qty = Number(item.qty) || 0;
                                        return (
                                          <tr
                                            key={i}
                                            className={
                                              i % 2 === 1 ? "bg-gray-50" : ""
                                            }
                                          >
                                            <td className="py-1 px-2 border-b border-gray-100">
                                              {qty}
                                            </td>
                                            <td className="py-1 px-2 border-b border-gray-100">
                                              {item.unit}
                                            </td>
                                            <td className="py-1 px-2 border-b border-gray-100">
                                              <div className="flex items-center gap-2">
                                                <span>
                                                  {item.description || "--"}
                                                </span>
                                                {item.imageDataUrl && (
                                                  <img
                                                    src={item.imageDataUrl}
                                                    alt=""
                                                    className="h-6 w-auto object-contain flex-shrink-0 rounded"
                                                  />
                                                )}
                                              </div>
                                            </td>
                                            <td className="py-1 px-2 border-b border-gray-100 text-right font-mono">
                                              {peso(price)}
                                            </td>
                                            <td className="py-1 px-2 border-b border-gray-100 text-right font-mono">
                                              {peso(qty * price)}
                                            </td>
                                          </tr>
                                        );
                                      },
                                    )}
                                  </tbody>
                                </table>
                              </div>

                              <div className="flex justify-end mt-8 mb-4">
                                <table className="text-[10px] w-full max-w-[240px]">
                                  <tbody>
                                    <tr>
                                      <td className="py-1 px-2 bg-[#e8f0e5] rounded-l-sm">
                                        Subtotal
                                      </td>
                                      <td className="py-1 px-2 bg-[#e8f0e5] text-right font-mono rounded-r-sm">
                                        {peso(subtotal)}
                                      </td>
                                    </tr>
                                    {discountAmount > 0 && (
                                      <tr>
                                        <td className="py-1 px-2">Discount</td>
                                        <td className="py-1 px-2 text-right font-mono">
                                          -{peso(discountAmount)}
                                        </td>
                                      </tr>
                                    )}
                                    {deliveryFee > 0 && (
                                      <tr>
                                        <td className="py-1 px-2">
                                          Delivery Fee
                                        </td>
                                        <td className="py-1 px-2 text-right font-mono">
                                          {peso(deliveryFee)}
                                        </td>
                                      </tr>
                                    )}
                                    {hasVat && (
                                      <tr>
                                        <td className="py-1 px-2">
                                          VAT ({vatRate}%)
                                        </td>
                                        <td className="py-1 px-2 text-right font-mono">
                                          {peso(vat)}
                                        </td>
                                      </tr>
                                    )}
                                    <tr className="border-t-2 border-[#3D5F3B]">
                                      <td className="py-1 px-2 font-bold text-[11px] bg-[#e8f0e5] rounded-l-sm">
                                        TOTAL
                                      </td>
                                      <td className="py-1 px-2 font-bold text-[11px] text-right font-mono bg-[#e8f0e5] rounded-r-sm">
                                        {peso(total)}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>

                              <div className="grid grid-cols-[1fr_240px] gap-4 mt-8 mb-2 text-[8px] leading-snug break-inside-avoid">
                                <div>
                                  <p className="font-bold text-[9px] uppercase tracking-wide mb-1">
                                    Terms &amp; Condition
                                  </p>
                                  <ol className="list-decimal pl-4 flex flex-col gap-0.5 text-gray-700">
                                    {terms.map((t, i) => (
                                      <li key={i}>{t}</li>
                                    ))}
                                  </ol>
                                </div>
                                <div>
                                  <p className="font-bold text-[9px] uppercase tracking-wide mb-3">
                                    Customer Conforme:
                                  </p>
                                  <div className="border-t border-black w-full mb-1.5" />
                                  <p className="text-gray-600">
                                    This is to certify that all details in this
                                    quotation are correct (name, address, items,
                                    specifications, quantity, price)
                                  </p>
                                </div>
                              </div>

                              <div className="border-t border-black pt-1 break-inside-avoid mt-8">
                                <p className="text-center font-bold text-[9px] uppercase tracking-wide mb-2">
                                  Bank Transfer Details
                                </p>
                                <div className="grid grid-cols-4 gap-2 gap-x-3 text-[7px]">
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
                                    <p className="font-bold">
                                      BANCO DE ORO (SM AURA BRANCH)
                                    </p>
                                    <p className="mt-0.5">MICHAEL P. SAYNES</p>
                                    <p>008010019955</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="pt-6 mt-4 border-t border-gray-100 flex justify-start">
                      <Link
                        href={`/admin-dashboard/client-quotation?id=${quotation.id}&pipelineId=${request.id}`}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#1d1d1f] text-white hover:bg-gray-800 transition-all text-[11px] font-medium w-full sm:w-auto shadow-sm"
                      >
                        Open Full Quotation &rarr;
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <EmptyStep
                  text="No quotation created yet for this request."
                  ctaLabel="Create Client Quotation"
                  href={`/admin-dashboard/client-quotation?from=${request.id}&pipelineId=${request.id}`}
                />
              )}
            </TabSection>
          )}

          {/* ======================= STEP 2 ======================= */}
          {activeTab === "confirmation" && (
            <TabSection title="Step 2: Quotation Approval">
              {!quotation ? (
                <EmptyStep text="Waiting on Step 1: create a quotation first." />
              ) : (
                <div className="flex flex-col h-full gap-1.5">
                  <SummaryRow
                    label="Quotation Status"
                    value={quotation.status.replace("_", " ")}
                  />
                  <SummaryRow
                    label="Total Value"
                    value={peso(quotationTotal(quotation))}
                    mono
                  />

                  <div
                    className={`mt-4 mb-3 p-5 rounded-2xl border transition-colors duration-300 ${
                      isQuotationApprovedOrBeyond
                        ? "border-green-200 bg-[#f0fdf4]"
                        : "border-gray-200 bg-gray-50/50"
                    }`}
                  >
                    {isQuotationApprovedOrBeyond ? (
                      <div className="flex flex-col items-start gap-3">
                        <p className="text-[13px] font-medium text-gray-900 leading-relaxed">
                          <strong className="text-[#149911] mr-1">
                            Approved!
                          </strong>{" "}
                          The client has accepted this quotation. You can now
                          print the formal document and proceed to confirm the
                          internal order.
                        </p>
                        <Link
                          href={`/admin-dashboard/client-quotation?id=${quotation.id}&pipelineId=${request.id}`}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all text-[11px] font-medium w-full sm:w-auto mt-1 shadow-sm"
                        >
                          Open Quotation to Print &rarr;
                        </Link>
                      </div>
                    ) : (
                      <div className="flex flex-col items-start gap-4">
                        <p className="text-[13px] font-medium text-gray-700 leading-relaxed">
                          {quotation.status === "pending_approval"
                            ? "Pending Approval. Waiting for internal review before this can be sent to the client or approved."
                            : quotation.status === "sent"
                              ? "Sent to client. Awaiting client acceptance to proceed with approval."
                              : "Draft stage. Complete the quotation details and send for internal approval."}
                        </p>
                        {quotation.status === "draft" && (
                          <Link
                            href={`/admin-dashboard/client-quotation?id=${quotation.id}&pipelineId=${request.id}`}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all text-[11px] font-medium w-full sm:w-auto shadow-sm"
                          >
                            Send for Internal Approval &rarr;
                          </Link>
                        )}
                      </div>
                    )}
                  </div>

                  {isQuotationApprovedOrBeyond && (
                    <div className="border-t border-gray-100 pt-5 mt-2 flex justify-start">
                      <button
                        onClick={() => handleTabChange("supplierPO")}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#1d1d1f] text-white hover:bg-gray-800 transition-all text-[11px] font-medium shadow-sm"
                      >
                        Next Step: Confirm Order & Create PO &rarr;
                      </button>
                    </div>
                  )}
                </div>
              )}
            </TabSection>
          )}

          {/* ======================= STEP 3 ======================= */}
          {activeTab === "supplierPO" && (
            <TabSection title="Step 3: Create PO">
              {!localOrder ? (
                isQuotationApprovedOrBeyond ? (
                  <div className="w-full">
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-3 mb-5">
                      <div>
                        <span className="bg-gray-100 px-2.5 py-1 text-[9px] font-semibold text-gray-500 tracking-wide rounded-full inline-block mb-2">
                          PENDING ORDER
                        </span>
                        <h3 className="text-[18px] font-semibold tracking-tight text-gray-900 leading-none break-words">
                          {quotation.customerName || "--"}
                        </h3>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-5 border-b border-gray-100">
                      <div>
                        <p className="text-[12px] text-gray-500 font-medium mb-1">
                          Internal Order Status
                        </p>
                        <p className="text-[13px] text-gray-900 font-medium">
                          Set to Confirmed to generate the order and unlock POs.
                        </p>
                      </div>

                      <div className="relative w-full sm:w-auto">
                        {isCreatingOrder ||
                        quotation?.status === "order_confirmed" ? (
                          <span className="inline-block w-full sm:w-[160px] text-center px-4 py-2 text-[11px] font-medium bg-[#149911]/10 text-[#149911] rounded-xl">
                            Generating Order...
                          </span>
                        ) : (
                          <div className="w-full sm:w-[160px]">
                            <select
                              onChange={(e) => {
                                if (e.target.value === "order_confirmed") {
                                  handleConfirmOrder();
                                }
                              }}
                              defaultValue="pending"
                              className="w-full appearance-none pr-8 pl-4 py-2 text-[12px] font-medium rounded-xl cursor-pointer focus:outline-none ring-1 ring-inset ring-gray-200 focus:ring-gray-300 transition-all bg-gray-50 hover:bg-gray-100 text-gray-900"
                            >
                              <option value="pending">Pending</option>
                              <option value="order_confirmed">Confirmed</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 opacity-40">
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                              >
                                <path d="M6 9l6 6 6-6" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="py-10 text-center bg-[#fbfbfd] rounded-2xl border border-dashed border-gray-200 px-5">
                      <p className="text-[13px] text-gray-500 font-medium max-w-sm mx-auto">
                        Please confirm the internal order status above to unlock
                        supplier assignments and PO generation.
                      </p>
                    </div>
                  </div>
                ) : (
                  <EmptyStep text="Waiting on Step 2: approve the quotation first." />
                )
              ) : (
                <div className="w-full">
                  <div className="flex flex-col lg:flex-row justify-between items-start gap-3 mb-5">
                    <div>
                      <span className="bg-gray-100 px-2.5 py-1 text-[9px] font-semibold text-gray-500 tracking-wide rounded-full inline-block mb-2">
                        {localOrder.orderNumber || "ACTIVE ORDER"}
                      </span>
                      <h3 className="text-[18px] font-semibold tracking-tight text-gray-900 leading-none break-words">
                        {localOrder.customerName || "--"}
                      </h3>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-5 border-b border-gray-100">
                    <div>
                      <p className="text-[12px] text-gray-500 font-medium mb-1">
                        Internal Order Status
                      </p>
                      <p className="text-[13px] text-gray-900 font-medium">
                        Order is active. You can now manage POs.
                      </p>
                    </div>
                    <span className="inline-block w-full sm:w-[160px] text-center px-4 py-2 text-[11px] font-medium bg-[#149911]/10 text-[#149911] rounded-xl">
                      Confirmed
                    </span>
                  </div>

                  <div className="mb-5">
                    <OrderSupplierSection
                      orderId={localOrder.id}
                      items={localOrder.items || []}
                      linkedPOs={linkedPOs || []}
                      allowStatusChange={false}
                    />
                  </div>

                  {/* Left Action Button, Right Financial Summary */}
                  <div className="border-t border-gray-100 pt-6 mt-6 flex flex-col-reverse lg:flex-row gap-6 justify-between items-start">
                    <div className="w-full lg:w-auto flex-1 flex justify-start">
                      {linkedPOs.length > 0 && (
                        <button
                          onClick={() => handleTabChange("fulfilled")}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#1d1d1f] text-white hover:bg-gray-800 transition-all text-[11px] font-medium shadow-sm"
                        >
                          Next Step: Order Fulfilled &rarr;
                        </button>
                      )}
                    </div>
                    {renderFinancialSummary()}
                  </div>
                </div>
              )}
            </TabSection>
          )}

          {/* ======================= STEP 4 ======================= */}
          {activeTab === "fulfilled" && (
            <TabSection title="Step 4: Order Fulfilled">
              {!localOrder ? (
                <EmptyStep text="Waiting on earlier steps." />
              ) : (
                <div className="w-full flex flex-col gap-6">
                  <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5 md:p-6">
                    <OrderSupplierSection
                      orderId={localOrder.id}
                      items={localOrder.items || []}
                      linkedPOs={linkedPOs || []}
                      allowStatusChange={true}
                    />
                  </div>
                  <OrderOpexSection
                    opex={localOrder.opex || []}
                    onUpdate={(newOpex) =>
                      handleUpdateOrderField("opex", newOpex)
                    }
                    allowAdd={true}
                  />
                  {linkedPOs.length > 0 &&
                    linkedPOs.every((po: any) => po.status === "fulfilled") && (
                      <div className="flex justify-start pt-2">
                        <button
                          onClick={() => handleTabChange("delivery")}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#1d1d1f] text-white hover:bg-gray-800 transition-all text-[13px] font-medium shadow-sm"
                        >
                          Next Step: Track Delivery & Payment &rarr;
                        </button>
                      </div>
                    )}
                </div>
              )}
            </TabSection>
          )}

          {/* ======================= STEP 5 ======================= */}
          {activeTab === "delivery" && (
            <TabSection title="Step 5: Track Delivery & Payment">
              {!localOrder ? (
                <EmptyStep text="Waiting on earlier steps." />
              ) : (
                <div className="flex flex-col gap-5 w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
                    <div>
                      <p className="text-[12px] text-gray-500 font-medium mb-1">
                        Fulfillment Status
                      </p>
                      <p className="text-[13px] text-gray-900 font-medium">
                        Track the physical delivery of the items.
                      </p>
                    </div>
                    <InstantSelect
                      value={localOrder.fulfillmentStatus}
                      options={FULFILLMENT_OPTIONS}
                      colorMap={FULFILLMENT_COLORS}
                      onChange={(val: string) =>
                        handleUpdateOrderField("fulfillmentStatus", val)
                      }
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3">
                    <div>
                      <p className="text-[12px] text-gray-500 font-medium mb-1">
                        Payment Status
                      </p>
                      <p className="text-[13px] text-gray-900 font-medium">
                        Monitor client payment progress.
                      </p>
                    </div>
                    <InstantSelect
                      value={localOrder.paymentStatus}
                      options={PAYMENT_OPTIONS}
                      colorMap={PAYMENT_COLORS}
                      onChange={(val: string) =>
                        handleUpdateOrderField("paymentStatus", val)
                      }
                    />
                  </div>

                  <div className="mt-1 mb-1">
                    <OrderOpexSection
                      opex={localOrder.opex || []}
                      onUpdate={(newOpex) =>
                        handleUpdateOrderField("opex", newOpex)
                      }
                      allowAdd={true}
                    />
                  </div>

                  {/* Left Action Button, Right Financial Summary */}
                  <div className="border-t border-gray-100 pt-6 mt-5 flex flex-col-reverse lg:flex-row gap-6 justify-between items-start">
                    <div className="w-full lg:w-auto flex-1 flex justify-start">
                      {localOrder.fulfillmentStatus === "delivered" &&
                        localOrder.paymentStatus === "paid" && (
                          <button
                            onClick={() => handleTabChange("closed")}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#1d1d1f] text-white hover:bg-gray-800 transition-all text-[11px] font-medium shadow-sm"
                          >
                            Next Step: Confirm Completed &rarr;
                          </button>
                        )}
                    </div>
                    {renderFinancialSummary()}
                  </div>
                </div>
              )}
            </TabSection>
          )}

          {/* ======================= STEP 6 ======================= */}
          {activeTab === "closed" && (
            <TabSection title="Step 6: Confirm Completed">
              {!localOrder || !quotation ? (
                <EmptyStep text="Waiting on earlier steps to complete." />
              ) : (
                (() => {
                  const orderItems = localOrder.items || [];

                  return (
                    <div className="flex flex-col gap-5 w-full">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#fbfbfd] rounded-2xl border border-gray-100">
                        <div>
                          <p className="text-[11px] text-gray-500 font-medium mb-1">
                            Pipeline Status
                          </p>
                          <p
                            className={`text-[14px] font-semibold tracking-tight ${request.status === "completed" ? "text-[#149911]" : "text-amber-600"}`}
                          >
                            {request.status === "completed"
                              ? "Fully Closed & Completed"
                              : "Pending Final Delivery/Payment"}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 md:p-6 bg-white rounded-3xl border border-gray-200/60 shadow-sm">
                        <div>
                          <h3 className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-3">
                            Client Details
                          </h3>
                          <p className="text-[14px] font-medium text-gray-900 mb-1">
                            {localOrder.customerName ||
                              quotation.customerName ||
                              "--"}
                          </p>
                          <p className="text-[13px] text-gray-600 mb-1">
                            {localOrder.company || quotation.company || "--"}
                          </p>
                          <p className="text-[13px] text-gray-600 leading-snug max-w-[280px] mb-1">
                            {quotation.address || "--"}
                          </p>
                          <p className="text-[13px] text-gray-600 font-mono">
                            {quotation.contactNumber || "--"}
                          </p>
                        </div>
                        <div className="pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-gray-100 md:pl-6">
                          <h3 className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-3">
                            Sales Agent
                          </h3>
                          <p className="text-[14px] font-medium text-gray-900">
                            {localOrder.salesPerson ||
                              quotation.salesPerson ||
                              "--"}
                          </p>
                        </div>
                      </div>

                      <div className="p-5 md:p-6 bg-white rounded-3xl border border-gray-200/60 shadow-sm">
                        <h3 className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-4">
                          Linked Supplier POs ({linkedPOs.length})
                        </h3>
                        <div className="flex flex-col gap-2.5">
                          {linkedPOs.map((po) => (
                            <div
                              key={po.id}
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-[#fbfbfd] rounded-2xl border border-gray-100"
                            >
                              <span className="font-medium text-[13px] text-gray-900 break-words">
                                <span className="font-mono text-gray-500 mr-2">
                                  {po.poNumber}
                                </span>
                                <span className="text-gray-300 mr-2">|</span>
                                {po.supplierName || "Unnamed"}
                              </span>
                              <span className="text-[9px] font-semibold tracking-wide px-2.5 py-1 text-center sm:w-auto bg-[#149911]/10 text-[#149911] rounded-full flex-shrink-0">
                                {po.status}
                              </span>
                            </div>
                          ))}
                          {linkedPOs.length === 0 && (
                            <p className="text-[13px] text-gray-400 italic">
                              No POs created.
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="p-5 md:p-6 bg-white rounded-3xl border border-gray-200/60 shadow-sm flex flex-col lg:flex-row gap-6 justify-between items-start">
                        <div className="flex-1 w-full lg:pr-8">
                          <h3 className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-4">
                            Order Items ({(localOrder.items || []).length})
                          </h3>
                          <div className="flex flex-col gap-3">
                            {orderItems.map((item: any, i: number) => (
                              <div
                                key={i}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-50 pb-3 last:border-0 last:pb-0"
                              >
                                <p className="text-[13px] text-gray-800 font-medium leading-tight">
                                  <span className="font-mono text-gray-400 inline-block min-w-[35px]">
                                    {Number(item.qty) || 0} {item.unit || "pcs"}
                                  </span>
                                  <span className="mx-2 text-gray-200">|</span>
                                  {item.description || "--"}
                                </p>
                                <p className="text-[13px] font-medium font-mono text-gray-900 sm:text-right flex-shrink-0">
                                  {peso(
                                    (Number(item.qty) || 0) *
                                      (Number(item.unitPrice) || 0),
                                  )}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {renderFinancialSummary()}
                      </div>
                    </div>
                  );
                })()
              )}
            </TabSection>
          )}
        </div>
      </div>
    </div>
  );
}

function TabSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <h2 className="text-[15px] font-semibold tracking-tight text-gray-900 mb-6 pb-3 border-b border-gray-100">
        {title}
      </h2>
      {children}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2.5 md:py-3 border-b border-gray-50 last:border-0 gap-1.5 sm:gap-3">
      <span className="text-[12px] font-medium text-gray-500 flex-shrink-0">
        {label}
      </span>
      <span
        className={`text-[13px] ${mono ? "font-mono tracking-tight" : ""} font-medium text-gray-900 sm:text-right break-words`}
      >
        {value}
      </span>
    </div>
  );
}

function EmptyStep({
  text,
  ctaLabel,
  href,
}: {
  text: string;
  ctaLabel?: string;
  href?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 md:p-12 bg-[#fbfbfd] rounded-3xl border border-dashed border-gray-200 text-center">
      <p className="text-[13px] text-gray-500 font-medium mb-5">{text}</p>
      {ctaLabel && href && (
        <Link
          href={href}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#1d1d1f] text-white hover:bg-gray-800 transition-all text-[11px] font-medium w-full sm:w-auto shadow-sm"
        >
          {ctaLabel} &rarr;
        </Link>
      )}
    </div>
  );
}
