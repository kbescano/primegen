import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPayloadClient } from "@/lib/getPayloadClient";
import StaffPerformanceClient from "@/components/StaffPerformanceClient";

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
  const { staff: initialStaff, status: initialStatus } = await searchParams;
  let { granularity, periodValue } = await searchParams;
  
  const payload = await getPayloadClient();
  const reqHeaders = await headers();
  const { user } = await payload.auth({ headers: reqHeaders });

  // Only allow Admin and Marketing roles to view the page
  if (user?.role !== "admin" && user?.role !== "marketing") {
    redirect("/admin-dashboard");
  }

  if (!granularity) {
    granularity = "month";
    periodValue = currentMonthValue();
  }
  const effectiveGranularity = granularity ?? "month";
  const effectivePeriodValue = periodValue ?? currentMonthValue();
  const { start, end } = getGranularityRange(
    effectiveGranularity,
    effectivePeriodValue,
  );

  // Fetch static lookups
  const staffRes = await payload.find({
    collection: "users",
    where: { role: { equals: "user" } },
    limit: 100,
    sort: "name",
  });
  const staffList = staffRes.docs as any[];

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

  // FETCH DATA (Filtered strictly by Date limits, NOT by staff/status)
  const conditions: any[] = [];
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

  const linkedQuotationsRes = requestIds.length > 0 ? await payload.find({ collection: "client-quotations", where: { sourceRequestId: { in: requestIds } }, limit: 300 }) : { docs: [] as any[] };
  const quotationByRequestId: Record<string, any> = {};
  for (const cq of linkedQuotationsRes.docs as any[]) if (cq.sourceRequestId) quotationByRequestId[String(cq.sourceRequestId)] = cq;

  const linkedQuotationIds = (linkedQuotationsRes.docs as any[]).map((cq: any) => String(cq.id));
  const linkedOrdersRes = linkedQuotationIds.length > 0 ? await payload.find({ collection: "orders", where: { sourceQuotationId: { in: linkedQuotationIds } }, limit: 300 }) : { docs: [] as any[] };
  const orderByQuotationId: Record<string, any> = {};
  for (const o of linkedOrdersRes.docs as any[]) if (o.sourceQuotationId) orderByQuotationId[String(o.sourceQuotationId)] = o;

  const orderIds = (linkedOrdersRes.docs as any[]).map((o: any) => String(o.id));
  let allLinkedPOs: any[] = [];
  if (orderIds.length > 0) {
    try {
      const posRes = await payload.find({ collection: "supplier-purchase-orders", where: { sourceOrderId: { in: orderIds } }, limit: 300 });
      allLinkedPOs = posRes.docs;
    } catch (e1) {
      console.error("Error fetching POs:", e1);
    }
  }

  const posByOrderId: Record<string, any[]> = {};
  for (const po of allLinkedPOs) {
    const rawOrderId = po.sourceOrderId;
    const poOrderId = rawOrderId ? String(typeof rawOrderId === "object" ? rawOrderId.id : rawOrderId) : null;
    if (!poOrderId) continue;
    if (!posByOrderId[poOrderId]) posByOrderId[poOrderId] = [];
    posByOrderId[poOrderId].push(po);
  }

  // --- FORMAT LINE ITEMS FOR STAFF PERFORMANCE CLIENT ---
  // We safely concatenate the sizeDescription into the main name/description fields here.
  // StaffPerformanceClient will automatically render the concatenated text without needing UI updates.
  
  const displayRequests = requests.map((req: any) => ({
    ...req,
    items: Array.isArray(req.items) ? req.items.map((item: any) => ({
      ...item,
      material: item.sizeDescription && typeof item.material === 'object' && item.material !== null
        ? { ...item.material, name: `${item.material.name} - ${item.sizeDescription}` }
        : item.material
    })) : []
  }));

  const displayOrderByQuotationId: Record<string, any> = {};
  for (const [qId, o] of Object.entries(orderByQuotationId)) {
    displayOrderByQuotationId[qId] = {
      ...(o as any),
      items: Array.isArray((o as any).items) ? (o as any).items.map((item: any) => ({
        ...item,
        description: item.sizeDescription ? `${item.description} - ${item.sizeDescription}` : item.description
      })) : []
    };
  }

  const displayPosByOrderId: Record<string, any[]> = {};
  for (const [oId, pos] of Object.entries(posByOrderId)) {
    displayPosByOrderId[oId] = pos.map((po: any) => ({
      ...po,
      items: Array.isArray(po.items) ? po.items.map((item: any) => ({
        ...item,
        description: item.sizeDescription ? `${item.description} - ${item.sizeDescription}` : item.description
      })) : []
    }));
  }
  // --------------------------------------------------------

  return (
    <StaffPerformanceClient
      initialStaff={initialStaff}
      initialStatus={initialStatus}
      granularity={effectiveGranularity}
      periodValue={effectivePeriodValue}
      staffList={staffList}
      products={products}
      requests={displayRequests}
      quotationByRequestId={quotationByRequestId}
      orderByQuotationId={displayOrderByQuotationId}
      posByOrderId={displayPosByOrderId}
    />
  );
}