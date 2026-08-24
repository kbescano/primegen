"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CollectionStatusSelect({
  collection,
  id,
  status,
  options,
  colorClassMap,
}: any) {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [updating, setUpdating] = useState(false);
  const router = useRouter();

  const currentColorClass = colorClassMap?.[currentStatus] || "bg-gray-100 text-gray-800";

  async function handleChange(e: any) {
    const newStatus = e.target.value;
    setCurrentStatus(newStatus);
    setUpdating(true);

    try {
      // Update the record -- any notification for this status change is the
      // collection's own responsibility (an afterChange hook on this same
      // PATCH), not this component's. It used to also fire its own POST to
      // /api/notifications via an optional `notifyOnUpdate` prop, which
      // ended up duplicating whatever the collection's hook already sent
      // for the same event -- removed along with its only caller.
      await fetch(`/api/${collection}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      router.refresh();
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="relative w-full sm:w-auto">
      <select
        value={currentStatus}
        onChange={handleChange}
        disabled={updating}
        className={`appearance-none w-full sm:w-auto px-4 py-2 pr-8 text-[11px] font-bold uppercase tracking-wider rounded cursor-pointer border border-transparent hover:border-gray-200 focus:outline-none transition-all ${currentColorClass} ${updating ? 'opacity-50 cursor-wait' : ''}`}
      >
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value} className="bg-white text-gray-900">
            {opt.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 opacity-50">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </div>
  );
}