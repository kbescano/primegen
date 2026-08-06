import Image from "next/image";
import { peso, getQuotationTerms } from "@/lib/pipelineUtils";

export default function QuotationPrintPreview({ quotation }: { quotation: any }) {
  if (!quotation) return null;

  const subtotal = (quotation.items || []).reduce(
    (sum: number, i: any) => sum + (Number(i.qty) || 0) * (Number(i.unitPrice) || 0),
    0
  );
  const discountAmount = Number(quotation.discountAmount) || 0;
  const deliveryFee = Number(quotation.deliveryFee) || 0;
  const netAfterDiscount = subtotal - discountAmount;
  const netWithDelivery = netAfterDiscount + deliveryFee;
  const hasVat = (Number(quotation.vatRate) || 0) > 0;
  const vatRate = Number(quotation.vatRate) || 0;
  const vat = hasVat ? netWithDelivery * (vatRate / 100) : 0;
  const total = netWithDelivery + vat;
  const terms = getQuotationTerms(hasVat);
  const qDate = quotation.quotationDate
    ? new Date(quotation.quotationDate).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "________";

  return (
    <div className="mt-6 border-t border-gray-100 pt-5">
      <p className="text-[11px] font-medium text-gray-500 mb-4">Confirmed Quotation Preview</p>
      <div className="w-full overflow-x-auto pb-4">
        <div className="quotation-print-doc bg-white border border-gray-200 rounded-2xl p-6 text-[#01172f] min-w-[794px] shadow-sm">
          <div className="flex flex-row justify-between items-start gap-3 mb-4">
            <div className="flex gap-1.5 items-center">
              <div className="relative w-36 h-36 flex-shrink-0 overflow-hidden">
                <Image src="/branding/primegen_trading_logo.png" alt="Primegen Trading Corporation" fill className="object-contain scale-[1.1]" />
              </div>
              <div>
                <h2 className="text-lg font-black leading-none text-[#103900] tracking-tight">PRIMEGEN</h2>
                <p className="text-[10px] font-bold tracking-[0.2em] text-[#01172f] mt-0 mb-1.5">TRADING CORPORATION</p>
                <div className="w-full max-w-[200px] h-[2px] bg-[#149911] mb-1.5" />
                <p className="text-[8px] font-bold text-[#103900] leading-snug max-w-[200px] m-0">
                  SOUTHERN CITY HOMES, YG BUILDING, CEBU ST, 4 TANZANG LUMA, IMUS, 4103 CAVITE, PHILIPPINES
                </p>
                <p className="text-[8px] font-bold text-[#103900] m-0 mt-1">0917-185-9127 / 0917-133-9515 / 046-8860853</p>
                <p className="text-[8px] font-bold text-[#103900] m-0 mt-1">SALES@PRIMEGENTRADINGCORP.COM</p>
              </div>
            </div>
            <div className="text-right w-auto">
              <h3 className="text-lg font-bold text-[#3D5F3B] mb-1">FORMAL QUOTATION</h3>
              <table className="text-[10px] ml-auto mt-0">
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-2 py-0.5 font-bold bg-gray-50">DATE</td>
                    <td className="border border-gray-300 px-2 py-0.5">{qDate}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-2 py-0.5 font-bold bg-gray-50">QUOTATION #</td>
                    <td className="border border-gray-300 px-2 py-0.5 font-mono">{quotation.quotationNumber || "________"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mb-3">
            <div className="bg-[#3D5F3B] text-white text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-sm">Customer</div>
            <div className="text-[10px] py-1 flex flex-col gap-0.5">
              <p><span className="font-bold">Name: </span>{quotation.customerName || "________"}</p>
              <p><span className="font-bold">Company: </span>{quotation.company || "________"}</p>
              <p><span className="font-bold">Address: </span>{quotation.address || "________"}</p>
              <p><span className="font-bold">Contact Number: </span>{quotation.contactNumber || "________"}</p>
            </div>
          </div>

          <div>
            <table className="w-full text-[10px] mb-2 border-collapse">
              <thead>
                <tr className="bg-[#3D5F3B] text-white text-[10px] uppercase tracking-wide">
                  <th className="py-1 px-2 text-left w-[60px]">Qty</th>
                  <th className="py-1 px-2 text-left w-[80px]">Unit</th>
                  <th className="py-1 px-2 text-left">Description</th>
                  <th className="py-1 px-2 text-right w-[100px]">Unit Price</th>
                  <th className="py-1 px-2 text-right w-[100px]">Amount</th>
                </tr>
              </thead>
              <tbody>
                {(quotation.items || []).map((item: any, i: number) => {
                  const price = Number(item.unitPrice) || 0;
                  const qty = Number(item.qty) || 0;
                  return (
                    <tr key={i} className={i % 2 === 1 ? "bg-gray-50" : ""}>
                      <td className="py-1 px-2 border-b border-gray-100">{qty}</td>
                      <td className="py-1 px-2 border-b border-gray-100">{item.unit}</td>
                      <td className="py-1 px-2 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <span>{item.description || "--"}</span>
                          {item.imageDataUrl && <img src={item.imageDataUrl} alt="" className="h-6 w-auto object-contain flex-shrink-0 rounded" />}
                        </div>
                      </td>
                      <td className="py-1 px-2 border-b border-gray-100 text-right font-mono">{peso(price)}</td>
                      <td className="py-1 px-2 border-b border-gray-100 text-right font-mono">{peso(qty * price)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mt-8 mb-4">
            <table className="text-[10px] w-full max-w-[240px]">
              <tbody>
                <tr>
                  <td className="py-1 px-2 bg-[#e8f0e5] rounded-l-sm">Subtotal</td>
                  <td className="py-1 px-2 bg-[#e8f0e5] text-right font-mono rounded-r-sm">{peso(subtotal)}</td>
                </tr>
                {discountAmount > 0 && (
                  <tr>
                    <td className="py-1 px-2">Discount</td>
                    <td className="py-1 px-2 text-right font-mono">-{peso(discountAmount)}</td>
                  </tr>
                )}
                {deliveryFee > 0 && (
                  <tr>
                    <td className="py-1 px-2">Delivery Fee</td>
                    <td className="py-1 px-2 text-right font-mono">{peso(deliveryFee)}</td>
                  </tr>
                )}
                {hasVat && (
                  <tr>
                    <td className="py-1 px-2">VAT ({vatRate}%)</td>
                    <td className="py-1 px-2 text-right font-mono">{peso(vat)}</td>
                  </tr>
                )}
                <tr className="border-t-2 border-[#3D5F3B]">
                  <td className="py-1 px-2 font-bold text-[11px] bg-[#e8f0e5] rounded-l-sm">TOTAL</td>
                  <td className="py-1 px-2 font-bold text-[11px] text-right font-mono bg-[#e8f0e5] rounded-r-sm">{peso(total)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-[1fr_240px] gap-4 mt-8 mb-2 text-[8px] leading-snug break-inside-avoid">
            <div>
              <p className="font-bold text-[9px] uppercase tracking-wide mb-1">Terms &amp; Condition</p>
              <ol className="list-decimal pl-4 flex flex-col gap-0.5 text-gray-700">
                {terms.map((t, i) => <li key={i}>{t}</li>)}
              </ol>
            </div>
            <div>
              <p className="font-bold text-[9px] uppercase tracking-wide mb-3">Customer Conforme:</p>
              <div className="border-t border-black w-full mb-1.5" />
              <p className="text-gray-600">This is to certify that all details in this quotation are correct (name, address, items, specifications, quantity, price)</p>
            </div>
          </div>

          <div className="border-t border-black pt-1 break-inside-avoid mt-8">
            <p className="text-center font-bold text-[9px] uppercase tracking-wide mb-2">Bank Transfer Details</p>
            <div className="grid grid-cols-4 gap-2 gap-x-3 text-[7px]">
              <div>
                <p className="font-bold">BANK:</p>
                <p>ASIA UNITED BANK</p>
                <p className="mt-0.5">ACCOUNT NAME:</p>
                <p>PRIMEGEN TRADING CORPORATION</p>
                <p className="mt-0.5">ACCOUNT NUMBER:</p>
                <p>102-01-000648-3</p>
              </div>
              <div>
                <p className="font-bold">G-CASH / MAYA</p>
                <p className="mt-0.5">LEAH R. SAYNES</p>
                <p>09617812908</p>
              </div>
              <div>
                <p className="font-bold">PNB</p>
                <p className="mt-0.5">MICHAEL P. SAYNES</p>
                <p>50110044450</p>
              </div>
              <div>
                <p className="font-bold">BANCO DE ORO (SM AURA BRANCH)</p>
                <p className="mt-0.5">MICHAEL P. SAYNES</p>
                <p>008010019955</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}