import Link from "next/link";
import { getPayloadClient } from "@/lib/getPayloadClient";
import StatusSelect from "@/components/StatusSelect";
import DateGranularityFilter from "@/components/DateGranularityFilter";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AssignStaffSelect from "@/components/AssignStaffSelect";
import AddUpdateNote from "@/components/AddUpdateNotes";

const STATUSES = ["pending", "processing", "quote-sent", "completed", "rejected"] as const;
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
    <div className="w-full max-w-[900px] mx-auto py-6 overflow-x-hidden text-gray-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-6">
        <div className="w-full">
          <h1 className="text-lg font-semibold text-gray-900 mb-0.5 truncate">
            Quotation Requests
          </h1>
          <p className="text-[11px] text-gray-400 w-full max-w-[600px] leading-relaxed">
            Requests submitted from the website. Follow up by phone or email,
            then update status — quotes are always sent by your team directly, never automatically.
            <span className="text-gray-500 font-medium"> {totalDocs} total.</span>
          </p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-3 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 shrink-0">Status</span>
          <div className="flex flex-wrap gap-1">
            {filterPills.map((pill) => {
              const isActive = (activeStatus || "") === pill.value;
              const href = buildStatusHref(pill.value || undefined);
              return (
                <Link
                  key={pill.value || "all"}
                  href={href}
                  className={`text-[10px] font-medium px-2.5 py-1 rounded-full transition-colors ${
                    isActive
                      ? "bg-[#01172f] text-white"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {pill.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="hidden sm:block w-px h-4 bg-gray-200" />

        <DateGranularityFilter
          granularity={granularity || ""}
          periodValue={periodValue || ""}
        />
      </div>

      {/* Quotation Cards */}
      {docs.length === 0 ? (
        <div className="border border-dashed border-gray-200 py-10 text-center rounded-lg">
          <p className="text-[11px] text-gray-400">
            No quotation requests
            {activeStatus
              ? ` with status "${STATUS_LABELS[activeStatus]}"`
              : ""}{" "}
            in this period.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
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
                className="bg-white border border-gray-100 rounded-lg p-3.5 sm:p-4 transition-colors hover:border-gray-200 overflow-hidden"
              >
                {/* Top Bar: Customer Info & Status Dropdown */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-gray-50">
                  <div className="w-full min-w-0">
                    <h3 className="text-[13px] font-semibold text-gray-900 mb-0.5 break-words">
                      {q.customerName || "Anonymous"}
                    </h3>
                    <p className="text-[10px] text-gray-400 truncate">
                      {q.email || "No email provided"}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">
                      {q.phone || "No phone provided"}
                    </p>
                  </div>
                  <div className="w-auto shrink-0">
                    <div className="flex flex-wrap items-center gap-1.5">
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
                  <div className="mb-3">
                    <a
                      href={q.facebookLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-600 hover:text-blue-800 underline underline-offset-2 transition-colors"
                    >
                      View Facebook Link →
                    </a>
                  </div>
                )}

                {/* Pipeline Stage Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50/70 rounded px-3 py-2 mb-3 text-[10.5px]">
                  <span className="text-gray-500">
                    Stage: <span className="text-emerald-600 font-medium">{stageLabel}</span>
                  </span>
                  <Link
                    href={`/admin-dashboard/pipeline/${q.id}`}
                    className="text-[10px] font-medium text-gray-500 hover:text-[#01172f] transition-colors"
                  >
                    View Order Workflow →
                  </Link>
                </div>

                {/* Items & Message Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  {/* Left Column: Requested Items */}
                  <div className="min-w-0">
                    <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-300 mb-1.5">
                      Requested Items ({Array.isArray(q.items) ? q.items.length : 0})
                    </p>
                    {Array.isArray(q.items) && q.items.length > 0 ? (
                      <div className="flex flex-col gap-1">
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
                              className="flex items-center justify-between gap-2 text-[10.5px] text-gray-600 min-w-0"
                            >
                              <span className="font-medium text-gray-800 truncate min-w-0">
                                {matName || "Unnamed Material"}
                                {item.sizeDescription ? ` — ${item.sizeDescription}` : ""}
                              </span>
                              <span className="font-mono text-gray-400 shrink-0">
                                {item.quantity} {matUnit}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[10.5px] text-gray-300 italic">No items listed</p>
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
                    <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-300 mb-1.5">
                      Customer Note
                    </p>
                    {q.message ? (
                      <div className="border-l-2 border-emerald-200 bg-gray-50/70 p-2.5 rounded-r overflow-hidden">
                        <p className="text-[10.5px] text-gray-500 italic leading-relaxed break-words">
                          &quot;{q.message}&quot;
                        </p>
                      </div>
                    ) : (
                      <p className="text-[10.5px] text-gray-300 italic">No message attached</p>
                    )}
                  </div>
                </div>

                {/* Bottom Footer */}
                <div className="mt-3 pt-2.5 border-t border-gray-50 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[9.5px] text-gray-300">
                    Submitted {new Date(q.createdAt).toLocaleString()}
                  </p>
                  <span className="text-[9px] font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
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
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6 pt-5 border-t border-gray-100">
          {hasPrevPage ? (
            <Link
              href={buildPageHref(currentPage - 1)}
              className="text-[10px] font-medium px-3 py-1.5 rounded-md border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-800 transition-colors"
            >
              ← Prev
            </Link>
          ) : (
            <span className="text-[10px] font-medium px-3 py-1.5 rounded-md border border-gray-100 text-gray-200">
              ← Prev
            </span>
          )}
          <span className="text-[10px] text-gray-400 px-2">
            Page {currentPage} of {totalPages}
          </span>
          {hasNextPage ? (
            <Link
              href={buildPageHref(currentPage + 1)}
              className="text-[10px] font-medium px-3 py-1.5 rounded-md border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-800 transition-colors"
            >
              Next →
            </Link>
          ) : (
            <span className="text-[10px] font-medium px-3 py-1.5 rounded-md border border-gray-100 text-gray-200">
              Next →
            </span>
          )}
        </div>
      )}

      {/* Admin Link Footer */}
      <p className="mt-6 text-[11px] text-gray-400 text-center">
        For internal notes or bulk edits, use the{" "}
        <Link
          href="/admin/collections/quotation-requests"
          className="text-emerald-600 font-medium hover:text-[#01172f] transition-colors underline underline-offset-2"
        >
          full CMS admin view
        </Link>
        .
      </p>
    </div>
  );
}