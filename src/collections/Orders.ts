import type { CollectionConfig, Field } from "payload";

const receiptItemFields: Field[] = [
  {
    name: "fileData",
    type: "textarea",
    required: true,
    maxLength: 10000000,
    admin: { description: "Base64-encoded image or PDF data." },
  },
  { name: "fileName", type: "text" },
  {
    name: "fileType",
    type: "text",
    admin: { description: "'image' or 'pdf', used to decide how to render the thumbnail." },
  },
  {
    name: "uploadedAt",
    type: "date",
    defaultValue: () => new Date().toISOString(),
  },
];

export const Orders: CollectionConfig = {
  slug: "orders",
  admin: {
    useAsTitle: "orderNumber",
    defaultColumns: [
      "orderNumber",
      "customerName",
      "fulfillmentStatus",
      "paymentStatus",
    ],
    group: "Content",
    description:
      "Confirmed orders, converted from Client Quotations. Tracks physical fulfillment and payment separately from the sales/quotation stage.",
    hidden: ({ user }) => user?.role === "marketing",
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation === "create" && !data.orderNumber) {
          const year = new Date().getFullYear();
          const { totalDocs } = await req.payload.find({
            collection: "orders",
            where: { orderNumber: { like: `${year}-` } },
            limit: 0,
          });
          data.orderNumber = `${year}-${String(totalDocs + 1).padStart(5, "0")}`;
        }
        return data;
      },
    ],
    afterChange: [
      // ✨ MODIFIED: "Order Confirmed" -- link changed from the deliveries
      // route tracker to the order itself, matching the new spec. The
      // deliveries link now belongs solely to the separate
      // "target delivery date set" event below. Admin and Marketing both
      // get this, same message and link.
      async ({ doc, operation, req }) => {
        if (operation !== "create") return doc;
        try {
          await req.payload.create({
            collection: "notifications" as any,
            data: {
              message: `Order ${doc.orderNumber || ""} confirmed for ${doc.customerName || "a customer"}.`,
              link: `/admin-dashboard/orders?id=${doc.id}`,
              audienceRoles: ["admin", "marketing"],
              read: false,
            },
          });
        } catch (err) {
          console.error("Failed to notify of order confirmation:", err);
        }
        return doc;
      },
      // ✨ NEW: "Target delivery date has been set". Admin and Marketing
      // get different links per spec -- Admin gets the plain deliveries
      // list, Marketing gets a direct trackOrderId link -- so these have
      // to be two separate notification docs rather than one shared one.
      async ({ doc, previousDoc, operation, req }) => {
        if (
          operation === "update" &&
          doc.targetDeliveryDate &&
          doc.targetDeliveryDate !== previousDoc?.targetDeliveryDate
        ) {
          try {
            await req.payload.create({
              collection: "notifications" as any,
              data: {
                message: `Target delivery date set for Order ${doc.orderNumber || ""} (${doc.customerName || "a customer"}).`,
                link: `/admin-dashboard/deliveries`,
                audienceRoles: ["admin"],
                read: false,
              },
            });
            await req.payload.create({
              collection: "notifications" as any,
              data: {
                message: `Target delivery date set for Order ${doc.orderNumber || ""} (${doc.customerName || "a customer"}).`,
                link: `/admin-dashboard/deliveries?trackOrderId=${doc.id}`,
                audienceRoles: ["marketing"],
                read: false,
              },
            });
          } catch (err) {
            console.error("Failed to notify of target delivery date set:", err);
          }
        }
        return doc;
      },
      // ✨ NEW: Payment status set to Partial or Paid -- admin only.
      async ({ doc, previousDoc, operation, req }) => {
        if (
          operation === "update" &&
          (doc.paymentStatus === "partial" || doc.paymentStatus === "paid") &&
          doc.paymentStatus !== previousDoc?.paymentStatus
        ) {
          try {
            await req.payload.create({
              collection: "notifications" as any,
              data: {
                message: `Order ${doc.orderNumber || ""} payment status set to "${doc.paymentStatus}".`,
                link: `/admin-dashboard/orders?id=${doc.id}`,
                audienceRoles: ["admin"],
                read: false,
              },
            });
          } catch (err) {
            console.error("Failed to notify of payment status change:", err);
          }
        }
        return doc;
      },
      // ✨ NEW: Mode of Payment set -- admin only.
      async ({ doc, previousDoc, operation, req }) => {
        if (
          operation === "update" &&
          doc.paymentMethod &&
          doc.paymentMethod !== previousDoc?.paymentMethod
        ) {
          try {
            await req.payload.create({
              collection: "notifications" as any,
              data: {
                message: `Mode of payment set to "${doc.paymentMethod}" for Order ${doc.orderNumber || ""}.`,
                link: `/admin-dashboard/orders?id=${doc.id}`,
                audienceRoles: ["admin"],
                read: false,
              },
            });
          } catch (err) {
            console.error("Failed to notify of payment method set:", err);
          }
        }
        return doc;
      },
      // Receipt uploaded (client or supplier) -- admin only. Verified this
      // is the only place this event is notified: PipelineSteps.tsx's
      // handleReceiptUpload only PATCHes the order fields (via
      // handleUpdateOrderField in PipelineStepper.tsx) and never posts to
      // /api/notifications itself, so there's no client-side duplicate to
      // worry about here.
      async ({ doc, previousDoc, operation, req }) => {
        if (operation !== "update") return doc;
        try {
          const prevClientCount = (previousDoc?.clientPaymentReceipts || []).length;
          const currClientCount = (doc.clientPaymentReceipts || []).length;
          const prevSupplierCount = (previousDoc?.supplierPaymentReceipts || []).length;
          const currSupplierCount = (doc.supplierPaymentReceipts || []).length;

          if (currClientCount > prevClientCount) {
            await req.payload.create({
              collection: "notifications" as any,
              data: {
                message: `Client payment receipt uploaded for Order ${doc.orderNumber || ""}.`,
                link: `/admin-dashboard/orders?id=${doc.id}`,
                audienceRoles: ["admin"],
                read: false,
              },
            });
          }
          if (currSupplierCount > prevSupplierCount) {
            await req.payload.create({
              collection: "notifications" as any,
              data: {
                message: `Supplier payment receipt uploaded for Order ${doc.orderNumber || ""}.`,
                link: `/admin-dashboard/orders?id=${doc.id}`,
                audienceRoles: ["admin"],
                read: false,
              },
            });
          }
        } catch (err) {
          console.error("Failed to notify of receipt upload:", err);
        }
        return doc;
      },
      // ✨ NEW: Delivery status Shipped / Delivered -- specific assigned
      // staff + admin. Marketing excluded per spec.
      async ({ doc, previousDoc, operation, req }) => {
        if (
          operation === "update" &&
          (doc.fulfillmentStatus === "shipped" || doc.fulfillmentStatus === "delivered") &&
          doc.fulfillmentStatus !== previousDoc?.fulfillmentStatus
        ) {
          try {
            const statusLabel = doc.fulfillmentStatus;

            await req.payload.create({
              collection: "notifications" as any,
              data: {
                message: `Order ${doc.orderNumber || ""} (${doc.customerName || "a customer"}) has been ${statusLabel}.`,
                link: `/admin-dashboard/deliveries`,
                audienceRoles: ["admin"],
                read: false,
              },
            });

            if (doc.sourceQuotationId) {
              const quotation: any = await req.payload.findByID({
                collection: "client-quotations",
                id: doc.sourceQuotationId,
              });
              if (quotation?.sourceRequestId) {
                const rfqId = isNaN(Number(quotation.sourceRequestId))
                  ? quotation.sourceRequestId
                  : Number(quotation.sourceRequestId);
                const rfq: any = await req.payload.findByID({
                  collection: "quotation-requests",
                  id: rfqId,
                });
                const staffId =
                  rfq?.assignedTo && typeof rfq.assignedTo === "object"
                    ? rfq.assignedTo.id
                    : rfq?.assignedTo;
                if (staffId) {
                  const recipientId = isNaN(Number(staffId)) ? staffId : Number(staffId);
                  await req.payload.create({
                    collection: "notifications" as any,
                    data: {
                      recipient: recipientId,
                      message: `Order ${doc.orderNumber || ""} (${doc.customerName || "a customer"}) has been ${statusLabel}.`,
                      link: `/admin-dashboard/deliveries?trackOrderId=${doc.id}`,
                      read: false,
                    },
                  });
                }
              }
            }
          } catch (err) {
            console.error("Failed to notify of delivery status change:", err);
          }
        }
        return doc;
      },
              async ({ doc, previousDoc, operation, req }) => {
        if (
          operation === "update" &&
          doc.paymentStatus === "paid" &&
          doc.fulfillmentStatus === "delivered" &&
          (previousDoc?.paymentStatus !== "paid" || previousDoc?.fulfillmentStatus !== "delivered") &&
          doc.sourceQuotationId
        ) {
          try {
            const quotation: any = await req.payload.findByID({
              collection: "client-quotations",
              id: doc.sourceQuotationId,
            });
            if (quotation?.sourceRequestId) {
              // ✨ context flag tells QuotationRequests.ts's generic status
              // broadcast to skip -- this completion is system-triggered
              // (cascading from payment+delivery), not a manual status
              // change by a person, so the "Someone changed..." message is
              // both misleading and redundant with the delivery
              // notification that already fired above.
              await req.payload.update({
                collection: "quotation-requests",
                id: quotation.sourceRequestId,
                data: { status: "completed" },
                context: { skipStatusBroadcast: true },
              });
            }
          } catch {
            // non-critical
          }
        }
        return doc;
      },
      async ({ doc, previousDoc, operation, req }) => {
        if (operation === "update" && Array.isArray(doc.opex)) {
          const newlyLiquidated = doc.opex.filter((currExp: any) => {
            if (currExp.status !== "liquidated") return false;
            const prevExp = (previousDoc?.opex || []).find(
              (p: any) => String(p.id) === String(currExp.id),
            );
            return prevExp && prevExp.status !== "liquidated";
          });

          if (newlyLiquidated.length > 0 && doc.sourceQuotationId) {
            try {
              const quotation: any = await req.payload.findByID({
                collection: "client-quotations",
                id: doc.sourceQuotationId,
              });

              if (quotation?.sourceRequestId) {
                const targetId = isNaN(Number(quotation.sourceRequestId))
                  ? quotation.sourceRequestId
                  : Number(quotation.sourceRequestId);
                const rfq: any = await req.payload.findByID({
                  collection: "quotation-requests",
                  id: targetId,
                });

                const staffId =
                  rfq.assignedTo && typeof rfq.assignedTo === "object"
                    ? rfq.assignedTo.id
                    : rfq.assignedTo;

                if (staffId) {
                  const recipientId = isNaN(Number(staffId))
                    ? staffId
                    : Number(staffId);

                  for (const exp of newlyLiquidated) {
                    await req.payload.create({
                      collection: "notifications" as any,
                      data: {
                        recipient: recipientId,
                        message: `OPEX Approved: ₱${exp.amount} for ${exp.description}.`,
                        link: `/admin-dashboard/pipeline/${rfq.id}`,
                        read: false,
                      },
                    });
                  }
                }
              }
            } catch (err) {
              console.error("Failed to send OPEX approval notification:", err);
            }
          }
        }
        return doc;
      },
      async ({ doc, previousDoc, operation, req }) => {
        if (operation === "update" && Array.isArray(doc.opex)) {
          const newlyPending = doc.opex.filter((currExp: any) => {
            if (currExp.status !== "pending") return false;
            const prevExp = (previousDoc?.opex || []).find(
              (p: any) => String(p.id) === String(currExp.id),
            );
            return !prevExp || prevExp.status !== "pending";
          });

          if (newlyPending.length > 0) {
            try {
              for (const exp of newlyPending) {
                await req.payload.create({
                  collection: "notifications" as any,
                  data: {
                    message: `New OPEX pending approval: ₱${exp.amount} for ${exp.description} (Order ${doc.orderNumber || ""})`,
                    link: `/admin-dashboard/orders?id=${doc.id}`,
                    read: false,
                  },
                });
              }
            } catch (err) {
              console.error("Failed to notify admins of pending OPEX:", err);
            }
          }
        }
        return doc;
      },
    ],
  },
  fields: [
    {
      name: "orderNumber",
      type: "text",
      unique: true,
      admin: { readOnly: true },
    },
    {
      name: "sourceQuotationId",
      type: "text",
      admin: {
        readOnly: true,
        description:
          "Links back to the originating Client Quotation. Prevents duplicate conversions.",
      },
    },
    {
      name: "orderDate",
      type: "date",
      defaultValue: () => new Date().toISOString(),
    },
    { name: "customerName", type: "text" },
    { name: "company", type: "text" },
    { name: "address", type: "text" },
    { name: "contactNumber", type: "text" },
    { name: "salesPerson", type: "text" },
    {
      name: "items",
      type: "array",
      fields: [
        { name: "description", type: "text" },
        {
          name: "sizeDescription",
          type: "text",
          label: "Size / Specs (Optional)",
        },
        { name: "qty", type: "number" },
        { name: "unit", type: "text" },
        { name: "unitPrice", type: "number" },
        {
          name: "unitCost",
          type: "number",
          defaultValue: 0,
          admin: {
            description:
              "Supplier cost per unit, carried over from the source quotation. Used to compute Profit.",
          },
        },
        {
          name: "assignedPOId",
          type: "text",
          admin: {
            readOnly: true,
            description:
              "Which Supplier PO this specific item was assigned to, if any.",
          },
        },
      ],
    },
    {
      name: "opex",
      type: "array",
      label: "Operating Expenses (OPEX)",
      admin: {
        description:
          'Track incidental costs (delivery, meals, toll). Only "Liquidated" expenses reduce True Net Profit.',
      },
      fields: [
        { name: "description", type: "text", required: true },
        { name: "amount", type: "number", required: true, min: 0 },
        {
          name: "expenseDate",
          type: "date",
          required: true,
          defaultValue: () => new Date().toISOString(),
        },
        { name: "receiptUrl", type: "text", label: "Receipt/Proof URL" },
        {
          name: "status",
          type: "select",
          defaultValue: "pending",
          options: [
            { label: "Pending Approval", value: "pending" },
            { label: "Liquidated", value: "liquidated" },
            { label: "Rejected", value: "rejected" },
          ],
        },
      ],
    },
    { name: "vatRate", type: "number", defaultValue: 12 },
    { name: "discountAmount", type: "number", defaultValue: 0 },
    { name: "deliveryFee", type: "number", defaultValue: 0 },
    {
      name: "fulfillmentStatus",
      type: "select",
      defaultValue: "preparing",
      label: "Fulfillment Status",
      options: [
        { label: "Preparing", value: "preparing" },
        { label: "Shipped", value: "shipped" },
        { label: "Delivered", value: "delivered" },
        { label: "Cancelled", value: "cancelled" },
      ],
    },
    {
      name: "paymentStatus",
      type: "select",
      defaultValue: "unpaid",
      label: "Payment Status",
      admin: {
        description: "Revenue in Reports only counts once this is Paid.",
      },
      options: [
        { label: "Unpaid", value: "unpaid" },
        { label: "Partial", value: "partial" },
        { label: "Paid", value: "paid" },
      ],
    },
    {
      name: "amountPaid",
      type: "number",
      label: "Amount Paid",
      admin: {
        description:
          "Record the partial payment amount received from the client.",
        condition: (data) => data.paymentStatus === "partial",
      },
    },
    {
      name: "paymentMethod",
      type: "select",
      label: "Mode of Payment",
      options: [
        { label: "Cash", value: "cash" },
        { label: "Cheque", value: "cheque" },
        { label: "Bank Transfer", value: "bank_transfer" },
      ],
    },
    {
      name: "targetDeliveryDate",
      type: "date",
      label: "Target Delivery Date",
      admin: {
        description: "The promised date of delivery set by sales.",
      },
    },
    {
      name: "clientPaymentReceipts",
      type: "array",
      label: "Client's Payment Receipts",
      admin: {
        position: "sidebar",
        description:
          "Proof of payment received FROM the client. At least one is required before Step 5 unlocks. No approval needed -- uploading is sufficient.",
      },
      fields: receiptItemFields,
    },
    {
      name: "supplierPaymentReceipts",
      type: "array",
      label: "Supplier's Payment Receipts",
      admin: {
        position: "sidebar",
        description:
          "Proof of payment sent TO the supplier(s) for this order's POs. At least one is required before Step 5 unlocks. No approval needed -- uploading is sufficient.",
      },
      fields: receiptItemFields,
    },
  ],
};