import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPayloadClient } from "@/lib/getPayloadClient";
import DateGranularityFilter from "@/components/DateGranularityFilter";
import CreateRFQModal from "@/components/CreateRFQModal";

const STATUS_KEYS = [
  "pending",
  "processing",
  "quote-sent",
  "completed",
  "rejected",
] as const;

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

function currentMonthValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getGranularityRange(
  granularity?: string,
  periodValue?: string,
): { start?: Date; end?: Date } {
  if (!granularity || !periodValue) return {};
  if (granularity === "month") {
    const [y, m] = periodValue.split("-").map(Number);
    if (!y || !m) return {};
    return { start: new Date(y, m - 1, 1), end: new Date(y, m, 1) };
  }
  if (granularity === "week") {
    const start = new Date(`${periodValue}T00:00:00`);
    if (isNaN(start.getTime())) return {};
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return { start, end };
  }
  if (granularity === "year") {
    const y = Number(periodValue);
    if (!y) return {};
    return { start: new Date(y, 0, 1), end: new Date(y + 1, 0, 1) };
  }
  return {};
}

type TableRow = {
  reqId: string;
  isFirstOfRequest: boolean;
  rowSpan: number;
  // Request-level
  reqDate?: string;
  customerName?: string;
  company?: string;
  contact?: string;
  assignedStaff?: string;
  status?: string;
  pipelineHref?: string;
  quoteId?: string | null;
  orderId?: string | null;
  // Row-level
  poLabel: string;
  poStatus?: string;
  poHref?: string;
  supplierCompany?: string;
  supplierPhone?: string;
  itemDesc: string;
  itemQty: string;
};

