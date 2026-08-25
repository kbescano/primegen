import { getPayloadClient } from "@/lib/getPayloadClient";
import { checkStaleRequestAlerts } from "@/lib/staleRequestAlerts";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import QuotationInboxClient from "@/components/QuotationInboxClient";

// Generous cap on how many requests can exist within one date window --
// mirrors /products fetching its whole catalog (up to 500) in one query
// instead of paginating. Status/Staff filtering now happens client-side
// over this full set (see QuotationInboxClient), which only works if the
// set is actually complete -- so there's no server-side pagination here
// any more. The date window (below) is what keeps this bounded as the
// collection grows indefinitely, unlike a roughly-fixed-size product
// catalog.
const FETCH_LIMIT = 1000;

function currentMonthValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// Fixed "this week" (Mon-Sun) / "this month" windows for the small overview
// panel -- independent of whatever date range the granularity filter is
// currently set to, since the overview is meant to always answer "how am I
// doing this week/month", not "how did the currently-viewed period go".
function thisWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  const day = now.getDay(); // 0 = Sun .. 6 = Sat
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { start, end };
}

function thisMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
  };
}

const OVERVIEW_STATUSES = [
  "pending",
  "processing",
  "informal-quote",
  "quote-sent",
  "completed",
  "rejected",
] as const;

