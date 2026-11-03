import { getPayloadClient } from "@/lib/getPayloadClient";
import { findAll } from "@/lib/findAll";
import { pickupProgress } from "@/lib/logistics";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DeliveriesClient from "./DeliveriesClient";

export const dynamic = "force-dynamic"; // ✨ Guarantees the page instantly refreshes new DB data

export default async function DeliveriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; trackOrderId?: string; q?: string }>;
}) {
  const { status: activeStatus, trackOrderId, q } = await searchParams;
  const searchTerm = (q || "").trim();
  const payload = await getPayloadClient();

  const reqHeaders = await headers();
  const { user } = await payload.auth({ headers: reqHeaders });

  if (!user) redirect("/admin-login");

  // Sales staff (role "user") only get their own orders here: orders carry
  // no link to the staff account, so "theirs" is matched on the salesPerson
  // name -- the same rule their own Sales Report uses. Admin and marketing
  // still see every order.
  const isStaff = (user as any).role === "user";
  const rawName = String((user as any).name || user.email || "");
  const myName = rawName.trim();
  // Some saved names carry stray trailing spaces (on the account and on the
  // orders alike), so match both the exact and the trimmed spelling.
  const myNames = Array.from(new Set([rawName, myName])).filter(Boolean);

  // 1. Determine Filtering
  const filterStatus = activeStatus || "active";
  const conditions: any[] = [];

  if (searchTerm) {
    // A search looks through every order, whatever the status filter says
    // (otherwise a delivered order could never be found from the default
    // "Active" view). Linked POs and itineraries live on other collections,
    // so resolve their matches to order ids first.
    const [poHits, itinHits] = await Promise.all([
      findAll(payload, {
        collection: "supplier-purchase-orders",
        where: { or: [{ poNumber: { contains: searchTerm } }, { supplierName: { contains: searchTerm } }] },
        depth: 0,
        select: { sourceOrderId: true },
      }),
      findAll(payload, {
        collection: "delivery-itineraries",
        where: {
          or: [
            { trackingNumber: { contains: searchTerm } },
            { driverName: { contains: searchTerm } },
            { vehicleDetails: { contains: searchTerm } },
            { "stops.address": { contains: searchTerm } },
            { "stops.contactName": { contains: searchTerm } },
            { "stops.contactPhone": { contains: searchTerm } },
          ],
        },
        depth: 0,
        select: { sourceOrderId: true },
      }),
    ]);
    const hitIds = Array.from(
      new Set(
        [...poHits.docs, ...itinHits.docs]
          .map((d: any) => (typeof d.sourceOrderId === "object" ? d.sourceOrderId?.id : d.sourceOrderId))
          .filter((v: any) => v !== null && v !== undefined && v !== ""),
      ),
    );
    conditions.push({
      or: [
        { orderNumber: { contains: searchTerm } },
        { customerName: { contains: searchTerm } },
        { company: { contains: searchTerm } },
        { address: { contains: searchTerm } },
        { contactNumber: { contains: searchTerm } },
        { salesPerson: { contains: searchTerm } },
        { "items.description": { contains: searchTerm } },
        ...(hitIds.length > 0 ? [{ id: { in: hitIds } }] : []),
      ],
    });
  } else if (filterStatus === "active") {
    conditions.push({ fulfillmentStatus: { in: ["preparing", "shipped"] } });
  } else if (filterStatus !== "all") {
    conditions.push({ fulfillmentStatus: { equals: filterStatus } });
  }
  if (isStaff) conditions.push({ salesPerson: { in: myNames } });

  const where: any = conditions.length > 0 ? { and: conditions } : undefined;

  // A ?trackOrderId= link auto-opens that order's tracker. For staff, only do
  // that when the order is one of theirs (whatever the status filter is).
  let allowedTrackOrderId: string | null | undefined = undefined;
  if (isStaff) {
    allowedTrackOrderId = null;
    if (trackOrderId) {
      const own = await payload.find({
        collection: "orders",
        where: { and: [{ id: { equals: trackOrderId } }, { salesPerson: { in: myNames } }] },
        limit: 1,
        depth: 0,
      });
      if (own.docs.length > 0) allowedTrackOrderId = String(trackOrderId);
    }
  }

  // 2. Fetch Orders
  const { docs: orders } = await findAll(payload, {
    collection: "orders",
    where,
    // This list tracks delivery status, never shows receipt images --
    // excluding them avoids pulling every receipt on every order here.
    select: { clientPaymentReceipts: false, supplierPaymentReceipts: false },
  });

  // 3. Sort by Target Delivery Date
  orders.sort((a: any, b: any) => {
    if (!a.targetDeliveryDate) return 1;
    if (!b.targetDeliveryDate) return -1;
    return (
      new Date(a.targetDeliveryDate).getTime() -
      new Date(b.targetDeliveryDate).getTime()
    );
  });

  // ✨ FIX: DO NOT cast to String here! Payload/Postgres needs the original ID type (numbers) for 'in' queries!
  const orderIds = orders.map((o: any) => o.id);

  const [itinerariesRes, posRes] = await Promise.all([
    orderIds.length > 0
      ? findAll(payload, {
          collection: "delivery-itineraries",
          where: { sourceOrderId: { in: orderIds } },
        })
      : Promise.resolve({ docs: [] }),
    orderIds.length > 0
      ? findAll(payload, {
          collection: "supplier-purchase-orders",
          where: { sourceOrderId: { in: orderIds } },
        })
      : Promise.resolve({ docs: [] }),
  ]);

  // An order can have several routes (e.g. a pickup run per supplier plus
  // the delivery) -- keep them all, oldest first, so "Route 1, 2, ..." means
  // the same thing here as in the route screen.
  const routesByOrderId: Record<string, any[]> = {};
  itinerariesRes.docs.forEach((itin: any) => {
    // Safely extract the ID and map it
    const sourceId =
      typeof itin.sourceOrderId === "object"
        ? itin.sourceOrderId?.id
        : itin.sourceOrderId;
    if (sourceId) {
      (routesByOrderId[String(sourceId)] ||= []).push(itin);
    }
  });
  Object.values(routesByOrderId).forEach((list) =>
    list.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
  );

  // Pre-calculate properties so the Client gets ready-to-use data
  const enrichedOrders = orders.map((o: any) => {
    const routes = routesByOrderId[String(o.id)] || [];
    const hasItinerary = routes.length > 0;
    const itin = routes[0];
    const address =
      o.shippingAddress ||
      o.deliveryAddress ||
      o.address ||
      (typeof o.client === "object" ? o.client?.address : "") ||
      "No address provided";

    let targetDateStr = "--";
    let deadlineColor = "text-gray-500";
    let badgeText = "";
    let badgeColor = "";

    if (o.targetDeliveryDate) {
      const tDate = new Date(o.targetDeliveryDate);
      targetDateStr = tDate.toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const targetMidnight = new Date(tDate);
      targetMidnight.setHours(0, 0, 0, 0);

      if (
        o.fulfillmentStatus !== "delivered" &&
        o.fulfillmentStatus !== "cancelled"
      ) {
        if (targetMidnight.getTime() < today.getTime()) {
          deadlineColor = "text-red-600 font-bold";
          badgeText = "OVERDUE";
          badgeColor = "bg-red-50 text-red-600 border border-red-100";
        } else if (targetMidnight.getTime() === today.getTime()) {
          deadlineColor = "text-amber-600 font-bold";
          badgeText = "TODAY";
          badgeColor = "bg-amber-50 text-amber-600 border border-amber-100";
        } else {
          deadlineColor = "text-[#01172f] font-semibold";
          const diffTime = Math.abs(targetMidnight.getTime() - today.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          badgeText = `In ${diffDays} day${diffDays > 1 ? "s" : ""}`;
          badgeColor = "bg-gray-50 text-gray-500 border border-gray-200";
        }
      } else {
        deadlineColor = "text-gray-400 line-through";
        badgeText = o.fulfillmentStatus === "delivered" ? "Done" : "Cancelled";
        badgeColor = "bg-gray-100 text-gray-400";
      }
    }

    const orderPOs = posRes.docs.filter((po: any) => {
      const sourceId =
        typeof po.sourceOrderId === "object"
          ? po.sourceOrderId?.id
          : po.sourceOrderId;
      return String(sourceId) === String(o.id);
    });

    const pickups = pickupProgress(o.items || [], orderPOs, routes);

    return {
      ...o,
      hasItinerary,
      itin,
      routes: routes.map((r: any) => ({
        id: r.id,
        trackingNumber: r.trackingNumber,
        status: r.status,
        driverName: r.driverName,
      })),
      pickedUpItems: pickups.pickedUp,
      totalItems: pickups.total,
      address,
      targetDateStr,
      deadlineColor,
      badgeText,
      badgeColor,
      orderPOs,
    };
  });

  return (
    <DeliveriesClient
      enrichedOrders={enrichedOrders}
      filterStatus={filterStatus}
      searchTerm={searchTerm}
      scopedTo={isStaff ? myName : undefined}
      allowedTrackOrderId={allowedTrackOrderId}
    />
  );
}
