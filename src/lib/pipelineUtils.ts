export type StepKey =
  | "quotation"
  | "confirmation"
  | "supplierPO"
  | "fulfilled"
  | "delivery"
  | "closed";

export const STEPS: { key: StepKey; label: string }[] = [
  { key: "quotation", label: "Create Quotation" },
  { key: "confirmation", label: "Quotation Approval" },
  { key: "supplierPO", label: "Create PO" },
  { key: "fulfilled", label: "Order Fulfilled" },
  { key: "delivery", label: "Track Delivery" },
  { key: "closed", label: "Confirm Completed" },
];

export const FULFILLMENT_OPTIONS = [
  { value: "preparing", label: "Preparing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export const FULFILLMENT_COLORS: Record<string, string> = {
  preparing: "bg-amber-50 text-amber-700",
  shipped: "bg-purple-50 text-purple-700",
  delivered: "bg-[#149911] text-white",
  cancelled: "bg-red-50 text-red-600",
};

export const PAYMENT_OPTIONS = [
  { value: "unpaid", label: "Unpaid" },
  { value: "partial", label: "Partial" },
  { value: "paid", label: "Paid" },
];

export const PAYMENT_COLORS: Record<string, string> = {
  unpaid: "bg-gray-100 text-gray-600",
  partial: "bg-amber-50 text-amber-700",
  paid: "bg-[#149911] text-white",
};

export const peso = (n: number) =>
  "\u20B1" +
  n.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const BASE_TERMS = [
  "",
  "This quotation is valid for 7 days from the date of issue. Prices and availability are subject to change without prior notice after this period.",
  "Full Payment before Delivery; Delivery will be arranged upon confirmation of full payment.",
  "Delivery timelines are estimates and depend on product availability and logistics. We shall not be held liable for delays due to causes beyond our control, including but not limited to supplier delays, transportation issues, or force majeure events.",
  "Ownership of products shall remain with Primegen Trading Corp. until full payment is received. Risk passes to the buyer upon delivery or collection.",
  "Cancellations must be made in writing within 1 day of order placement. Returns are subject to approval and may incur restocking fees. Custom or special-order items are non-returnable.",
  "Products supplied are covered by manufacturer's warranty only, subject to their terms and conditions. No additional warranties are expressed or implied unless agreed upon in writing.",
  "Proceeding with this quotation constitutes acceptance of these terms and conditions in full.",
  "Refund Processing. Approved refunds (if any) will be processed within 7–14 working days via the original mode of payment.",
];

export function getQuotationTerms(hasVat: boolean) {
  const copy = [...BASE_TERMS];
  copy[0] = `All prices are quoted in Peso and are ${
    hasVat ? "Inclusive" : "Exclusive"
  } of VAT, delivery charges, and other applicable taxes, unless otherwise specified. Prices are based on current material costs and may be adjusted due to market fluctuations.`;
  return copy;
}

export function quotationTotal(q: any): number {
  const subtotal = (q.items || []).reduce(
    (sum: number, i: any) =>
      sum + (Number(i.qty) || 0) * (Number(i.unitPrice) || 0),
    0,
  );
  const afterDiscount = subtotal - (Number(q.discountAmount) || 0);
  const withDelivery = afterDiscount + (Number(q.deliveryFee) || 0);
  return withDelivery + withDelivery * ((Number(q.vatRate) || 0) / 100);
}

export function orderBreakdown(o: any) {
  const subtotal = (o.items || []).reduce(
    (sum: number, i: any) =>
      sum + (Number(i.qty) || 0) * (Number(i.unitPrice) || 0),
    0,
  );
  const discountAmount = Number(o.discountAmount) || 0;
  const deliveryFee = Number(o.deliveryFee) || 0;
  const afterDiscount = subtotal - discountAmount;
  const withDelivery = afterDiscount + deliveryFee;
  const vatRate = Number(o.vatRate) || 0;
  const vatAmount = withDelivery * (vatRate / 100);
  const total = withDelivery + vatAmount;

  const liquidatedOpex = (o.opex || []).reduce(
    (sum: number, exp: any) =>
      sum + (exp.status === "liquidated" ? Number(exp.amount) || 0 : 0),
    0,
  );

  const pendingOpex = (o.opex || []).reduce(
    (sum: number, exp: any) =>
      sum + (exp.status === "pending" ? Number(exp.amount) || 0 : 0),
    0,
  );

  return {
    subtotal,
    discountAmount,
    deliveryFee,
    vatRate,
    vatAmount,
    total,
    liquidatedOpex,
    pendingOpex,
  };
}

export function orderMarkupTotal(o: any): number {
  const subtotal = (o.items || []).reduce(
    (sum: number, i: any) =>
      sum + (Number(i.qty) || 0) * (Number(i.unitPrice) || 0),
    0,
  );
  const discountAmount = Number(o.discountAmount) || 0;
  const deliveryFee = Number(o.deliveryFee) || 0;
  const netRevenue = subtotal - discountAmount + deliveryFee;

  const cogs = (o.items || []).reduce(
    (sum: number, i: any) =>
      sum + (Number(i.qty) || 0) * (Number(i.unitCost) || 0),
    0,
  );

  return netRevenue - cogs;
}

export function orderTrueNetProfit(o: any): number {
  const markup = orderMarkupTotal(o);
  const liquidatedOpex = (o.opex || []).reduce(
    (sum: number, exp: any) =>
      sum + (exp.status === "liquidated" ? Number(exp.amount) || 0 : 0),
    0,
  );
  return markup - liquidatedOpex;
}