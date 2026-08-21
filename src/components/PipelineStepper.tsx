'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StepKey, STEPS } from "@/lib/pipelineUtils";
import {
  StepQuotation,
  StepConfirmation,
  StepSupplierPO,
  StepFulfilled,
  StepDelivery,
  StepClosed,
} from "@/components/pipeline/PipelineSteps";

export default function PipelineStepper({
  request,
  quotation,
  order,
  linkedPOs,
  completedSteps,
  currentStep,
}: {
  request: any;
  quotation: any | null;
  order: any | null;
  linkedPOs: any[];
  completedSteps: Record<StepKey, boolean>;
  currentStep: StepKey;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<StepKey>(currentStep);
  const [localOrder, setLocalOrder] = useState(order);
  const [isUpdating, setIsUpdating] = useState(false);

  const isQuotationApprovedOrBeyond =
    ["quotation_approved", "order_confirmed"].includes(quotation?.status) || !!order;

  useEffect(() => {
    setLocalOrder(order);
  }, [order]);

  let maxUnlockedIndex = 0;
  for (let i = 0; i < STEPS.length; i++) {
    if (i === 0) {
      maxUnlockedIndex = 0;
    } else {
      const prevStepKey = STEPS[i - 1].key;
      const isDeliveredAndPaidLocal = localOrder?.fulfillmentStatus === 'delivered' && localOrder?.paymentStatus === 'paid';

      if (prevStepKey === 'delivery' && isDeliveredAndPaidLocal) {
        maxUnlockedIndex = i;
      } else if (completedSteps[prevStepKey]) {
        maxUnlockedIndex = i;
      } else {
        break;
      }
    }
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      const updateTabFromUrl = () => {
        const params = new URLSearchParams(window.location.search);
        const stepParam = params.get("step") as StepKey;
        const requestedIdx = STEPS.findIndex((s) => s.key === stepParam);

        if (stepParam && requestedIdx !== -1 && requestedIdx <= maxUnlockedIndex) {
          setActiveTab(stepParam);
        } else if (!stepParam) {
          const fallbackStep = STEPS[maxUnlockedIndex].key;
          setActiveTab(fallbackStep);
        }
      };

      updateTabFromUrl();
      window.addEventListener("popstate", updateTabFromUrl);
      return () => window.removeEventListener("popstate", updateTabFromUrl);
    }
  }, [maxUnlockedIndex]);

  function handleTabChange(newStep: StepKey) {
    const targetIdx = STEPS.findIndex((s) => s.key === newStep);
    if (targetIdx <= maxUnlockedIndex) {
      setActiveTab(newStep);
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.set("step", newStep);
        window.history.pushState({}, "", url.toString());
      }
    }
  }

  async function handleConfirmOrder() {
    if (!quotation?.id) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/client-quotations/${quotation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "order_confirmed" }),
      });
      if (res.ok) {
        router.refresh();
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleUpdateOrderField(fieldOrUpdates: string | Record<string, any>, value?: any) {
    const updates = typeof fieldOrUpdates === 'string'
      ? { [fieldOrUpdates]: value }
      : fieldOrUpdates;

    const previousOrder = localOrder;
    setIsUpdating(true);
    setLocalOrder((prev: any) => ({ ...prev, ...updates }));

    try {
      const res = await fetch(`/api/orders/${localOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        const data = await res.json();
        setLocalOrder(data.doc);
        router.refresh();
      } else {
        setLocalOrder(previousOrder);
        console.error('Failed to update order fields:', res.status, await res.text().catch(() => ''));
      }
    } catch (error) {
      setLocalOrder(previousOrder);
      console.error('Failed to update order fields', error);
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="w-full flex flex-col h-full relative">
      <div className="sticky top-0 z-[50] w-full bg-[#fbfbfd]/90 backdrop-blur-xl pt-2.5 pb-2 md:pt-3 md:pb-2.5 border-b border-gray-200/50 shadow-sm shrink-0">
        <div className="w-full max-w-[900px] mx-auto px-4">
          <div className="grid grid-cols-3 sm:flex sm:flex-nowrap items-start w-full gap-y-5 sm:gap-y-0 relative">
            {STEPS.map((step, i) => {
              const isDeliveredAndPaidLocal = localOrder?.fulfillmentStatus === 'delivered' && localOrder?.paymentStatus === 'paid';
              const done = completedSteps[step.key] || (step.key === 'delivery' && isDeliveredAndPaidLocal);
              const isActive = activeTab === step.key;
              const isLast = i === STEPS.length - 1;
              const isDisabled = i > maxUnlockedIndex;
              const hideLineMobile = (i + 1) % 3 === 0;

              return (
                <div key={step.key} className="relative w-full sm:flex-1 flex flex-col items-center group">
                  {!isLast && (
                    <div
                      className={`absolute top-[9px] left-[50%] w-full h-[2px] transition-colors duration-500 z-0 ${
                        hideLineMobile ? "hidden sm:block" : "block"
                      } ${done ? "bg-[#149911]" : isDisabled ? "bg-gray-100" : "bg-gray-200"}`}
                    />
                  )}
                  <button
                    onClick={() => !isDisabled && handleTabChange(step.key)}
                    disabled={isDisabled}
                    className={`relative z-10 flex flex-col items-center gap-1 w-full focus:outline-none transition-all duration-300 ${
                      isDisabled ? "cursor-not-allowed opacity-40 grayscale" : "cursor-pointer"
                    }`}
                  >
                    <div
                      className={`flex items-center justify-center w-[20px] h-[20px] rounded-full text-[8px] font-semibold transition-all duration-300 ${
                        done
                          ? "bg-[#149911] text-white ring-4 ring-[#fbfbfd]"
                          : isActive
                          ? "bg-[#1d1d1f] text-white ring-4 ring-gray-200/50 scale-110 shadow-sm"
                          : "bg-white border-2 border-gray-200 text-gray-400 group-hover:border-gray-300 group-hover:text-gray-600"
                      }`}
                    >
                      {done ? (
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      ) : (
                        i + 1
                      )}
                    </div>
                    <span
                      className={`text-[8px] font-medium tracking-tight text-center leading-[1.2] transition-colors w-full px-1 max-w-[90px] break-words ${
                        isActive ? "text-[#1d1d1f] font-semibold" : done ? "text-gray-700" : "text-gray-400"
                      }`}
                    >
                      {step.label}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="w-full flex-1 p-3 sm:p-4 md:p-5">
        <div className="bg-white rounded-2xl border border-gray-100/80 p-4 md:p-5 shadow-[0_2px_20px_rgba(0,0,0,0.02)] max-w-[900px] mx-auto">
          {activeTab === "quotation" && <StepQuotation quotation={quotation} localOrder={localOrder} request={request} />}
          {activeTab === "confirmation" && (
            <StepConfirmation
              quotation={quotation}
              isQuotationApprovedOrBeyond={isQuotationApprovedOrBeyond}
              handleTabChange={handleTabChange}
              request={request}
            />
          )}
          {activeTab === "supplierPO" && (
            <StepSupplierPO
              quotation={quotation}
              localOrder={localOrder}
              isQuotationApprovedOrBeyond={isQuotationApprovedOrBeyond}
              isCreatingOrder={false}
              handleConfirmOrder={handleConfirmOrder}
              linkedPOs={linkedPOs}
              handleTabChange={handleTabChange}
              handleUpdateOrderField={handleUpdateOrderField}
            />
          )}
          {activeTab === "fulfilled" && (
            <StepFulfilled
              localOrder={localOrder}
              linkedPOs={linkedPOs}
              handleUpdateOrderField={handleUpdateOrderField}
              handleTabChange={handleTabChange}
              isUpdating={isUpdating}
            />
          )}
          {activeTab === "delivery" && (
            <StepDelivery
              localOrder={localOrder}
              linkedPOs={linkedPOs}
              handleUpdateOrderField={handleUpdateOrderField}
              handleTabChange={handleTabChange}
              isUpdating={isUpdating}
            />
          )}
          {activeTab === "closed" && (
            <StepClosed localOrder={localOrder} quotation={quotation} request={request} linkedPOs={linkedPOs} />
          )}
        </div>
      </div>
    </div>
  );
}