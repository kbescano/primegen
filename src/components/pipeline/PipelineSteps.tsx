import Link from "next/link";
import { useState, useEffect } from "react";
import OrderSupplierSection from "@/components/OrderSupplierSection";
import OrderOpexSection from "@/components/OrderOpexSection";
import QuotationPrintPreview from "@/components/pipeline/QuotationPrintPreview";
import { TabSection, SummaryRow, EmptyStep, InstantSelect, FinancialSummary } from "@/components/pipeline/PipelineSharedUI";
import { quotationTotal, peso, FULFILLMENT_OPTIONS, FULFILLMENT_COLORS, PAYMENT_OPTIONS, PAYMENT_COLORS } from "@/lib/pipelineUtils";

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

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
            <div className="pt-5 mt-3 border-t border-gray-100 flex justify-start">
              <Link
                href={`/admin-dashboard/client-quotation?id=${quotation.id}&pipelineId=${request.id}`}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-[#1d1d1f] text-white hover:bg-gray-800 transition-all text-[10px] font-medium w-full sm:w-auto shadow-sm"
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
  const [confirmSendOpen, setConfirmSendOpen] = useState(false);
  const [sendingQuote, setSendingQuote] = useState(false);

  async function confirmQuoteSentAndProceed() {
    setSendingQuote(true);
    try {
      await fetch(`/api/quotation-requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'quote-sent' }),
      });

      const url = new URL(window.location.href);
      url.searchParams.set("step", "supplierPO");
      window.location.assign(url.toString());

    } catch (e) {
      console.error('Failed to update quotation-request status to quote-sent:', e);
      setSendingQuote(false);
      setConfirmSendOpen(false);
      handleTabChange("supplierPO");
    }
  }

  return (
    <TabSection title="Step 2: Quotation Approval">
      {confirmSendOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-5 rounded-2xl shadow-[0_30px_80px_-20px_rgba(1,23,47,0.35)]">
            <div className="w-8 h-[3px] bg-[#149911] mb-3" />
            <h2 className="text-[14px] font-semibold tracking-tight text-gray-900 mb-1.5">
              Confirm Quotation Sent
            </h2>
            <p className="text-[12px] text-gray-500 leading-relaxed mb-5">
              Has this quotation actually been sent to and accepted by the client? This will mark the request as <strong className="text-gray-700">Quote Sent</strong> and unlock Step 3 (Create PO).
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmSendOpen(false)}
                disabled={sendingQuote}
                className="flex-1 py-2 rounded-full text-[12px] font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none disabled:opacity-50"
              >
                Not Yet
              </button>
              <button
                onClick={confirmQuoteSentAndProceed}
                disabled={sendingQuote}
                className="flex-1 py-2 rounded-full text-[12px] font-medium bg-[#149911] text-white hover:bg-[#103900] transition-colors focus:outline-none disabled:opacity-50 shadow-sm"
              >
                {sendingQuote ? 'Confirming...' : 'Yes, Proceed to Step 3'}
              </button>
            </div>
          </div>
        </div>
      )}

      {!quotation ? (
        <EmptyStep text="Waiting on Step 1: create a quotation first." />
      ) : (
        <div className="flex flex-col h-full gap-1.5">
          <SummaryRow label="Quotation Status" value={quotation.status.replace("_", " ")} />
          <SummaryRow label="Total Value" value={peso(quotationTotal(quotation))} mono />
          <div className={`mt-3 mb-3 p-4 rounded-2xl border transition-colors duration-300 ${isQuotationApprovedOrBeyond ? "border-green-200 bg-[#f0fdf4]" : "border-gray-200 bg-gray-50/50"}`}>
            {isQuotationApprovedOrBeyond ? (
              <div className="flex flex-col items-start gap-3">
                <p className="text-[12px] font-medium text-gray-900 leading-relaxed">
                  <strong className="text-[#149911] mr-1">Approved!</strong> The admin has accepted this quotation. You can now print the formal document and proceed to confirm the internal order.
                </p>
                <Link
                  href={`/admin-dashboard/client-quotation?id=${quotation.id}&pipelineId=${request.id}`}
                  className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all text-[10px] font-medium w-full sm:w-auto mt-1 shadow-sm"
                >
                  Open Quotation to Print &rarr;
                </Link>
              </div>
            ) : (
              <div className="flex flex-col items-start gap-3.5">
                <p className="text-[12px] font-medium text-gray-700 leading-relaxed">
                  {quotation.status === "pending_approval"
                    ? "Pending Approval. Waiting for internal review before this can be sent to the client or approved."
                    : quotation.status === "sent"
                      ? "Sent to client. Awaiting client acceptance to proceed with approval."
                      : "Draft stage. Complete the quotation details and send for internal approval."}
                </p>
                {quotation.status === "draft" && (
                  <Link
                    href={`/admin-dashboard/client-quotation?id=${quotation.id}&pipelineId=${request.id}`}
                    className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all text-[10px] font-medium w-full sm:w-auto shadow-sm"
                  >
                    Send for Internal Approval &rarr;
                  </Link>
                )}
              </div>
            )}
          </div>
          {isQuotationApprovedOrBeyond && (
            <div className="border-t border-gray-100 pt-4 mt-2 flex justify-start">
              <button
                onClick={() => setConfirmSendOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-[#1d1d1f] text-white hover:bg-gray-800 transition-all text-[10px] font-medium shadow-sm"
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

export function StepSupplierPO({ quotation, localOrder, isQuotationApprovedOrBeyond, isCreatingOrder, handleConfirmOrder, linkedPOs, handleTabChange, handleUpdateOrderField }: any) {
  if (!isQuotationApprovedOrBeyond) {
    return (
      <TabSection title="Step 3: Create PO">
        <EmptyStep text="Waiting on Step 2: approve the quotation first." />
      </TabSection>
    );
  }

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
          <div className="flex flex-col lg:flex-row justify-between items-start gap-3 mb-4">
            <div>
              <span className="bg-gray-100 px-2 py-0.5 text-[8px] font-medium text-gray-500 tracking-wide rounded-full inline-block mb-2">
                PENDING ORDER
              </span>
              <h3 className="text-[16px] font-semibold tracking-tight text-gray-900 leading-none break-words">
                {quotation?.customerName || "--"}
              </h3>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-gray-100">
            <div>
              <p className="text-[11px] text-gray-500 font-medium mb-1">Internal Order Status</p>
              <p className="text-[12px] text-gray-900 font-medium">Set to Confirmed to generate the order and unlock POs.</p>
            </div>
            <div className="relative w-full sm:w-auto">
              {isCreatingOrder || quotation?.status === "order_confirmed" ? (
                <span className="inline-block w-full sm:w-[160px] text-center px-4 py-1.5 text-[10px] font-medium bg-[#149911]/10 text-[#149911] rounded-xl">
                  Generating Order...
                </span>
              ) : (
                <div className="w-full sm:w-[160px]">
                  <select
                    onChange={(e) => {
                      if (e.target.value === "order_confirmed") handleConfirmOrder();
                    }}
                    defaultValue="pending"
                    className="w-full appearance-none pr-8 pl-4 py-1.5 text-[11px] font-medium rounded-xl cursor-pointer focus:outline-none ring-1 ring-inset ring-gray-200 focus:ring-gray-300 transition-all bg-gray-50 hover:bg-gray-100 text-gray-900"
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

          <div className="py-8 text-center bg-[#fbfbfd] rounded-2xl border border-dashed border-gray-200 px-5">
            <p className="text-[12px] text-gray-500 font-medium max-w-sm mx-auto">
              Please confirm the internal order status above to unlock supplier assignments and PO generation.
            </p>
          </div>
        </div>
      ) : (
        <div className="w-full">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-3 mb-4">
            <div>
              <span className="bg-gray-100 px-2 py-0.5 text-[8px] font-medium text-gray-500 tracking-wide rounded-full inline-block mb-2">
                {localOrder.orderNumber || "ACTIVE ORDER"}
              </span>
              <h3 className="text-[16px] font-semibold tracking-tight text-gray-900 leading-none break-words">
                {localOrder.customerName || "--"}
              </h3>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-gray-100">
            <div className="flex-1">
              <p className="text-[11px] text-gray-500 font-medium mb-1">Internal Order Status</p>
              <p className="text-[12px] text-gray-900 font-medium">Order is active. You can now manage POs.</p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
              <div className="w-full sm:w-auto text-left">
                <label className="block text-[8px] font-semibold uppercase tracking-wide text-gray-400 mb-1 ml-1">Target Delivery Date</label>
                <input
                  type="date"
                  value={localOrder.targetDeliveryDate ? new Date(localOrder.targetDeliveryDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleUpdateOrderField?.('targetDeliveryDate', e.target.value || null)}
                  className="w-full sm:w-[150px] appearance-none px-3 py-1.5 text-[11px] font-medium rounded-lg cursor-pointer focus:outline-none ring-1 ring-inset ring-gray-200 focus:ring-[#149911]/40 transition-all bg-white hover:bg-gray-50 text-gray-900 shadow-sm"
                />
              </div>
              <div className="w-full sm:w-auto text-left">
                <label className="block text-[8px] font-semibold uppercase tracking-wide text-gray-400 mb-1 ml-1">Status</label>
                <span className="inline-block w-full sm:w-[120px] text-center px-4 py-1.5 text-[10px] font-medium bg-[#149911]/10 text-[#149911] rounded-lg shadow-sm">
                  Confirmed
                </span>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <OrderSupplierSection
              orderId={localOrder.id}
              items={localOrder.items || []}
              linkedPOs={linkedPOs || []}
              allowStatusChange={false}
            />
          </div>

          <div className="border-t border-gray-100 pt-5 mt-5 flex flex-col-reverse lg:flex-row gap-5 justify-between items-start">
            <div className="w-full lg:w-auto flex-1 flex justify-start">
              {linkedPOs.length > 0 && isFullyAssigned && (
                <button
                  onClick={() => handleTabChange("fulfilled")}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-[#1d1d1f] text-white hover:bg-gray-800 transition-all text-[10px] font-medium shadow-sm"
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

function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[c]);
}

function openReceiptInNewTab(fileData: string, fileType?: string, fileName?: string) {
  const win = window.open('', '_blank');
  if (!win) {
    alert('Please allow pop-ups for this site to view the receipt.');
    return;
  }
  const isImage = fileType === 'image' || fileData.startsWith('data:image');
  const safeTitle = escapeHtml(fileName || 'Receipt');
  win.document.write(`<!DOCTYPE html>
<html>
<head>
<title>${safeTitle}</title>
<style>
  html, body { margin: 0; padding: 0; height: 100%; background: #1a1a1a; }
  body { display: flex; align-items: center; justify-content: center; }
  img { max-width: 100%; max-height: 100vh; object-fit: contain; }
  iframe { width: 100vw; height: 100vh; border: none; background: #fff; }
</style>
</head>
<body>
  ${isImage
    ? `<img src="${fileData}" alt="${safeTitle}" />`
    : `<iframe src="${fileData}"></iframe>`
  }
</body>
</html>`);
  win.document.close();
  try { win.opener = null; } catch {}
}

function ReceiptGroup({
  title,
  receipts,
  onAdd,
  onRemove,
  uploading,
  isUpdating,
}: {
  title: string;
  receipts: any[];
  onAdd: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (index: number) => void;
  uploading: boolean;
  isUpdating: boolean;
}) {
  return (
    <div className="flex-1 min-w-0 bg-[#fbfbfd] border border-gray-100 rounded-xl p-3.5">
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-700">
          {title} <span className="text-red-500">*</span>
        </p>
        <span className="text-[9px] font-medium text-gray-400">
          {receipts.length} uploaded
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {receipts.map((r: any, idx: number) => (
          <div key={idx} className="relative w-14 h-14 rounded-lg overflow-hidden border border-gray-200 bg-white group shrink-0">
            <button
              type="button"
              onClick={() => openReceiptInNewTab(r.fileData, r.fileType, r.fileName)}
              className="block w-full h-full cursor-pointer"
              aria-label={`View ${r.fileName || 'receipt'}`}
            >
              {r.fileData?.startsWith('data:image') ? (
                <img src={r.fileData} alt={r.fileName || 'Receipt'} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-[7px] font-semibold text-gray-400 uppercase">PDF</span>
                </div>
              )}
            </button>
            <button
              type="button"
              onClick={() => onRemove(idx)}
              disabled={isUpdating}
              className="absolute top-0.5 right-0.5 w-4 h-4 flex items-center justify-center bg-black/60 hover:bg-red-500 text-white rounded-full transition-colors disabled:opacity-50"
              aria-label="Remove receipt"
            >
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}

        <label className="flex flex-col items-center justify-center w-14 h-14 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#149911] hover:bg-[#149911]/[0.03] transition-colors cursor-pointer shrink-0">
          <input
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={onAdd}
            disabled={uploading || isUpdating}
          />
          {uploading ? (
            <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-[#149911] rounded-full animate-spin" />
          ) : (
            <span className="text-[8px] font-semibold uppercase tracking-wide text-gray-400 hover:text-[#149911] transition-colors">
              + Add
            </span>
          )}
        </label>
      </div>
    </div>
  );
}

export function StepFulfilled({ localOrder, linkedPOs, handleUpdateOrderField, handleTabChange, isUpdating }: any) {
  const [tempAmount, setTempAmount] = useState<string | number>(localOrder?.amountPaid || '');
  const [uploadingClientReceipt, setUploadingClientReceipt] = useState(false);
  const [uploadingSupplierReceipt, setUploadingSupplierReceipt] = useState(false);

  useEffect(() => {
    setTempAmount(localOrder?.amountPaid || '');
  }, [localOrder?.amountPaid]);

  const PAYMENT_METHOD_OPTIONS = [
    { label: 'Cash', value: 'cash' },
    { label: 'Cheque', value: 'cheque' },
    { label: 'Bank Transfer', value: 'bank_transfer' },
  ];

  const isFullyAssigned = Boolean(
    localOrder?.items?.length > 0 &&
    localOrder.items.every((item: any) =>
      item.assignedPOId && linkedPOs.some((po: any) => String(po.id) === String(item.assignedPOId))
    )
  );

  const clientReceipts = localOrder?.clientPaymentReceipts || [];
  const supplierReceipts = localOrder?.supplierPaymentReceipts || [];
  const hasClientReceipt = clientReceipts.length > 0;
  const hasSupplierReceipt = supplierReceipts.length > 0;
  const receiptsComplete = hasClientReceipt && hasSupplierReceipt;

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
        <EmptyStep text="Waiting on Step 3: assign every item to a supplier and click Next Step there first." />
      </TabSection>
    );
  }

  const poById: Record<string, any> = {};
  linkedPOs.forEach((po: any) => { poById[String(po.id)] = po; });

  async function handleReceiptUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'clientPaymentReceipts' | 'supplierPaymentReceipts'
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'application/pdf' && file.size > 5 * 1024 * 1024) {
      alert("PDFs must be under 5MB. Please compress your file.");
      e.target.value = '';
      return;
    }

    const setUploading = type === 'clientPaymentReceipts' ? setUploadingClientReceipt : setUploadingSupplierReceipt;
    setUploading(true);

    const processFile = async (): Promise<string> => {
      if (file.type.startsWith('image/')) {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const MAX_WIDTH = 1000;
              let width = img.width;
              let height = img.height;
              if (width > MAX_WIDTH) {
                height = Math.round((height * MAX_WIDTH) / width);
                width = MAX_WIDTH;
              }
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx?.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.src = event.target?.result as string;
          };
          reader.readAsDataURL(file);
        });
      }
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    };

    const base64Str = await processFile();

    const newReceipt = {
      fileData: base64Str,
      fileName: file.name,
      fileType: file.type.startsWith('image/') ? 'image' : 'pdf',
      uploadedAt: new Date().toISOString(),
    };

    const existing = (type === 'clientPaymentReceipts' ? localOrder.clientPaymentReceipts : localOrder.supplierPaymentReceipts) || [];

   await handleUpdateOrderField({
      [type]: [...existing, newReceipt],
    });

    setUploading(false);
    e.target.value = '';

  }

  function handleRemoveReceipt(type: 'clientPaymentReceipts' | 'supplierPaymentReceipts', index: number) {
    const existing = (type === 'clientPaymentReceipts' ? localOrder.clientPaymentReceipts : localOrder.supplierPaymentReceipts) || [];
    const updated = existing.filter((_: any, i: number) => i !== index);
    handleUpdateOrderField({ [type]: updated });
  }

  return (
    <TabSection title="Step 4: Order Fulfilled">
      <div className="w-full flex flex-col gap-5">

        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-4 md:p-5">
          <h3 className="text-[9px] font-medium text-gray-400 uppercase tracking-wide mb-3">Order Line Items</h3>
          <div className="flex flex-col gap-2.5">
            {(localOrder.items || []).map((item: any, i: number) => {
              const po = item.assignedPOId ? poById[item.assignedPOId] : null;
              return (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-50 pb-2.5 last:border-0 last:pb-0">
                  <div>
                    <p className="text-[12px] text-gray-800 font-medium leading-tight">
                      <span className="font-mono text-gray-400 inline-block min-w-[35px]">{Number(item.qty) || 0} {item.unit || "pcs"}</span>
                      <span className="mx-2 text-gray-200">|</span>
                      {item.description || "--"}
                    </p>
                    {po && (
                      <p className="text-[10px] text-[#149911] font-medium mt-1">
                        {po.poNumber ? `${po.poNumber} -- ` : ''}{po.supplierName || 'Unnamed supplier'}
                      </p>
                    )}
                  </div>
                  <p className="text-[12px] font-medium font-mono text-gray-900 sm:text-right flex-shrink-0">
                    {peso((Number(item.qty) || 0) * (Number(item.unitCost) || 0))}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-4 md:p-5">
          <OrderSupplierSection
            orderId={localOrder.id}
            items={localOrder.items || []}
            linkedPOs={linkedPOs || []}
            allowStatusChange={true}
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-2.5">
          <div>
            <p className="text-[11px] text-gray-500 font-medium mb-1">Payment Status</p>
            <p className="text-[12px] text-gray-900 font-medium">Monitor client payment progress.</p>
          </div>
          <div className="flex flex-col gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <InstantSelect
                value={localOrder.paymentStatus}
                options={PAYMENT_OPTIONS}
                colorMap={PAYMENT_COLORS}
                disabled={isUpdating}
                onChange={(val: string) => {
                  const updates: Record<string, any> = { paymentStatus: val };
                  if (val !== 'partial') updates.amountPaid = 0;
                  if (val === 'unpaid') updates.paymentMethod = null;
                  handleUpdateOrderField(updates);
                }}
              />
              {isUpdating && (
                <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-[#149911] rounded-full animate-spin flex-shrink-0" />
              )}
            </div>

            {(localOrder.paymentStatus === 'partial' || localOrder.paymentStatus === 'paid') && (
              <div className="w-full sm:w-[200px] ml-auto flex flex-col gap-1.5">
                <label className="block text-[9px] font-semibold uppercase tracking-wide text-gray-500 ml-1">
                  Mode of Payment
                </label>
                <select
                  value={localOrder.paymentMethod || ''}
                  onChange={(e) => handleUpdateOrderField("paymentMethod", e.target.value || null)}
                  disabled={isUpdating}
                  className="w-full appearance-none px-3 py-2 text-[12px] font-medium rounded-xl cursor-pointer focus:outline-none ring-1 ring-inset ring-gray-200 focus:ring-[#149911]/40 transition-all bg-gray-50 hover:bg-gray-100 text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="" disabled>Select method</option>
                  {PAYMENT_METHOD_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}

            {localOrder.paymentStatus === 'partial' && (
              <div className="w-full sm:w-[200px] ml-auto bg-amber-50 p-2.5 rounded-xl border border-amber-100/50 flex flex-col gap-2">
                <label className="block text-[9px] font-semibold uppercase tracking-wide text-amber-600 mb-1 ml-1">
                  Amount Received
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-gray-400">₱</span>
                  <input
                    type="number"
                    value={tempAmount}
                    onChange={(e) => setTempAmount(e.target.value)}
                    disabled={isUpdating}
                    className="w-full pl-7 pr-3 py-1.5 text-[12px] bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/20 transition-all font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="0.00"
                  />
                </div>
                <button
                  onClick={() => handleUpdateOrderField("amountPaid", Number(tempAmount))}
                  disabled={isUpdating || Number(tempAmount) === Number(localOrder.amountPaid)}
                  className="w-full py-1.5 bg-amber-500 text-white text-[10px] font-semibold uppercase tracking-wide rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:bg-gray-300 disabled:text-gray-500 mt-1"
                >
                  {isUpdating ? 'Saving...' : 'Save Amount'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4 mt-1">
          <p className="text-[11px] text-gray-500 font-medium mb-1">Payment Receipts</p>
          <p className="text-[10px] text-gray-400 mb-3">
            Upload proof of payment. Both the client's payment to Primegen and Primegen's payment to the supplier(s) are required before moving to Step 5. You can add multiple files to each.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ReceiptGroup
              title="Client's Payment Receipt"
              receipts={clientReceipts}
              onAdd={(e) => handleReceiptUpload(e, 'clientPaymentReceipts')}
              onRemove={(idx) => handleRemoveReceipt('clientPaymentReceipts', idx)}
              uploading={uploadingClientReceipt}
              isUpdating={isUpdating}
            />
            <ReceiptGroup
              title="Supplier's Payment Receipt"
              receipts={supplierReceipts}
              onAdd={(e) => handleReceiptUpload(e, 'supplierPaymentReceipts')}
              onRemove={(idx) => handleRemoveReceipt('supplierPaymentReceipts', idx)}
              uploading={uploadingSupplierReceipt}
              isUpdating={isUpdating}
            />
          </div>
        </div>

        {linkedPOs.length > 0 && linkedPOs.every((po: any) => po.status === "fulfilled") && (
          <div className="flex justify-start pt-3 mt-1 border-t border-gray-100">
            {isUpdating ? (
              <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-gray-50 text-gray-500 text-[12px] font-medium border border-gray-100">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                Saving Updates...
              </div>
            ) : receiptsComplete ? (
              <button
                onClick={() => handleTabChange("delivery")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#1d1d1f] text-white hover:bg-gray-800 transition-all text-[12px] font-medium shadow-sm"
              >
                Next Step: Track Delivery & Payment &rarr;
              </button>
            ) : (
              <div className="text-[9px] text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100/50 leading-snug">
                <span className="font-semibold uppercase tracking-wide">⚠️ Action Required to Proceed:</span><br/>
                {!hasClientReceipt && !hasSupplierReceipt
                  ? "Upload at least one Client Payment Receipt and one Supplier Payment Receipt to unlock Step 5."
                  : !hasClientReceipt
                  ? "Upload at least one Client Payment Receipt to unlock Step 5."
                  : "Upload at least one Supplier Payment Receipt to unlock Step 5."}
              </div>
            )}
          </div>
        )}
      </div>
    </TabSection>
  );
}

export function StepDelivery({ localOrder, linkedPOs, handleUpdateOrderField, handleTabChange, isUpdating }: any) {
  const [tempAmount, setTempAmount] = useState<string | number>(localOrder?.amountPaid || '');

  useEffect(() => {
    setTempAmount(localOrder?.amountPaid || '');
  }, [localOrder?.amountPaid]);

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

  const canProceedToClose = Boolean(
    localOrder.targetDeliveryDate &&
    localOrder.fulfillmentStatus === "delivered" &&
    localOrder.paymentStatus === "paid"
  );

  const PAYMENT_METHOD_OPTIONS = [
    { label: 'Cash', value: 'cash' },
    { label: 'Cheque', value: 'cheque' },
    { label: 'Bank Transfer', value: 'bank_transfer' },
  ];

  return (
    <TabSection title="Step 5: Track Delivery & Payment">
      <div className="flex flex-col gap-4 w-full">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <p className="text-[11px] text-gray-500 font-medium mb-1">
              Target Delivery Date <span className="text-red-500">*</span>
            </p>
            <p className="text-[12px] text-gray-900 font-medium">The promised delivery deadline for this order.</p>
          </div>
          <input
            type="date"
            value={localOrder.targetDeliveryDate ? new Date(localOrder.targetDeliveryDate).toISOString().split('T')[0] : ''}
            onChange={(e) => handleUpdateOrderField?.("targetDeliveryDate", e.target.value || null)}
            className="w-full sm:w-[200px] appearance-none px-3 py-1.5 text-[12px] font-medium rounded-xl cursor-pointer focus:outline-none ring-1 ring-inset ring-gray-200 focus:ring-[#149911]/40 transition-all bg-gray-50 hover:bg-gray-100 text-gray-900 shadow-sm"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <p className="text-[11px] text-gray-500 font-medium mb-1">Fulfillment Status</p>
            <p className="text-[12px] text-gray-900 font-medium">Track the physical delivery of the items.</p>
          </div>
          <InstantSelect
            value={localOrder.fulfillmentStatus}
            options={FULFILLMENT_OPTIONS}
            colorMap={FULFILLMENT_COLORS}
            onChange={(val: string) => handleUpdateOrderField("fulfillmentStatus", val)}
          />
        </div>


        <div className="mt-1 mb-1">
          <OrderOpexSection
            opex={localOrder.opex || []}
            onUpdate={(newOpex) => handleUpdateOrderField("opex", newOpex)}
            allowAdd={true}
          />
        </div>

        <div className="border-t border-gray-100 pt-5 mt-4 flex flex-col-reverse lg:flex-row gap-5 justify-between items-start">

          <div className="w-full lg:w-auto flex-1 flex flex-col items-start gap-2">
            {isUpdating ? (
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-gray-50 text-gray-500 text-[10px] font-medium border border-gray-100">
                <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                Saving Status...
              </div>
            ) : canProceedToClose ? (
              <button
                onClick={() => handleTabChange("closed")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-[#1d1d1f] text-white hover:bg-gray-800 transition-all text-[10px] font-medium shadow-sm"
              >
                Next Step: Confirm Completed &rarr;
              </button>
            ) : (
              <div className="text-[9px] text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100/50 leading-snug">
                <span className="font-semibold uppercase tracking-wide">⚠️ Action Required to Proceed:</span><br/>
                Target Delivery Date, Delivered status, and Paid payment status are required to unlock Step 6.
              </div>
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

  const liquidatedOpex = (localOrder.opex || []).reduce((sum: number, exp: any) => sum + (exp.status === 'liquidated' ? Number(exp.amount) || 0 : 0), 0)
  const pendingOpex = (localOrder.opex || []).reduce((sum: number, exp: any) => sum + (exp.status === 'pending' ? Number(exp.amount) || 0 : 0), 0)

  const subtotal = (localOrder.items || []).reduce((sum: number, i: any) => sum + (Number(i.qty) || 0) * (Number(i.unitPrice) || 0), 0)
  const netRev = subtotal - (Number(localOrder.discountAmount) || 0) + (Number(localOrder.deliveryFee) || 0)
  const vatVal = netRev * ((Number(localOrder.vatRate) || 0) / 100)
  const totalGross = netRev + vatVal
  const amountPaid = Number(localOrder.amountPaid) || 0
  const receivables = localOrder.paymentStatus === 'partial' ? totalGross - amountPaid : (localOrder.paymentStatus === 'paid' ? 0 : totalGross)

  return (
    <TabSection title="Step 6: Confirm Completed">
      <div className="flex flex-col gap-4 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-[#fbfbfd] rounded-2xl border border-gray-100">
          <div>
            <p className="text-[10px] text-gray-500 font-medium mb-1">Pipeline Status</p>
            <p className={`text-[13px] font-semibold tracking-tight ${request.status === "completed" ? "text-[#149911]" : "text-amber-600"}`}>
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
               className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-1.5 bg-[#149911] text-white hover:bg-[#103900] transition-colors rounded-full text-[10px] font-semibold tracking-wide uppercase shadow-sm"
            >
              Close Pipeline
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 md:p-5 bg-white rounded-3xl border border-gray-200/60 shadow-sm">
          <div>
            <h3 className="text-[9px] font-medium text-gray-400 uppercase tracking-wide mb-2.5">Client Details</h3>
            <p className="text-[13px] font-medium text-gray-900 mb-1">{localOrder.customerName || quotation.customerName || "--"}</p>
            <p className="text-[12px] text-gray-600 mb-1">{localOrder.company || quotation.company || "--"}</p>
            <p className="text-[12px] text-gray-600 leading-snug max-w-[280px] mb-1">{quotation.address || "--"}</p>
            <p className="text-[12px] text-gray-600 font-mono">{quotation.contactNumber || "--"}</p>
          </div>
          <div className="pt-3.5 md:pt-0 border-t md:border-t-0 md:border-l border-gray-100 md:pl-5">
            <h3 className="text-[9px] font-medium text-gray-400 uppercase tracking-wide mb-2.5">Sales Agent</h3>
            <p className="text-[13px] font-medium text-gray-900">{localOrder.salesPerson || quotation.salesPerson || "--"}</p>
          </div>
        </div>
        <div className="p-4 md:p-5 bg-white rounded-3xl border border-gray-200/60 shadow-sm flex flex-col lg:flex-row gap-5 justify-between items-start">
          <div className="flex-1 w-full lg:pr-7">
            <h3 className="text-[9px] font-medium text-gray-400 uppercase tracking-wide mb-3">Final Ledger Summary</h3>
            <div className="flex flex-col gap-2.5">
              {(localOrder.items || []).map((item: any, i: number) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-50 pb-2.5 last:border-0 last:pb-0">
                  <p className="text-[12px] text-gray-800 font-medium leading-tight">
                    <span className="font-mono text-gray-400 inline-block min-w-[35px]">{Number(item.qty) || 0} {item.unit || "pcs"}</span>
                    <span className="mx-2 text-gray-200">|</span>
                    {item.description || "--"}
                  </p>
                  <p className="text-[12px] font-medium font-mono text-gray-900 sm:text-right flex-shrink-0">
                    {peso((Number(item.qty) || 0) * (Number(item.unitPrice) || 0))}
                  </p>
                </div>
              ))}
            </div>

             {localOrder.paymentStatus === 'partial' && (
               <div className="mt-5 p-3.5 bg-amber-50 rounded-xl border border-amber-100 flex flex-col gap-2">
                 <h3 className="text-[9px] font-semibold text-amber-600 uppercase tracking-wide mb-1">Accounts Receivable</h3>
                 <div className="flex justify-between items-center text-[11px] text-gray-700">
                    <span>Amount Paid</span>
                    <span className="font-mono font-medium">{peso(amountPaid)}</span>
                 </div>
                 <div className="flex justify-between items-center text-[12px] font-semibold text-gray-900 mt-1 pt-2 border-t border-amber-200/60">
                    <span>Remaining Balance</span>
                    <span className="font-mono">{peso(receivables)}</span>
                 </div>
               </div>
             )}

             <div className="mt-6">
                <h3 className="text-[9px] font-medium text-gray-400 uppercase tracking-wide mb-2.5">Linked Supplier POs</h3>
                <div className="flex flex-col gap-2">
                   {linkedPOs.length > 0 ? (
                      linkedPOs.map((po: any) => (
                        <div key={po.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100">
                          <span className="text-[11px] font-medium text-gray-800">
                            <span className="font-mono text-gray-500 mr-2">{po.poNumber}</span>
                            {po.supplierName || 'Unnamed'}
                          </span>
                           <span className="text-[8px] font-medium tracking-wide px-1.5 py-0.5 bg-[#149911]/10 text-[#149911] rounded flex-shrink-0">
                             {po.status}
                           </span>
                        </div>
                      ))
                   ) : (
                     <p className="text-[11px] text-gray-400 italic">No POs recorded.</p>
                   )}
                </div>
             </div>

             <div className="mt-5">
                <h3 className="text-[9px] font-medium text-gray-400 uppercase tracking-wide mb-2.5">Operating Expenses</h3>
                <div className="flex flex-col gap-2 text-[11px]">
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