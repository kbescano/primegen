import type { CollectionConfig } from "payload";

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
    hidden: ({ user }) => user?.role === 'marketing',
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
      async ({ doc, previousDoc, operation, req }) => {
        if (
          operation === "update" &&
          doc.paymentStatus === "paid" &&
          previousDoc?.paymentStatus !== "paid" &&
          doc.sourceQuotationId
        ) {
          try {
            const quotation: any = await req.payload.findByID({
              collection: "client-quotations",
              id: doc.sourceQuotationId,
            });
            if (quotation?.sourceRequestId) {
              await req.payload.update({
                collection: "quotation-requests",
                id: quotation.sourceRequestId,
                data: { status: "completed" },
              });
            }
          } catch {
            // non-critical
          }
        }
        return doc;
      },
      // Notify staff when admin approves (liquidates) their OPEX
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
                  // notifications.recipient is a relationship field -- it
                  // needs the user's ID directly, not their email. Writing
                  // an email string here silently breaks the notification,
                  // same bug already fixed once in QuotationRequests.ts.
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
      // Notify admins when NEW OPEX is submitted needing their approval --
      // replaces the "pending OPEX" signal the old synthetic admin feed
      // used to surface, now as a real persisted notification.
      async ({ doc, previousDoc, operation, req }) => {
        if (operation === "update" && Array.isArray(doc.opex)) {
          const newlyPending = doc.opex.filter((currExp: any) => {
            if (currExp.status !== "pending") return false;
            const prevExp = (previousDoc?.opex || []).find(
              (p: any) => String(p.id) === String(currExp.id),
            );
            // Either brand new (no prevExp at all) or just reverted back to pending
            return !prevExp || prevExp.status !== "pending";
          });

          if (newlyPending.length > 0) {
            try {
              const admins = await req.payload.find({
                collection: "users",
                where: { role: { equals: "admin" } },
                limit: 100,
              });

              for (const exp of newlyPending) {
                await Promise.all(
                  admins.docs.map((admin: any) =>
                    req.payload.create({
                      collection: "notifications" as any,
                      data: {
                        recipient: admin.id,
                        message: `New OPEX pending approval: ₱${exp.amount} for ${exp.description} (Order ${doc.orderNumber || ""})`,
                        link: `/admin-dashboard/orders?id=${doc.id}`,
                        read: false,
                      },
                    }),
                  ),
                );
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
  ],
};
