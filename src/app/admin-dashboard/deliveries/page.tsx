import { getPayloadClient } from "@/lib/getPayloadClient";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DeliveriesClient from "./DeliveriesClient";

export const dynamic = "force-dynamic"; // ✨ Guarantees the page instantly refreshes new DB data

export default async function DeliveriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: activeStatus } = await searchParams;
  const payload = await getPayloadClient();

  const reqHeaders = await headers();
  const { user } = await payload.auth({ headers: reqHeaders });

  if (!user) redirect("/admin-login");

  // 1. Determine Filtering
  const filterStatus = activeStatus || "active";
  let where: any = undefined;

  if (filterStatus === "active") {
    where = { fulfillmentStatus: { in: ["preparing", "shipped"] } };
  } else if (filterStatus !== "all") {
    where = { fulfillmentStatus: { equals: filterStatus } };
  }

  // 2. Fetch Orders
  const { docs: orders } = await payload.find({
    collection: "orders",
    limit: 100,
    where,
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
      ? payload.find({
          collection: "delivery-itineraries" as any,
          where: { sourceOrderId: { in: orderIds } },
          limit: 200,
        })
      : Promise.resolve({ docs: [] }),
    orderIds.length > 0
      ? payload.find({
          collection: "supplier-purchase-orders",
          where: { sourceOrderId: { in: orderIds } },
          limit: 500,
        })
      : Promise.resolve({ docs: [] }),
  ]);

  const itineraryByOrderId: Record<string, any> = {};
  itinerariesRes.docs.forEach((itin: any) => {
    // Safely extract the ID and map it
    const sourceId =
      typeof itin.sourceOrderId === "object"
        ? itin.sourceOrderId?.id
        : itin.sourceOrderId;
    if (sourceId) {
      itineraryByOrderId[String(sourceId)] = itin;
    }
  });

  // Pre-calculate properties so the Client gets ready-to-use data
  const enrichedOrders = orders.map((o: any) => {
    const hasItinerary = !!itineraryByOrderId[String(o.id)];
    const itin = itineraryByOrderId[String(o.id)];
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

    return {
      ...o,
      hasItinerary,
      itin,
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
    />
  );
}
