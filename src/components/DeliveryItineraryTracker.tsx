"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type RouteStop = {
  id?: string;
  type: "pickup" | "dropoff";
  address: string;
  contactName: string;
  contactPhone: string;
  scheduledDate?: string | null;
  status: "pending" | "arrived" | "completed";
};

type Itinerary = {
  id: string;
  trackingNumber: string;
  driverName?: string;
  vehicleDetails?: string;
  status: string;
  stops: RouteStop[];
};

type CargoItem = {
  description: string;
  size: string;
  qty: number;
  unit: string;
  sourceName?: string;
  sourcePO?: string;
  sourceAddress?: string;
};

type SupplierPOData = {
  poId: string;
  poNumber: string;
  name: string;
  company: string;
  address: string;
  phone: string;
  items: CargoItem[];
};

const PRIMEGEN_ADDRESS =
  "SOUTHERN CITY HOMES, YG BUILDING, CEBU ST, 4 TANZANG LUMA, IMUS, 4103 CAVITE";
const PRIMEGEN_PHONE = "0917-185-9127 / 0917-133-9515";

const formatDateTimeLocal = (isoString?: string | null) => {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function DeliveryItineraryTracker({
  orderId,
}: {
  orderId: string | number;
}) {
  const router = useRouter();

  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [linkedPOs, setLinkedPOs] = useState<SupplierPOData[]>([]);
  const [cargoItems, setCargoItems] = useState<CargoItem[]>([]);
  const [primegenItems, setPrimegenItems] = useState<CargoItem[]>([]);
  const [clientData, setClientData] = useState<{
    name: string;
    phone: string;
    address: string;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [setupMode, setSetupMode] = useState(false);

  const [driverName, setDriverName] = useState("");
  const [vehicleDetails, setVehicleDetails] = useState("");
  const [routeStops, setRouteStops] = useState<RouteStop[]>([
    {
      type: "pickup",
      address: "",
      contactName: "",
      contactPhone: "",
      scheduledDate: null,
      status: "pending",
    },
    {
      type: "dropoff",
      address: "",
      contactName: "",
      contactPhone: "",
      scheduledDate: null,
      status: "pending",
    },
  ]);

  useEffect(() => {
    const fetchItin = fetch(
      `/api/delivery-itineraries?where[sourceOrderId][equals]=${orderId}`,
      { credentials: "include" },
    ).then((res) => res.json());
    const fetchPOs = fetch(
      `/api/supplier-purchase-orders?where[sourceOrderId][equals]=${orderId}`,
      { credentials: "include" },
    ).then((res) => res.json());
    const fetchOrder = fetch(`/api/orders/${orderId}?depth=2`, {
      credentials: "include",
    }).then((res) => res.json());

    Promise.all([fetchItin, fetchPOs, fetchOrder])
      .then(([itinData, poData, orderData]) => {
        const pos = poData.docs || [];
        const masterItems = orderData.items || [];

        const itemsByPoId: Record<string, CargoItem[]> = {};
        const unassignedPrimegen: CargoItem[] = [];
        const mappedCargoItems: CargoItem[] = [];

        masterItems.forEach((item: any) => {
          const itemDesc =
            item.material?.name || item.description || "Custom Item";
          const itemQty = item.quantity || item.qty || 1;
          const itemUnit = item.material?.unit || item.unit || "pcs";
          const itemSize = item.sizeDescription || "";

          let matchedPO = null;

          if (item.assignedPOId) {
            const assignedId =
              typeof item.assignedPOId === "object"
                ? String(item.assignedPOId.id)
                : String(item.assignedPOId);
            matchedPO = pos.find((p: any) => String(p.id) === assignedId);
          }

          if (!matchedPO) {
            matchedPO = pos.find(
              (p: any) =>
                Array.isArray(p.items) &&
                p.items.some(
                  (pi: any) =>
                    (pi.description || "").toLowerCase().trim() ===
                    itemDesc.toLowerCase().trim(),
                ),
            );
          }

          const cargoItem: CargoItem = {
            description: itemDesc,
            size: itemSize,
            qty: itemQty,
            unit: itemUnit,
            sourceName: "Primegen Trading (Warehouse)",
            sourcePO: "",
            sourceAddress: PRIMEGEN_ADDRESS,
          };

          if (matchedPO) {
            const poIdStr = String(matchedPO.id);
            if (!itemsByPoId[poIdStr]) itemsByPoId[poIdStr] = [];
            itemsByPoId[poIdStr].push(cargoItem);

            cargoItem.sourceName = matchedPO.supplierCompany
              ? `${matchedPO.supplierName || "Supplier"} (${matchedPO.supplierCompany})`
              : matchedPO.supplierName || "Supplier";
            cargoItem.sourcePO =
              matchedPO.poNumber ||
              `PO-${poIdStr.substring(0, 6).toUpperCase()}`;
            cargoItem.sourceAddress =
              matchedPO.supplierAddress || "No address provided";
          } else {
            unassignedPrimegen.push(cargoItem);
          }

          mappedCargoItems.push(cargoItem);
        });

        const poList: SupplierPOData[] = pos
          .map((po: any) => {
            const poIdStr = String(po.id);
            return {
              poId: poIdStr,
              poNumber:
                po.poNumber || `PO-${poIdStr.substring(0, 6).toUpperCase()}`,
              name: po.supplierName || "",
              company: po.supplierCompany || "",
              address: po.supplierAddress || "",
              phone: po.supplierPhone || "",
              items: itemsByPoId[poIdStr] || [],
            };
          })
          .filter((po: SupplierPOData) => po.items.length > 0);

        setCargoItems(mappedCargoItems);
        setPrimegenItems(unassignedPrimegen);
        setLinkedPOs(poList);

        const extractedClientName =
          orderData.customerName ||
          orderData.client?.name ||
          orderData.sourceQuotationId?.customerName ||
          "";
        const extractedClientPhone =
          orderData.phone ||
          orderData.contactNumber ||
          orderData.client?.phone ||
          orderData.sourceQuotationId?.phone ||
          "";
        const extractedClientAddress =
          orderData.shippingAddress ||
          orderData.deliveryAddress ||
          orderData.address ||
          orderData.client?.address ||
          "";

        setClientData({
          name: extractedClientName,
          phone: extractedClientPhone,
          address: extractedClientAddress,
        });

        if (itinData.docs && itinData.docs.length > 0) {
          setItinerary(itinData.docs[0]);
          setDriverName(itinData.docs[0].driverName || "");
          setVehicleDetails(itinData.docs[0].vehicleDetails || "");
        } else {
          const autoStops: RouteStop[] = [];

          if (unassignedPrimegen.length > 0) {
            autoStops.push({
              type: "pickup",
              address: PRIMEGEN_ADDRESS,
              contactName: "Primegen Trading (Warehouse)",
              contactPhone: PRIMEGEN_PHONE,
              scheduledDate: null,
              status: "pending",
            });
          }
          if (poList.length > 0) {
            autoStops.push(
              ...poList.map((po) => ({
                type: "pickup" as const,
                address: po.address || "",
                contactName: `${po.name || po.company || "Supplier"} (${po.poNumber})`,
                contactPhone: po.phone || "",
                scheduledDate: null,
                status: "pending" as const,
              })),
            );
          }
          if (autoStops.length === 0) {
            autoStops.push({
              type: "pickup",
              address: "",
              contactName: "",
              contactPhone: "",
              scheduledDate: null,
              status: "pending",
            });
          }
          autoStops.push({
            type: "dropoff",
            address: extractedClientAddress,
            contactName: extractedClientName,
            contactPhone: extractedClientPhone,
            scheduledDate: null,
            status: "pending",
          });

          setRouteStops(autoStops);
          setSetupMode(true);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [orderId]);

  function handleAddStop(type: "pickup" | "dropoff") {
    setRouteStops((prev) => [
      ...prev,
      {
        type,
        address: "",
        contactName: "",
        contactPhone: "",
        scheduledDate: null,
        status: "pending",
      },
    ]);
  }

  function handleRemoveStop(index: number) {
    setRouteStops((prev) => prev.filter((_, i) => i !== index));
  }

  function updateStop(index: number, patch: Partial<RouteStop>) {
    setRouteStops((prev) =>
      prev.map((stop, i) => (i === index ? { ...stop, ...patch } : stop)),
    );
  }

  async function handleSaveRoute(e: React.FormEvent) {
    e.preventDefault();
    setUpdating(true);
    try {
      const payload = {
        trackingNumber: itinerary
          ? itinerary.trackingNumber
          : `TRK-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        sourceOrderId: orderId,
        status: itinerary ? itinerary.status : "scheduled",
        driverName,
        vehicleDetails,
        stops: routeStops.map((stop) => ({
          ...stop,
          scheduledDate: stop.scheduledDate || null, 
        })),
      };

      const url = itinerary
        ? `/api/delivery-itineraries/${itinerary.id}`
        : "/api/delivery-itineraries";
      const method = itinerary ? "PATCH" : "POST";

      const [res] = await Promise.all([
        fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }),
        fetch(`/api/orders/${orderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ fulfillmentStatus: "shipped" }),
        }),
      ]);

      const data = await res.json();
      setItinerary(data.doc);
      setSetupMode(false);
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(false);
    }
  }

  async function updateStopStatus(
    stopId: string | undefined,
    newStatus: string,
  ) {
    if (!itinerary || !stopId) return;
    setUpdating(true);

    const updatedStops = itinerary.stops.map((s) =>
      s.id === stopId ? { ...s, status: newStatus as any } : s,
    );
    const allCompleted = updatedStops
      .filter((s) => s.type === "dropoff")
      .every((s) => s.status === "completed");

    const newItineraryStatus = allCompleted ? "delivered" : "in-transit";
    const newOrderFulfillmentStatus = allCompleted ? "delivered" : "shipped";

    try {
      const [res] = await Promise.all([
        fetch(`/api/delivery-itineraries/${itinerary.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            stops: updatedStops.map(stop => ({
              ...stop,
              scheduledDate: stop.scheduledDate || null
            })),
            status: newItineraryStatus,
          }),
        }),
        fetch(`/api/orders/${orderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            fulfillmentStatus: newOrderFulfillmentStatus,
          }),
        }),
      ]);

      if (res.ok) {
        const data = await res.json();
        setItinerary(data.doc);
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(false);
    }
  }

  const displayStops = !itinerary || setupMode ? routeStops : itinerary.stops;
  const displayDriver =
    !itinerary || setupMode ? driverName : itinerary.driverName;
  const displayVehicle =
    !itinerary || setupMode ? vehicleDetails : itinerary.vehicleDetails;
  const displayTracking = itinerary ? itinerary.trackingNumber : "PENDING";

  const matchedPOsByStopIndex = useMemo(() => {
    return displayStops.map((stop) => {
      if (stop.type !== "pickup") return [];
      let matches = linkedPOs.filter(
        (po) =>
          stop.contactName.includes(po.poNumber) ||
          stop.address.includes(po.poNumber),
      );
      if (matches.length === 0) {
        matches = linkedPOs.filter(
          (po) =>
            (po.name && stop.contactName.includes(po.name)) ||
            (po.address && stop.address && stop.address.includes(po.address)),
        );
      }
      return matches;
    });
  }, [displayStops, linkedPOs]);

  function isPrimegenStop(stop: RouteStop) {
    return (
      stop.contactName.toLowerCase().includes("primegen") ||
      stop.address.includes("TANZANG LUMA") ||
      stop.address.includes("CAVITE")
    );
  }

  if (loading)
    return (
      <div className="p-6 text-sm text-gray-400 font-medium">
        Loading logistics...
      </div>
    );

  const isFormValid = routeStops.every((s) => s.address.trim() !== "");

  const WebCargoSummary = () => {
    const uniqueSourceKeys = Array.from(
      new Set(cargoItems.map((c) => `${c.sourceName}-${c.sourcePO}`)),
    );
    const isSingleSource =
      uniqueSourceKeys.length === 1 && cargoItems.length > 0;

    return (
      <div className="mb-6 mx-5 md:mx-8 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#01172f]">
            Master Cargo Summary
          </h4>
          <span className="text-[10px] font-bold text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded">
            {cargoItems.length} Items
          </span>
        </div>

        {isSingleSource && (
          <div className="bg-[#149911]/5 px-4 py-2.5 border-b border-[#149911]/10 text-[10px] font-bold uppercase tracking-widest text-[#149911] flex items-center flex-wrap gap-1">
            📦 Source: {cargoItems[0].sourceName}
            {cargoItems[0].sourcePO && (
              <span className="bg-white border border-[#149911]/20 px-1.5 py-0.5 rounded mx-1 text-[#01172f]">
                {cargoItems[0].sourcePO}
              </span>
            )}
            <span className="text-gray-500 font-medium normal-case ml-1">
              — {cargoItems[0].sourceAddress}
            </span>
          </div>
        )}

        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-100">
                <th className="px-4 py-2 text-[9px] font-bold uppercase text-gray-400 w-[15%]">
                  Qty
                </th>
                <th className="px-4 py-2 text-[9px] font-bold uppercase text-gray-400 w-[45%]">
                  Description
                </th>
                <th className="px-4 py-2 text-[9px] font-bold uppercase text-gray-400 w-[40%]">
                  Specs / Size
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cargoItems.map((item, idx) => {
                const isPrimegen =
                  item.sourceName === "Primegen Trading (Warehouse)";

                return (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-[12px] font-bold text-[#01172f] align-top">
                      {item.qty}{" "}
                      <span className="text-[10px] text-gray-400 font-normal">
                        {item.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="text-[12px] font-bold uppercase text-[#01172f] leading-tight">
                        {item.description}
                      </div>

                      {!isSingleSource && (
                        <div
                          className={`mt-1.5 text-[9px] font-bold uppercase tracking-widest inline-block px-1.5 py-0.5 rounded border ${
                            isPrimegen
                              ? "bg-blue-50 text-blue-600 border-blue-100"
                              : "bg-gray-50 text-gray-500 border-gray-200"
                          }`}
                        >
                          {item.sourceName}{" "}
                          {item.sourcePO && `• ${item.sourcePO}`}
                          <span className="text-gray-400 font-medium normal-case ml-1">
                            — {item.sourceAddress}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-gray-500 align-top">
                      {item.size || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const WebPickupItemsDetails = ({
    stop,
    matchedPOs,
  }: {
    stop: RouteStop;
    matchedPOs: SupplierPOData[];
  }) => {
    if (stop.type !== "pickup") return null;

    const primegenStop = isPrimegenStop(stop);
    if (!primegenStop && matchedPOs.length === 0) return null;

    return (
      <div className="mt-4 flex flex-col gap-3">
        {primegenStop && primegenItems.length > 0 && (
          <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3">
            <p className="text-[9px] font-bold uppercase tracking-widest text-blue-800 mb-2">
              Primegen Inventory to Load:
            </p>
            <ul className="space-y-1 pl-1">
              {primegenItems.map((item, idx) => {
                // ✨ SMART REDUNDANCY CHECK
                const isRedundant = item.size && (item.description || '').toUpperCase().includes(item.size.toUpperCase());
                
                return (
                  <li
                    key={idx}
                    className="text-[11px] text-gray-700 font-medium flex items-start gap-2"
                  >
                    <span className="font-bold text-blue-800 w-12 shrink-0">
                      {item.qty} {item.unit}
                    </span>
                    <span className="uppercase">
                      {item.description}{" "}
                      {!isRedundant && item.size && (
                        <span className="text-gray-500 capitalize">
                          ({item.size})
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {matchedPOs.length > 0 && (
          <div className="bg-[#149911]/5 border border-[#149911]/20 rounded-lg p-3">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#149911] mb-2">
              Supplier Items to Load:
            </p>
            <div className="flex flex-col gap-3">
              {matchedPOs.map((po, poIdx) => (
                <div key={poIdx}>
                  <span className="text-[9px] font-bold text-[#01172f] border border-[#01172f]/10 px-1.5 py-0.5 rounded mb-1.5 inline-block bg-white shadow-sm">
                    {po.poNumber}
                  </span>
                  <ul className="space-y-1 pl-1">
                    {po.items.map((item, idx) => {
                      // ✨ SMART REDUNDANCY CHECK
                      const isRedundant = item.size && (item.description || '').toUpperCase().includes(item.size.toUpperCase());

                      return (
                        <li
                          key={idx}
                          className="text-[11px] text-gray-700 font-medium flex items-start gap-2"
                        >
                          <span className="font-bold text-[#149911] w-12 shrink-0">
                            {item.qty} {item.unit}
                          </span>
                          <span className="uppercase">
                            {item.description}{" "}
                            {!isRedundant && item.size && (
                              <span className="text-gray-500 capitalize">
                                ({item.size})
                              </span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const uniqueSuppliersForQuickFill = Array.from(
    new Map(linkedPOs.map((po) => [po.name, po])).values(),
  );

  return (
    <div className="w-full">
     <style>{`
  @media print {
    @page { size: portrait; margin: 6mm; }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
    }
    body * {
      visibility: hidden !important;
    }
    .waybill-print-doc,
    .waybill-print-doc * {
      visibility: visible !important;
    }
    .waybill-print-doc {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      border: none !important;
      box-shadow: none !important;
    }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
  }
`}</style>

      {!itinerary || setupMode ? (
        // ==========================================
        // VIEW 1: ROUTE BUILDER (SETUP MODE)
        // ==========================================
        <div className="bg-[#fbfbfd] border border-gray-200 rounded-2xl shadow-sm overflow-hidden print:hidden">
          <div className="p-5 md:p-6 border-b border-gray-200 bg-white flex justify-between items-center mb-6">
            <div>
              <h3 className="text-[18px] font-semibold tracking-tight text-gray-900">
                Plan Delivery Route
              </h3>
              <p className="text-[13px] text-gray-500 mt-1">
                Set up the multi-stop delivery itinerary.
              </p>
            </div>
            {itinerary && (
              <button
                type="button"
                onClick={() => setSetupMode(false)}
                className="text-[11px] font-bold uppercase tracking-widest text-gray-500 hover:text-gray-900 focus:outline-none"
              >
                Cancel
              </button>
            )}
          </div>

          <WebCargoSummary />

          <form
            onSubmit={handleSaveRoute}
            className="p-5 md:p-8 pt-0 flex flex-col gap-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-5 border border-gray-200 rounded-xl shadow-sm">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                  Driver Name
                </label>
                <input
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="e.g. Lalamove - Juan"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#149911]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                  Vehicle / Plate #
                </label>
                <input
                  value={vehicleDetails}
                  onChange={(e) => setVehicleDetails(e.target.value)}
                  placeholder="e.g. Closed Van - ABC 123"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#149911]"
                />
              </div>
            </div>

            <div className="relative flex flex-col gap-6 pl-4 md:pl-6 border-l-2 border-gray-200 ml-4">
              {routeStops.map((stop, i) => (
                <div
                  key={i}
                  className="relative bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
                >
                  <div
                    className={`absolute -left-[29px] md:-left-[37px] top-5 w-5 h-5 rounded-full border-4 border-[#fbfbfd] flex items-center justify-center ${stop.type === "pickup" ? "bg-blue-500" : "bg-orange-500"}`}
                  />

                  <div className="flex justify-between items-center mb-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${stop.type === "pickup" ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"}`}
                    >
                      {i + 1}. {stop.type === "pickup" ? "Pick Up" : "Drop Off"}
                    </span>
                    {routeStops.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStop(i)}
                        className="text-gray-400 hover:text-red-500 transition-colors focus:outline-none"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Pick Up Quick Fills */}
                  {stop.type === "pickup" && (
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                        Quick Fill:
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          updateStop(i, {
                            address: PRIMEGEN_ADDRESS,
                            contactName: "Primegen Trading (Warehouse)",
                            contactPhone: PRIMEGEN_PHONE,
                          })
                        }
                        className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 bg-[#01172f]/10 text-[#01172f] hover:bg-[#01172f] hover:text-white rounded transition-colors focus:outline-none"
                      >
                        Primegen
                      </button>

                      {uniqueSuppliersForQuickFill.map((po, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() =>
                            updateStop(i, {
                              address: po.address || "",
                              contactName: `${po.name || po.company || "Supplier"} (${po.poNumber})`,
                              contactPhone: po.phone || "",
                            })
                          }
                          className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 bg-[#149911]/10 text-[#149911] hover:bg-[#149911] hover:text-white rounded transition-colors focus:outline-none"
                        >
                          {po.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Drop Off Quick Fills (Client Details) */}
                  {stop.type === "dropoff" &&
                    clientData &&
                    (clientData.address || clientData.name) && (
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                          Quick Fill:
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateStop(i, {
                              address: clientData.address,
                              contactName: clientData.name,
                              contactPhone: clientData.phone,
                            })
                          }
                          className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 bg-[#01172f]/10 text-[#01172f] hover:bg-[#01172f] hover:text-white rounded transition-colors focus:outline-none"
                        >
                          Client Address
                        </button>
                      </div>
                    )}

                  <div className="flex flex-col gap-3 mt-2">
                    <input
                      type="text"
                      value={stop.address}
                      onChange={(e) =>
                        updateStop(i, { address: e.target.value })
                      }
                      placeholder="Enter full address..."
                      required
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:border-[#149911] shadow-sm transition-colors"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 ml-1">
                          Contact Name
                        </label>
                        <input
                          value={stop.contactName}
                          onChange={(e) =>
                            updateStop(i, { contactName: e.target.value })
                          }
                          placeholder="Name"
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[12px] focus:outline-none focus:border-gray-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 ml-1">
                          Contact Phone
                        </label>
                        <input
                          value={stop.contactPhone}
                          onChange={(e) =>
                            updateStop(i, { contactPhone: e.target.value })
                          }
                          placeholder="Phone Number"
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[12px] focus:outline-none focus:border-gray-400"
                        />
                      </div>
                    </div>
                    <div className="mt-2">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 ml-1">
                        Scheduled Time (Optional)
                      </label>
                      <input
                        type="datetime-local"
                        value={formatDateTimeLocal(stop.scheduledDate)}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateStop(i, {
                            scheduledDate: val
                              ? new Date(val).toISOString()
                              : null,
                          });
                        }}
                        className="w-full sm:w-[250px] px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[12px] focus:outline-none focus:border-[#149911]"
                      />
                    </div>
                  </div>

                  <WebPickupItemsDetails
                    stop={stop}
                    matchedPOs={matchedPOsByStopIndex[i] || []}
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 ml-4 md:ml-6 pl-4 md:pl-6 border-l-2 border-transparent">
              <button
                type="button"
                onClick={() => handleAddStop("pickup")}
                className="flex-1 py-3 border border-dashed border-blue-300 text-blue-600 text-[12px] font-semibold rounded-xl hover:bg-blue-50 transition-colors focus:outline-none"
              >
                + Add Pick Up
              </button>
              <button
                type="button"
                onClick={() => handleAddStop("dropoff")}
                className="flex-1 py-3 border border-dashed border-orange-300 text-orange-600 text-[12px] font-semibold rounded-xl hover:bg-orange-50 transition-colors focus:outline-none"
              >
                + Add Drop Off
              </button>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={updating || !isFormValid}
                className="relative flex items-center justify-center w-full flex-1 bg-white text-[#3D5F3B] py-3.5 overflow-hidden group cursor-pointer border-2 border-[#149911] rounded-lg disabled:opacity-50 transition-colors duration-300 shadow-sm hover:shadow-md"
              >
                <span className="absolute inset-0 bg-[#149911] transform scale-x-0 origin-left transition-transform duration-500 ease-[cubic-bezier(0.87,0,0.13,1)] group-hover:scale-x-100" />
                <span className="relative z-10 text-[13px] text-[#149911] font-bold uppercase tracking-[0.2em] transition-colors duration-300 group-hover:text-[#fdfffc]">
                  {updating
                    ? "Saving Route..."
                    : itinerary
                      ? "Update Route"
                      : "Save Route"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center justify-center px-8 py-3.5 bg-[#01172f] text-white text-[12px] font-bold uppercase tracking-[0.15em] rounded-lg hover:bg-[#103900] transition-colors shadow-sm focus:outline-none flex-shrink-0"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  ></path>
                </svg>
                Print Waybill
              </button>
            </div>
          </form>
        </div>
      ) : (
        // ==========================================
        // VIEW 2: ACTIVE ITINERARY TRACKER
        // ==========================================
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden print:hidden">
          <div className="p-5 md:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-[16px] font-semibold tracking-tight text-gray-900 leading-none">
                  Live Delivery Route
                </h3>
                <span
                  className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded ${itinerary.status === "delivered" ? "bg-[#149911]/10 text-[#149911]" : "bg-amber-50 text-amber-600"}`}
                >
                  {itinerary.status.replace("-", " ")}
                </span>
              </div>
              <p className="text-[11px] font-mono text-gray-400 mt-1">
                TRK#: {itinerary.trackingNumber}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setRouteStops(itinerary.stops);
                  setDriverName(itinerary.driverName || "");
                  setVehicleDetails(itinerary.vehicleDetails || "");
                  setSetupMode(true);
                }}
                className="text-[10px] font-bold uppercase tracking-widest px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors focus:outline-none"
              >
                Edit Route
              </button>
              <button
                onClick={() => window.print()}
                className="text-[10px] font-bold uppercase tracking-widest px-4 py-2 bg-[#149911] text-white hover:bg-[#103900] rounded-lg transition-colors shadow-sm focus:outline-none"
              >
                Print Waybill
              </button>
            </div>
          </div>

          <WebCargoSummary />

          {(itinerary.driverName || itinerary.vehicleDetails) && (
            <div className="bg-gray-50 px-5 md:px-6 py-3 border-y border-gray-100 flex flex-wrap gap-x-8 gap-y-2 text-[11px] text-[#01172f]">
              {itinerary.driverName && (
                <span className="font-bold">
                  <span className="text-gray-400 font-medium mr-1 uppercase tracking-wider text-[9px]">
                    Driver:
                  </span>
                  {itinerary.driverName}
                </span>
              )}
              {itinerary.vehicleDetails && (
                <span className="font-bold">
                  <span className="text-gray-400 font-medium mr-1 uppercase tracking-wider text-[9px]">
                    Vehicle:
                  </span>
                  {itinerary.vehicleDetails}
                </span>
              )}
            </div>
          )}

          <div className="p-5 md:p-8">
            <div className="relative border-l-2 border-gray-100 ml-3 md:ml-4 space-y-8">
              {itinerary.stops.map((stop, i) => {
                const isCompleted = stop.status === "completed";
                const isArrived = stop.status === "arrived";

                return (
                  <div key={stop.id || i} className="relative pl-6 md:pl-8">
                    <div
                      className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-4 border-white ${isCompleted ? "bg-[#149911]" : isArrived ? "bg-amber-400" : "bg-gray-200"}`}
                    />

                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1">
                        <span
                          className={`inline-block mb-2 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${stop.type === "pickup" ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"}`}
                        >
                          {i + 1}.{" "}
                          {stop.type === "pickup" ? "Pick Up" : "Drop Off"}
                        </span>
                        <h4
                          className={`text-[15px] font-medium leading-snug ${isCompleted ? "text-gray-400 line-through" : "text-[#01172f]"}`}
                        >
                          {stop.address}
                        </h4>
                        {(stop.contactName || stop.contactPhone) && (
                          <p className="text-[12px] text-gray-500 mt-2 font-medium">
                            Contact: {stop.contactName}{" "}
                            {stop.contactName && stop.contactPhone && "•"}{" "}
                            {stop.contactPhone}
                          </p>
                        )}

                        {stop.scheduledDate && (
                          <p className="text-[11px] text-[#149911] mt-1.5 font-bold flex items-center gap-1.5">
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            Scheduled:{" "}
                            {new Date(stop.scheduledDate).toLocaleString(
                              "en-PH",
                              { dateStyle: "medium", timeStyle: "short" },
                            )}
                          </p>
                        )}

                        <WebPickupItemsDetails
                          stop={stop}
                          matchedPOs={matchedPOsByStopIndex[i] || []}
                        />
                      </div>

                      {!isCompleted && (
                        <div className="flex items-center gap-2 shrink-0">
                          <select
                            value={stop.status}
                            onChange={(e) =>
                              updateStopStatus(stop.id, e.target.value)
                            }
                            disabled={updating}
                            className="bg-white border border-gray-200 text-[#01172f] text-[10px] font-bold uppercase tracking-widest rounded-lg px-3 py-2 outline-none focus:border-[#149911] transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
                          >
                            <option value="pending">Pending</option>
                            <option value="arrived">Driver Arrived</option>
                            <option value="completed">Completed ✓</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* HIDDEN PRINT DOCUMENT (PRIMEGEN WAYBILL) */}
      {/* ========================================== */}
      <div className="waybill-print-doc hidden print:block w-full bg-white text-[#01172f]">
        {/* Print Header */}
        <div className="flex justify-between items-center mb-4 border-b-2 border-[#149911] pb-3">
          <div className="flex gap-3 items-center">
            <div className="relative w-16 h-16 flex-shrink-0">
              <Image
                src="/branding/primegen_trading_logo.png"
                alt="Primegen Trading"
                fill
                className="object-contain"
              />
            </div>
            <div>
              <h2 className="text-lg font-black leading-none text-[#103900] tracking-tight mb-0.5">
                PRIMEGEN
              </h2>
              <p className="text-[10px] font-bold tracking-[0.2em] text-[#01172f] mb-1">
                TRADING CORPORATION
              </p>
              <p className="text-[8px] font-bold text-[#103900] max-w-[250px] m-0">
                SOUTHERN CITY HOMES, YG BUILDING, CEBU ST, 4 TANZANG LUMA, IMUS,
                4103 CAVITE
              </p>
              <p className="text-[8px] font-bold text-[#103900] m-0">
                0917-185-9127 / 0917-133-9515
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="inline-block bg-[#3D5F3B] text-white text-[12px] font-bold tracking-widest px-3 py-1 mb-2">
              DELIVERY WAYBILL
            </div>
            <p className="text-[11px] font-bold m-0">
              <span className="text-gray-500 mr-2">TRK#:</span>{" "}
              <span className="font-mono">{displayTracking}</span>
            </p>
            <p className="text-[11px] font-bold m-0">
              <span className="text-gray-500 mr-2">DATE:</span>{" "}
              {new Date().toLocaleDateString("en-PH")}
            </p>
          </div>
        </div>

        {/* Driver Details */}
        <div className="flex justify-between items-center mb-4 bg-gray-50 py-2 px-3 border border-gray-200">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-0.5">
              Assigned Driver
            </p>
            <p className="text-[12px] font-bold">
              {displayDriver || "_________________________"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-0.5">
              Vehicle Details
            </p>
            <p className="text-[12px] font-bold uppercase">
              {displayVehicle || "_________________________"}
            </p>
          </div>
        </div>

        {/* Printed Cargo Summary Table */}
        <div className="mb-4">
          <div className="bg-[#3D5F3B] text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1 mb-2">
            Cargo / Items to Deliver
          </div>
          {cargoItems.length === 0 ? (
            <p className="text-[10px] text-gray-500 italic">
              No line items recorded for this order.
            </p>
          ) : (
            <>
              {(() => {
                const uniqueSourceKeys = Array.from(
                  new Set(
                    cargoItems.map((c) => `${c.sourceName}-${c.sourcePO}`),
                  ),
                );
                const isSingleSource =
                  uniqueSourceKeys.length === 1 && cargoItems.length > 0;

                return (
                  <div className="w-full border border-gray-200 border-t-0">
                    {isSingleSource && (
                      <div className="bg-gray-100/80 px-2 py-1.5 border-t border-gray-200 text-[8px] font-bold uppercase tracking-widest text-[#01172f]">
                        Source: {cargoItems[0].sourceName}{" "}
                        {cargoItems[0].sourcePO &&
                          `• PO: ${cargoItems[0].sourcePO}`}
                        <span className="text-gray-500 font-medium normal-case ml-1">
                          — {cargoItems[0].sourceAddress}
                        </span>
                      </div>
                    )}
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-t border-b-2 border-gray-300">
                          <th className="text-left text-[9px] font-bold uppercase text-gray-500 pb-1.5 pt-1.5 w-[15%] pl-2">
                            Qty
                          </th>
                          <th className="text-left text-[9px] font-bold uppercase text-gray-500 pb-1.5 pt-1.5 w-[45%]">
                            Description
                          </th>
                          <th className="text-left text-[9px] font-bold uppercase text-gray-500 pb-1.5 pt-1.5 w-[40%]">
                            Specs / Size
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {cargoItems.map((item, idx) => {
                          const isPrimegen =
                            item.sourceName === "Primegen Trading (Warehouse)";
                          return (
                            <tr key={idx} className="border-b border-gray-100">
                              <td className="py-2 text-[10px] font-bold pl-2 align-top">
                                {item.qty}{" "}
                                <span className="text-[9px] text-gray-500 font-normal ml-0.5">
                                  {item.unit}
                                </span>
                              </td>
                              <td className="py-2 align-top pr-4">
                                <div className="text-[10px] font-bold uppercase leading-tight">
                                  {item.description}
                                </div>
                                {!isSingleSource && (
                                  <div
                                    className={`mt-1 text-[7px] font-bold uppercase tracking-wider ${isPrimegen ? "text-blue-600" : "text-gray-500"}`}
                                  >
                                    {item.sourceName}{" "}
                                    {item.sourcePO && `• ${item.sourcePO}`}{" "}
                                    <span className="normal-case font-medium">
                                      — {item.sourceAddress}
                                    </span>
                                  </div>
                                )}
                              </td>
                              <td className="py-2 text-[10px] text-gray-700 leading-tight align-top">
                                {item.size || "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </>
          )}
        </div>

        {/* Stops List */}
        <div className="mb-4">
          <div className="bg-[#3D5F3B] text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1 mb-2">
            Route Details
          </div>

          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left text-[9px] font-bold uppercase text-gray-500 pb-1.5 w-[8%]">
                  Seq
                </th>
                <th className="text-left text-[9px] font-bold uppercase text-gray-500 pb-1.5 w-[42%]">
                  Address / Details
                </th>
                <th className="text-left text-[9px] font-bold uppercase text-gray-500 pb-1.5 w-[25%] pl-3">
                  Received By (Sign)
                </th>
                <th className="text-left text-[9px] font-bold uppercase text-gray-500 pb-1.5 w-[25%] pl-3">
                  Time Arrived
                </th>
              </tr>
            </thead>
            <tbody>
              {displayStops.map((stop, i) => {
                const primegenStop = isPrimegenStop(stop);
                const matchedPOs = matchedPOsByStopIndex[i] || [];

                return (
                  <tr key={i} className="border-b border-gray-200">
                    <td className="py-3 align-top">
                      <span className="font-bold text-[12px]">{i + 1}.</span>
                      <span className="block text-[7px] font-bold uppercase tracking-wider text-gray-500 mt-0.5">
                        {stop.type === "pickup" ? "Pick Up" : "Drop Off"}
                      </span>
                    </td>
                    <td className="py-3 align-top pr-4">
                      <p className="text-[11px] font-bold leading-tight mb-1">
                        {stop.address}
                      </p>
                      
                      <div className="flex flex-col gap-0.5 mb-1.5">
                        <p className="text-[9px] text-gray-600 font-medium">
                          Contact: {stop.contactName || "_________"} •{" "}
                          {stop.contactPhone || "_________"}
                        </p>

                        {stop.scheduledDate && (
                          <p className="text-[9px] text-[#149911] font-bold mt-1">
                            Sched:{" "}
                            {new Date(stop.scheduledDate).toLocaleString(
                              "en-PH",
                              { dateStyle: "short", timeStyle: "short" },
                            )}
                          </p>
                        )}
                      </div>

                      {stop.type === "pickup" &&
                        primegenStop &&
                        primegenItems.length > 0 && (
                          <div className="mt-2 pl-2 border-l-2 border-[#01172f]/30">
                            <p className="text-[8px] font-bold uppercase tracking-widest text-[#01172f] mb-0.5">
                              Primegen Inventory:
                            </p>
                            <ul className="list-disc pl-3">
                              {primegenItems.map((item, idx) => {
                                // ✨ SMART REDUNDANCY CHECK
                                const isRedundant = item.size && (item.description || '').toUpperCase().includes(item.size.toUpperCase());

                                return (
                                  <li
                                    key={idx}
                                    className="text-[9px] text-gray-600 font-medium mb-0.5 leading-tight"
                                  >
                                    {item.qty} {item.unit} —{" "}
                                    <span className="uppercase">
                                      {item.description}
                                    </span>{" "}
                                    {!isRedundant && item.size && `(${item.size})`}
                                  </li>
                                )
                              })}
                            </ul>
                          </div>
                        )}

                      {stop.type === "pickup" && matchedPOs.length > 0 && (
                        <div className="mt-2 pl-2 border-l-2 border-[#149911]/30">
                          <p className="text-[8px] font-bold uppercase tracking-widest text-[#149911] mb-0.5">
                            Supplier Items:
                          </p>
                          <div className="flex flex-col gap-1.5">
                            {matchedPOs.map((po, poIdx) => (
                              <div key={poIdx}>
                                <span className="text-[8px] font-bold text-[#01172f] border border-[#01172f]/20 px-1 rounded inline-block bg-gray-50 mb-0.5">
                                  {po.poNumber}
                                </span>
                                <ul className="list-disc pl-4">
                                  {po.items.map((item, idx) => {
                                    // ✨ SMART REDUNDANCY CHECK
                                    const isRedundant = item.size && (item.description || '').toUpperCase().includes(item.size.toUpperCase());

                                    return (
                                      <li
                                        key={idx}
                                        className="text-[9px] text-gray-700 font-medium leading-tight mb-0.5"
                                      >
                                        <span className="font-bold">
                                          {item.qty} {item.unit}
                                        </span>{" "}
                                        —{" "}
                                        <span className="uppercase">
                                          {item.description}
                                        </span>{" "}
                                        {!isRedundant && item.size && `(${item.size})`}
                                      </li>
                                    )
                                  })}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="py-3 align-bottom border-l border-gray-100 pl-3">
                      <div className="border-b border-gray-400 w-full mb-1" />
                      <span className="text-[7px] text-gray-400 uppercase tracking-wider">
                        Signature over printed name
                      </span>
                    </td>
                    <td className="py-3 align-bottom border-l border-gray-100 pl-3 pr-1">
                      <div className="border-b border-gray-400 w-full mb-1" />
                      <span className="text-[7px] text-gray-400 uppercase tracking-wider">
                        Date & Time
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="text-[9px] text-gray-500 border-t border-gray-200 pt-2 text-center mt-6">
          <p className="font-bold uppercase tracking-widest text-[#01172f] mb-0.5">
            Important Note
          </p>
          <p>
            Please ensure all goods are inspected before signing. Signature
            constitutes acceptance of delivery in good condition.
          </p>
        </div>
      </div>
    </div>
  );
}