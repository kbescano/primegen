"use client";

import { useState } from 'react';
import Link from 'next/link';
import DeliveryItineraryTracker from '@/components/DeliveryItineraryTracker';

const FULFILLMENT_LABELS: Record<string, string> = {
  preparing: 'Preparing',
  shipped: 'In Transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function DeliveriesClient({
  enrichedOrders,
  filterStatus,
}: {
  enrichedOrders: any[];
  filterStatus: string;
}) {
  const [trackOrderId, setTrackOrderId] = useState<string | null>(null);

  const filterPills = [
    { value: 'active', label: 'Active Deliveries' },
    { value: 'delivered', label: 'Completed' },
    { value: 'all', label: 'All Orders' },
  ];

  return (
    <div className="max-w-[1200px] mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-black uppercase tracking-tight text-[#01172f] mb-1">
          Delivery Master List
        </h1>
        <p className="text-xs text-gray-500 font-medium">
          Logistics command center. Monitor target deadlines, plan routes, and track active deliveries.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {filterPills.map((pill) => {
          const isActive = filterStatus === pill.value;
          const href = `/admin-dashboard/deliveries?status=${pill.value}`;
          return (
            <Link
              key={pill.value}
              href={href}
              className={`text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-lg transition-all ${
                isActive
                  ? 'bg-[#01172f] text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {pill.label}
            </Link>
          );
        })}
      </div>

      {enrichedOrders.length === 0 ? (
        <div className="py-16 text-center bg-white border border-gray-200 rounded-2xl shadow-sm">
          <p className="text-sm text-gray-400 font-medium">No deliveries found for this view.</p>
        </div>
      ) : (
        <>
          {/* ============================================== */}
          {/* MOBILE VIEW (Card-Based, No Carousel) */}
          {/* ============================================== */}
          <div className="block lg:hidden w-full space-y-4">
            {enrichedOrders.map((o: any) => (
              <div key={o.id} className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex flex-col gap-4">
                
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-[14px] font-black text-[#01172f]">{o.orderNumber}</span>
                    <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded w-fit ${
                      o.fulfillmentStatus === 'preparing' ? 'bg-blue-50 text-blue-600' :
                      o.fulfillmentStatus === 'shipped' ? 'bg-amber-50 text-amber-600' :
                      o.fulfillmentStatus === 'delivered' ? 'bg-[#149911]/10 text-[#149911]' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {FULFILLMENT_LABELS[o.fulfillmentStatus || 'preparing']}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[12px] ${o.deadlineColor}`}>{o.targetDateStr}</span>
                    {o.badgeText && (
                      <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${o.badgeColor}`}>
                        {o.badgeText}
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="text-[12px] font-bold text-[#01172f] mb-0.5">{o.customerName}</div>
                  <div className="text-[11px] text-gray-500 leading-snug line-clamp-2 mb-1">{o.address}</div>
                  <div className="text-[10px] text-gray-400">{o.contactNumber}</div>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Order Items</h4>
                  {o.items && o.items.length > 0 ? (
                    <ul className="flex flex-col gap-1.5">
                      {o.items.map((item: any, idx: number) => {
                        // ✨ SMART REDUNDANCY CHECK
                        const descUpper = (item.description || '').toUpperCase();
                        const sizeUpper = (item.sizeDescription || '').toUpperCase();
                        const isRedundant = sizeUpper && descUpper.includes(sizeUpper);

                        return (
                          <li key={idx} className="text-[11px] text-gray-700 leading-snug break-words">
                            <span className="font-bold text-[#01172f] mr-1.5">{Number(item.qty) || 0} {item.unit || 'x'}</span>
                            <span className="uppercase font-medium text-gray-800">{item.description || 'Unnamed item'}</span>
                            {item.sizeDescription && !isRedundant && <span className="text-gray-400 capitalize"> ({item.sizeDescription})</span>}
                          </li>
                        )
                      })}
                    </ul>
                  ) : (
                    <span className="text-[11px] text-gray-400 italic">No items in order</span>
                  )}

                  {o.orderPOs.length > 0 && (
                    <div className="pt-2 mt-2 border-t border-gray-100 flex flex-col gap-1.5">
                      {o.orderPOs.map((po: any) => (
                        <div key={po.id} className="flex items-start">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-[#149911] bg-[#149911]/5 border border-[#149911]/10 px-1.5 py-0.5 rounded leading-tight inline-block">
                            Supplier: {po.poNumber ? `${po.poNumber} • ` : ''}{po.supplierName || po.company || 'Unnamed Supplier'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div>
                    {o.hasItinerary ? (
                      <div className="flex flex-col items-start gap-0.5">
                        <span className="text-[11px] font-mono font-semibold text-gray-700">{o.itin.trackingNumber}</span>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mt-0.5 ${
                          o.itin.status === 'delivered' ? 'bg-[#149911]/10 text-[#149911]' : 'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                          {o.itin.status.replace('-', ' ')}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-gray-400 italic">No route planned</span>
                    )}
                  </div>
                  <button
                    onClick={() => setTrackOrderId(o.id)}
                    className={`inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm ${
                      o.hasItinerary 
                        ? 'bg-white border border-gray-200 text-[#01172f] hover:bg-gray-50'
                        : 'bg-[#149911] text-white hover:bg-[#103900]'
                    }`}
                  >
                    {o.hasItinerary ? 'Track Route' : 'Plan Route'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ============================================== */}
          {/* DESKTOP VIEW (Spreadsheet Table) */}
          {/* ============================================== */}
          <div className="hidden lg:block bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 w-[12%]">Deadline</th>
                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 w-[12%]">Order #</th>
                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 w-[24%]">Order Summary & Sources</th>
                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 w-[22%]">Destination</th>
                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 w-[16%]">Logistics Status</th>
                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 w-[14%] text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {enrichedOrders.map((o: any) => (
                    <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4 align-top">
                        <div className="flex flex-col items-start gap-1.5">
                          <span className={`text-[12px] ${o.deadlineColor}`}>{o.targetDateStr}</span>
                          {o.badgeText && (
                            <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${o.badgeColor}`}>
                              {o.badgeText}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <span className="font-mono text-[12px] font-bold text-[#01172f] block mb-1">{o.orderNumber}</span>
                        <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          o.fulfillmentStatus === 'preparing' ? 'bg-blue-50 text-blue-600' :
                          o.fulfillmentStatus === 'shipped' ? 'bg-amber-50 text-amber-600' :
                          o.fulfillmentStatus === 'delivered' ? 'bg-[#149911]/10 text-[#149911]' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {FULFILLMENT_LABELS[o.fulfillmentStatus || 'preparing']}
                        </span>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <div className="flex flex-col gap-2.5">
                          {o.items && o.items.length > 0 ? (
                            <ul className="flex flex-col gap-1.5">
                              {o.items.map((item: any, idx: number) => {
                                // ✨ SMART REDUNDANCY CHECK
                                const descUpper = (item.description || '').toUpperCase();
                                const sizeUpper = (item.sizeDescription || '').toUpperCase();
                                const isRedundant = sizeUpper && descUpper.includes(sizeUpper);

                                return (
                                  <li key={idx} className="text-[11px] text-gray-700 leading-snug break-words">
                                    <span className="font-bold text-[#01172f] mr-1.5">
                                      {Number(item.qty) || 0} {item.unit || 'x'}
                                    </span>
                                    <span className="uppercase font-medium text-gray-800">{item.description || 'Unnamed item'}</span>
                                    {item.sizeDescription && !isRedundant && <span className="text-gray-400 capitalize"> ({item.sizeDescription})</span>}
                                  </li>
                                )
                              })}
                            </ul>
                          ) : (
                            <span className="text-[11px] text-gray-400 italic">No items in order</span>
                          )}

                          {o.orderPOs.length > 0 && (
                            <div className="pt-2 border-t border-gray-100 flex flex-col gap-1.5">
                              {o.orderPOs.map((po: any) => (
                                <div key={po.id} className="flex items-start">
                                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#149911] bg-[#149911]/5 border border-[#149911]/10 px-1.5 py-0.5 rounded leading-tight inline-block">
                                    Supplier: {po.poNumber ? `${po.poNumber} • ` : ''}{po.supplierName || po.company || 'Unnamed Supplier'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <div className="text-[13px] font-bold text-[#01172f] mb-0.5">{o.customerName}</div>
                        <div className="text-[11px] text-gray-500 leading-snug line-clamp-2 max-w-[200px] mb-1">{o.address}</div>
                        <div className="text-[10px] text-gray-400">{o.contactNumber}</div>
                      </td>

                      <td className="px-5 py-4 align-top">
                        {o.hasItinerary ? (
                          <div className="flex flex-col items-start gap-1">
                            <span className="text-[11px] font-mono font-semibold text-gray-700">{o.itin.trackingNumber}</span>
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                              o.itin.status === 'delivered' ? 'bg-[#149911]/10 text-[#149911]' : 'bg-amber-50 text-amber-600 border border-amber-100'
                            }`}>
                              {o.itin.status.replace('-', ' ')}
                            </span>
                            {o.itin.driverName && <span className="text-[10px] text-gray-500 mt-0.5">{o.itin.driverName}</span>}
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-400 italic">No route planned yet</span>
                        )}
                      </td>

                      <td className="px-5 py-4 align-top text-right">
                        <button
                          onClick={() => setTrackOrderId(o.id)}
                          className={`inline-flex items-center justify-center px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm ${
                            o.hasItinerary 
                              ? 'bg-white border border-gray-200 text-[#01172f] hover:bg-gray-50'
                              : 'bg-[#149911] text-white hover:bg-[#103900]'
                          }`}
                        >
                          {o.hasItinerary ? 'Track Route' : 'Plan Route'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* The Instant Modal overlay */}
      {trackOrderId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-[#01172f]/40 backdrop-blur-sm print:static print:bg-transparent print:p-0 print:block">
          <div className="bg-transparent w-full max-w-[800px] max-h-[90vh] overflow-y-auto relative custom-scrollbar print:static print:max-w-none print:max-h-none print:overflow-visible">
            
            <button
              onClick={() => setTrackOrderId(null)}
              className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full transition-colors z-[210] print:hidden focus:outline-none shadow-sm"
              aria-label="Close Tracking Modal"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            
            <div className="print:block">
              <DeliveryItineraryTracker orderId={trackOrderId} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}