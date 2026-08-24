"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

type Product = { id: string; name: string; unit: string };
type LineItem = {
  materialId: string;
  quantity: number;
  sizeDescription?: string;
};
type ClientOption = {
  id: string | number;
  name: string;
  company?: string;
  address?: string;
  phone?: string;
  email?: string;
};

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
  const [view, setView] = useState<
    "idle" | "picker" | "form" | "submitting" | "done"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);

  const [formData, setFormData] = useState({
    customerName: "",
    phone: "",
    email: "",
    projectType: "residential",
    source: "facebook",
    facebookLink: "",
    sourceOther: "",
    message: "",
  });

  const [isProductsTBC, setIsProductsTBC] = useState(false);
  const [items, setItems] = useState<LineItem[]>([
    {
      materialId: preselectedMaterial?.id ?? products[0]?.id ?? "",
      quantity: 1,
      sizeDescription: "",
    },
  ]);

  function fetchClients() {
    setLoadingClients(true);
    fetch("/api/clients?limit=200&sort=name", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setClients(data.docs || []))
      .catch(() => setClients([]))
      .finally(() => setLoadingClients(false));
  }

  function openModal() {
    setIsOpen(true);
    setView("picker");
    fetchClients();
  }

  function handleSelectClient(client: ClientOption) {
    setFormData((prev) => ({
      ...prev,
      customerName: client.name || "",
      phone: client.phone || "",
      email: client.email || "",
    }));
    setView("form");
  }

  function resetForm() {
    setFormData({
      customerName: "",
      phone: "",
      email: "",
      projectType: "residential",
      source: "facebook",
      facebookLink: "",
      sourceOther: "",
      message: "",
    });
    setItems([
      {
        materialId: preselectedMaterial?.id ?? products[0]?.id ?? "",
        quantity: 1,
        sizeDescription: "",
      },
    ]);
    setIsProductsTBC(false);
    setView("idle");
    setErrorMsg("");
  }

  function closeModal() {
    setIsOpen(false);
    setTimeout(resetForm, 300);
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

  function handleFormChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMsg("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setView("submitting");

    const finalMessage = isProductsTBC
      ? `${formData.message}\n\n[System Note: Products/Quantities To Be Confirmed]`
      : formData.message;

    const data = {
      customerName: formData.customerName,
      phone: formData.phone,
      email: formData.email,
      projectType: formData.projectType,
      message: finalMessage,
      source: formData.source,
      facebookLink: formData.source === "facebook" ? formData.facebookLink : "",
      sourceOther: formData.source === "other" ? formData.sourceOther : "",
      items: isProductsTBC
        ? []
        : items
            .filter((i) => i.materialId)
            .map((i) => ({
              // Coerce back to a number when the material ID is numeric, since
              // <select> option values always arrive as strings but the
              // `products` collection uses Payload's default numeric ID.
              material: isNaN(Number(i.materialId))
                ? i.materialId
                : Number(i.materialId),
              quantity: Number(i.quantity) || 1,
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
      setView("done");
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
      setView("form");
    }
  }

  return (
    <>
      <button
        onClick={openModal}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#01172f] text-white rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-[#149911] transition-colors shadow-md hover:shadow-lg"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="square"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        Create new Inquiry
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#01172f]/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white w-full max-w-[680px] max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl relative custom-scrollbar flex flex-col">
            <button
              onClick={closeModal}
              className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full transition-colors z-10"
              aria-label="Close Modal"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="square"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            {view === "picker" && (
              <div className="p-6 sm:p-10 flex flex-col h-full">
                <div className="mb-6 pr-8 shrink-0">
                  <h2 className="text-[22px] font-bold tracking-tight text-[#01172f] mb-1">
                    Use an Existing Client?
                  </h2>
                  <p className="text-[13px] text-gray-500">
                    Select a client to auto-fill this inquiry, or start with a
                    blank form.
                  </p>
                </div>

                <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden mb-6 shrink-0">
                  {loadingClients ? (
                    <div className="p-10 text-center text-[13px] font-medium text-gray-400">
                      Loading clients...
                    </div>
                  ) : clients.length === 0 ? (
                    <div className="p-10 text-center text-[13px] font-medium text-gray-400">
                      No clients saved in the database yet.
                    </div>
                  ) : (
                    <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                      {clients.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => handleSelectClient(c)}
                          className="w-full text-left px-5 py-4 hover:bg-[#149911]/[0.05] transition-colors border-b border-gray-100 last:border-0 group"
                        >
                          <p className="font-bold text-[#01172f] text-[13px] group-hover:text-[#149911] transition-colors">
                            {c.name}
                          </p>
                          {(c.company || c.phone) && (
                            <p className="text-[11px] text-gray-500 mt-1">
                              {c.company} {c.company && c.phone && "•"}{" "}
                              {c.phone}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-auto pt-2 shrink-0">
                  <button
                    onClick={() => setView("form")}
                    className="w-full py-3.5 border-2 border-gray-200 rounded-xl text-[11px] font-bold uppercase tracking-widest text-gray-500 hover:border-[#01172f] hover:text-[#01172f] transition-all bg-gray-50 hover:bg-white"
                  >
                    Start Blank Instead
                  </button>
                </div>
              </div>
            )}

            {view === "done" && (
              <div className="p-10 md:p-16 text-center my-auto flex flex-col items-center justify-center h-full">
                <div className="w-12 h-[3px] bg-[#149911] mx-auto mb-8" />
                <h2 className="text-[28px] md:text-[32px] font-black uppercase tracking-tight text-[#01172f] mb-4">
                  Inquiry created.
                </h2>
                <p className="text-[15px] text-[#01172f]/60 font-medium max-w-[400px] mx-auto mb-10">
                  The project details have been recorded.
                </p>
                <button
                  onClick={closeModal}
                  className="px-8 py-3 bg-[#01172f] text-white text-[11px] font-bold uppercase tracking-widest hover:bg-[#149911] transition-colors rounded-lg"
                >
                  Done
                </button>
              </div>
            )}

            {(view === "form" || view === "submitting") && (
              <div className="p-6 sm:p-10">
                <div className="mb-8 pr-8 flex items-center justify-between">
                  <div>
                    <h2 className="text-[22px] font-bold tracking-tight text-[#01172f] mb-1">
                      New Inquiry Details
                    </h2>
                    <p className="text-[13px] text-gray-500">
                      Manually encode a new Request for Quotation into the
                      system. All fields are required.
                    </p>
                  </div>
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
                      <label className={labelClass} htmlFor="customerName">
                        Full Name
                      </label>
                      <input
                        id="customerName"
                        name="customerName"
                        value={formData.customerName}
                        onChange={handleFormChange}
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
                        value={formData.phone}
                        onChange={handleFormChange}
                        placeholder="+639..."
                        className={fieldClass}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className={labelClass} htmlFor="email">
                        Email
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleFormChange}
                        placeholder="you@company.com"
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="projectType">
                        Project Type
                      </label>
                      <select
                        id="projectType"
                        name="projectType"
                        value={formData.projectType}
                        onChange={handleFormChange}
                        required
                        className={`${fieldClass} appearance-none pr-9 bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2301172f%22 stroke-width=%222%22><path d=%22M6 9l6 6 6-6%22/></svg>')] bg-no-repeat bg-[right_16px_center]`}
                      >
                        <option value="residential">Residential</option>
                        <option value="commercial">Commercial</option>
                        <option value="renovation">Renovation</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className={labelClass} htmlFor="source">
                        Lead Source *
                      </label>
                      <select
                        id="source"
                        name="source"
                        value={formData.source}
                        onChange={handleFormChange}
                        required
                        className={`${fieldClass} appearance-none pr-9 bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2301172f%22 stroke-width=%222%22><path d=%22M6 9l6 6 6-6%22/></svg>')] bg-no-repeat bg-[right_16px_center]`}
                      >
                        <option value="facebook">Facebook</option>
                        <option value="google">Google</option>
                        <option value="viber">Viber</option>
                        <option value="marketPlace">Market Place</option>
                        <option value="dummy">Dummy</option>
                        <option value="email">Email</option>
                        <option value="other">Others</option>
                      </select>
                    </div>

                    {(formData.source === "facebook" ||
                      formData.source === "marketPlace" ||
                      formData.source === "dummy") && (
                      <div>
                        <label className={labelClass} htmlFor="facebookLink">
                          Facebook Profile / Post Link
                        </label>
                        <textarea
                          id="facebookLink"
                          name="facebookLink"
                          rows={3}
                          value={formData.facebookLink}
                          onChange={handleFormChange}
                          placeholder="Paste the link to their FB profile, page message, or post..."
                          className={`${fieldClass} resize-y`}
                        />
                      </div>
                    )}

                    {formData.source === "other" && (
                      <div>
                        <label className={labelClass} htmlFor="sourceOther">
                          Please Specify
                        </label>
                        <input
                          id="sourceOther"
                          name="sourceOther"
                          value={formData.sourceOther}
                          onChange={handleFormChange}
                          placeholder="e.g. referral, walk-in..."
                          required
                          className={fieldClass}
                        />
                      </div>
                    )}
                  </div>

                  {/* Products Section */}
                  <div className="border-t border-[#01172f]/10 pt-8 mt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#01172f] m-0">
                        Products Needed
                      </p>

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
                              <svg
                                className="w-3.5 h-3.5 text-white"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
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
                      <div className="w-full border border-dashed border-gray-200 py-10 flex items-center justify-center rounded-lg bg-gray-50/50">
                        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400">
                          Products to be confirmed
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-5">
                        {items.map((item, index) => {
                          const selected =
                            products.find(
                              (m) => String(m.id) === String(item.materialId),
                            ) ?? products[0];

                          return (
                            <div
                              key={index}
                              className="flex flex-col gap-3 w-full"
                            >
                              <div className="flex flex-col sm:flex-row gap-3 items-center w-full">
                                <div className="w-full sm:w-[55%] relative">
                                  <select
                                    value={item.materialId}
                                    onChange={(e) =>
                                      updateItem(index, {
                                        materialId: e.target.value,
                                      })
                                    }
                                    className="w-full px-4 py-3.5 bg-white border border-gray-200 text-[14px] text-[#01172f] focus:outline-none focus:border-[#149911] transition-colors duration-300 rounded-lg shadow-sm appearance-none pr-9 bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2301172f%22 stroke-width=%222%22><path d=%22M6 9l6 6 6-6%22/></svg>')] bg-no-repeat bg-[right_14px_center]"
                                  >
                                    {products.map((m) => (
                                      <option key={m.id} value={m.id}>
                                        {m.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div className="w-full sm:w-[45%] flex items-center gap-2">
                                  <div className="flex-1 flex items-center bg-white border border-gray-200 rounded-lg shadow-sm px-4 py-3.5 focus-within:border-[#149911] transition-colors duration-300">
                                    <input
                                      type="number"
                                      min={1}
                                      required
                                      value={item.quantity}
                                      onChange={(e) =>
                                        updateItem(index, {
                                          quantity: Number(e.target.value),
                                        })
                                      }
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
                                    <svg
                                      width="18"
                                      height="18"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2.5"
                                      strokeLinecap="square"
                                    >
                                      <path d="M18 6L6 18M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              </div>

                              <div className="w-full">
                                <input
                                  type="text"
                                  placeholder="Size / Specs (optional) e.g., 20mm, 6m length"
                                  value={item.sizeDescription || ""}
                                  onChange={(e) =>
                                    updateItem(index, {
                                      sizeDescription: e.target.value,
                                    })
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
                      value={formData.message}
                      onChange={handleFormChange}
                      placeholder="Size, timeline, delivery location, etc."
                      className={`${fieldClass} resize-y`}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={view === "submitting"}
                    className="relative flex items-center justify-center w-full bg-white text-[#3D5F3B] py-4 overflow-hidden group cursor-pointer border-2 border-[#149911] rounded-lg disabled:opacity-60 mt-4 transition-colors duration-300 shadow-sm hover:shadow-md"
                  >
                    <span className="absolute inset-0 bg-[#149911] transform scale-x-0 origin-left transition-transform duration-500 ease-[cubic-bezier(0.87,0,0.13,1)] group-hover:scale-x-100" />
                    <span className="relative z-10 text-[13px] text-[#149911] font-bold uppercase tracking-[0.2em] transition-colors duration-300 group-hover:text-[#fdfffc]">
                      {view === "submitting"
                        ? "Submitting..."
                        : "Submit Inquiry"}
                    </span>
                  </button>

                  {errorMsg && (
                    <p className="text-[12px] text-red-600 font-bold text-center m-0 bg-red-50 py-3 rounded-lg border border-red-200">
                      {errorMsg}
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