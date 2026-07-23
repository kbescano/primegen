"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

type Material = { id: string; name: string; unit: string };
type LineItem = { materialId: string; quantity: number };

const fieldClass =
  "w-full px-4 py-3.5 bg-white border border-[#01172f]/15 text-[15px] text-[#01172f] placeholder:text-[#01172f]/35 focus:outline-none focus:border-[#149911] transition-colors duration-300";

const labelClass =
  "text-[10px] font-bold uppercase tracking-[0.2em] text-[#01172f]/40 mb-2 block";

export default function QuoteForm({ products }: { products: Material[] }) {
  const searchParams = useSearchParams();
  const preselected = searchParams.get("material");
  const preselectedMaterial = products.find(
    (m) => String(m.id) === String(preselected),
  );

  const [status, setStatus] = useState<
    "idle" | "submitting" | "done" | "error"
  >("idle");
  const [items, setItems] = useState<LineItem[]>([
    {
      materialId: preselectedMaterial?.id ?? products[0]?.id ?? "",
      quantity: 1,
    },
  ]);

  function addItem() {
    setItems((prev) => [
      ...prev,
      { materialId: products[0]?.id ?? "", quantity: 1 },
    ]);
  }
  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }
  function updateItem(index: number, patch: Partial<LineItem>) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    const form = e.currentTarget;
    const data = {
      customerName: (
        form.elements.namedItem("customerName") as HTMLInputElement
      ).value,
      phone: (form.elements.namedItem("phone") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      projectType: (form.elements.namedItem("projectType") as HTMLSelectElement)
        .value,
      message: (form.elements.namedItem("message") as HTMLTextAreaElement)
        .value,
      source: "website",
      items: items
        .filter((i) => i.materialId)
        .map((i) => ({ material: i.materialId, quantity: i.quantity })),
    };
    try {
      const res = await fetch("/api/quotation-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus("done");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="border border-[#01172f]/10 bg-white p-10 md:p-14 text-center">
        <div className="w-10 h-[3px] bg-[#149911] mx-auto mb-6" />
        <h2 className="text-[24px] md:text-[28px] font-black uppercase tracking-tight text-[#01172f] mb-4">
          Request Received.
        </h2>
        <p className="text-[15px] text-[#01172f]/60 font-medium max-w-[440px] mx-auto">
          Thanks -- your project details are with our team. We&apos;ll reach out
          directly by phone or email with your quotation shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {preselectedMaterial && (
        <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[#3D5F3B] m-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#149911] inline-block" />
          Pre-filled: {preselectedMaterial.name}
        </p>
      )}

      <div>
        <label className={labelClass} htmlFor="customerName">
          Full Name
        </label>
        <input
          id="customerName"
          name="customerName"
          placeholder="Juan dela Cruz"
          required
          className={fieldClass}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="phone">
          Phone Number
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          placeholder="+639..."
          required
          className={fieldClass}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="email">
          Email{" "}
          <span className="normal-case tracking-normal font-medium">
            (optional)
          </span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="you@company.com"
          className={fieldClass}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="projectType">
          Project Type
        </label>
        <select id="projectType" name="projectType" className={fieldClass}>
          <option value="residential">Residential</option>
          <option value="commercial">Commercial</option>
          <option value="renovation">Renovation</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="border-t border-[#01172f]/10 pt-6 mt-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#01172f]/40 mb-4">
          Products Needed
        </p>
        <div className="flex flex-col gap-4 sm:gap-2.5">
          {items.map((item, index) => {
            const selected =
              products.find((m) => String(m.id) === String(item.materialId)) ??
              products[0];
            return (
              <div
                key={index}
                className="flex flex-col sm:flex-row gap-2 sm:items-center bg-gray-50/50 sm:bg-transparent p-3 sm:p-0 border border-gray-100 sm:border-none rounded-md sm:rounded-none"
              >
                <select
                  value={item.materialId}
                  onChange={(e) =>
                    updateItem(index, { materialId: e.target.value })
                  }
                  className={`${fieldClass} w-full sm:flex-1 min-w-0 h-[52px] py-0 appearance-none`}
                >
                  {products.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                
                <div className="flex items-center justify-between sm:justify-start gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(index, { quantity: Number(e.target.value) })
                      }
                      className={`${fieldClass} w-[68px] px-2 flex-shrink-0 text-center h-[52px] py-0`}
                      aria-label="Quantity"
                    />
                    <span className="text-[11px] font-medium uppercase tracking-wide text-[#01172f]/40 w-[52px] flex-shrink-0 truncate">
                      {selected?.unit ?? ""}
                    </span>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    aria-label="Remove item"
                    disabled={items.length === 1}
                    className="w-10 h-10 sm:w-7 sm:h-auto flex items-center justify-center flex-shrink-0 text-[#01172f]/30 hover:text-red-700 disabled:opacity-0 disabled:pointer-events-none transition-colors text-2xl sm:text-lg"
                  >
                    &times;
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={addItem}
          className="mt-4 w-full border border-dashed border-[#01172f]/20 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.15em] text-[#3D5F3B] hover:border-[#149911] hover:text-[#149911] transition-colors duration-300"
        >
          + Add Another Material
        </button>
      </div>

      {/* Quote Summary */}
      <div className="border border-[#01172f]/10 bg-white p-6 mt-2">
        <div className="w-8 h-[3px] bg-[#149911] mb-4" />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#01172f]/40 mb-4">
          Quote Summary
        </p>
        <ul className="flex flex-col gap-2.5 m-0 p-0 list-none">
          {items.map((item, index) => {
            const mat =
              products.find((m) => String(m.id) === String(item.materialId)) ??
              products[0];
            if (!mat) return null;
            return (
              <li
                key={index}
                className="flex justify-between items-start gap-4 text-[14px]"
              >
                <span className="font-medium text-[#01172f] leading-snug">
                  {mat.name}
                </span>
                <span className="font-mono text-[#01172f]/50 whitespace-nowrap pt-0.5">
                  {item.quantity} {mat.unit ?? ""}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="border-t border-[#01172f]/10 mt-4 pt-4 flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-2 text-[12px]">
          <span className="font-bold uppercase tracking-wide text-[#01172f]">
            {items.length} {items.length === 1 ? "material" : "products"}{" "}
            requested
          </span>
          <span className="text-[#01172f]/40 font-medium">
            Pricing follows by phone/email
          </span>
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="message">
          Project Details
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          placeholder="Size, timeline, delivery location, etc."
          className={`${fieldClass} resize-y`}
        />
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="relative flex items-center justify-center w-full bg-white text-[#3D5F3B] py-4 overflow-hidden group cursor-pointer border-2 border-[#149911] disabled:opacity-60 mt-2 transition-colors duration-300"
      >
        <span className="absolute inset-0 bg-[#149911] transform scale-x-0 origin-left transition-transform duration-500 ease-[cubic-bezier(0.87,0,0.13,1)] group-hover:scale-x-100" />
        <span className="relative z-10 text-[13px] text-[#149911] font-bold uppercase tracking-[0.2em] transition-colors duration-300 group-hover:text-[#fdfffc]">
          {status === "submitting" ? "Sending..." : "Send Request"}
        </span>
      </button>
      {status === "error" && (
        <p className="text-[13px] text-red-700 font-medium text-center m-0">
          Something went wrong. Please try again.
        </p>
      )}
    </form>
  );
}