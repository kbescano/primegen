"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import SupplierPickerModal from "@/components/SupplierPickerModal";
import { useRouter, useSearchParams } from "next/navigation";

type LineItem = {
  description: string;
  qty: number;
  unit: string;
  unitPrice: number;
  imageDataUrl?: string;
};

export type SupplierPOInitial = {
  id?: string | number;
  poNumber?: string;
  poDate?: string;
  supplierName?: string;
  supplierCompany?: string;
  supplierAddress?: string;
  supplierPhone?: string;
  preparedBy?: string;
  preparedByRole?: string;
  project?: string;
  items?: LineItem[];
  sourceOrderId?: string;
  sourceRequestId?: string;
  status?: string;
};

const peso = (n: number) =>
  n.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function formatDisplayDate(iso: string) {
  if (!iso) return "________";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString("en-US", { month: "short" });
  const year = String(d.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
}

const TERMS = [
  "By acknowledging or fulfilling this PO, Seller agrees to be bound by these Terms, unless otherwise agreed to in writing by both parties. No other terms proposed by Seller shall apply.",
  "Prices stated in the PO are firm and not subject to change.",
  "If Seller anticipates a delay, they must inform the Buyer immediately.",
  "Buyer reserves the right to cancel the PO or impose penalties for late delivery.",
  "Goods/services not conforming to the PO may be rejected, and Buyer may return them at Seller's risk and Expense.",
  "Title and risk of loss remain with Seller until delivery and acceptance by Buyer at the specified destination.",
  "Seller shall keep confidential all non-public information disclosed by Buyer and use it solely for fulfilling the PO.",
  "This PO and these Terms constitute the entire agreement between Buyer and Seller and supersede all prior communications.",
];

async function getDeepPipelineId(oid: string): Promise<string | undefined> {
  try {
    const oRes = await fetch(`/api/orders/${oid}?depth=0`, {
      credentials: "include",
    });
    if (!oRes.ok) return undefined;
    const oData = await oRes.json();

    const qId =
      typeof oData?.sourceQuotationId === "object"
        ? oData.sourceQuotationId?.id
        : oData?.sourceQuotationId;
    if (!qId) return undefined;

    const qRes = await fetch(`/api/client-quotations/${qId}?depth=0`, {
      credentials: "include",
    });
    if (!qRes.ok) return undefined;
    const qData = await qRes.json();

    const reqId =
      typeof qData?.sourceRequestId === "object"
        ? qData.sourceRequestId?.id
        : qData?.sourceRequestId;
    if (reqId) return String(reqId);
  } catch (e) {
    console.error("Failed resolving Deep Pipeline ID", e);
  }
  return undefined;
}

export default function SupplierPOGenerator({
  initial,
  showSupplierPicker = false,
  showBackToList = false,
  products = [],
  orderSalesPerson = "",
}: {
  initial?: SupplierPOInitial;
  showSupplierPicker?: boolean;
  showBackToList?: boolean;
  products?: { id: string | number; name: string; unit?: string }[];
  orderSalesPerson?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [poNumber, setPoNumber] = useState(initial?.poNumber ?? "");
  const [poDate, setPoDate] = useState(
    initial?.poDate ?? new Date().toISOString().slice(0, 10),
  );
  const [supplierName, setSupplierName] = useState(initial?.supplierName ?? "");
  const [companyName, setCompanyName] = useState(
    initial?.supplierCompany ?? "",
  );
  const [streetAddress, setStreetAddress] = useState(
    initial?.supplierAddress ?? "",
  );
  const [phone, setPhone] = useState(initial?.supplierPhone ?? "");

  const [preparedBy, setPreparedBy] = useState(
    initial?.preparedBy ?? orderSalesPerson,
  );
  const [preparedByRole, setPreparedByRole] = useState(
    initial?.preparedByRole ?? "Sales Rep.",
  );
  const [items, setItems] = useState<LineItem[]>(
    initial?.items && initial.items.length > 0
      ? initial.items
      : [{ description: "", qty: 1, unit: "pcs", unitPrice: 0 }],
  );
  const [saving, setSaving] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [saveErrorDetail, setSaveErrorDetail] = useState("");
  const [pickerOpen, setPickerOpen] = useState(showSupplierPicker);
  const [reminderOpen, setReminderOpen] = useState(false);

  const [pipelineId, setPipelineId] = useState<string | undefined>(
    initial?.sourceRequestId,
  );
  const [hasUrlContext, setHasUrlContext] = useState(false);
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [isFulfilled, setIsFulfilled] = useState(
    initial?.status === "fulfilled",
  );

  useEffect(() => {
    if (initial?.id && initial?.status !== "fulfilled") {
      fetch(`/api/supplier-purchase-orders/${initial.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.status === "fulfilled") {
            setIsFulfilled(true);
          }
        })
        .catch(() => {});
    }
  }, [initial?.id, initial?.status]);

  useEffect(() => {
    const hasParamContext =
      searchParams.has("orderId") ||
      searchParams.has("requestId") ||
      searchParams.has("pipelineId") ||
      searchParams.has("from");
    setHasUrlContext(hasParamContext);

    if (searchParams.get("mode") === "print") {
      setIsPrintMode(true);
    }

    const uOrderId = searchParams.get("orderId") || initial?.sourceOrderId;
    const uReqId =
      searchParams.get("pipelineId") ||
      searchParams.get("requestId") ||
      initial?.sourceRequestId;

    if (uReqId) {
      setPipelineId(String(uReqId));
      return;
    }

    if (uOrderId) {
      getDeepPipelineId(String(uOrderId)).then((res) => {
        if (res) {
          setPipelineId(res);
        }
      });
    }
  }, [initial, searchParams]);

  const isLocked = isPrintMode || isFulfilled;

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0),
    [items],
  );
  const total = subtotal;

  function updateItem(index: number, patch: Partial<LineItem>) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  }

  function handleImageSelect(index: number, file: File | null) {
    if (!file) {
      updateItem(index, { imageDataUrl: undefined });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      updateItem(index, { imageDataUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  }

  const isEditing = Boolean(initial?.id);

  function handleSelectSupplier(s: {
    name: string;
    company?: string;
    address?: string;
    phone?: string;
  }) {
    setSupplierName(s.name);
    setCompanyName(s.company ?? "");
    setStreetAddress(s.address ?? "");
    setPhone(s.phone ?? "");
    setPickerOpen(false);
  }

  async function upsertSupplierRecord() {
    if (!supplierName) return;
    try {
      const findRes = await fetch(
        `/api/suppliers?where[name][equals]=${encodeURIComponent(supplierName)}&limit=1`,
        { credentials: "include" },
      );
      const findData = await findRes.json();
      const existing = findData?.docs?.[0];
      const supplierPayload = {
        name: supplierName,
        company: companyName,
        address: streetAddress,
        phone,
        status: "active",
      };
      if (existing) {
        await fetch(`/api/suppliers/${existing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(supplierPayload),
        });
      } else {
        await fetch("/api/suppliers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(supplierPayload),
        });
      }
    } catch {}
  }

  function getMissingFields(): string[] {
    const missing: string[] = [];
    if (!supplierName.trim()) missing.push("Supplier Name");
    if (!companyName.trim()) missing.push("Company Name");
    if (!streetAddress.trim()) missing.push("Street Address");
    if (!phone.trim()) missing.push("Phone");
    if (!preparedBy.trim()) missing.push("Prepared By");
    items.forEach((item, i) => {
      const label = item.description.trim() || `Item ${i + 1}`;
      if (!item.description.trim())
        missing.push(`Item ${i + 1} -- Description`);
      if (!item.unitPrice) missing.push(`${label} -- Price`);
    });
    return missing;
  }

  async function savePO() {
    setSaving("saving");
    try {
      const targetOrderId =
        initial?.sourceOrderId || searchParams.get("orderId");
      let finalPipelineId = pipelineId;

      if (!finalPipelineId && targetOrderId) {
        finalPipelineId = await getDeepPipelineId(String(targetOrderId));
      }

      const url = isEditing
        ? `/api/supplier-purchase-orders/${initial?.id}`
        : "/api/supplier-purchase-orders";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          poDate,
          supplierName,
          supplierAddress: streetAddress,
          supplierCompany: companyName,
          supplierPhone: phone,
          preparedBy,
          preparedByRole,
          items: items.map(({ imageDataUrl, ...rest }) => rest),
          status: "draft",
          sourceOrderId: targetOrderId,
          sourceRequestId: finalPipelineId,
        }),
      });

      if (!res.ok) {
        let detail = `HTTP ${res.status}`;
        try {
          const errBody = await res.json();
          detail = errBody?.errors?.[0]?.message || errBody?.message || detail;
        } catch {}
        throw new Error(detail);
      }

      const saved = await res.json();
      setPoNumber(saved.doc.poNumber);
      await upsertSupplierRecord();

      // Keep the Order's own copy of qty/cost in sync with this PO --
      // orders_items.qty/unitCost is a separate stored snapshot (that's
      // what /orders and the Pipeline actually render), not a live read of
      // the PO. Previously this block only ran `if (!isEditing)`, so
      // creating a PO auto-assigned + synced fine, but editing an existing
      // PO's quantity/price afterward silently never propagated anywhere --
      // the Order kept showing whatever was true at PO-creation time.
      if (targetOrderId && saved.doc?.id) {
        // Force Next.js to fetch the absolute latest order state by skipping cache
        const orderRes = await fetch(`/api/orders/${targetOrderId}?depth=0`, {
          credentials: "include",
          cache: "no-store",
        });

        if (orderRes.ok) {
          const orderData = await orderRes.json();
          const orderItems: any[] = orderData.items || [];

          let updatedItems: any[];
          if (!isEditing) {
            // New PO, "one single supplier" flow: assign every order item
            // to it, and seed qty/cost from what was actually keyed into
            // the PO form (positionally aligned -- this form's initial
            // items came from these same order items in the same order).
            updatedItems = orderItems.map((item, i) => ({
              ...item,
              assignedPOId: String(saved.doc.id),
              qty: items[i]?.qty ?? item.qty,
              unitCost: items[i]?.unitPrice ?? item.unitCost,
            }));
          } else {
            // Editing an existing PO: push qty/price changes back to
            // whichever order items are already assigned to it, matched
            // positionally within that subset.
            const assignedPositions = orderItems
              .map((item, i) => ({ item, i }))
              .filter(({ item }) => String(item.assignedPOId) === String(saved.doc.id));
            updatedItems = [...orderItems];
            assignedPositions.forEach(({ i }, matchIdx) => {
              const poItem = items[matchIdx];
              if (poItem) {
                updatedItems[i] = {
                  ...updatedItems[i],
                  qty: poItem.qty,
                  unitCost: poItem.unitPrice,
                };
              }
            });
          }

          const patchRes = await fetch(`/api/orders/${targetOrderId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ items: updatedItems }),
          });

          if (!patchRes.ok) {
            console.error("Failed to sync PO changes back to order in Payload CMS");
          }
        }
      }

      setSaving("saved");

      // CRITICAL FIX: Use window.location.href to force the browser to reload the page.
      // This entirely bypasses Next.js's route cache and guarantees the Pipeline UI is 100% fresh.
      if (
        hasUrlContext &&
        finalPipelineId &&
        finalPipelineId !== "undefined" &&
        finalPipelineId !== "null"
      ) {
        window.location.href = `/admin-dashboard/pipeline/${finalPipelineId}?step=supplierPO`;
      } else {
        window.location.href = "/admin-dashboard/supplier-po";
      }
    } catch (err: any) {
      setSaving("error");
      setSaveErrorDetail(err?.message || "Unknown error");
    }
  }

  const inputClass =
    "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px] text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-gray-300 focus:ring-4 focus:ring-gray-100/50 transition-all outline-none";
  const labelClass =
    "block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2";

  return (
    <div className="w-full max-w-[1000px] mx-auto p-4 md:p-8 bg-[#fbfbfd] min-h-screen antialiased print:min-h-0 print:p-0 print:m-0 print:bg-white">
      {pickerOpen && (
        <SupplierPickerModal
          onSelect={handleSelectSupplier}
          onSkip={() => setPickerOpen(false)}
        />
      )}

      {reminderOpen && (
        <div className="fixed inset-0 bg-[#1d1d1f]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-8 rounded-[2rem] shadow-2xl">
            <h2 className="text-[18px] font-semibold tracking-tight text-gray-900 mb-2">
              Missing Information
            </h2>
            <p className="text-[13px] text-gray-500 mb-5">
              You can still save, but double-check these empty fields:
            </p>
            <ul className="flex flex-col gap-2 mb-6 max-h-[200px] overflow-y-auto">
              {getMissingFields().map((f, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 text-[13px] text-gray-700 font-medium"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setReminderOpen(false)}
                className="w-full sm:flex-1 py-3 rounded-full border border-gray-200 text-gray-700 font-medium text-[12px] hover:bg-gray-50 transition-colors shadow-sm"
              >
                Go Back
              </button>
              <button
                onClick={() => {
                  setReminderOpen(false);
                  savePO();
                }}
                className="w-full sm:flex-1 py-3 rounded-full bg-[#149911] text-white font-medium text-[12px] hover:bg-[#103900] transition-colors shadow-sm"
              >
                Save Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
          html, body { height: auto !important; min-height: auto !important; overflow: visible !important; background: white !important; }
          .po-print-doc { zoom: 0.85; page-break-inside: avoid; margin: 0 !important; }
        }
      `}</style>

      {/* ===== FORM (hidden when printing) ===== */}
      <div className="print:hidden w-full">
        <div className="mb-6 md:mb-10">
          {showBackToList && (
            <button
              onClick={(e) => {
                e.preventDefault();
                // Also hard-reload on the back button to be safe
                if (
                  hasUrlContext &&
                  pipelineId &&
                  pipelineId !== "undefined" &&
                  pipelineId !== "null"
                ) {
                  window.location.href = `/admin-dashboard/pipeline/${pipelineId}?step=${isLocked ? "fulfilled" : "supplierPO"}`;
                } else {
                  window.location.href = "/admin-dashboard/supplier-po";
                }
              }}
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-400 hover:text-gray-900 transition-colors mb-6 focus:outline-none"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
              {hasUrlContext &&
              pipelineId &&
              pipelineId !== "undefined" &&
              pipelineId !== "null"
                ? "Back to Pipeline"
                : "Back to PO List"}
            </button>
          )}
          <h1 className="text-[24px] sm:text-[26px] md:text-[32px] font-semibold tracking-tight text-gray-900 mb-2">
            {isFulfilled
              ? "Fulfilled Purchase Order"
              : isPrintMode
                ? "Print Purchase Order"
                : isEditing
                  ? "Edit Purchase Order"
                  : "New Purchase Order"}
          </h1>
          <p className="text-[13px] sm:text-[14px] text-gray-500 font-medium max-w-[560px]">
            {isFulfilled
              ? "This purchase order has been fulfilled and is locked. You can print or save a copy for your records."
              : isPrintMode
                ? "Review the final document below and click Print to issue this PO."
                : "Fill in the details below. Save to auto-generate the PO number, then use Print / Save as PDF to send to the supplier."}
          </p>
        </div>

        <p className="flex flex-col sm:flex-row items-start sm:items-center gap-3 text-[12px] text-amber-800 bg-amber-50/50 border border-amber-200/60 rounded-2xl px-4 sm:px-5 py-3 sm:py-4 mb-6 sm:mb-8 font-medium">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="flex-shrink-0 mt-0.5 sm:mt-0 text-amber-500"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className="leading-snug">
            Before printing: in the print dialog, open &quot;More settings&quot;
            and uncheck &quot;Headers and footers&quot; to remove the
            browser&apos;s default URL/date markings.
          </span>
        </p>

        <div
          className={`bg-white rounded-[1.5rem] md:rounded-[2rem] border border-gray-100/80 p-5 md:p-8 shadow-[0_4px_32px_rgba(0,0,0,0.02)] mb-8 ${isLocked ? "opacity-50 pointer-events-none" : ""}`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 mb-8">
            <div>
              <label className={labelClass}>PO Date</label>
              <input
                type="date"
                className={inputClass}
                value={poDate}
                onChange={(e) => setPoDate(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>PO #</label>
              <input
                className={`${inputClass} bg-gray-100/50 text-gray-400 cursor-not-allowed`}
                value={poNumber || "Auto-generated on save"}
                readOnly
              />
            </div>

            <div className="col-span-1 md:col-span-2 mt-4 pt-6 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-[15px] font-semibold text-gray-900">
                Supplier Details
              </h2>
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="w-full sm:w-auto text-[11px] font-semibold px-4 py-2 bg-[#149911]/10 text-[#149911] hover:bg-[#149911]/20 rounded-full transition-colors"
              >
                Select or Add Supplier
              </button>
            </div>

            <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              <div>
                <label className={labelClass}>Supplier Name</label>
                <input
                  className={inputClass}
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="e.g. NORTHMETAL"
                />
              </div>
              <div>
                <label className={labelClass}>Company Name</label>
                <input
                  className={inputClass}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. NORTHMETAL"
                />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className={labelClass}>Street Address</label>
                <input
                  className={inputClass}
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="e.g. Caloocan"
                />
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input
                  className={inputClass}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+639..."
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4 pt-6 border-t border-gray-100">
            <h2 className="text-[15px] font-semibold tracking-tight text-gray-900">
              Line Items
            </h2>
            <span className="text-[11px] font-medium bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
              {items.length}
            </span>
          </div>

          <div className="flex flex-col gap-4 mb-6">
            {items.map((item, index) => (
              <div
                key={index}
                className="bg-gray-50/50 border border-gray-100 rounded-2xl p-4 transition-shadow hover:shadow-sm"
              >
                {products.length > 0 && (
                  <select
                    onChange={(e) => {
                      const p = products.find(
                        (prod) => String(prod.id) === e.target.value,
                      );
                      if (p)
                        updateItem(index, {
                          description: p.name,
                          unit: p.unit || item.unit,
                        });
                      e.target.value = "";
                    }}
                    defaultValue=""
                    className="w-full mb-4 px-3 py-2 text-[12px] font-medium bg-white border border-gray-200 rounded-lg text-gray-500 outline-none focus:ring-2 focus:ring-gray-200 cursor-pointer"
                  >
                    <option value="" disabled>
                      -- Quick-pick a product (optional) --
                    </option>
                    {products.map((p) => (
                      <option key={p.id} value={String(p.id)}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                )}

                <div className="grid grid-cols-12 md:grid-cols-[1fr_70px_90px_120px_120px_36px] gap-3 items-center">
                  <input
                    className={`${inputClass} col-span-12 md:col-span-1`}
                    value={item.description}
                    onChange={(e) =>
                      updateItem(index, { description: e.target.value })
                    }
                    placeholder="Description"
                  />
                  <input
                    type="text"
                    className={`${inputClass} col-span-4 md:col-span-1`}
                    value={item.qty}
                    onChange={(e) =>
                      updateItem(index, { qty: Number(e.target.value) || 0 })
                    }
                    placeholder="Qty"
                  />
                  <input
                    className={`${inputClass} col-span-4 md:col-span-1`}
                    value={item.unit}
                    onChange={(e) =>
                      updateItem(index, { unit: e.target.value })
                    }
                    placeholder="Unit"
                  />
                  <input
                    type="text"
                    className={`${inputClass} col-span-4 md:col-span-1`}
                    value={item.unitPrice}
                    onChange={(e) =>
                      updateItem(index, {
                        unitPrice: Number(e.target.value) || 0,
                      })
                    }
                    placeholder="Price"
                  />
                  <div className="col-span-6 md:col-span-1 text-[13px] text-left md:text-right font-mono text-gray-900 font-medium flex items-center md:justify-end overflow-hidden">
                    <span className="md:hidden text-gray-400 mr-2 text-[11px] uppercase tracking-wider shrink-0">
                      Total:
                    </span>
                    <span className="truncate">
                      {peso(item.qty * item.unitPrice)}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      setItems((prev) => prev.filter((_, i) => i !== index))
                    }
                    disabled={items.length === 1}
                    className="col-span-6 md:col-span-1 text-gray-400 hover:text-red-500 disabled:opacity-0 disabled:pointer-events-none transition-colors text-sm font-medium flex items-center justify-end md:justify-center gap-1"
                    aria-label="Remove line item"
                  >
                    <span className="md:hidden text-[12px] uppercase tracking-wide">
                      Remove
                    </span>
                    <span className="hidden md:inline text-lg">&times;</span>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-4 pt-4 border-t border-gray-200/60">
                  <label className="text-[11px] font-medium text-gray-500 flex items-center gap-2 cursor-pointer w-full sm:w-auto">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleImageSelect(index, e.target.files?.[0] ?? null)
                      }
                    />
                    <span className="w-full sm:w-auto text-center px-4 py-2 border border-dashed border-gray-300 rounded-lg text-[#149911] hover:border-[#149911] hover:bg-[#149911]/5 transition-all duration-200">
                      {item.imageDataUrl
                        ? "Change spec image"
                        : "+ Add spec image"}
                    </span>
                  </label>
                  {item.imageDataUrl && (
                    <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
                      <img
                        src={item.imageDataUrl}
                        alt=""
                        className="h-10 w-10 object-contain border border-gray-200 bg-white rounded-lg flex-shrink-0"
                      />
                      <button
                        type="button"
                        onClick={() => handleImageSelect(index, null)}
                        className="text-[11px] font-medium text-red-500 hover:text-red-600"
                      >
                        Remove Image
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() =>
              setItems((prev) => [
                ...prev,
                { description: "", qty: 1, unit: "pcs", unitPrice: 0 },
              ])
            }
            className="text-[12px] font-medium text-[#149911] border border-dashed border-gray-300 rounded-xl px-5 py-3 mb-8 hover:border-[#149911] hover:bg-[#149911]/5 transition-all w-full md:w-auto"
          >
            + Add Line Item
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 pt-6 border-t border-gray-100">
            <div>
              <label className={labelClass}>Prepared By (Name)</label>
              <input
                className={inputClass}
                value={preparedBy}
                onChange={(e) => setPreparedBy(e.target.value)}
                placeholder="e.g. Nira"
              />
            </div>
            <div>
              <label className={labelClass}>Prepared By (Role)</label>
              <input
                className={inputClass}
                value={preparedByRole}
                onChange={(e) => setPreparedByRole(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-8 w-full">
          {!isLocked && (
            <button
              onClick={() => {
                if (getMissingFields().length > 0) {
                  setReminderOpen(true);
                } else {
                  savePO();
                }
              }}
              disabled={saving === "saving"}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-full font-medium text-[13px] disabled:opacity-50 transition-all duration-300 shadow-sm ${
                saving === "saved"
                  ? "bg-[#149911] text-white"
                  : "bg-[#1d1d1f] text-white hover:bg-gray-800"
              }`}
            >
              {saving === "saving"
                ? "Saving..."
                : saving === "saved"
                  ? "Saved ✓"
                  : isEditing
                    ? "Update Purchase Order"
                    : "Save Purchase Order"}
            </button>
          )}

          <button
            type="button"
            onClick={async () => {
              if (initial?.id && isPrintMode && !isFulfilled) {
                try {
                  await fetch(`/api/supplier-purchase-orders/${initial.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ status: "issued" }),
                  });
                } catch (e) {}
              }
              const originalTitle = document.title;
              document.title = poNumber
                ? `Purchase_Order_${poNumber}`
                : "Purchase_Order";

              window.print();

              // Restore the original title so the browser tab name goes back to normal
              document.title = originalTitle;
            }}
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#149911] border border-transparent text-white font-medium text-[13px] hover:bg-[#103900] transition-all duration-300 shadow-sm"
          >
            Print / Save as PDF
          </button>
        </div>

        {saving === "error" && (
          <p className="text-[13px] font-medium text-red-500 mb-8 bg-red-50 border border-red-100 p-4 rounded-xl">
            {saveErrorDetail || "Save failed. Please try again."}
          </p>
        )}

        <div className="flex items-center gap-4 mb-6 md:mb-8 pt-6 border-t border-gray-200">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-400">
            Document Preview
          </span>
        </div>
      </div>

      {/* ===== FORMAL PURCHASE ORDER DOCUMENT ===== */}
      <div className="po-print-doc bg-white border border-gray-200 rounded-[1.5rem] md:rounded-3xl p-4 sm:p-6 md:p-10 print:border-0 print:p-10 print:rounded-none text-[#01172f] shadow-sm print:shadow-none print:w-full print:max-w-none overflow-hidden print:overflow-visible">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 print:gap-3 mb-6 print:mb-4">
          <div className="flex gap-2 sm:gap-3 items-center">
            <div className="relative w-16 h-16 sm:w-32 sm:h-32 md:w-44 md:h-44 flex-shrink-0 overflow-hidden">
              <Image
                src="/branding/primegen_trading_logo.png"
                alt="Primegen Trading Corporation"
                fill
                className="object-contain scale-[1.1]"
              />
            </div>
            <div>
              <h2 className="text-sm sm:text-lg md:text-xl font-black leading-none text-[#103900] tracking-tight">
                PRIMEGEN
              </h2>
              <p className="text-[7px] sm:text-[9px] md:text-[11px] font-bold tracking-[0.2em] text-[#01172f] mt-0 mb-1 sm:mb-1.5">
                TRADING CORPORATION
              </p>
              <div className="w-full max-w-[120px] sm:max-w-[200px] md:max-w-[240px] h-[2px] bg-[#149911] mb-1 sm:mb-1.5" />
              <p className="text-[6px] sm:text-[8px] md:text-[9px] font-bold text-[#103900] leading-snug max-w-[150px] sm:max-w-[200px] md:max-w-[240px] m-0">
                SOUTHERN CITY HOMES, YG BUILDING, CEBU ST, 4 TANZANG LUMA, IMUS,
                4103 CAVITE, PHILIPPINES
              </p>
              <p className="text-[6px] sm:text-[8px] md:text-[9px] font-bold text-[#103900] m-0 mt-1">
                0917-185-9127 / 0917-133-9515 / 046-8860853
              </p>
              <p className="text-[6px] sm:text-[8px] md:text-[9px] font-bold text-[#103900] m-0 mt-1">
                SALES@PRIMEGENTRADINGCORP.COM
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right w-full sm:w-auto border-t sm:border-0 border-gray-100 pt-3 sm:pt-0 mt-2 sm:mt-0">
            <span className="inline-block bg-[#3D5F3B] text-white text-[10px] sm:text-sm print:text-[11px] font-bold tracking-wide px-3 sm:px-4 print:px-3 py-1 sm:py-1.5 print:py-1 mb-2 sm:mb-3 print:mb-2">
              PURCHASE ORDER
            </span>
            <table className="text-[10px] sm:text-sm print:text-xs ml-0 sm:ml-auto mt-1 sm:mt-0">
              <tbody>
                <tr>
                  <td className="px-1 sm:px-2 py-0.5 font-bold text-left sm:text-right">
                    PO#:
                  </td>
                  <td className="px-1 sm:px-2 py-0.5 font-mono">
                    {poNumber || "________"}
                  </td>
                </tr>
                <tr>
                  <td className="px-1 sm:px-2 py-0.5 font-bold text-left sm:text-right">
                    DATE:
                  </td>
                  <td className="px-1 sm:px-2 py-0.5">
                    {formatDisplayDate(poDate)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mb-4 sm:mb-6 print:mb-4">
          <div className="bg-[#3D5F3B] text-white text-[10px] sm:text-xs font-bold uppercase tracking-wide px-2 sm:px-3 py-1 print:py-0.5">
            Supplier
          </div>
          <div className="text-[10px] sm:text-sm print:text-[11px] flex flex-col gap-0.5 py-1.5 sm:py-2 print:py-1">
            <p>NAME: {supplierName || "________"}</p>
            <p>COMPANY NAME: {companyName || "________"}</p>
            <p>STREET ADDRESS: {streetAddress || "________"}</p>
            <p>PHONE: {phone || "________"}</p>
          </div>
        </div>

        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-[10px] sm:text-sm print:text-xs mb-2 border-collapse min-w-[500px] md:min-w-full print:min-w-0">
            <thead>
              <tr className="bg-[#3D5F3B] text-white text-[9px] sm:text-xs print:text-[10px] uppercase tracking-wide">
                <th className="py-2 sm:py-3.5 print:py-1.5 px-2 sm:px-4 print:px-2 text-left">
                  Description
                </th>
                <th className="py-2 sm:py-3.5 print:py-1.5 px-2 sm:px-4 print:px-2 text-right w-[50px] sm:w-[70px]">
                  Qty.
                </th>
                <th className="py-2 sm:py-3.5 print:py-1.5 px-2 sm:px-4 print:px-2 text-right w-[80px] sm:w-[120px]">
                  Price
                </th>
                <th className="py-2 sm:py-3.5 print:py-1.5 px-2 sm:px-4 print:px-2 text-right w-[80px] sm:w-[120px]">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className={i % 2 === 1 ? "bg-gray-50" : ""}>
                  <td className="py-2 sm:py-3.5 print:py-1.5 px-2 sm:px-4 print:px-2 border-b border-gray-100">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="whitespace-normal sm:whitespace-nowrap">
                        {item.description || "--"}
                      </span>
                      {item.imageDataUrl && (
                        <img
                          src={item.imageDataUrl}
                          alt=""
                          className="h-8 sm:h-16 print:h-8 w-auto object-contain flex-shrink-0"
                        />
                      )}
                    </div>
                  </td>
                  <td className="py-2 sm:py-3.5 print:py-1.5 px-2 sm:px-4 print:px-2 border-b border-gray-100 text-right">
                    {item.qty}
                  </td>
                  <td className="py-2 sm:py-3.5 print:py-1.5 px-2 sm:px-4 print:px-2 border-b border-gray-100 text-right font-mono">
                    ₱{peso(item.unitPrice)}
                  </td>
                  <td className="py-2 sm:py-3.5 print:py-1.5 px-2 sm:px-4 print:px-2 border-b border-gray-100 text-right font-mono">
                    ₱{peso(item.qty * item.unitPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mt-6 sm:mt-10 print:mt-10 mb-6 sm:mb-10 print:mb-10">
          <table className="text-[10px] sm:text-sm print:text-xs w-full max-w-[200px] sm:max-w-[280px]">
            <tbody>
              <tr>
                <td className="py-1.5 sm:py-2.5 print:py-1 px-2 sm:px-4 print:px-2 bg-[#e8f0e5]">
                  SUBTOTAL
                </td>
                <td className="py-1.5 sm:py-2.5 print:py-1 px-2 sm:px-4 print:px-2 bg-[#e8f0e5] text-right font-mono">
                  ₱{peso(subtotal)}
                </td>
              </tr>
              <tr className="border-t-2 border-[#3D5F3B]">
                <td className="py-2 sm:py-3.5 print:py-1.5 px-2 sm:px-4 print:px-2 font-bold text-[11px] sm:text-base print:text-[13px] bg-[#e8f0e5]">
                  TOTAL
                </td>
                <td className="py-2 sm:py-3.5 print:py-1.5 px-2 sm:px-4 print:px-2 font-bold text-[11px] sm:text-base print:text-[13px] text-right font-mono bg-[#e8f0e5]">
                  ₱{peso(total)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-6 sm:mt-10 print:mt-4 mb-6 sm:mb-10 print:mb-4 text-[9px] sm:text-[11px] print:text-[8px] leading-snug sm:leading-relaxed print:leading-tight print:break-inside-avoid">
          <div className="bg-[#3D5F3B] text-white text-[9px] sm:text-xs print:text-[9px] font-bold uppercase tracking-wide px-2 sm:px-3 py-1 sm:py-1.5 print:py-1 mb-2 sm:mb-3 print:mb-1.5">
            Terms and Condition
          </div>
          <ol className="list-decimal pl-4 flex flex-col gap-1 sm:gap-1.5 print:gap-0.5 text-gray-700">
            {TERMS.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ol>
        </div>

        <div className="text-[10px] sm:text-sm print:text-[11px] print:break-inside-avoid mt-6 sm:mt-10 print:mt-6">
          <p className="font-bold mb-4 sm:mb-8 print:mb-4">PREPARED BY:</p>
          <div className="border-t border-black w-[160px] sm:w-[220px] mb-1" />
          <p className="font-bold">{preparedBy || "________"}</p>
          <p className="text-gray-600 text-[8px] sm:text-xs print:text-[9px] uppercase tracking-wide">
            {preparedByRole}
          </p>
        </div>
      </div>
    </div>
  );
}
