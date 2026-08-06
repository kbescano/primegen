import Link from "next/link";
import OrderSupplierSection from "@/components/OrderSupplierSection";
import OrderOpexSection from "@/components/OrderOpexSection";
import QuotationPrintPreview from "@/components/pipeline/QuotationPrintPreview";
import { TabSection, SummaryRow, EmptyStep, InstantSelect, FinancialSummary } from "@/components/pipeline/PipelineSharedUI";
import { quotationTotal, peso, FULFILLMENT_OPTIONS, FULFILLMENT_COLORS, PAYMENT_OPTIONS, PAYMENT_COLORS } from "@/lib/pipelineUtils";

export function StepQuotation({ quotation, localOrder, request }: any) {
  return (
    <TabSection title="Step 1: Create Quotation">
      {quotation ? (
        <div className="flex flex-col gap-1.5">
          <SummaryRow label="Quotation #" value={quotation.quotationNumber} mono />
          <SummaryRow label="Status" value={quotation.status.replace("_", " ")} />
          <SummaryRow label="Customer" value={quotation.customerName} />
          {localOrder ? (
            <QuotationPrintPreview quotation={quotation} />
          ) : (
            <div className="pt-6 mt-4 border-t border-gray-100 flex justify-start">
              <Link
                href={`/admin-dashboard/client-quotation?id=${quotation.id}&pipelineId=${request.id}`}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#1d1d1f] text-white hover:bg-gray-800 transition-all text-[11px] font-medium w-full sm:w-auto shadow-sm"
              >
                Open Full Quotation &rarr;
              </Link>
            </div>
          )}
        </div>
      ) : (
        <EmptyStep text="No quotation created yet for this request." ctaLabel="Create Client Quotation" href={`/admin-dashboard/client-quotation?from=${request.id}&pipelineId=${request.id}`} />
      )}
    </TabSection>
  );
}

