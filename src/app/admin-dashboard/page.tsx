import Link from "next/link";
import { getPayloadClient } from "@/lib/getPayloadClient";
import StatusSelect from "@/components/StatusSelect";
import DateGranularityFilter from "@/components/DateGranularityFilter";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AssignStaffSelect from "@/components/AssignStaffSelect";
import AddUpdateNote from "@/components/AddUpdateNotes";

const STATUSES = ["pending", "processing", "quote-sent", "completed"] as const;
const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "quote-sent", label: "Quote Sent" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
];
const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  "quote-sent": "Quote Sent",
  completed: "Completed",
  rejected: "Rejected",
};

const PAGE_SIZE = 25;

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

const STEP_ORDER = [
  "quotation",
  "confirmation",
  "supplierPO",
  "fulfilled",
  "delivery",
  "closed",
] as const;
const STEP_LABELS: Record<string, string> = {
  quotation: "Create Quotation",
  confirmation: "Quotation Approval",
  supplierPO: "Create PO",
  fulfilled: "Confirm Fulfilled",
  delivery: "Track Delivery & Payment",
  closed: "Confirm Completed",
};

function computeStepState(
  q: any,
  orderByQuotationId: Record<string, any>,
  posByOrderId: Record<string, any[]>,
) {
  const order = q ? orderByQuotationId[String(q.id)] : null;
  const pos = order ? posByOrderId[String(order.id)] || [] : [];
  const completedSteps = {
    quotation: Boolean(q),
    confirmation: Boolean(order),
    supplierPO: pos.length > 0,
    fulfilled:
      pos.length > 0 && pos.every((po: any) => po.status === "fulfilled"),
    delivery: Boolean(
      order &&
      order.fulfillmentStatus === "delivered" &&
      order.paymentStatus === "paid",
    ),
    closed: false,
  };
  const currentStep = STEP_ORDER.find((s) => !completedSteps[s]) || "closed";
  return { completedSteps, currentStep };
}

