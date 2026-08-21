"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
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

const STATUS_SHORT_LABELS: Record<string, string> = {
  pending: "Pend",
  processing: "Proc",
  "quote-sent": "Quote",
  completed: "Done",
  rejected: "Rej",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#e4574c",
  processing: "#d18b3d",
  "quote-sent": "#3b6fd1",
  completed: "#2f9e5c",
  rejected: "#8b93a1",
};

function getRowBgColor(status?: string) {
  const color = STATUS_COLORS[status || ""];
  if (!color) return undefined;
  return `${color}10`;
}

function getStatusBadgeStyle(val: string) {
  if (!val || val === "—") return "bg-gray-50 text-gray-400";
  const lower = val.toLowerCase();
  if (lower === "paid" || lower === "delivered" || lower === "fulfilled") {
    return "bg-emerald-50 text-emerald-700";
  }
  if (lower === "pending" || lower === "processing" || lower === "unpaid") {
    return "bg-amber-50 text-amber-700";
  }
  return "bg-gray-50 text-gray-500";
}

function getSourceBadgeStyle(val: string) {
  if (!val) return "bg-gray-50 text-gray-400";
  const lower = val.toLowerCase();
  if (lower.includes("facebook")) return "bg-blue-50 text-blue-700";
  if (lower.includes("google")) return "bg-rose-50 text-rose-700";
  if (lower.includes("website")) return "bg-gray-50 text-gray-500";
  return "bg-gray-50 text-gray-500";
}

type TableRow = {
  reqId: string;
  isFirstOfRequest: boolean;
  rowSpan: number;
  reqDate?: string;
  source?: string;
  facebookLink?: string | null;
  customerName?: string;
  company?: string;
  contact?: string;
  assignedStaff?: string;
  assignedStaffId?: string;
  status?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  fulfillmentStatus?: string;
  pipelineHref?: string;
  quoteId?: string | null;
  orderId?: string | null;
  orderNumber?: string | null;
  orderStatus?: string | null;
  allUpdateNotes?: any[];
  poLabel: string;
  poStatus?: string;
  poHref?: string;
  supplierCompany?: string;
  supplierPhone?: string;
  itemDesc: string;
  itemQty: string;
};

type OverviewEntry = {
  id: string;
  name: string;
  total: number;
  counts: Record<string, number>;
  completionRate: number;
};