function countByStatus(docs: any[]): Record<string, number> {
  const counts: Record<string, number> = Object.fromEntries(
    OVERVIEW_STATUSES.map((s) => [s, 0]),
  );
  for (const d of docs) {
    if (d.status in counts) counts[d.status]++;
  }
  return counts;
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
  if (granularity === "day") {
    const start = new Date(`${periodValue}T00:00:00`);
    if (isNaN(start.getTime())) return {};
    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    return { start, end };
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
  return { currentStep };
}

export default async function QuotationInboxPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    staff?: string;
    granularity?: string;
    periodValue?: string;
  }>;
}) {
  // status/staff are only used to seed the client component's initial
  // filter state (for a shared/bookmarked URL) -- they no longer affect
  // the server query, since filtering on them now happens client-side.
  const { status, staff } = await searchParams;
  let { granularity, periodValue } = await searchParams;

  if (!granularity) {
    granularity = "month";
    periodValue = currentMonthValue();
  }

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

  const conditions: any[] = [];
  if (start && end) {
    conditions.push({ createdAt: { greater_than_equal: start.toISOString() } });
    conditions.push({ createdAt: { less_than: end.toISOString() } });
  }

  const weekRange = thisWeekRange();
  const monthRange = thisMonthRange();

  // Runs on every page load/refresh instead of a scheduled cron -- catches
  // anything that's sat pending 5+ minutes and raises an Action Item for
  // whoever it's assigned to. Awaited (not fired-and-forgotten) so a freshly
  // created alert shows up in the actionItemsRes query right below, on this
  // same load, instead of only appearing after a second refresh.
  await checkStaleRequestAlerts(payload);

  // The staff list (for the filter dropdown), the Action Items panel, and
  // the two small "this week" / "this month" overview counts don't depend
  // on the main quotation-requests query or each other -- run everything
  // together instead of one after the other.
  const [staffRes, { docs }, actionItemsRes, weekOverviewRes, monthOverviewRes] = await Promise.all([
    isAdmin
      ? payload.find({
          collection: "users",
          where: {
            or: [
              { role: { equals: "user" } },
              { email: { equals: "nica@primegen.admin" } },
            ],
          },
          limit: 100,
        })
      : Promise.resolve({ docs: [] as any[] }),
    payload.find({
      collection: "quotation-requests",
      sort: "-createdAt",
      limit: FETCH_LIMIT,
      where: conditions.length > 0 ? { and: conditions } : undefined,
      // Only need one hop: assignedTo as a user object (for the id/email
      // shown in AssignStaffSelect) and items.material as a product
      // object (for name/unit). depth: 2 was also resolving each
      // material's OWN relationships (category, photos, weight-calc
      // link) for every item on every row -- unused here.
      depth: 1,
      overrideAccess: false,
      user: currentUser,
    }),
    // overrideAccess: false + user here is what scopes this to "all" for
    // Admin vs "only mine" for Staff -- same as the main query, driven
    // entirely by ActionItems.ts's own read access, not a where clause.
    payload.find({
      collection: "action-items",
      sort: "-createdAt",
      limit: 100,
      where: { status: { not_equals: "closed" } },
      depth: 1,
      overrideAccess: false,
      user: currentUser,
    }),
    // overrideAccess: false is what makes this "per sales staff" for a
    // staff user (their own read access already scopes to assignedTo ===
    // themselves) vs. the combined total for Admin/Marketing -- same as
    // the main query above, no extra where clause needed for that part.
    payload.find({
      collection: "quotation-requests",
      where: {
        and: [
          { createdAt: { greater_than_equal: weekRange.start.toISOString() } },
          { createdAt: { less_than: weekRange.end.toISOString() } },
        ],
      },
      limit: FETCH_LIMIT,
      depth: 0,
      overrideAccess: false,
      user: currentUser,
    }),
    payload.find({
      collection: "quotation-requests",
      where: {
        and: [
          { createdAt: { greater_than_equal: monthRange.start.toISOString() } },
          { createdAt: { less_than: monthRange.end.toISOString() } },
        ],
      },
      limit: FETCH_LIMIT,
      depth: 0,
      overrideAccess: false,
      user: currentUser,
    }),
  ]);

  const weekOverview = countByStatus(weekOverviewRes.docs);
  const monthOverview = countByStatus(monthOverviewRes.docs);

  const staffOptions = staffRes.docs.map((u: any) => ({
    id: String(u.id),
    name: u.name || "",
    email: u.email || "",
  }));

  const requestIds = docs.map((d: any) => d.id);
  const linkedQuotations =
    requestIds.length > 0
      ? await payload.find({
          collection: "client-quotations",
          where: { sourceRequestId: { in: requestIds } },
          limit: FETCH_LIMIT,
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
          limit: FETCH_LIMIT,
        })
      : { docs: [] as any[] };
  const orderByQuotationId: Record<string, any> = {};
  for (const o of linkedOrders.docs as any[]) {
    if (o.sourceQuotationId) {
      orderByQuotationId[o.sourceQuotationId] = o;
    }
  }

  const orderIds = (linkedOrders.docs as any[]).map((o: any) => String(o.id));
  const linkedPOsRes =
    orderIds.length > 0
      ? await payload.find({
          collection: "supplier-purchase-orders",
          where: { sourceOrderId: { in: orderIds } },
          limit: FETCH_LIMIT,
        })
      : { docs: [] as any[] };
  const posByOrderId: Record<string, any[]> = {};
  for (const po of linkedPOsRes.docs as any[]) {
    if (!po.sourceOrderId) continue;
    if (!posByOrderId[po.sourceOrderId]) posByOrderId[po.sourceOrderId] = [];
    posByOrderId[po.sourceOrderId].push(po);
  }

  // Precompute each row's pipeline stage server-side, since it needs the
  // linked-quotations/orders/POs lookups above -- the client component
  // just renders `.stageLabel`, it doesn't need any of this wiring.
  const requestsWithStage = docs.map((q: any) => {
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
    return { ...q, stageLabel: closed ? "Completed" : STEP_LABELS[currentStep] };
  });

  return (
    <QuotationInboxClient
      requests={requestsWithStage}
      staffOptions={staffOptions}
      isAdmin={isAdmin}
      currentUserName={currentUser?.name || currentUser?.email || "Staff"}
      initialStatus={status}
      initialStaff={isAdmin ? staff : undefined}
      granularity={granularity || ""}
      periodValue={periodValue || ""}
      actionItems={actionItemsRes.docs}
      weekOverview={weekOverview}
      monthOverview={monthOverview}
    />
  );
}
