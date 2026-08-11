"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import DateGranularityFilter from "@/components/DateGranularityFilter";
import CreateRFQModal from "@/components/CreateRFQModal";

const STATUS_KEYS = ["pending", "processing", "quote-sent", "completed", "rejected"] as const;

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  "quote-sent": "Quote Sent",
  completed: "Completed",
  rejected: "Rejected",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#94a3b8",
  processing: "#d97706",
  "quote-sent": "#2563eb",
  completed: "#149911",
  rejected: "#dc2626",
};

type TableRow = {
  reqId: string;
  isFirstOfRequest: boolean;
  rowSpan: number;
  reqDate?: string;
  customerName?: string;
  company?: string;
  contact?: string;
  assignedStaff?: string;
  status?: string;
  pipelineHref?: string;
  quoteId?: string | null;
  orderId?: string | null;
  poLabel: string;
  poStatus?: string;
  poHref?: string;
  supplierCompany?: string;
  supplierPhone?: string;
  itemDesc: string;
  itemQty: string;
};

export default function StaffPerformanceClient({
  initialStaff,
  initialStatus,
  granularity,
  periodValue,
  staffList,
  products,
  requests,
  quotationByRequestId,
  orderByQuotationId,
  posByOrderId,
}: {
  initialStaff?: string;
  initialStatus?: string;
  granularity: string;
  periodValue: string;
  staffList: any[];
  products: any[];
  requests: any[];
  quotationByRequestId: Record<string, any>;
  orderByQuotationId: Record<string, any>;
  posByOrderId: Record<string, any[]>;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [activeStaff, setActiveStaff] = useState<string | undefined>(initialStaff);
  const [activeStatus, setActiveStatus] = useState<string | undefined>(initialStatus);

  // Sync state if user uses browser Back/Forward navigation
  useEffect(() => {
    setActiveStaff(searchParams.get("staff") || undefined);
    setActiveStatus(searchParams.get("status") || undefined);
  }, [searchParams]);

  const handleStaffToggle = (staffId?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (staffId) params.set("staff", staffId);
    else params.delete("staff");
    window.history.replaceState(null, "", `${pathname}?${params.toString()}`);
    startTransition(() => setActiveStaff(staffId));
  };

  const handleStatusToggle = (status?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (status) params.set("status", status);
    else params.delete("status");
    window.history.replaceState(null, "", `${pathname}?${params.toString()}`);
    startTransition(() => setActiveStatus(status));
  };

  // Process and shape all data instantly on the client whenever filters change
  const {
    filteredRequests,
    staffRows,
    unassignedCount,
    overallCounts,
    overallTotal,
    overallCompletionRate,
    tableRows,
  } = useMemo(() => {
    // 1. FILTER REQUESTS
    const filtered = requests.filter((r) => {
      let pass = true;
      if (activeStaff) {
        // String conversion handles payload DB ID mismatches automatically
        const assignedId = r.assignedTo ? String(typeof r.assignedTo === "object" ? r.assignedTo.id : r.assignedTo) : null;
        if (assignedId !== activeStaff) pass = false;
      }
      if (activeStatus && r.status !== activeStatus) {
        pass = false;
      }
      return pass;
    });

    // 2. COMPUTE STAFF ROWS
    const byStaff: Record<string, { name: string; counts: Record<string, number>; total: number }> = {};
    for (const s of staffList) {
      byStaff[String(s.id)] = { name: s.name || s.email, counts: Object.fromEntries(STATUS_KEYS.map((k) => [k, 0])), total: 0 };
    }
    
    let unassigned = 0;
    for (const r of filtered) {
      const assignedId = r.assignedTo ? String(typeof r.assignedTo === "object" ? r.assignedTo.id : r.assignedTo) : null;
      if (!assignedId || !byStaff[assignedId]) {
        unassigned++;
        continue;
      }
      byStaff[assignedId].total++;
      if (STATUS_KEYS.includes(r.status)) byStaff[assignedId].counts[r.status]++;
    }
    
    const computedStaffRows = Object.entries(byStaff).map(([id, data]) => ({
      id, ...data, completionRate: data.total > 0 ? Math.round((data.counts["completed"] / data.total) * 100) : 0,
    }));

    // 3. COMPUTE OVERALL ROWS
    const computedOverallCounts: Record<string, number> = Object.fromEntries(STATUS_KEYS.map((k) => [k, 0]));
    const computedOverallTotal = filtered.length;
    for (const r of filtered) {
      if (STATUS_KEYS.includes(r.status)) computedOverallCounts[r.status]++;
    }
    const computedOverallCompletionRate = computedOverallTotal > 0 ? Math.round((computedOverallCounts["completed"] / computedOverallTotal) * 100) : 0;

    // 4. FLATTEN SPREADSHEET TABLE ROWS
    const computedTableRows: TableRow[] = [];
    for (const req of filtered) {
      const assignedStaffName = req.assignedTo ? (typeof req.assignedTo === "object" ? req.assignedTo.name || req.assignedTo.email : req.assignedTo) : "Unassigned";
      const reqDate = new Date(req.createdAt).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
      const safeReqId = String(req.id || "");
      const linkedQuotation = quotationByRequestId[safeReqId] || null;
      const safeQuoteId = linkedQuotation ? String(linkedQuotation.id) : null;
      const linkedOrder = safeQuoteId ? orderByQuotationId[safeQuoteId] || null : null;
      const safeOrderId = linkedOrder ? String(linkedOrder.id) : null;
      const reqPOs = safeOrderId ? posByOrderId[safeOrderId] || [] : [];
      const hasOrder = Boolean(linkedOrder);

      const orderItems: any[] = linkedOrder?.items || [];
      const poById: Record<string, any> = {};
      for (const po of reqPOs) poById[String(po.id)] = po;

      const itemsByPO: Record<string, any[]> = {};
      const unassignedOrderItems: any[] = [];
      for (const item of orderItems) {
        const poId = item.assignedPOId ? String(item.assignedPOId) : null;
        if (poId && poById[poId]) {
          if (!itemsByPO[poId]) itemsByPO[poId] = [];
          itemsByPO[poId].push(item);
        } else {
          unassignedOrderItems.push(item);
        }
      }

      const baseMeta = {
        reqId: safeReqId, reqDate, customerName: req.customerName || "Unnamed Client", company: req.company || "",
        contact: req?.email ? `${req.email} | ${req.phone}` : req.phone || "", assignedStaff: assignedStaffName, status: req.status,
        pipelineHref: `/admin-dashboard/pipeline/${safeReqId}`, quoteId: safeQuoteId, orderId: safeOrderId,
      };

      const rowsForRequest: Omit<TableRow, "isFirstOfRequest" | "rowSpan">[] = [];

      if (!hasOrder) {
        if (req.items && req.items.length > 0) {
          for (const item of req.items) {
            const materialName = item.material ? (typeof item.material === "object" ? item.material.name : "Unknown Material") : "Custom Item";
            rowsForRequest.push({ reqId: safeReqId, poLabel: "\u2014", itemDesc: materialName, itemQty: `x${item.quantity || 1}` });
          }
        } else {
          rowsForRequest.push({ reqId: safeReqId, poLabel: "\u2014", itemDesc: "No items recorded", itemQty: "\u2014" });
        }
      } else {
        for (const po of reqPOs) {
          const poIdStr = String(po.id);
          const poNumber = po.poNumber || `PO #${poIdStr.substring(0, 6)}`;
          const supplierName = po.supplierName || (po.supplier && typeof po.supplier === "object" ? po.supplier.name : null) || "Unnamed Supplier";
          const supplierCompany = po.supplierCompany || (po.supplier && typeof po.supplier === "object" ? po.supplier.company : null);
          const supplierPhone = po.supplierPhone || (po.supplier && typeof po.supplier === "object" ? po.supplier.phone : null);
          const poHref = `/admin-dashboard/supplier-po?listSupplier=${encodeURIComponent(supplierName)}`;
          const poItems = itemsByPO[poIdStr] || [];

          if (poItems.length > 0) {
            for (const item of poItems) {
              rowsForRequest.push({ reqId: safeReqId, poLabel: `${poNumber} \u00b7 ${supplierName}`, poStatus: po.status || "active", poHref, supplierCompany, supplierPhone, itemDesc: item.description || "Unnamed item", itemQty: `${item.qty || 1} ${item.unit || "pcs"}` });
            }
          } else {
            rowsForRequest.push({ reqId: safeReqId, poLabel: `${poNumber} \u00b7 ${supplierName}`, poStatus: po.status || "active", poHref, supplierCompany, supplierPhone, itemDesc: "No items assigned", itemQty: "\u2014" });
          }
        }
        for (const item of unassignedOrderItems) {
          rowsForRequest.push({ reqId: safeReqId, poLabel: "Unassigned", itemDesc: item.description || "Unnamed item", itemQty: `${item.qty || 1} ${item.unit || "pcs"}` });
        }
        if (rowsForRequest.length === 0) {
          rowsForRequest.push({ reqId: safeReqId, poLabel: "\u2014", itemDesc: "No items on this order", itemQty: "\u2014" });
        }
      }

      rowsForRequest.forEach((row, idx) => {
        computedTableRows.push({ ...row, ...(idx === 0 ? baseMeta : {}), isFirstOfRequest: idx === 0, rowSpan: rowsForRequest.length });
      });
    }

    return { filteredRequests: filtered, staffRows: computedStaffRows, unassignedCount: unassigned, overallCounts: computedOverallCounts, overallTotal: computedOverallTotal, overallCompletionRate: computedOverallCompletionRate, tableRows: computedTableRows };
  }, [requests, activeStaff, activeStatus, staffList, quotationByRequestId, orderByQuotationId, posByOrderId]);

  const thClass = "bg-[#01172f] text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-2.5 text-left border-r border-[#1a2d42] last:border-0";
  const tdClass = "px-2.5 py-3 border border-gray-200 align-top text-[10px] break-words";

  return (
    <div className="max-w-[1100px] mx-auto py-6 sm:py-10 lg:px-4 sm:px-0 font-sans text-gray-800">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 mb-1">
            Inquiry Overview
          </h1>
          <p className="text-[13px] text-gray-500">
            Track workload, filter statuses, and review active requests as a spreadsheet.
            {unassignedCount > 0 && (
              <span className="text-amber-600 font-medium ml-2">
                ({unassignedCount} unassigned)
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CreateRFQModal products={products} />
        </div>
      </div>

      {/* Minimalist Filter Section */}
      <div className="flex flex-col gap-5 mb-12">
        {/* Staff Filter */}
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 w-20 shrink-0">
            Staff
          </span>
          <div className="flex flex-wrap gap-2">
             <button
              onClick={() => handleStaffToggle(undefined)}
              className={`text-[12px] font-medium px-4 py-1.5 rounded-full transition-colors ${
                !activeStaff ? "bg-[#01172f] text-white shadow-sm" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              All Staff
            </button>
            {staffList.map((s: any) => (
              <button
                key={s.id}
                onClick={() => handleStaffToggle(String(s.id))}
                className={`text-[12px] font-medium px-4 py-1.5 rounded-full transition-colors ${
                  activeStaff === String(s.id) ? "bg-[#01172f] text-white shadow-sm" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                {s.name || s.email}
              </button>
            ))}
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 w-20 shrink-0">
            Status
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleStatusToggle(undefined)}
              className={`text-[12px] font-medium px-4 py-1.5 rounded-full transition-colors ${
                !activeStatus ? "bg-[#01172f] text-white shadow-sm" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              All Statuses
            </button>
            {STATUS_KEYS.map((s) => (
              <button
                key={s}
                onClick={() => handleStatusToggle(s)}
                className={`text-[12px] font-medium px-4 py-1.5 rounded-full transition-colors ${
                  activeStatus === s ? "bg-[#01172f] text-white shadow-sm" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 w-20 shrink-0">
            Date
          </span>
          <DateGranularityFilter granularity={granularity || ""} periodValue={periodValue || ""} />
        </div>
      </div>

      <div className={`transition-opacity duration-300 ${isPending ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        
        {/* Summary Cards Layout (Staff vs Overall) */}
        <div className="flex flex-col lg:flex-row gap-8 mb-16 items-start">
          
          {/* Staff Overview (Left Side) */}
          <div className="flex-1 w-full">
            <h2 className="text-[12px] font-semibold tracking-widest text-gray-400 uppercase mb-5">Staff Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {staffRows.map((s) => (
                <div key={s.id} className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-[#01172f] tracking-tight leading-tight">{s.name}</h3>
                      <p className="text-[11px] text-gray-400 mt-1 font-medium">{s.total} Total Requests</p>
                    </div>
                    <span className="inline-flex items-center px-2 py-1 rounded bg-[#149911]/10 text-[#149911] text-[10px] font-bold tracking-wide">
                      {s.completionRate}% Done
                    </span>
                  </div>

                  <div className="flex h-1.5 w-full bg-gray-50 rounded-full overflow-hidden mb-6">
                    {STATUS_KEYS.map((k) => s.counts[k] > 0 ? (
                      <div key={k} className="transition-all" style={{ width: `${(s.counts[k] / s.total) * 100}%`, backgroundColor: STATUS_COLORS[k] }} title={`${STATUS_LABELS[k]}: ${s.counts[k]}`} />
                    ) : null)}
                  </div>

                  <div className="grid grid-cols-3 gap-y-4 gap-x-2">
                    {STATUS_KEYS.map((k) => (
                      <div key={k} className="flex flex-col">
                        <span className="text-lg font-light text-gray-800 leading-none mb-1">
                          {s.counts[k] > 0 ? s.counts[k] : <span className="text-gray-300">0</span>}
                        </span>
                        <span className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold leading-tight">
                          {STATUS_LABELS[k]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Overall Overview (Right Side) */}
          <div className="w-full lg:w-[320px] xl:w-[360px] shrink-0">
            <h2 className="text-[12px] font-semibold tracking-widest text-gray-400 uppercase mb-5">Overall Overview</h2>
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-[#01172f] tracking-tight leading-tight">All Requests</h3>
                  <p className="text-[11px] text-gray-400 mt-1 font-medium">{overallTotal} Total Requests</p>
                </div>
                <span className="inline-flex items-center px-2 py-1 rounded bg-[#149911]/10 text-[#149911] text-[10px] font-bold tracking-wide">
                  {overallCompletionRate}% Done
                </span>
              </div>

              <div className="flex h-1.5 w-full bg-gray-50 rounded-full overflow-hidden mb-6">
                {STATUS_KEYS.map((k) => overallCounts[k] > 0 ? (
                  <div key={k} className="transition-all" style={{ width: `${(overallCounts[k] / overallTotal) * 100}%`, backgroundColor: STATUS_COLORS[k] }} title={`${STATUS_LABELS[k]}: ${overallCounts[k]}`} />
                ) : null)}
              </div>

              <div className="grid grid-cols-3 gap-y-4 gap-x-2">
                {STATUS_KEYS.map((k) => (
                  <div key={k} className="flex flex-col">
                    <span className="text-lg font-light text-gray-800 leading-none mb-1">
                      {overallCounts[k] > 0 ? overallCounts[k] : <span className="text-gray-300">0</span>}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold leading-tight">
                      {STATUS_LABELS[k]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 sm:py-2 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-gray-600">Detailed Inquiry</h2>
            <span className="text-[11px] font-medium text-gray-500">
              {filteredRequests.length} Record{filteredRequests.length !== 1 ? "s" : ""}
            </span>
          </div>
          
          {/* --- MOBILE CARD VIEW (No Carousel) --- */}
          <div className="block lg:hidden w-full flex-col">
            {tableRows.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-400 italic text-[11px]">
                No requests found matching criteria.
              </div>
            ) : (
              tableRows.map((row, i) => (
                <div 
                  key={`${row.reqId}-${i}`} 
                  className={`flex flex-col px-4 pb-4 ${row.isFirstOfRequest ? (i === 0 ? 'pt-4' : 'border-t-4 border-gray-100 pt-5 mt-2') : 'pt-3 mt-3 border-t border-dashed border-gray-100'}`}
                >
                  {row.isFirstOfRequest && (
                    <div className="flex flex-col gap-3 mb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-mono font-bold text-[#01172f] text-sm leading-none">{row.reqId.substring(0, 8).toUpperCase()}</div>
                          <div className="text-gray-500 text-[10px] mt-1">{row.reqDate}</div>
                        </div>
                        <span className="inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded" style={{ backgroundColor: `${STATUS_COLORS[row.status || ""] || "#94a3b8"}1a`, color: STATUS_COLORS[row.status || ""] || "#64748b" }}>
                          {STATUS_LABELS[row.status || ""] || row.status}
                        </span>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div className="font-bold text-[#01172f] text-[13px] leading-tight mb-1">{row.customerName}</div>
                        {row.company && <div className="text-[11px] text-gray-500 leading-tight mb-1">{row.company}</div>}
                        <div className="text-[11px] text-gray-500 mb-2">{row.contact || "\u2014"}</div>
                        <div className="text-[11px] pt-2 border-t border-gray-200 flex items-center justify-between">
                          <span className="text-gray-400">Assigned Rep:</span>
                          <span className={row.assignedStaff === "Unassigned" ? "text-amber-600 font-semibold italic" : "text-[#01172f] font-medium"}>
                            {row.assignedStaff}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Item Sub-row */}
                  <div className="flex flex-col gap-2 pl-3 border-l-[3px] border-[#149911]/30">
                    <div className="flex justify-between items-start gap-3">
                      <div className="text-[12px] font-medium text-gray-800 leading-snug">{row.itemDesc}</div>
                      <div className="font-mono text-[#01172f] font-bold text-[11px] bg-gray-100 px-1.5 py-0.5 rounded shrink-0">{row.itemQty}</div>
                    </div>
                    
                    <div className="text-[10px]">
                      <span className="text-gray-400 mr-1">PO:</span>
                      {row.poHref ? (
                        <Link href={row.poHref} className="font-mono font-bold text-[#01172f] hover:text-[#149911] transition-colors">{row.poLabel}</Link>
                      ) : (
                        <span className="text-gray-500">{row.poLabel}</span>
                      )}
                      {row.poStatus && <span className={`ml-1.5 text-[9px] font-bold uppercase tracking-wider ${row.poStatus === "fulfilled" ? "text-[#149911]" : "text-amber-600"}`}>({row.poStatus})</span>}
                    </div>
                    
                    {(row.supplierCompany || row.supplierPhone) && (
                      <div className="text-[9px] text-gray-500 flex gap-2">
                        {row.supplierCompany && <span>{row.supplierCompany}</span>}
                        {row.supplierPhone && <span>{row.supplierPhone}</span>}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* --- DESKTOP SPREADSHEET VIEW (Unchanged) --- */}
          <div className="hidden lg:block w-full overflow-x-auto">
            <table className="w-full min-w-[900px] table-fixed border-collapse text-left break-words">
              <thead>
                <tr>
                  <th className={`${thClass} w-[9%]`}>ID & Date</th>
                  <th className={`${thClass} w-[15%]`}>Client</th>
                  <th className={`${thClass} w-[13%]`}>Contact</th>
                  <th className={`${thClass} w-[10%]`}>Rep</th>
                  <th className={`${thClass} w-[9%]`}>Status</th>
                  <th className={`${thClass} w-[19%]`}>PO / Supplier</th>
                  <th className={`${thClass} w-[15%]`}>Item</th>
                  <th className={`${thClass} w-[5%]`}>Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {tableRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-8 text-center text-gray-400 italic text-[11px]">
                      No requests found matching criteria.
                    </td>
                  </tr>
                ) : (
                  tableRows.map((row, i) => {
                    const zebra = i % 2 === 1 ? "bg-gray-50/60" : "bg-white";
                    return (
                      <tr key={`${row.reqId}-${i}`} className={`${zebra} hover:bg-[#149911]/[0.04] transition-colors`}>
                        {row.isFirstOfRequest && (
                          <>
                            <td className={tdClass} rowSpan={row.rowSpan}>
                              <div className="font-mono font-bold text-[#01172f] mb-1">{row.reqId.substring(0, 8).toUpperCase()}</div>
                              <div className="text-gray-500">{row.reqDate}</div>
                            </td>
                            <td className={tdClass} rowSpan={row.rowSpan}>
                              <div className="font-bold text-[#01172f] leading-tight">{row.customerName}</div>
                              {row.company && <div className="text-[9px] text-gray-500 mt-1 leading-tight">{row.company}</div>}
                            </td>
                            <td className={`${tdClass} text-gray-500`} rowSpan={row.rowSpan}>{row.contact || "\u2014"}</td>
                            <td className={tdClass} rowSpan={row.rowSpan}>
                              <span className={row.assignedStaff === "Unassigned" ? "text-amber-600 font-semibold italic" : "text-[#01172f] font-medium"}>
                                {row.assignedStaff}
                              </span>
                            </td>
                            <td className={tdClass} rowSpan={row.rowSpan}>
                              <span className="inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ backgroundColor: `${STATUS_COLORS[row.status || ""] || "#94a3b8"}1a`, color: STATUS_COLORS[row.status || ""] || "#64748b" }}>
                                {STATUS_LABELS[row.status || ""] || row.status}
                              </span>
                            </td>
                          </>
                        )}
                        <td className={tdClass}>
                          {row.poHref ? (
                            <Link href={row.poHref} className="font-mono font-bold text-[#01172f] hover:text-[#149911] transition-colors block leading-tight">{row.poLabel}</Link>
                          ) : (
                            <span className="text-gray-400 block leading-tight">{row.poLabel}</span>
                          )}
                          {row.poStatus && <span className={`inline-block mt-1 text-[8px] font-bold uppercase tracking-wider ${row.poStatus === "fulfilled" ? "text-[#149911]" : "text-amber-600"}`}>{row.poStatus}</span>}
                          {(row.supplierCompany || row.supplierPhone) && (
                            <div className="mt-2 text-[9px] text-gray-500 font-normal leading-tight space-y-0.5">
                              {row.supplierCompany && <div>{row.supplierCompany}</div>}
                              {row.supplierPhone && <div>{row.supplierPhone}</div>}
                            </div>
                          )}
                        </td>
                        <td className={tdClass}>{row.itemDesc}</td>
                        <td className={`${tdClass} font-mono text-gray-500`}>{row.itemQty}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}