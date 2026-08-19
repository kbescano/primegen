"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminReceiptApproval({ order }: { order: any }) {
  const [updating, setUpdating] = useState(false);
  const router = useRouter();

  if (!order.paymentReceipt) return <span className="text-[10px] text-gray-400 italic">No receipt</span>;

  const handleStatus = async (status: string) => {
    setUpdating(true);
    try {
      await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentReceiptStatus: status })
      });

      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(false);
    }
  };

  // ✨ FIX: Safely render the Base64 data in a new tab to bypass browser security blocks
  const openReceipt = (e: React.MouseEvent) => {
    e.preventDefault();
    const w = window.open("");
    if (w) {
      const isImage = order.paymentReceipt.startsWith('data:image');
      if (isImage) {
        w.document.write(`<html><body style="margin:0;display:flex;justify-content:center;align-items:center;background:#0e1111;min-height:100vh;"><img src="${order.paymentReceipt}" style="max-width:100%;max-height:100vh;object-fit:contain;" /></body></html>`);
      } else {
        w.document.write(`<html><body style="margin:0;"><iframe src="${order.paymentReceipt}" width="100%" height="100%" style="border:none;height:100vh;"></iframe></body></html>`);
      }
      w.document.close();
    }
  };

  return (
    <div className="flex flex-col gap-2 mt-2">
      <div className="flex items-center gap-3">
        <button 
          onClick={openReceipt}
          className="text-[10px] font-bold uppercase tracking-wider text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          View Receipt
        </button>
        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
          order.paymentReceiptStatus === 'approved' ? 'bg-green-100 text-green-700' :
          order.paymentReceiptStatus === 'rejected' ? 'bg-red-100 text-red-700' :
          'bg-amber-100 text-amber-700 animate-pulse'
        }`}>
          {order.paymentReceiptStatus || 'pending'}
        </span>
      </div>

      {order.paymentReceiptStatus !== 'approved' && (
        <div className="flex gap-2">
          <button 
            onClick={() => handleStatus('approved')}
            disabled={updating}
            className="px-3 py-1.5 bg-[#149911] text-white text-[9px] font-bold uppercase rounded hover:bg-[#103900] disabled:opacity-50"
          >
            Approve
          </button>
          {order.paymentReceiptStatus !== 'rejected' && (
            <button 
              onClick={() => handleStatus('rejected')}
              disabled={updating}
              className="px-3 py-1.5 bg-red-100 text-red-700 border border-red-200 text-[9px] font-bold uppercase rounded hover:bg-red-200 disabled:opacity-50"
            >
              Reject
            </button>
          )}
        </div>
      )}
    </div>
  );
}