export default async function QuotationInboxPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    granularity?: string;
    periodValue?: string;
    page?: string;
  }>;
}) {
  const { status, page } = await searchParams;
  let { granularity, periodValue } = await searchParams;

  // Default to "this month" rather than "this week" or all-time, matching
  // DateGranularityFilter's own default state.
  if (!status && !granularity) {
    granularity = "month";
    periodValue = currentMonthValue();
  }

  const activeStatus = STATUSES.includes(status as any) ? status : undefined;
  const currentPage = Math.max(1, Number(page) || 1);
  const { start, end } = getGranularityRange(granularity, periodValue);

  const payload = await getPayloadClient();

  const reqHeaders = await headers();
  const { user: currentUser } = await payload.auth({
    headers: reqHeaders,
  });

  // 🔒 STRICT ROLE-BASED ACCESS CONTROL (Admin and User Only)
  if (
    !currentUser ||
    (currentUser.role !== "admin" && currentUser.role !== "user")
  ) {
    redirect("/");
  }

  const isAdmin = currentUser?.role === "admin";

  const staffRes = isAdmin
    ? await payload.find({
        collection: "users",
        where: {
          or: [
            { role: { equals: "user" } },
            { email: { equals: "nica@primegen.admin" } },
          ],
        },
        limit: 100,
      })
    : { docs: [] as any[] };
  const staffOptions = staffRes.docs.map((u: any) => ({
    id: String(u.id),
    name: u.name,
    email: u.email,
  }));
  const conditions: any[] = [];
  if (activeStatus) conditions.push({ status: { equals: activeStatus } });
  if (start && end) {
    conditions.push({ createdAt: { greater_than_equal: start.toISOString() } });
    conditions.push({ createdAt: { less_than: end.toISOString() } });
  }

  const { docs, totalDocs, totalPages, hasNextPage, hasPrevPage } =
    await payload.find({
      collection: "quotation-requests",
      sort: "-createdAt",
      limit: PAGE_SIZE,
      page: currentPage,
      where: conditions.length > 0 ? { and: conditions } : undefined,
      depth: 2,
      overrideAccess: false,
      user: currentUser,
    });

  // Bulk lookup: client-quotations
  const requestIds = docs.map((d: any) => d.id);
  const linkedQuotations =
    requestIds.length > 0
      ? await payload.find({
          collection: "client-quotations",
          where: { sourceRequestId: { in: requestIds } },
          limit: 200,
        })
      : { docs: [] as any[] };

  const quotationIdByRequestId: Record<string, string> = {};
  for (const cq of linkedQuotations.docs as any[]) {
    if (cq.sourceRequestId) quotationIdByRequestId[cq.sourceRequestId] = cq.id;
  }

  // Bulk lookup: orders
  const linkedQuotationIds = Object.values(quotationIdByRequestId);
  const linkedOrders =
    linkedQuotationIds.length > 0
      ? await payload.find({
          collection: "orders",
          where: { sourceQuotationId: { in: linkedQuotationIds } },
          limit: 200,
        })
      : { docs: [] as any[] };
  const orderIdByQuotationId: Record<string, string> = {};
  const orderByQuotationId: Record<string, any> = {};
  for (const o of linkedOrders.docs as any[]) {
    if (o.sourceQuotationId) {
      orderIdByQuotationId[o.sourceQuotationId] = o.id;
      orderByQuotationId[o.sourceQuotationId] = o;
    }
  }

  // Bulk lookup: supplier POs
  const orderIds = (linkedOrders.docs as any[]).map((o: any) => String(o.id));
  const linkedPOsRes =
    orderIds.length > 0
      ? await payload.find({
          collection: "supplier-purchase-orders",
          where: { sourceOrderId: { in: orderIds } },
          limit: 300,
        })
      : { docs: [] as any[] };
  const posByOrderId: Record<string, any[]> = {};
  for (const po of linkedPOsRes.docs as any[]) {
    if (!po.sourceOrderId) continue;
    if (!posByOrderId[po.sourceOrderId]) posByOrderId[po.sourceOrderId] = [];
    posByOrderId[po.sourceOrderId].push(po);
  }

  function buildStatusHref(s?: string) {
    const params = new URLSearchParams();
    if (s) params.set("status", s);
    const qs = params.toString();
    return qs ? `/admin-dashboard?${qs}` : "/admin-dashboard";
  }

  function buildPageHref(p: number) {
    const params = new URLSearchParams();
    if (activeStatus) params.set("status", activeStatus);
    if (granularity) params.set("granularity", granularity);
    if (periodValue) params.set("periodValue", periodValue);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/admin-dashboard?${qs}` : "/admin-dashboard";
  }

  const filterPills = [{ value: "", label: "All" }, ...STATUS_OPTIONS];

  return (
    <div className="w-full max-w-[1000px] mx-auto py-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div className="w-full">
          <h1 className="text-2xl font-black uppercase tracking-tight text-[#01172f] mb-1 truncate">
            Quotation Requests
          </h1>
          <p className="text-xs text-gray-500 font-medium w-full max-w-[600px]">
            Requests submitted from the website. Follow up by phone or email,
            then update status -- quotes are always sent by your team directly,
            never automatically. Showing {totalDocs} total.
          </p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="mb-6 space-y-4">
        {/* Status Pills */}
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">
            Status
          </p>
          <div className="flex flex-wrap gap-1.5">
            {filterPills.map((pill) => {
              const isActive = (activeStatus || "") === pill.value;
              const href = buildStatusHref(pill.value || undefined);
              return (
                <Link
                  key={pill.value || "all"}
                  href={href}
                  className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded transition-all ${
                    isActive
                      ? "bg-[#01172f] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {pill.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Date Range Filter */}
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">
            Date Range
          </p>
          <DateGranularityFilter
            granularity={granularity || ""}
            periodValue={periodValue || ""}
          />
        </div>
      </div>

      {/* Quotation Cards */}
      {docs.length === 0 ? (
        <div className="border border-dashed border-gray-200 py-12 text-center rounded">
          <p className="text-xs text-gray-400 font-medium">
            No quotation requests
            {activeStatus
              ? ` with status "${STATUS_LABELS[activeStatus]}"`
              : ""}{" "}
            in this period.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {docs.map((q: any) => {
            const linkedQuotationId = quotationIdByRequestId[q.id];
            const linkedQuotation = linkedQuotations.docs.find(
              (cq: any) => String(cq.id) === String(linkedQuotationId),
            );
            const { currentStep } = computeStepState(
              linkedQuotation,
              orderByQuotationId,
              posByOrderId,
            );
            const closed = q.status === "completed";
            const stageLabel = closed ? "Completed" : STEP_LABELS[currentStep];

            return (
              <div
                key={q.id}
                className="bg-white border border-gray-200 rounded p-4 sm:p-5 transition-all hover:border-gray-300 overflow-hidden"
              >
                {/* Top Bar: Customer Info & Status Dropdown */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-gray-100">
                  <div className="w-full min-w-0">
                    <h3 className="text-sm font-black uppercase text-[#01172f] mb-0.5 break-words">
                      {q.customerName || "Anonymous"}
                    </h3>
                    <p className="text-[11px] text-gray-400 font-medium truncate">
                      {q.email || "No email provided"}
                    </p>
                    <p className="text-[11px] text-gray-400 font-medium truncate">
                      {q.phone || "No phone provided"}
                    </p>
                  </div>
                  <div className="w-auto shrink-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {isAdmin && (
                        <AssignStaffSelect
                          requestId={q.id}
                          currentAssignedTo={
                            typeof q.assignedTo === "object"
                              ? String(q.assignedTo?.id)
                              : q.assignedTo
                          }
                          staffOptions={staffOptions}
                        />
                      )}
                      <StatusSelect id={q.id} status={q.status} />
                    </div>
                  </div>
                </div>

                {q.facebookLink && (
                  <div className="mb-4">
                    <a
                      href={q.facebookLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 hover:text-blue-800 underline underline-offset-2 transition-colors"
                    >
                      View Facebook Link &rarr;
                    </a>
                  </div>
                )}

                {/* Pipeline Stage Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 border border-gray-100 rounded px-3.5 py-2.5 mb-4 text-[11px]">
                  <span className="font-bold text-[#01172f]/70">
                    Stage:{" "}
                    <span className="text-[#149911] font-bold ml-1">
                      {stageLabel}
                    </span>
                  </span>
                  <Link
                    href={`/admin-dashboard/pipeline/${q.id}`}
                    className="text-[10px] font-bold uppercase tracking-wider text-[#01172f] hover:text-[#149911] transition-colors flex items-center gap-1"
                  >
                    View Order Workflow &rarr;
                  </Link>
                </div>
                {/* Items & Message Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  {/* Left Column: Requested Items */}
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                      Requested Items (
                      {Array.isArray(q.items) ? q.items.length : 0})
                    </p>
                    {Array.isArray(q.items) && q.items.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {q.items.map((item: any, i: number) => {
                          const material = item.material;
                          const matName =
                            typeof material === "object"
                              ? material?.name
                              : material;
                          const matUnit =
                            typeof material === "object" ? material?.unit : "";
                          return (
                            <div
                              key={i}
                              className="flex items-center justify-between gap-2 text-[11px] text-gray-700 min-w-0"
                            >
                              <span className="font-medium text-[#01172f] truncate min-w-0">
                                {matName || "Unnamed Material"}
                                {item.sizeDescription
                                  ? ` - ${item.sizeDescription}`
                                  : ""}
                              </span>
                              <span className="font-mono text-gray-400 font-bold shrink-0">
                                {item.quantity} {matUnit}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[11px] text-gray-400 italic">
                        No items listed
                      </p>
                    )}
                  </div>
                  <AddUpdateNote
                    requestId={q.id}
                    existingNotes={q.statusUpdates || []}
                    currentUserName={
                      currentUser?.name || currentUser?.email || "Staff"
                    }
                  />
                  {/* Right Column: Customer Message */}
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                      Customer Note
                    </p>
                    {q.message ? (
                      <div className="border-l-2 border-[#149911] bg-gray-50 p-3 rounded-r overflow-hidden">
                        <p className="text-[11px] text-gray-600 italic leading-relaxed break-words">
                          &quot;{q.message}&quot;
                        </p>
                      </div>
                    ) : (
                      <p className="text-[11px] text-gray-400 italic">
                        No message attached
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom Footer */}
                <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[10px] font-bold text-gray-400">
                    Submitted {new Date(q.createdAt).toLocaleString()}
                  </p>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-2.5 py-1 rounded">
                    via {q.source || "website"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2 mt-8 pt-6 border-t border-gray-100">
          {hasPrevPage ? (
            <Link
              href={buildPageHref(currentPage - 1)}
              className="text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded border bg-white border-gray-200 text-gray-600 hover:border-[#01172f] hover:text-[#01172f] transition-all"
            >
              &larr; Prev
            </Link>
          ) : (
            <span className="text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded border bg-gray-50 border-gray-100 text-gray-300">
              &larr; Prev
            </span>
          )}
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-3">
            Page {currentPage} of {totalPages}
          </span>
          {hasNextPage ? (
            <Link
              href={buildPageHref(currentPage + 1)}
              className="text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded border bg-white border-gray-200 text-gray-600 hover:border-[#01172f] hover:text-[#01172f] transition-all"
            >
              Next &rarr;
            </Link>
          ) : (
            <span className="text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded border bg-gray-50 border-gray-100 text-gray-300">
              Next &rarr;
            </span>
          )}
        </div>
      )}

      {/* Admin Link Footer */}
      <p className="mt-8 text-xs text-gray-400 font-medium text-center">
        For internal notes or bulk edits, use the{" "}
        <Link
          href="/admin/collections/quotation-requests"
          className="text-[#149911] font-bold hover:text-[#01172f] transition-colors underline underline-offset-2"
        >
          full CMS admin view
        </Link>
        .
      </p>
    </div>
  );
}