export function StepConfirmation({ quotation, isQuotationApprovedOrBeyond, handleTabChange, request }: any) {
  return (
    <TabSection title="Step 2: Quotation Approval">
      {!quotation ? (
        <EmptyStep text="Waiting on Step 1: create a quotation first." />
      ) : (
        <div className="flex flex-col h-full gap-1.5">
          <SummaryRow label="Quotation Status" value={quotation.status.replace("_", " ")} />
          <SummaryRow label="Total Value" value={peso(quotationTotal(quotation))} mono />
          <div className={`mt-4 mb-3 p-5 rounded-2xl border transition-colors duration-300 ${isQuotationApprovedOrBeyond ? "border-green-200 bg-[#f0fdf4]" : "border-gray-200 bg-gray-50/50"}`}>
            {isQuotationApprovedOrBeyond ? (
              <div className="flex flex-col items-start gap-3">
                <p className="text-[13px] font-medium text-gray-900 leading-relaxed">
                  <strong className="text-[#149911] mr-1">Approved!</strong> The client has accepted this quotation. You can now print the formal document and proceed to confirm the internal order.
                </p>
                <Link
                  href={`/admin-dashboard/client-quotation?id=${quotation.id}&pipelineId=${request.id}`}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all text-[11px] font-medium w-full sm:w-auto mt-1 shadow-sm"
                >
                  Open Quotation to Print &rarr;
                </Link>
              </div>
            ) : (
              <div className="flex flex-col items-start gap-4">
                <p className="text-[13px] font-medium text-gray-700 leading-relaxed">
                  {quotation.status === "pending_approval"
                    ? "Pending Approval. Waiting for internal review before this can be sent to the client or approved."
                    : quotation.status === "sent"
                      ? "Sent to client. Awaiting client acceptance to proceed with approval."
                      : "Draft stage. Complete the quotation details and send for internal approval."}
                </p>
                {quotation.status === "draft" && (
                  <Link
                    href={`/admin-dashboard/client-quotation?id=${quotation.id}&pipelineId=${request.id}`}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all text-[11px] font-medium w-full sm:w-auto shadow-sm"
                  >
                    Send for Internal Approval &rarr;
                  </Link>
                )}
              </div>
            )}
          </div>
          {isQuotationApprovedOrBeyond && (
            <div className="border-t border-gray-100 pt-5 mt-2 flex justify-start">
              <button
                onClick={() => handleTabChange("supplierPO")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#1d1d1f] text-white hover:bg-gray-800 transition-all text-[11px] font-medium shadow-sm"
              >
                Next Step: Confirm Order & Create PO &rarr;
              </button>
            </div>
          )}
        </div>
      )}
    </TabSection>
  );
}

export function StepSupplierPO({ quotation, localOrder, isQuotationApprovedOrBeyond, isCreatingOrder, handleConfirmOrder, linkedPOs, handleTabChange }: any) {
  if (!isQuotationApprovedOrBeyond) {
    return (
      <TabSection title="Step 3: Create PO">
        <EmptyStep text="Waiting on Step 2: approve the quotation first." />
      </TabSection>
    );
  }

  // STRICT CHECK: Item must have an ID AND that ID must exist in the active linkedPOs list
  const isFullyAssigned = Boolean(
    localOrder?.items?.length > 0 && 
    localOrder.items.every((item: any) => 
      item.assignedPOId && linkedPOs.some((po: any) => String(po.id) === String(item.assignedPOId))
    )
  );

  return (
    <TabSection title="Step 3: Create PO">
      {!localOrder ? (
        <div className="w-full">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-3 mb-5">
            <div>
              <span className="bg-gray-100 px-2.5 py-1 text-[9px] font-semibold text-gray-500 tracking-wide rounded-full inline-block mb-2">
                PENDING ORDER
              </span>
              <h3 className="text-[18px] font-semibold tracking-tight text-gray-900 leading-none break-words">
                {quotation?.customerName || "--"}
              </h3>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-5 border-b border-gray-100">
            <div>
              <p className="text-[12px] text-gray-500 font-medium mb-1">Internal Order Status</p>
              <p className="text-[13px] text-gray-900 font-medium">Set to Confirmed to generate the order and unlock POs.</p>
            </div>
            <div className="relative w-full sm:w-auto">
              {isCreatingOrder || quotation?.status === "order_confirmed" ? (
                <span className="inline-block w-full sm:w-[160px] text-center px-4 py-2 text-[11px] font-medium bg-[#149911]/10 text-[#149911] rounded-xl">
                  Generating Order...
                </span>
              ) : (
                <div className="w-full sm:w-[160px]">
                  <select
                    onChange={(e) => {
                      if (e.target.value === "order_confirmed") handleConfirmOrder();
                    }}
                    defaultValue="pending"
                    className="w-full appearance-none pr-8 pl-4 py-2 text-[12px] font-medium rounded-xl cursor-pointer focus:outline-none ring-1 ring-inset ring-gray-200 focus:ring-gray-300 transition-all bg-gray-50 hover:bg-gray-100 text-gray-900"
                  >
                    <option value="pending">Pending</option>
                    <option value="order_confirmed">Confirmed</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 opacity-40">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="py-10 text-center bg-[#fbfbfd] rounded-2xl border border-dashed border-gray-200 px-5">
            <p className="text-[13px] text-gray-500 font-medium max-w-sm mx-auto">
              Please confirm the internal order status above to unlock supplier assignments and PO generation.
            </p>
          </div>
        </div>
      ) : (
        <div className="w-full">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-3 mb-5">
            <div>
              <span className="bg-gray-100 px-2.5 py-1 text-[9px] font-semibold text-gray-500 tracking-wide rounded-full inline-block mb-2">
                {localOrder.orderNumber || "ACTIVE ORDER"}
              </span>
              <h3 className="text-[18px] font-semibold tracking-tight text-gray-900 leading-none break-words">
                {localOrder.customerName || "--"}
              </h3>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-5 border-b border-gray-100">
            <div>
              <p className="text-[12px] text-gray-500 font-medium mb-1">Internal Order Status</p>
              <p className="text-[13px] text-gray-900 font-medium">Order is active. You can now manage POs.</p>
            </div>
            <span className="inline-block w-full sm:w-[160px] text-center px-4 py-2 text-[11px] font-medium bg-[#149911]/10 text-[#149911] rounded-xl">
              Confirmed
            </span>
          </div>
          
          <div className="mb-5">
            <OrderSupplierSection
              orderId={localOrder.id}
              items={localOrder.items || []}
              linkedPOs={linkedPOs || []}
              allowStatusChange={false}
            />
          </div>
          
          <div className="border-t border-gray-100 pt-6 mt-6 flex flex-col-reverse lg:flex-row gap-6 justify-between items-start">
            <div className="w-full lg:w-auto flex-1 flex justify-start">
              {/* Only show the Next button if POs exist AND ALL items are validly assigned */}
              {linkedPOs.length > 0 && isFullyAssigned && (
                <button
                  onClick={() => handleTabChange("fulfilled")}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#1d1d1f] text-white hover:bg-gray-800 transition-all text-[11px] font-medium shadow-sm"
                >
                  Next Step: Order Fulfilled &rarr;
                </button>
              )}
            </div>
            <FinancialSummary localOrder={localOrder} />
          </div>
        </div>
      )}
    </TabSection>
  );
}

export function StepFulfilled({ localOrder, linkedPOs, handleUpdateOrderField, handleTabChange }: any) {
  // Strict Validation
  const isFullyAssigned = Boolean(
    localOrder?.items?.length > 0 && 
    localOrder.items.every((item: any) => 
      item.assignedPOId && linkedPOs.some((po: any) => String(po.id) === String(item.assignedPOId))
    )
  );

  if (!localOrder) {
    return (
      <TabSection title="Step 4: Order Fulfilled">
        <EmptyStep text="Waiting on earlier steps." />
      </TabSection>
    );
  }

  if (!isFullyAssigned) {
    return (
      <TabSection title="Step 4: Order Fulfilled">
        <EmptyStep text="Waiting on Step 3: Please assign all order items to a Supplier PO first." />
      </TabSection>
    );
  }

  return (
    <TabSection title="Step 4: Order Fulfilled">
      <div className="w-full flex flex-col gap-6">
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5 md:p-6">
          <OrderSupplierSection
            orderId={localOrder.id}
            items={localOrder.items || []}
            linkedPOs={linkedPOs || []}
            allowStatusChange={true}
          />
        </div>
        <OrderOpexSection
          opex={localOrder.opex || []}
          onUpdate={(newOpex) => handleUpdateOrderField("opex", newOpex)}
          allowAdd={true}
        />
        {linkedPOs.length > 0 && linkedPOs.every((po: any) => po.status === "fulfilled") && (
          <div className="flex justify-start pt-2">
            <button
              onClick={() => handleTabChange("delivery")}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#1d1d1f] text-white hover:bg-gray-800 transition-all text-[13px] font-medium shadow-sm"
            >
              Next Step: Track Delivery & Payment &rarr;
            </button>
          </div>
        )}
      </div>
    </TabSection>
  );
}

export function StepDelivery({ localOrder, linkedPOs, handleUpdateOrderField, handleTabChange }: any) {
  // Strict Validation
  const isFullyAssigned = Boolean(
    localOrder?.items?.length > 0 && 
    localOrder.items.every((item: any) => 
      item.assignedPOId && linkedPOs.some((po: any) => String(po.id) === String(item.assignedPOId))
    )
  );
  
  const allPOsFulfilled = linkedPOs && linkedPOs.length > 0 && linkedPOs.every((po: any) => po.status === "fulfilled");

  if (!localOrder || !isFullyAssigned || !allPOsFulfilled) {
    return (
      <TabSection title="Step 5: Track Delivery & Payment">
        <EmptyStep text="Waiting on Step 4: All Supplier POs must be fulfilled first." />
      </TabSection>
    );
  }

  return (
    <TabSection title="Step 5: Track Delivery & Payment">
      <div className="flex flex-col gap-5 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
          <div>
            <p className="text-[12px] text-gray-500 font-medium mb-1">Fulfillment Status</p>
            <p className="text-[13px] text-gray-900 font-medium">Track the physical delivery of the items.</p>
          </div>
          <InstantSelect
            value={localOrder.fulfillmentStatus}
            options={FULFILLMENT_OPTIONS}
            colorMap={FULFILLMENT_COLORS}
            onChange={(val: string) => handleUpdateOrderField("fulfillmentStatus", val)}
          />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3">
          <div>
            <p className="text-[12px] text-gray-500 font-medium mb-1">Payment Status</p>
            <p className="text-[13px] text-gray-900 font-medium">Monitor client payment progress.</p>
          </div>
          <InstantSelect
            value={localOrder.paymentStatus}
            options={PAYMENT_OPTIONS}
            colorMap={PAYMENT_COLORS}
            onChange={(val: string) => handleUpdateOrderField("paymentStatus", val)}
          />
        </div>
        <div className="mt-1 mb-1">
          <OrderOpexSection
            opex={localOrder.opex || []}
            onUpdate={(newOpex) => handleUpdateOrderField("opex", newOpex)}
            allowAdd={true}
          />
        </div>
        <div className="border-t border-gray-100 pt-6 mt-5 flex flex-col-reverse lg:flex-row gap-6 justify-between items-start">
          <div className="w-full lg:w-auto flex-1 flex justify-start">
            {localOrder.fulfillmentStatus === "delivered" && localOrder.paymentStatus === "paid" && (
              <button
                onClick={() => handleTabChange("closed")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#1d1d1f] text-white hover:bg-gray-800 transition-all text-[11px] font-medium shadow-sm"
              >
                Next Step: Confirm Completed &rarr;
              </button>
            )}
          </div>
          <FinancialSummary localOrder={localOrder} />
        </div>
      </div>
    </TabSection>
  );
}

export function StepClosed({ localOrder, quotation, request, linkedPOs }: any) {
  if (!localOrder || !quotation) {
    return (
      <TabSection title="Step 6: Confirm Completed">
        <EmptyStep text="Waiting on earlier steps to complete." />
      </TabSection>
    );
  }

  // Calculate OPEX for display on Step 6
  const liquidatedOpex = (localOrder.opex || []).reduce((sum: number, exp: any) => sum + (exp.status === 'liquidated' ? Number(exp.amount) || 0 : 0), 0)
  const pendingOpex = (localOrder.opex || []).reduce((sum: number, exp: any) => sum + (exp.status === 'pending' ? Number(exp.amount) || 0 : 0), 0)

  return (
    <TabSection title="Step 6: Confirm Completed">
      <div className="flex flex-col gap-5 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#fbfbfd] rounded-2xl border border-gray-100">
          <div>
            <p className="text-[11px] text-gray-500 font-medium mb-1">Pipeline Status</p>
            <p className={`text-[14px] font-semibold tracking-tight ${request.status === "completed" ? "text-[#149911]" : "text-amber-600"}`}>
              {request.status === "completed" ? "Fully Closed & Completed" : "Pending Final Delivery/Payment"}
            </p>
          </div>
          {request.status !== "completed" && (
            <button
               onClick={async () => {
                 try {
                   await fetch(`/api/quotation-requests/${request.id}`, {
                     method: 'PATCH',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({ status: 'completed' })
                   });
                   window.location.reload();
                 } catch (e) { console.error(e) }
               }}
               className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 bg-[#149911] text-white hover:bg-[#103900] transition-colors rounded-full text-[11px] font-semibold tracking-wide uppercase shadow-sm"
            >
              Close Pipeline
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 md:p-6 bg-white rounded-3xl border border-gray-200/60 shadow-sm">
          <div>
            <h3 className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-3">Client Details</h3>
            <p className="text-[14px] font-medium text-gray-900 mb-1">{localOrder.customerName || quotation.customerName || "--"}</p>
            <p className="text-[13px] text-gray-600 mb-1">{localOrder.company || quotation.company || "--"}</p>
            <p className="text-[13px] text-gray-600 leading-snug max-w-[280px] mb-1">{quotation.address || "--"}</p>
            <p className="text-[13px] text-gray-600 font-mono">{quotation.contactNumber || "--"}</p>
          </div>
          <div className="pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-gray-100 md:pl-6">
            <h3 className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-3">Sales Agent</h3>
            <p className="text-[14px] font-medium text-gray-900">{localOrder.salesPerson || quotation.salesPerson || "--"}</p>
          </div>
        </div>
        <div className="p-5 md:p-6 bg-white rounded-3xl border border-gray-200/60 shadow-sm flex flex-col lg:flex-row gap-6 justify-between items-start">
          <div className="flex-1 w-full lg:pr-8">
            <h3 className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-4">Final Ledger Summary</h3>
            <div className="flex flex-col gap-3">
              {(localOrder.items || []).map((item: any, i: number) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                  <p className="text-[13px] text-gray-800 font-medium leading-tight">
                    <span className="font-mono text-gray-400 inline-block min-w-[35px]">{Number(item.qty) || 0} {item.unit || "pcs"}</span>
                    <span className="mx-2 text-gray-200">|</span>
                    {item.description || "--"}
                  </p>
                  <p className="text-[13px] font-medium font-mono text-gray-900 sm:text-right flex-shrink-0">
                    {peso((Number(item.qty) || 0) * (Number(item.unitPrice) || 0))}
                  </p>
                </div>
              ))}
            </div>
             <div className="mt-8">
                <h3 className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-3">Linked Supplier POs</h3>
                <div className="flex flex-col gap-2">
                   {linkedPOs.length > 0 ? (
                      linkedPOs.map((po: any) => (
                        <div key={po.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                          <span className="text-[12px] font-medium text-gray-800">
                            <span className="font-mono text-gray-500 mr-2">{po.poNumber}</span>
                            {po.supplierName || 'Unnamed'}
                          </span>
                           <span className="text-[9px] font-semibold tracking-wide px-2 py-0.5 bg-[#149911]/10 text-[#149911] rounded flex-shrink-0">
                             {po.status}
                           </span>
                        </div>
                      ))
                   ) : (
                     <p className="text-[12px] text-gray-400 italic">No POs recorded.</p>
                   )}
                </div>
             </div>
             
             <div className="mt-6">
                <h3 className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-3">Operating Expenses</h3>
                <div className="flex flex-col gap-2 text-[12px]">
                   {liquidatedOpex > 0 || pendingOpex > 0 ? (
                      <>
                        <div className="flex justify-between items-center text-gray-700">
                          <span>Liquidated Expenses</span>
                          <span className="font-mono font-medium">{peso(liquidatedOpex)}</span>
                        </div>
                        {pendingOpex > 0 && (
                          <div className="flex justify-between items-center text-amber-600">
                            <span>Pending / Unapproved</span>
                            <span className="font-mono font-medium">{peso(pendingOpex)}</span>
                          </div>
                        )}
                      </>
                   ) : (
                      <p className="text-gray-400 italic">No OPEX recorded.</p>
                   )}
                </div>
             </div>
          </div>
          <FinancialSummary localOrder={localOrder} />
        </div>
      </div>
    </TabSection>
  );
}