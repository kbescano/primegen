"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

type Product = { id: string; name: string; unit: string };
type LineItem = { materialId: string; quantity: number; sizeDescription?: string };

const fieldClass =
  "w-full px-4 py-3.5 bg-white border border-[#01172f]/15 text-[14px] text-[#01172f] placeholder:text-[#01172f]/35 focus:outline-none focus:border-[#149911] transition-colors duration-300 rounded-lg shadow-sm";

const labelClass =
  "text-[10px] font-bold uppercase tracking-[0.2em] text-[#01172f]/40 mb-2 block";

export default function CreateRFQModal({ products }: { products: Product[] }) {
  const searchParams = useSearchParams();
  const preselected = searchParams.get("product");
  const preselectedMaterial = products.find(
    (m) => String(m.id) === String(preselected),
  );

  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "submitting" | "done" | "error"
  >("idle");
  
  const [isProductsTBC, setIsProductsTBC] = useState(false);
  const [items, setItems] = useState<LineItem[]>([
    {
      materialId: preselectedMaterial?.id ?? products[0]?.id ?? "",
      quantity: 1,
      sizeDescription: "",
    },
  ]);

  function resetForm() {
    setItems([
      {
        materialId: preselectedMaterial?.id ?? products[0]?.id ?? "",
        quantity: 1,
        sizeDescription: "",
      },
    ]);
    setIsProductsTBC(false);
    setStatus("idle");
  }

  function closeModal() {
    setIsOpen(false);
    setTimeout(resetForm, 300); // Reset after closing animation
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      { materialId: products[0]?.id ?? "", quantity: 1, sizeDescription: "" },
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
    
    const baseMessage = (form.elements.namedItem("message") as HTMLTextAreaElement).value;
    
    // Automatically append a note if products are set to "To Be Confirmed"
    const finalMessage = isProductsTBC 
      ? `${baseMessage}\n\n[System Note: Products/Quantities To Be Confirmed]`
      : baseMessage;

    const data = {
      customerName: (form.elements.namedItem("customerName") as HTMLInputElement).value,
      phone: (form.elements.namedItem("phone") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      projectType: (form.elements.namedItem("projectType") as HTMLSelectElement).value,
      message: finalMessage,
      source: "website",
      // If TBC is checked, send an empty array. Otherwise, map the items.
      items: isProductsTBC 
        ? [] 
        : items.filter((i) => i.materialId).map((i) => ({ 
            material: i.materialId, 
            quantity: i.quantity,
            sizeDescription: i.sizeDescription || "",
          })),
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

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#01172f] text-white rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-[#149911] transition-colors shadow-md hover:shadow-lg"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Create new Inquiry
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#01172f]/40 backdrop-blur-sm transition-opacity">
          
          {/* Modal Container */}
          <div className="bg-white w-full max-w-[680px] max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl relative custom-scrollbar flex flex-col">
            
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full transition-colors z-10"
              aria-label="Close Modal"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            {/* Success State */}
            {status === "done" ? (
              <div className="p-10 md:p-16 text-center my-auto flex flex-col items-center justify-center h-full">
                <div className="w-12 h-[3px] bg-[#149911] mx-auto mb-8" />
                <h2 className="text-[28px] md:text-[32px] font-black uppercase tracking-tight text-[#01172f] mb-4">
                  Request Received.
                </h2>
                <p className="text-[15px] text-[#01172f]/60 font-medium max-w-[400px] mx-auto mb-10">
                  Thanks — the project details have been recorded. Our team will review and process the quotation shortly.
                </p>
                <button
                  onClick={closeModal}
                  className="px-8 py-3 bg-[#01172f] text-white text-[11px] font-bold uppercase tracking-widest hover:bg-[#149911] transition-colors rounded-lg"
                >
                  Done
                </button>
              </div>
            ) : (
              
              /* Form State */
              <div className="p-6 sm:p-10">
                <div className="mb-8 pr-8">
                  <h2 className="text-[22px] font-bold tracking-tight text-[#01172f] mb-1">
                    Create New Inquiry
                  </h2>
                  <p className="text-[13px] text-gray-500">
                    Manually encode a new Request for Quotation into the system. All fields are required.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                  {preselectedMaterial && (
                    <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[#3D5F3B] m-0 bg-green-50 p-3 rounded-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#149911] inline-block" />
                      Pre-filled Product: {preselectedMaterial.name}
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className={labelClass} htmlFor="customerName">Full Name</label>
                      <input id="customerName" name="customerName" placeholder="Juan dela Cruz" required className={fieldClass} />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="phone">Phone Number</label>
                      <input id="phone" name="phone" type="tel" placeholder="+639..." required className={fieldClass} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className={labelClass} htmlFor="email">Email</label>
                      <input id="email" name="email" type="email" placeholder="you@company.com" required className={fieldClass} />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="projectType">Project Type</label>
                      <select id="projectType" name="projectType" required className={`${fieldClass} appearance-none pr-9 bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2301172f%22 stroke-width=%222%22><path d=%22M6 9l6 6 6-6%22/></svg>')] bg-no-repeat bg-[right_16px_center]`}>
                        <option value="residential">Residential</option>
                        <option value="commercial">Commercial</option>
                        <option value="renovation">Renovation</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Products Section */}
                  <div className="border-t border-[#01172f]/10 pt-8 mt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#01172f] m-0">
                        Products Needed
                      </p>
                      
                      {/* Global To Be Confirmed Toggle matching screenshot */}
                      <label className="flex items-center gap-2.5 cursor-pointer group">
                        <div className="relative flex items-center justify-center w-5 h-5">
                          <input
                            type="checkbox"
                            checked={isProductsTBC}
                            onChange={(e) => setIsProductsTBC(e.target.checked)}
                            className="peer absolute w-full h-full opacity-0 cursor-pointer"
                          />
                          <div className="w-full h-full border-2 border-[#01172f] rounded-sm bg-white peer-checked:bg-[#01172f] transition-colors flex items-center justify-center">
                            {isProductsTBC && (
                              <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                        </div>
                        <span className="text-[11px] font-bold uppercase tracking-widest text-[#01172f]/60 group-hover:text-[#01172f] transition-colors">
                          To be confirmed?
                        </span>
                      </label>
                    </div>

                    {isProductsTBC ? (
                      // Products to be confirmed message
                      <div className="w-full border border-dashed border-gray-200 py-10 flex items-center justify-center rounded-lg bg-gray-50/50">
                        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400">
                          Products to be confirmed
                        </p>
                      </div>
                    ) : (
                      // Dynamic product rows matching screenshot
                      <div className="flex flex-col gap-5">
                        {items.map((item, index) => {
                          const selected = products.find((m) => String(m.id) === String(item.materialId)) ?? products[0];

                          return (
                            <div key={index} className="flex flex-col gap-3 w-full">
                              
                              <div className="flex flex-col sm:flex-row gap-3 items-center w-full">
                                {/* Product Select (Left Box) */}
                                <div className="w-full sm:w-[55%] relative">
                                  <select
                                    value={item.materialId}
                                    onChange={(e) => updateItem(index, { materialId: e.target.value })}
                                    className="w-full px-4 py-3.5 bg-white border border-gray-200 text-[14px] text-[#01172f] focus:outline-none focus:border-[#149911] transition-colors duration-300 rounded-lg shadow-sm appearance-none pr-9 bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2301172f%22 stroke-width=%222%22><path d=%22M6 9l6 6 6-6%22/></svg>')] bg-no-repeat bg-[right_14px_center]"
                                  >
                                    {products.map((m) => (
                                      <option key={m.id} value={m.id}>
                                        {m.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {/* Quantity + Unit (Right Box) */}
                                <div className="w-full sm:w-[45%] flex items-center gap-2">
                                  <div className="flex-1 flex items-center bg-white border border-gray-200 rounded-lg shadow-sm px-4 py-3.5 focus-within:border-[#149911] transition-colors duration-300">
                                    <input
                                      type="number"
                                      min={1}
                                      required
                                      value={item.quantity}
                                      onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
                                      className="w-full text-center text-[14px] text-[#01172f] focus:outline-none bg-transparent"
                                      aria-label="Quantity"
                                    />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-3 whitespace-nowrap">
                                      {selected?.unit ?? "pcs"}
                                    </span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => removeItem(index)}
                                    aria-label="Remove item"
                                    disabled={items.length === 1}
                                    className="w-10 h-10 flex items-center justify-center flex-shrink-0 text-gray-400 hover:text-red-500 disabled:opacity-0 disabled:pointer-events-none transition-colors"
                                  >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
                                      <path d="M18 6L6 18M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              </div>

                              {/* Size / Specs Field */}
                              <div className="w-full">
                                <input
                                  type="text"
                                  placeholder="Size / Specs (optional) e.g., 20mm, 6m length"
                                  value={item.sizeDescription || ""}
                                  onChange={(e) =>
                                    updateItem(index, { sizeDescription: e.target.value })
                                  }
                                  className={`${fieldClass} h-[44px] py-0 text-[13px]`}
                                />
                              </div>

                            </div>
                          );
                        })}
                        
                        <button
                          type="button"
                          onClick={addItem}
                          className="mt-2 w-full border border-dashed border-gray-200 px-4 py-4 text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400 hover:border-[#01172f]/30 hover:text-[#01172f] hover:bg-gray-50 transition-all duration-300 rounded-lg"
                        >
                          + Add Another Product
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-[#01172f]/5 pt-8 mt-2">
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
                    className="relative flex items-center justify-center w-full bg-white text-[#3D5F3B] py-4 overflow-hidden group cursor-pointer border-2 border-[#149911] rounded-lg disabled:opacity-60 mt-4 transition-colors duration-300 shadow-sm hover:shadow-md"
                  >
                    <span className="absolute inset-0 bg-[#149911] transform scale-x-0 origin-left transition-transform duration-500 ease-[cubic-bezier(0.87,0,0.13,1)] group-hover:scale-x-100" />
                    <span className="relative z-10 text-[13px] text-[#149911] font-bold uppercase tracking-[0.2em] transition-colors duration-300 group-hover:text-[#fdfffc]">
                      {status === "submitting" ? "Submitting..." : "Submit Inquiry"}
                    </span>
                  </button>
                  
                  {status === "error" && (
                    <p className="text-[13px] text-red-600 font-bold text-center m-0">
                      Something went wrong. Please try again.
                    </p>
                  )}
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}