function OverviewTable({
  rows,
  nameHeader,
  nameBadgeStyle,
  highlightId,
}: {
  rows: OverviewEntry[];
  nameHeader: string;
  nameBadgeStyle?: (id: string) => string;
  highlightId?: string;
}) {
  const ovThClass =
    "text-[8px] font-semibold uppercase tracking-wider px-2.5 py-2 text-left border-b border-gray-100";
  const ovTdClass =
    "px-2.5 py-2 text-[10.5px] align-middle border-b border-gray-50";

  return (
    <>
      <div className="block sm:hidden divide-y divide-gray-50">
        {rows.length === 0 ? (
          <div className="px-3 py-5 text-center text-gray-300 italic text-[11px]">
            No data.
          </div>
        ) : (
          rows.map((r) => (
            <div
              key={r.id}
              className={`px-2.5 py-2.5 ${r.id === highlightId ? "bg-gray-50/60" : ""}`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                {nameBadgeStyle ? (
                  <span
                    className={`inline-block px-1.5 py-0.5 rounded-full text-[9px] font-medium capitalize break-words ${nameBadgeStyle(r.id)}`}
                  >
                    {r.name}
                  </span>
                ) : (
                  <span
                    className={`text-[11px] break-words min-w-0 ${r.id === highlightId ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}
                  >
                    {r.name}
                  </span>
                )}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11px] font-semibold text-gray-800">
                    {r.total}
                  </span>
                  <span className="inline-block px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[8px] font-medium">
                    {r.completionRate}%
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                {STATUS_KEYS.some((k) => r.counts[k] > 0) ? (
                  STATUS_KEYS.map((k) =>
                    r.counts[k] > 0 ? (
                      <span
                        key={k}
                        className="inline-flex items-center gap-1 text-[9px] font-medium"
                        style={{ color: STATUS_COLORS[k] }}
                      >
                        <span
                          className="w-1 h-1 rounded-full"
                          style={{ backgroundColor: STATUS_COLORS[k] }}
                        />
                        {STATUS_SHORT_LABELS[k]} {r.counts[k]}
                      </span>
                    ) : null,
                  )
                ) : (
                  <span className="text-[9px] text-gray-300 italic">
                    No activity
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <table className="hidden sm:table w-full table-fixed border-collapse text-left">
        <thead>
          <tr>
            <th className={`${ovThClass} w-[26%] text-gray-400`}>{nameHeader}</th>
            {STATUS_KEYS.map((k) => (
              <th
                key={k}
                className={`${ovThClass} w-[11%] text-center`}
                style={{ color: STATUS_COLORS[k] }}
                title={STATUS_LABELS[k]}
              >
                {STATUS_SHORT_LABELS[k]}
              </th>
            ))}
            <th className={`${ovThClass} w-[10%] text-center text-gray-400`}>
              Total
            </th>
            <th className={`${ovThClass} w-[10%] text-center text-emerald-600`}>
              Done %
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={8}
                className="px-3 py-5 text-center text-gray-300 italic text-[11px]"
              >
                No data.
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr
                key={r.id}
                className={r.id === highlightId ? "bg-gray-50/60" : ""}
              >
                <td className={`${ovTdClass} truncate`}>
                  {nameBadgeStyle ? (
                    <span
                      className={`inline-block max-w-full truncate px-1.5 py-0.5 rounded-full text-[9px] font-medium capitalize ${nameBadgeStyle(r.id)}`}
                    >
                      {r.name}
                    </span>
                  ) : (
                    <span
                      className={`truncate block ${r.id === highlightId ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}
                    >
                      {r.name}
                    </span>
                  )}
                </td>
                {STATUS_KEYS.map((k) => (
                  <td key={k} className={`${ovTdClass} text-center`}>
                    {r.counts[k] > 0 ? (
                      <span
                        className="inline-flex items-center gap-1 font-medium"
                        style={{ color: STATUS_COLORS[k] }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: STATUS_COLORS[k] }}
                        />
                        {r.counts[k]}
                      </span>
                    ) : (
                      <span className="text-gray-200">0</span>
                    )}
                  </td>
                ))}
                <td
                  className={`${ovTdClass} text-center font-semibold text-gray-800`}
                >
                  {r.total}
                </td>
                <td className={`${ovTdClass} text-center`}>
                  <span className="inline-block px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-medium">
                    {r.completionRate}%
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </>
  );
}

export default function StaffPerformanceClient({
  currentUserRole,
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
  currentUserRole: string;
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [localRequests, setLocalRequests] = useState(requests);
  const [activeStaff, setActiveStaff] = useState<string | undefined>(
    initialStaff,
  );
  const [activeStatus, setActiveStatus] = useState<string | undefined>(
    initialStatus,
  );
  const [activeSource, setActiveSource] = useState<string | undefined>(
    undefined,
  );
  const [updatingReqId, setUpdatingReqId] = useState<string | null>(null);

  useEffect(() => {
    setLocalRequests(requests);
  }, [requests]);

  useEffect(() => {
    setActiveStaff(searchParams.get("staff") || undefined);
    setActiveStatus(searchParams.get("status") || undefined);
    setActiveSource(searchParams.get("source") || undefined);
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

  const handleSourceToggle = (source?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (source) params.set("source", source);
    else params.delete("source");
    window.history.replaceState(null, "", `${pathname}?${params.toString()}`);
    startTransition(() => setActiveSource(source));
  };

  async function handleAssignStaff(reqId: string, newStaffId: string) {
    setUpdatingReqId(reqId);

    const staffObj = staffList.find((s) => String(s.id) === String(newStaffId));
    setLocalRequests((prev) =>
      prev.map((r) =>
        String(r.id) === String(reqId)
          ? { ...r, assignedTo: staffObj || newStaffId }
          : r,
      ),
    );

    try {
      const parsedStaffId = newStaffId
        ? isNaN(Number(newStaffId))
          ? newStaffId
          : Number(newStaffId)
        : null;

      const res = await fetch(`/api/quotation-requests/${reqId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ assignedTo: parsedStaffId }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        setLocalRequests(requests);
        const err = await res.json().catch(() => ({}));
        console.error("Payload validation error:", res.status, err);
      }
    } catch (e) {
      setLocalRequests(requests);
      console.error("Failed to assign staff", e);
    } finally {
      setUpdatingReqId(null);
    }
  }

  const uniqueSources = useMemo(() => {
    const set = new Set<string>();
    for (const r of localRequests) {
      set.add(String(r.source || "website").toLowerCase());
    }
    return Array.from(set).sort();
  }, [localRequests]);

  const {
    filteredRequests,
    staffRows,
    sourceRows,
    unassignedCount,
    overallCounts,
    overallTotal,
    overallCompletionRate,
    tableRows,
  } = useMemo(() => {
    const filtered = localRequests
      .filter((r) => {
        let pass = true;
        if (activeStaff) {
          const assignedId = r.assignedTo
            ? String(
                typeof r.assignedTo === "object"
                  ? r.assignedTo.id
                  : r.assignedTo,
              )
            : null;
          if (assignedId !== activeStaff) pass = false;
        }
        if (activeStatus && r.status !== activeStatus) {
          pass = false;
        }
        if (activeSource) {
          const src = String(r.source || "website").toLowerCase();
          if (src !== activeSource) pass = false;
        }
        return pass;
      })
      .sort((a, b) => {
        const aTime = new Date(a.updatedAt || a.createdAt).getTime();
        const bTime = new Date(b.updatedAt || b.createdAt).getTime();
        return bTime - aTime;
      });

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

    let unassigned = 0;
    for (const r of filtered) {
      const assignedId = r.assignedTo
        ? String(
            typeof r.assignedTo === "object" ? r.assignedTo.id : r.assignedTo,
          )
        : null;
      if (!assignedId || !byStaff[assignedId]) {
        unassigned++;
        continue;
      }
      byStaff[assignedId].total++;
      if (STATUS_KEYS.includes(r.status))
        byStaff[assignedId].counts[r.status]++;
    }

    const computedStaffRows = Object.entries(byStaff)
      .map(([id, data]) => ({
        id,
        ...data,
        completionRate:
          data.total > 0
            ? Math.round((data.counts["completed"] / data.total) * 100)
            : 0,
      }))
      .sort((a, b) => b.total - a.total);

    const bySource: Record<
      string,
      { name: string; counts: Record<string, number>; total: number }
    > = {};
    for (const r of filtered) {
      const src = String(r.source || "website").toLowerCase();
      if (!bySource[src]) {
        bySource[src] = {
          name: src.replace("-", " "),
          counts: Object.fromEntries(STATUS_KEYS.map((k) => [k, 0])),
          total: 0,
        };
      }
      bySource[src].total++;
      if (STATUS_KEYS.includes(r.status)) bySource[src].counts[r.status]++;
    }

    const computedSourceRows = Object.entries(bySource)
      .map(([id, data]) => ({
        id,
        ...data,
        completionRate:
          data.total > 0
            ? Math.round((data.counts["completed"] / data.total) * 100)
            : 0,
      }))
      .sort((a, b) => b.total - a.total);

    const computedOverallCounts: Record<string, number> = Object.fromEntries(
      STATUS_KEYS.map((k) => [k, 0]),
    );
    const computedOverallTotal = filtered.length;
    for (const r of filtered) {
      if (STATUS_KEYS.includes(r.status)) computedOverallCounts[r.status]++;
    }
    const computedOverallCompletionRate =
      computedOverallTotal > 0
        ? Math.round(
            (computedOverallCounts["completed"] / computedOverallTotal) * 100,
          )
        : 0;

    const computedTableRows: TableRow[] = [];
    for (const req of filtered) {
      const assignedStaffName = req.assignedTo
        ? typeof req.assignedTo === "object"
          ? req.assignedTo.name || req.assignedTo.email
          : req.assignedTo
        : "Unassigned";
      const assignedStaffId = req.assignedTo
        ? typeof req.assignedTo === "object"
          ? String(req.assignedTo.id)
          : String(req.assignedTo)
        : "";

      const reqDate = new Date(req.createdAt).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      const safeReqId = String(req.id || "");
      const safeSource = String(req.source || "website").replace("-", " ");
      const safeFacebookLink = req.facebookLink
        ? String(req.facebookLink).trim()
        : null;

      const linkedQuotation = quotationByRequestId[safeReqId] || null;
      const safeQuoteId = linkedQuotation ? String(linkedQuotation.id) : null;
      const linkedOrder = safeQuoteId
        ? orderByQuotationId[safeQuoteId] || null
        : null;
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

      const paymentStatus = linkedOrder?.paymentStatus || "—";
      const paymentMethod =
        linkedOrder?.paymentMethod || linkedOrder?.modeOfPayment || "—";
      const fulfillmentStatus = linkedOrder?.fulfillmentStatus || "—";

      const baseMeta = {
        reqId: safeReqId,
        reqDate,
        source: safeSource,
        facebookLink: safeFacebookLink,
        customerName: req.customerName || "Unnamed Client",
        company: req.company || "",
        contact: req?.email ? `${req.email} | ${req.phone}` : req.phone || "",
        assignedStaff: assignedStaffName,
        assignedStaffId,
        status: req.status,
        paymentStatus,
        paymentMethod,
        fulfillmentStatus,
        pipelineHref: `/admin-dashboard/pipeline/${safeReqId}`,
        quoteId: safeQuoteId,
        orderId: safeOrderId,
        orderNumber: linkedOrder?.orderNumber || null,
        orderStatus: linkedOrder?.status || null,
        allUpdateNotes: req.statusUpdates
          ? [...req.statusUpdates].reverse()
          : [],
      };

      const rowsForRequest: Omit<TableRow, "isFirstOfRequest" | "rowSpan">[] =
        [];

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
              status: req.status,
              poLabel: "\u2014",
              itemDesc: materialName,
              itemQty: `${item.quantity || 1} pcs`,
            });
          }
        } else {
          rowsForRequest.push({
            reqId: safeReqId,
            status: req.status,
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
            (po.supplier && typeof po.supplier === "object"
              ? po.supplier.name
              : null) ||
            "Unnamed Supplier";
          const supplierCompany =
            po.supplierCompany ||
            (po.supplier && typeof po.supplier === "object"
              ? po.supplier.company
              : null);
          const supplierPhone =
            po.supplierPhone ||
            (po.supplier && typeof po.supplier === "object"
              ? po.supplier.phone
              : null);
          const poHref = `/admin-dashboard/supplier-po?listSupplier=${encodeURIComponent(supplierName)}`;
          const poItems = itemsByPO[poIdStr] || [];

          if (poItems.length > 0) {
            for (const item of poItems) {
              rowsForRequest.push({
                reqId: safeReqId,
                status: req.status,
                poLabel: `${poNumber} \u00b7 ${supplierName}`,
                poStatus: po.status || "active",
                poHref,
                supplierCompany,
                supplierPhone,
                itemDesc: item.description || "Unnamed item",
                itemQty: `${item.qty || 1} pcs`,
              });
            }
          } else {
            rowsForRequest.push({
              reqId: safeReqId,
              status: req.status,
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
            status: req.status,
            poLabel: "Unassigned",
            itemDesc: item.description || "Unnamed item",
            itemQty: `${item.qty || 1} pcs`,
          });
        }
        if (rowsForRequest.length === 0) {
          rowsForRequest.push({
            reqId: safeReqId,
            status: req.status,
            poLabel: "\u2014",
            itemDesc: "No items on this order",
            itemQty: "\u2014",
          });
        }
      }

      rowsForRequest.forEach((row, idx) => {
        computedTableRows.push({
          ...row,
          ...(idx === 0 ? baseMeta : {}),
          isFirstOfRequest: idx === 0,
          rowSpan: rowsForRequest.length,
        });
      });
    }

    return {
      filteredRequests: filtered,
      staffRows: computedStaffRows,
      sourceRows: computedSourceRows,
      unassignedCount: unassigned,
      overallCounts: computedOverallCounts,
      overallTotal: computedOverallTotal,
      overallCompletionRate: computedOverallCompletionRate,
      tableRows: computedTableRows,
    };
  }, [
    localRequests,
    activeStaff,
    activeStatus,
    activeSource,
    staffList,
    quotationByRequestId,
    orderByQuotationId,
    posByOrderId,
  ]);

  const canAssignStaff =
    currentUserRole === "admin" || currentUserRole === "marketing";

  const thClass =
    "bg-[#01172f] text-white text-[9px] font-semibold uppercase tracking-widest px-3 py-2.5 text-left border-r border-white/10 last:border-0";
  const tdClass =
    "px-3 py-3 border border-gray-100 align-top text-[11px] break-words";

  const overallRow: OverviewEntry[] = [
    {
      id: "__all__",
      name: "All Requests",
      total: overallTotal,
      counts: overallCounts,
      completionRate: overallCompletionRate,
    },
  ];

  return (
    <div className="w-full max-w-[1600px] mx-auto px-0 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-6 md:py-10 font-sans text-gray-700 overflow-x-hidden print:overflow-visible">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-end sm:justify-between mb-4 sm:mb-6 px-2 sm:px-0 print:hidden">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl md:text-2xl font-semibold tracking-tight text-gray-900 mb-1">
            Inquiry Overview
          </h1>
          <p className="text-[11px] sm:text-[13px] text-gray-400 leading-relaxed">
            Track workload, filter statuses, and review active requests.
            {unassignedCount > 0 && (
              <span className="text-amber-600 font-medium ml-1.5">
                {unassignedCount} unassigned
              </span>
            )}
          </p>
        </div>
        <div className="shrink-0">
          <CreateRFQModal products={products} />
        </div>
      </div>

      {/* Filters -- one aligned row */}
      <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-2 sm:gap-y-3 mb-4 sm:mb-6 px-2 sm:px-0 pb-3 sm:pb-4 border-b border-gray-100 print:hidden">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            Staff
          </span>
          <select
            value={activeStaff || ""}
            onChange={(e) => handleStaffToggle(e.target.value || undefined)}
            className="text-[11px] sm:text-[12px] font-medium text-gray-700 bg-transparent border-0 border-b border-gray-200 pb-0.5 pr-5 focus:outline-none focus:border-[#149911] cursor-pointer appearance-none"
          >
            <option value="">All Staff</option>
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name || s.email}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            Status
          </span>
          <select
            value={activeStatus || ""}
            onChange={(e) => handleStatusToggle(e.target.value || undefined)}
            className="text-[11px] sm:text-[12px] font-medium text-gray-700 bg-transparent border-0 border-b border-gray-200 pb-0.5 pr-5 focus:outline-none focus:border-[#149911] cursor-pointer appearance-none"
          >
            <option value="">All Statuses</option>
            {STATUS_KEYS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            Source
          </span>
          <select
            value={activeSource || ""}
            onChange={(e) => handleSourceToggle(e.target.value || undefined)}
            className="text-[11px] sm:text-[12px] font-medium text-gray-700 bg-transparent border-0 border-b border-gray-200 pb-0.5 pr-5 focus:outline-none focus:border-[#149911] cursor-pointer appearance-none capitalize"
          >
            <option value="">All Sources</option>
            {uniqueSources.map((s) => (
              <option key={s} value={s}>
                {s.replace("-", " ")}
              </option>
            ))}
          </select>
        </div>

        <div className="hidden sm:block w-px h-4 bg-gray-200" />

        <DateGranularityFilter
          granularity={granularity || ""}
          periodValue={periodValue || ""}
        />
      </div>

      <div
        className={`transition-opacity duration-300 ${isPending ? "opacity-50 pointer-events-none" : "opacity-100"} print:hidden`}
      >
        {/* Overview */}
        <div className="mb-5 sm:mb-8 px-2 sm:px-0">
          <h2 className="text-[9px] sm:text-[10px] font-semibold tracking-widest text-gray-400 uppercase mb-1.5">
            Overall Status
          </h2>
          <div className="bg-white border-y sm:border sm:rounded-lg border-gray-100 overflow-hidden">
            <OverviewTable
              rows={overallRow}
              nameHeader="Scope"
              highlightId="__all__"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-5 sm:mb-8 px-2 sm:px-0">
          <div className="min-w-0">
            <h2 className="text-[9px] sm:text-[10px] font-semibold tracking-widest text-gray-400 uppercase mb-1.5">
              Staff Overview
            </h2>
            <div className="bg-white border-y sm:border sm:rounded-lg border-gray-100 overflow-hidden">
              <OverviewTable rows={staffRows} nameHeader="Staff" />
            </div>
          </div>

          <div className="min-w-0">
            <h2 className="text-[9px] sm:text-[10px] font-semibold tracking-widest text-gray-400 uppercase mb-1.5">
              Lead Source
            </h2>
            <div className="bg-white border-y sm:border sm:rounded-lg border-gray-100 overflow-hidden">
              <OverviewTable
                rows={sourceRows}
                nameHeader="Source"
                nameBadgeStyle={getSourceBadgeStyle}
              />
            </div>
          </div>
        </div>

        {/* Detailed Inquiry */}
        <div className="bg-white border-y sm:border border-gray-100 sm:rounded-xl overflow-hidden">
          <div className="px-2.5 sm:px-4 py-2.5 sm:py-3 border-b border-gray-100 flex items-center justify-between gap-2">
            <h2 className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-gray-400">
              Detailed Inquiry
            </h2>
            <span className="text-[10px] sm:text-[11px] text-gray-400 shrink-0">
              {filteredRequests.length} record
              {filteredRequests.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* --- MOBILE CARD VIEW --- */}
          <div className="block xl:hidden w-full flex-col">
            {tableRows.length === 0 ? (
              <div className="px-3 py-8 sm:py-10 text-center text-gray-300 italic text-[11px] sm:text-[12px]">
                No requests found matching criteria.
              </div>
            ) : (
              tableRows.map((row, i) => (
                <div
                  key={`${row.reqId}-${i}`}
                  className={`flex flex-col px-2 sm:px-4 pb-3 sm:pb-4 ${row.isFirstOfRequest ? (i === 0 ? "pt-3 sm:pt-4" : "border-t-4 border-gray-50 pt-4 sm:pt-5 mt-1") : "pt-2.5 sm:pt-3 mt-2.5 sm:mt-3 border-t border-dashed border-gray-100"}`}
                  style={{ backgroundColor: getRowBgColor(row.status) }}
                >
                  {row.isFirstOfRequest && (
                    <div className="flex flex-col gap-2.5 sm:gap-3 mb-3 sm:mb-4">
                      <div className="flex justify-between items-start gap-2 sm:gap-3">
                        <div className="min-w-0">
                          <div className="font-mono font-semibold text-gray-800 text-[13px] sm:text-sm leading-none truncate">
                            {row.reqId.substring(0, 8).toUpperCase()}
                          </div>
                          {row.orderNumber && (
                            <div className="font-mono text-emerald-700 text-[10px] sm:text-[11px] font-medium mt-1 truncate">
                              {row.orderNumber}
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 sm:gap-2 text-gray-400 text-[9px] sm:text-[10px] mt-1 sm:mt-1.5">
                            <span className="shrink-0">{row.reqDate}</span>
                            <span
                              className={`inline-block shrink-0 text-[8px] sm:text-[9px] font-medium capitalize px-1.5 py-0.5 rounded-full ${getSourceBadgeStyle(row.source || "")}`}
                            >
                              {row.source}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span
                            className="inline-block text-[8px] sm:text-[9px] font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full"
                            style={{
                              backgroundColor: `${STATUS_COLORS[row.status || ""] || "#94a3b8"}18`,
                              color:
                                STATUS_COLORS[row.status || ""] || "#64748b",
                            }}
                          >
                            {STATUS_LABELS[row.status || ""] || row.status}
                          </span>
                          {row.orderStatus && (
                            <span className="inline-block text-[8px] sm:text-[9px] font-medium px-1.5 py-0.5 bg-gray-50 text-gray-400 rounded-full">
                              {row.orderStatus.replace("_", " ")}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="bg-gray-50/70 p-2.5 sm:p-3.5 rounded-lg">
                        <div className="font-medium text-gray-900 text-[12px] sm:text-[13px] leading-snug mb-0.5 break-words">
                          {row.customerName}
                        </div>
                        {row.company && (
                          <div className="text-[10px] sm:text-[11px] text-gray-400 leading-snug mb-1 break-words">
                            {row.company}
                          </div>
                        )}
                        <div className="text-[10px] sm:text-[11px] text-gray-400 mb-2 break-words">
                          {row.contact || "\u2014"}
                        </div>

                        {row.facebookLink && (
                          <a
                            href={row.facebookLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block text-[10px] sm:text-[11px] text-blue-600 hover:text-blue-800 underline break-all mb-2"
                          >
                            View Facebook post →
                          </a>
                        )}

                        <div className="text-[10px] sm:text-[11px] pt-2.5 sm:pt-3 mt-1 border-t border-gray-200 grid grid-cols-2 gap-2 sm:gap-3">
                          <div className="min-w-0">
                            <span className="text-gray-400 block text-[8px] sm:text-[9px] uppercase tracking-wide mb-1">
                              Rep
                            </span>
                            {canAssignStaff ? (
                              <select
                                value={row.assignedStaffId || ""}
                                onChange={(e) =>
                                  handleAssignStaff(row.reqId, e.target.value)
                                }
                                disabled={updatingReqId === row.reqId}
                                className={`w-full bg-transparent border-b ${row.assignedStaffId ? "border-transparent text-gray-800" : "border-amber-300 text-amber-600"} hover:border-gray-300 focus:border-emerald-500 focus:outline-none text-[10px] sm:text-[11px] font-medium py-0.5 transition-colors cursor-pointer disabled:opacity-50 appearance-none truncate`}
                              >
                                <option value="" disabled>
                                  Unassigned
                                </option>
                                {staffList.map((s: any) => (
                                  <option key={s.id} value={s.id}>
                                    {s.name || s.email}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span
                                className={`block truncate ${row.assignedStaff === "Unassigned" ? "text-amber-600 font-medium italic" : "text-gray-800 font-medium"}`}
                              >
                                {row.assignedStaff}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="text-gray-400 block text-[8px] sm:text-[9px] uppercase tracking-wide mb-1">
                              Pay Mode
                            </span>
                            <span className="font-medium text-gray-800 capitalize truncate block">
                              {row.paymentMethod}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <span className="text-gray-400 block text-[8px] sm:text-[9px] uppercase tracking-wide mb-1">
                              Pay Status
                            </span>
                            <span
                              className={`inline-block text-[8px] sm:text-[9px] font-medium px-1.5 py-0.5 rounded-full ${getStatusBadgeStyle(row.paymentStatus || "")}`}
                            >
                              {row.paymentStatus}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <span className="text-gray-400 block text-[8px] sm:text-[9px] uppercase tracking-wide mb-1">
                              Shipping
                            </span>
                            <span
                              className={`inline-block text-[8px] sm:text-[9px] font-medium px-1.5 py-0.5 rounded-full ${getStatusBadgeStyle(row.fulfillmentStatus || "")}`}
                            >
                              {row.fulfillmentStatus}
                            </span>
                            {row.orderId && (
                              <Link
                                href={`/admin-dashboard/deliveries?trackOrderId=${row.orderId}`}
                                className="block mt-1.5 text-[8px] sm:text-[9px] font-semibold uppercase tracking-wide text-emerald-700 hover:text-emerald-900 transition-colors"
                              >
                                Track route →
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* ✨ Latest Update — this section was entirely
                          missing before. Only renders when there are
                          actual notes, matching the desktop table's same
                          condition. */}
                      {row.allUpdateNotes && row.allUpdateNotes.length > 0 && (
                        <div className="bg-gray-50/70 p-2.5 sm:p-3.5 rounded-lg">
                          <span className="text-gray-400 block text-[8px] sm:text-[9px] uppercase tracking-wide mb-1.5">
                            Latest Update
                          </span>
                          <ul className="list-none m-0 p-0 flex flex-col gap-1">
                            {row.allUpdateNotes.map((n: any, idx: number) => (
                              <li
                                key={idx}
                                className="flex items-start gap-1.5 text-[10px] sm:text-[11px] text-gray-600 leading-snug break-words"
                              >
                                <span className="text-emerald-600 shrink-0">
                                  &bull;
                                </span>
                                <span className="min-w-0">{n.note}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5 pl-2 sm:pl-3 border-l-2 border-emerald-100">
                    <div className="flex justify-between items-start gap-2 sm:gap-3">
                      <div className="text-[11px] sm:text-[12px] font-medium text-gray-700 leading-snug break-words min-w-0">
                        {row.itemDesc}
                      </div>
                      <div className="font-mono text-gray-700 font-medium text-[10px] sm:text-[11px] bg-gray-50 px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap">
                        {row.itemQty}
                      </div>
                    </div>

                    <div className="text-[9px] sm:text-[10px] flex flex-wrap items-center gap-x-1.5">
                      <span className="text-gray-400">PO:</span>
                      {row.poHref ? (
                        <Link
                          href={row.poHref}
                          className="font-mono font-medium text-gray-700 hover:text-emerald-700 transition-colors break-all"
                        >
                          {row.poLabel}
                        </Link>
                      ) : (
                        <span className="text-gray-400 break-all">
                          {row.poLabel}
                        </span>
                      )}
                      {row.poStatus && (
                        <span
                          className={`text-[8px] sm:text-[9px] font-medium ${row.poStatus === "fulfilled" ? "text-emerald-700" : "text-amber-600"}`}
                        >
                          ({row.poStatus})
                        </span>
                      )}
                    </div>

                    {(row.supplierCompany || row.supplierPhone) && (
                      <div className="text-[8px] sm:text-[9px] text-gray-400 flex flex-wrap gap-x-2 gap-y-0.5">
                        {row.supplierCompany && (
                          <span className="break-words">
                            {row.supplierCompany}
                          </span>
                        )}
                        {row.supplierPhone && (
                          <span className="break-words">
                            {row.supplierPhone}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* --- DESKTOP SPREADSHEET VIEW --- */}
          <div className="hidden xl:block w-full">
            <table className="w-full table-fixed border-collapse text-left">
              <thead>
                <tr>
                  <th className={`${thClass} w-[6%]`}>ID &amp; Date</th>
                  <th className={`${thClass} w-[5%]`}>Order</th>
                  <th className={`${thClass} w-[9%]`}>Client</th>
                  <th className={`${thClass} w-[7%]`}>Contact</th>
                  <th className={`${thClass} w-[4%]`}>FB</th>
                  <th className={`${thClass} w-[8%]`}>Rep</th>
                  <th className={`${thClass} w-[6%]`}>Status</th>
                  <th className={`${thClass} w-[5%]`}>Pay Mode</th>
                  <th className={`${thClass} w-[6%]`}>Pay Status</th>
                  <th className={`${thClass} w-[6%]`}>Shipping</th>
                  <th className={`${thClass} w-[8%]`}>PO/Supplier</th>
                  <th className={`${thClass} w-[10%]`}>Item</th>
                  <th className={`${thClass} w-[5%]`}>Qty</th>
                  <th className={`${thClass} w-[15%]`}>Latest Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tableRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={14}
                      className="px-5 py-10 text-center text-gray-300 italic text-[11px]"
                    >
                      No requests found matching criteria.
                    </td>
                  </tr>
                ) : (
                  tableRows.map((row, i) => {
                    const rowBg = getRowBgColor(row.status);
                    return (
                      <tr
                        key={`${row.reqId}-${i}`}
                        className="hover:brightness-[0.98] transition-[filter]"
                        style={{ backgroundColor: rowBg }}
                      >
                        {row.isFirstOfRequest && (
                          <>
                            <td className={tdClass} rowSpan={row.rowSpan}>
                              <div
                                className="font-mono font-semibold text-gray-800 mb-1"
                                title="Inquiry ID"
                              >
                                {row.reqId.substring(0, 8).toUpperCase()}
                              </div>
                              <div className="text-gray-400 mb-1">
                                {row.reqDate}
                              </div>
                              <span
                                className={`inline-block text-[8px] font-medium capitalize px-1.5 py-0.5 rounded-full ${getSourceBadgeStyle(row.source || "")}`}
                              >
                                {row.source}
                              </span>
                            </td>

                            <td className={tdClass} rowSpan={row.rowSpan}>
                              {row.orderNumber ? (
                                <>
                                  <div
                                    className="font-mono font-medium text-emerald-700 text-[9px] mb-1 break-all"
                                    title="Order Number"
                                  >
                                    {row.orderNumber}
                                  </div>
                                  {row.orderStatus && (
                                    <span className="inline-block text-[8px] font-medium px-1.5 py-0.5 bg-gray-50 text-gray-400 rounded-full">
                                      {row.orderStatus.replace("_", " ")}
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="text-[9px] text-gray-300 italic">
                                  —
                                </span>
                              )}
                            </td>

                            <td className={tdClass} rowSpan={row.rowSpan}>
                              <div className="font-medium text-gray-800 leading-tight">
                                {row.customerName}
                              </div>
                              {row.company && (
                                <div className="text-[9px] text-gray-400 mt-0.5 leading-tight">
                                  {row.company}
                                </div>
                              )}
                            </td>

                            <td
                              className={`${tdClass} text-gray-400`}
                              rowSpan={row.rowSpan}
                            >
                              {row.contact || "\u2014"}
                            </td>

                            <td className={tdClass} rowSpan={row.rowSpan}>
                              {row.facebookLink ? (
                                <a
                                  href={row.facebookLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline"
                                >
                                  Link
                                </a>
                              ) : (
                                <span className="text-gray-200 italic">—</span>
                              )}
                            </td>

                            <td className={tdClass} rowSpan={row.rowSpan}>
                              {canAssignStaff ? (
                                <select
                                  value={row.assignedStaffId || ""}
                                  onChange={(e) =>
                                    handleAssignStaff(row.reqId, e.target.value)
                                  }
                                  disabled={updatingReqId === row.reqId}
                                  className={`w-full bg-transparent border-b ${row.assignedStaffId ? "border-transparent text-gray-800" : "border-amber-300 text-amber-600"} hover:border-gray-300 focus:border-emerald-500 focus:outline-none text-[9px] font-medium py-1 transition-colors cursor-pointer disabled:opacity-50 appearance-none truncate`}
                                >
                                  <option value="" disabled>
                                    Unassigned
                                  </option>
                                  {staffList.map((s: any) => (
                                    <option key={s.id} value={s.id}>
                                      {s.name || s.email}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span
                                  className={`block truncate ${row.assignedStaff === "Unassigned" ? "text-amber-600 font-medium italic" : "text-gray-800 font-medium"}`}
                                >
                                  {row.assignedStaff}
                                </span>
                              )}
                            </td>

                            <td className={tdClass} rowSpan={row.rowSpan}>
                              <span
                                className="inline-block text-[8px] font-medium px-1.5 py-0.5 rounded-full"
                                style={{
                                  backgroundColor: `${STATUS_COLORS[row.status || ""] || "#94a3b8"}18`,
                                  color:
                                    STATUS_COLORS[row.status || ""] ||
                                    "#64748b",
                                }}
                              >
                                {STATUS_LABELS[row.status || ""] || row.status}
                              </span>
                            </td>

                            <td
                              className={`${tdClass} font-medium text-gray-700 capitalize`}
                              rowSpan={row.rowSpan}
                            >
                              {row.paymentMethod}
                            </td>

                            <td className={tdClass} rowSpan={row.rowSpan}>
                              <span
                                className={`inline-block text-[8px] font-medium px-1.5 py-0.5 rounded-full ${getStatusBadgeStyle(row.paymentStatus || "")}`}
                              >
                                {row.paymentStatus}
                              </span>
                            </td>

                            <td className={tdClass} rowSpan={row.rowSpan}>
                              <span
                                className={`inline-block text-[8px] font-medium px-1.5 py-0.5 rounded-full ${getStatusBadgeStyle(row.fulfillmentStatus || "")}`}
                              >
                                {row.fulfillmentStatus}
                              </span>
                              {row.orderId && (
                                <Link
                                  href={`/admin-dashboard/deliveries?trackOrderId=${row.orderId}`}
                                  className="block mt-1 text-[8px] font-semibold uppercase tracking-wide text-emerald-700 hover:text-emerald-900 transition-colors"
                                >
                                  Track route →
                                </Link>
                              )}
                            </td>
                          </>
                        )}

                        <td className={tdClass}>
                          {row.poHref ? (
                            <Link
                              href={row.poHref}
                              className="font-mono font-medium text-gray-700 hover:text-emerald-700 transition-colors block leading-tight break-words"
                            >
                              {row.poLabel}
                            </Link>
                          ) : (
                            <span className="text-gray-400 block leading-tight break-words">
                              {row.poLabel}
                            </span>
                          )}
                          {row.poStatus && (
                            <span
                              className={`inline-block mt-1 text-[8px] font-medium ${row.poStatus === "fulfilled" ? "text-emerald-700" : "text-amber-600"}`}
                            >
                              {row.poStatus}
                            </span>
                          )}
                          {(row.supplierCompany || row.supplierPhone) && (
                            <div className="mt-1.5 text-[8px] text-gray-400 font-normal leading-tight space-y-0.5 break-words">
                              {row.supplierCompany && (
                                <div>{row.supplierCompany}</div>
                              )}
                              {row.supplierPhone && (
                                <div>{row.supplierPhone}</div>
                              )}
                            </div>
                          )}
                        </td>

                        <td className={`${tdClass} break-words`}>
                          {row.itemDesc}
                        </td>
                        <td
                          className={`${tdClass} font-mono text-gray-400 whitespace-nowrap`}
                        >
                          {row.itemQty}
                        </td>

                        {row.isFirstOfRequest && (
                          <td className={tdClass} rowSpan={row.rowSpan}>
                            {row.allUpdateNotes &&
                            row.allUpdateNotes.length > 0 ? (
                              <ul className="list-none m-0 p-0 flex flex-col gap-1">
                                {row.allUpdateNotes.map(
                                  (n: any, idx: number) => (
                                    <li
                                      key={idx}
                                      className="flex items-start gap-1 text-[9.5px] text-gray-600 leading-snug break-words"
                                    >
                                      <span className="text-emerald-600 shrink-0">
                                        &bull;
                                      </span>
                                      <span className="min-w-0">{n.note}</span>
                                    </li>
                                  ),
                                )}
                              </ul>
                            ) : (
                              <span className="text-gray-300 italic">
                                No updates
                              </span>
                            )}
                          </td>
                        )}
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