export default async function StaffPerformancePage({
  searchParams,
}: {
  searchParams: Promise<{
    staff?: string;
    status?: string;
    granularity?: string;
    periodValue?: string;
  }>;
}) {
  const { staff: staffFilter, status: statusFilter } = await searchParams;
  let { granularity, periodValue } = await searchParams;
  const payload = await getPayloadClient();
  const reqHeaders = await headers();
  const { user } = await payload.auth({ headers: reqHeaders });

  if (user?.role !== "admin") {
    redirect("/admin-dashboard");
  }

  if (!granularity) {
    granularity = "month";
    periodValue = currentMonthValue();
  }
  const { start, end } = getGranularityRange(granularity, periodValue);

  // Fetch all users for staff list
  const staffRes = await payload.find({
    collection: "users",
    where: { role: { equals: "user" } },
    limit: 100,
    sort: "name",
  });
  const staffList = staffRes.docs as any[];

  // Fetch products for the Create RFQ Modal
  const productsRes = await payload.find({
    collection: "products",
    limit: 300,
    sort: "name",
    select: { name: true, unit: true },
  });
  const products = productsRes.docs.map((m: any) => ({
    id: m.id,
    name: m.name,
    unit: m.unit || "pcs",
  }));

  const conditions: any[] = [];
  if (staffFilter) conditions.push({ assignedTo: { equals: staffFilter } });
  if (statusFilter && STATUS_KEYS.includes(statusFilter as any)) {
    conditions.push({ status: { equals: statusFilter } });
  }
  if (start && end) {
    conditions.push({ createdAt: { greater_than_equal: start.toISOString() } });
    conditions.push({ createdAt: { less_than: end.toISOString() } });
  }

  const { docs: requests } = await payload.find({
    collection: "quotation-requests",
    where: conditions.length > 0 ? { and: conditions } : undefined,
    limit: 1000,
    depth: 2,
    sort: "-createdAt",
  });

  const requestIds = requests.map((r: any) => String(r.id));

  const linkedQuotationsRes =
    requestIds.length > 0
      ? await payload.find({
          collection: "client-quotations",
          where: { sourceRequestId: { in: requestIds } },
          limit: 300,
        })
      : { docs: [] as any[] };

  const quotationByRequestId: Record<string, any> = {};
  for (const cq of linkedQuotationsRes.docs as any[]) {
    if (cq.sourceRequestId)
      quotationByRequestId[String(cq.sourceRequestId)] = cq;
  }

  const linkedQuotationIds = (linkedQuotationsRes.docs as any[]).map(
    (cq: any) => String(cq.id),
  );

  const linkedOrdersRes =
    linkedQuotationIds.length > 0
      ? await payload.find({
          collection: "orders",
          where: { sourceQuotationId: { in: linkedQuotationIds } },
          limit: 300,
        })
      : { docs: [] as any[] };

  const orderByQuotationId: Record<string, any> = {};
  for (const o of linkedOrdersRes.docs as any[]) {
    if (o.sourceQuotationId)
      orderByQuotationId[String(o.sourceQuotationId)] = o;
  }

  const orderIds = (linkedOrdersRes.docs as any[]).map((o: any) =>
    String(o.id),
  );

  let allLinkedPOs: any[] = [];
  if (orderIds.length > 0) {
    try {
      const posRes = await payload.find({
        collection: "supplier-purchase-orders",
        where: { sourceOrderId: { in: orderIds } },
        limit: 300,
      });
      allLinkedPOs = posRes.docs;
    } catch (e1) {
      console.error("Error fetching POs with sourceOrderId:", e1);
    }
  }

  const posByOrderId: Record<string, any[]> = {};
  for (const po of allLinkedPOs) {
    const rawOrderId = po.sourceOrderId;
    const poOrderId = rawOrderId
      ? String(typeof rawOrderId === "object" ? rawOrderId.id : rawOrderId)
      : null;
    if (!poOrderId) continue;
    if (!posByOrderId[poOrderId]) posByOrderId[poOrderId] = [];
    posByOrderId[poOrderId].push(po);
  }

  const byStaff: Record<
    string,
    { name: string; counts: Record<string, number>; total: number }
  > = {};
  for (const s of staffList) {
    byStaff[String(s.id)] = {
      name: s.name || s.email,
      counts: Object.fromEntries(STATUS_KEYS.map((k) => [k, 0])),
      total: 0,
    };
  }
  let unassignedCount = 0;

  for (const r of requests as any[]) {
    const assignedId = r.assignedTo
      ? String(
          typeof r.assignedTo === "object" ? r.assignedTo.id : r.assignedTo,
        )
      : null;
    if (!assignedId || !byStaff[assignedId]) {
      unassignedCount++;
      continue;
    }
    byStaff[assignedId].total++;
    if (STATUS_KEYS.includes(r.status)) {
      byStaff[assignedId].counts[r.status]++;
    }
  }

  const staffRows = Object.entries(byStaff).map(([id, data]) => {
    const completionRate =
      data.total > 0
        ? Math.round((data.counts["completed"] / data.total) * 100)
        : 0;
    return { id, ...data, completionRate };
  });

  // Calculate Overall Overview Metrics
  const overallCounts: Record<string, number> = Object.fromEntries(STATUS_KEYS.map((k) => [k, 0]));
  const overallTotal = requests.length;
  for (const r of requests as any[]) {
    if (STATUS_KEYS.includes(r.status)) {
      overallCounts[r.status]++;
    }
  }
  const overallCompletionRate =
    overallTotal > 0
      ? Math.round((overallCounts["completed"] / overallTotal) * 100)
      : 0;

  function buildHref(newStaff?: string, newStatus?: string) {
    const params = new URLSearchParams();
    if (newStaff) params.set("staff", newStaff);
    if (newStatus) params.set("status", newStatus);
    if (granularity) params.set("granularity", granularity);
    if (periodValue) params.set("periodValue", periodValue);
    const qs = params.toString();
    return qs
      ? `/admin-dashboard/staff-performance?${qs}`
      : "/admin-dashboard/staff-performance";
  }

  const tableRows: TableRow[] = [];

  for (const req of requests as any[]) {
    const assignedStaff = req.assignedTo
      ? typeof req.assignedTo === "object"
        ? req.assignedTo.name || req.assignedTo.email
        : req.assignedTo
      : "Unassigned";

    const reqDate = new Date(req.createdAt).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

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
      reqId: safeReqId,
      reqDate,
      customerName: req.customerName || "Unnamed Client",
      company: req.company || "",
      contact: req?.email ? `${req.email} | ${req.phone}` : req.phone || "",
      assignedStaff,
      status: req.status,
      pipelineHref: `/admin-dashboard/pipeline/${safeReqId}`,
      quoteId: safeQuoteId,
      orderId: safeOrderId,
    };

    const rowsForRequest: Omit<TableRow, "isFirstOfRequest" | "rowSpan">[] = [];

    if (!hasOrder) {
      if (req.items && req.items.length > 0) {
        for (const item of req.items) {
          const materialName = item.material
            ? typeof item.material === "object"
              ? item.material.name
              : "Unknown Material"
            : "Custom Item";
          rowsForRequest.push({
            reqId: safeReqId,
            poLabel: "\u2014",
            itemDesc: materialName,
            itemQty: `x${item.quantity || 1}`,
          });
        }
      } else {
        rowsForRequest.push({
          reqId: safeReqId,
          poLabel: "\u2014",
          itemDesc: "No items recorded",
          itemQty: "\u2014",
        });
      }
    } else {
      for (const po of reqPOs) {
        const poIdStr = String(po.id);
        const poNumber = po.poNumber || `PO #${poIdStr.substring(0, 6)}`;
        
        const supplierName =
          po.supplierName ||
          (po.supplier && typeof po.supplier === "object" ? po.supplier.name : null) ||
          "Unnamed Supplier";
          
        const supplierCompany =
          po.supplierCompany ||
          (po.supplier && typeof po.supplier === "object" ? po.supplier.company : null);
          
        const supplierPhone =
          po.supplierPhone ||
          (po.supplier && typeof po.supplier === "object" ? po.supplier.phone : null);

        const poHref = `/admin-dashboard/supplier-po?listSupplier=${encodeURIComponent(supplierName)}`;
        const poItems = itemsByPO[poIdStr] || [];

        if (poItems.length > 0) {
          for (const item of poItems) {
            rowsForRequest.push({
              reqId: safeReqId,
              poLabel: `${poNumber} \u00b7 ${supplierName}`,
              poStatus: po.status || "active",
              poHref,
              supplierCompany,
              supplierPhone,
              itemDesc: item.description || "Unnamed item",
              itemQty: `${item.qty || 1} ${item.unit || "pcs"}`,
            });
          }
        } else {
          rowsForRequest.push({
            reqId: safeReqId,
            poLabel: `${poNumber} \u00b7 ${supplierName}`,
            poStatus: po.status || "active",
            poHref,
            supplierCompany,
            supplierPhone,
            itemDesc: "No items assigned",
            itemQty: "\u2014",
          });
        }
      }
      for (const item of unassignedOrderItems) {
        rowsForRequest.push({
          reqId: safeReqId,
          poLabel: "Unassigned",
          itemDesc: item.description || "Unnamed item",
          itemQty: `${item.qty || 1} ${item.unit || "pcs"}`,
        });
      }
      if (rowsForRequest.length === 0) {
        rowsForRequest.push({
          reqId: safeReqId,
          poLabel: "\u2014",
          itemDesc: "No items on this order",
          itemQty: "\u2014",
        });
      }
    }

    rowsForRequest.forEach((row, idx) => {
      tableRows.push({
        ...row,
        ...(idx === 0 ? baseMeta : {}),
        isFirstOfRequest: idx === 0,
        rowSpan: rowsForRequest.length,
      });
    });
  }

  // Small padding and font sizes for a strict, compact table fit
  const thClass =
    "bg-[#01172f] text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-2.5 text-left border-r border-[#1a2d42] last:border-0";
  const tdClass = "px-2.5 py-3 border border-gray-200 align-top text-[10px] break-words";

  return (
    <div className="max-w-[1400px] mx-auto py-10 px-6 font-sans text-gray-800">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 mb-1">
            Staff Performance Overview
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
             <Link
              href={buildHref(undefined, statusFilter)}
              className={`text-[12px] font-medium px-4 py-1.5 rounded-full transition-colors ${
                !staffFilter ? "bg-[#01172f] text-white shadow-sm" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              All Staff
            </Link>
            {staffList.map((s: any) => (
              <Link
                key={s.id}
                href={buildHref(String(s.id), statusFilter)}
                className={`text-[12px] font-medium px-4 py-1.5 rounded-full transition-colors ${
                  staffFilter === String(s.id) ? "bg-[#01172f] text-white shadow-sm" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                {s.name || s.email}
              </Link>
            ))}
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 w-20 shrink-0">
            Status
          </span>
          <div className="flex flex-wrap gap-2">
            <Link
              href={buildHref(staffFilter, undefined)}
              className={`text-[12px] font-medium px-4 py-1.5 rounded-full transition-colors ${
                !statusFilter ? "bg-[#01172f] text-white shadow-sm" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              All Statuses
            </Link>
            {STATUS_KEYS.map((s) => (
              <Link
                key={s}
                href={buildHref(staffFilter, s)}
                className={`text-[12px] font-medium px-4 py-1.5 rounded-full transition-colors ${
                  statusFilter === s ? "bg-[#01172f] text-white shadow-sm" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                {STATUS_LABELS[s]}
              </Link>
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

      {/* Summary Cards Layout (Staff vs Overall) */}
      <div className="flex flex-col lg:flex-row gap-8 mb-16 items-start">
        
        {/* Staff Overview (Left Side) */}
        <div className="flex-1 w-full">
          <h2 className="text-[12px] font-semibold tracking-widest text-gray-400 uppercase mb-5">Staff Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {staffRows.map((s) => (
              <div key={s.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                
                {/* Card Header */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-[#01172f] tracking-tight leading-tight">{s.name}</h3>
                    <p className="text-[11px] text-gray-400 mt-1 font-medium">{s.total} Total Requests</p>
                  </div>
                  <span className="inline-flex items-center px-2 py-1 rounded bg-[#149911]/10 text-[#149911] text-[10px] font-bold tracking-wide">
                    {s.completionRate}% Done
                  </span>
                </div>

                {/* Minimal Progress Bar */}
                <div className="flex h-1.5 w-full bg-gray-50 rounded-full overflow-hidden mb-6">
                  {STATUS_KEYS.map((k) =>
                    s.counts[k] > 0 ? (
                      <div
                        key={k}
                        className="transition-all"
                        style={{ width: `${(s.counts[k] / s.total) * 100}%`, backgroundColor: STATUS_COLORS[k] }}
                        title={`${STATUS_LABELS[k]}: ${s.counts[k]}`}
                      />
                    ) : null,
                  )}
                </div>

                {/* Status Mini-Grid */}
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
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            
            {/* Card Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-semibold text-[#01172f] tracking-tight leading-tight">All Requests</h3>
                <p className="text-[11px] text-gray-400 mt-1 font-medium">{overallTotal} Total Requests</p>
              </div>
              <span className="inline-flex items-center px-2 py-1 rounded bg-[#149911]/10 text-[#149911] text-[10px] font-bold tracking-wide">
                {overallCompletionRate}% Done
              </span>
            </div>

            {/* Minimal Progress Bar */}
            <div className="flex h-1.5 w-full bg-gray-50 rounded-full overflow-hidden mb-6">
              {STATUS_KEYS.map((k) =>
                overallCounts[k] > 0 ? (
                  <div
                    key={k}
                    className="transition-all"
                    style={{ width: `${(overallCounts[k] / overallTotal) * 100}%`, backgroundColor: STATUS_COLORS[k] }}
                    title={`${STATUS_LABELS[k]}: ${overallCounts[k]}`}
                  />
                ) : null,
              )}
            </div>

            {/* Status Mini-Grid */}
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

      {/* Spreadsheet RFQ Breakdown Table (Intact Logic, Forced to Fit) */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-4 py-2 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-gray-600">Detailed Inquiry</h2>
          <span className="text-[11px] font-medium text-gray-500">
            {requests.length} Record{requests.length !== 1 ? "s" : ""}
          </span>
        </div>
        
        {/* Strictly bound container to prevent horizontal scrolling */}
        <div className="w-full">
          <table className="w-full table-fixed border-collapse text-left break-words">
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
                          {/* ID & Date */}
                          <td className={tdClass} rowSpan={row.rowSpan}>
                            <div className="font-mono font-bold text-[#01172f] mb-1">{row.reqId.substring(0, 8).toUpperCase()}</div>
                            <div className="text-gray-500">{row.reqDate}</div>
                          </td>
                          
                          {/* Client */}
                          <td className={tdClass} rowSpan={row.rowSpan}>
                            <div className="font-bold text-[#01172f] leading-tight">{row.customerName}</div>
                            {row.company && (
                              <div className="text-[9px] text-gray-500 mt-1 leading-tight">{row.company}</div>
                            )}
                          </td>

                          {/* Contact */}
                          <td className={`${tdClass} text-gray-500`} rowSpan={row.rowSpan}>
                            {row.contact || "\u2014"}
                          </td>

                          {/* Rep */}
                          <td className={tdClass} rowSpan={row.rowSpan}>
                            <span className={row.assignedStaff === "Unassigned" ? "text-amber-600 font-semibold italic" : "text-[#01172f] font-medium"}>
                              {row.assignedStaff}
                            </span>
                          </td>

                          {/* Status */}
                          <td className={tdClass} rowSpan={row.rowSpan}>
                            <span
                              className="inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                              style={{
                                backgroundColor: `${STATUS_COLORS[row.status || ""] || "#94a3b8"}1a`,
                                color: STATUS_COLORS[row.status || ""] || "#64748b",
                              }}
                            >
                              {STATUS_LABELS[row.status || ""] || row.status}
                            </span>
                          </td>
                        </>
                      )}

                      {/* PO / Supplier */}
                      <td className={tdClass}>
                        {row.poHref ? (
                          <Link href={row.poHref} className="font-mono font-bold text-[#01172f] hover:text-[#149911] transition-colors block leading-tight">
                            {row.poLabel}
                          </Link>
                        ) : (
                          <span className="text-gray-400 block leading-tight">{row.poLabel}</span>
                        )}
                        {row.poStatus && (
                          <span className={`inline-block mt-1 text-[8px] font-bold uppercase tracking-wider ${row.poStatus === "fulfilled" ? "text-[#149911]" : "text-amber-600"}`}>
                            {row.poStatus}
                          </span>
                        )}
                        {(row.supplierCompany || row.supplierPhone) && (
                          <div className="mt-2 text-[9px] text-gray-500 font-normal leading-tight space-y-0.5">
                            {row.supplierCompany && <div>{row.supplierCompany}</div>}
                            {row.supplierPhone && <div>{row.supplierPhone}</div>}
                          </div>
                        )}
                      </td>

                      {/* Item Desc */}
                      <td className={tdClass}>{row.itemDesc}</td>

                      {/* Qty */}
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
  );
}