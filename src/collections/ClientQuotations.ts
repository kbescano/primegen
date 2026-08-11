import type { CollectionConfig } from "payload";

export const ClientQuotations: CollectionConfig = {
  slug: "client-quotations",
  labels: { singular: "Client Quotation", plural: "Client Quotations" },
  admin: {
    useAsTitle: "quotationNumber",
    defaultColumns: [
      "quotationNumber",
      "customerName",
      "company",
      "quotationDate",
      "status",
    ],
    group: "Operations",
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation === "create" && !data.quotationNumber) {
          const year = new Date().getFullYear();
          const existing = await req.payload.find({
            collection: "client-quotations",
            where: { quotationNumber: { like: `${year}-` } },
            sort: "-quotationNumber",
            limit: 1,
          });
          let next = 1;
          if (existing.docs.length > 0) {
            const last = existing.docs[0].quotationNumber as string;
            next = parseInt(last.split("-").pop() || "0", 10) + 1;
          }
          data.quotationNumber = `${year}-${String(next).padStart(5, "0")}`;
        }
        return data;
      },
    ],
    afterChange: [
      // Trigger when status changes TO 'quotation_approved': notify whichever
      // staff member is assigned to the originating quotation-request. Links to
      // this ClientQuotationPage (not the pipeline) so a click lands directly on
      // the quotation itself.
      async ({ doc, previousDoc, operation, req }) => {
        if (
          operation === "update" &&
          doc.status === "quotation_approved" &&
          previousDoc?.status !== "quotation_approved" &&
          doc.sourceRequestId
        ) {
          try {
            const request = await req.payload.findByID({
              collection: "quotation-requests",
              id: doc.sourceRequestId,
            });
            if (request?.assignedTo) {
              const recipientId =
                typeof request.assignedTo === "object"
                  ? request.assignedTo.id
                  : request.assignedTo;
              await req.payload.create({
                collection: "notifications" as any,
                data: {
                  recipient: recipientId,
                  message: `Quotation ${doc.quotationNumber || ""} was approved`,
                  link: `/admin-dashboard/client-quotation?id=${doc.id}`,
                  read: false,
                },
              });
            }
          } catch (err) {
            console.error("Failed to notify on quotation approval:", err);
          }
        }
        return doc;
      },
      async ({ doc, previousDoc, operation, req }) => {
        if (
          operation === "update" &&
          doc.status === "order_confirmed" &&
          previousDoc.status !== "order_confirmed"
        ) {
          const existing = await req.payload.find({
            collection: "orders",
            where: { sourceQuotationId: { equals: String(doc.id) } },
            limit: 1,
          });

          if (existing.docs.length === 0) {
            const year = new Date().getFullYear();
            const existingOrders = await req.payload.find({
              collection: "orders",
              where: { orderNumber: { like: `${year}-` } },
              sort: "-orderNumber",
              limit: 1,
            });

            let next = 1;
            if (existingOrders.docs.length > 0) {
              const last = existingOrders.docs[0].orderNumber as string;
              next = parseInt(last.split("-").pop() || "0", 10) + 1;
            }

            const orderNumber = `${year}-${String(next).padStart(5, "0")}`;

            const mappedItems = Array.isArray(doc.items)
              ? doc.items.map((i: any) => ({
                  description: i.description || "",
                  sizeDescription: i.sizeDescription || "",
                  qty: i.qty || 1,
                  unit: i.unit || "pcs",
                  unitPrice: i.unitPrice || 0,
                  unitCost: i.unitCost || 0,
                }))
              : [];

            await req.payload.create({
              collection: "orders",
              data: {
                orderNumber,
                sourceQuotationId: String(doc.id),
                customerName: doc.customerName || "",
                company: doc.company || "",
                address: doc.address || "",
                contactNumber: doc.contactNumber || "",
                salesPerson: doc.salesPerson || "",
                vatRate: doc.vatRate || 12,
                discountAmount: doc.discountAmount || 0,
                deliveryFee: doc.deliveryFee || 0,
                items: mappedItems,
                fulfillmentStatus: "preparing",
                paymentStatus: "unpaid",
              },
            });
          }
        }
        return doc;
      },
      async ({ doc, previousDoc, operation, req }) => {
        if (
          operation === "update" &&
          previousDoc &&
          doc.status !== previousDoc.status
        ) {
          try {
            const admins = await req.payload.find({
              collection: "users",
              where: { role: { equals: "admin" } },
              limit: 100,
            });
            const changedBy = req.user?.name || req.user?.email || "Someone";
            await Promise.all(
              admins.docs.map((admin: any) =>
                req.payload.create({
                  collection: "notifications" as any,
                  data: {
                    recipient: admin.id,
                    message: `${changedBy} changed quotation ${doc.quotationNumber || ""} from "${previousDoc.status}" to "${doc.status}"`,
                    link: `/admin-dashboard/client-quotation?id=${doc.id}`,
                    read: false,
                  },
                }),
              ),
            );
          } catch (err) {
            console.error(
              "Failed to notify admins of quotation status change:",
              err,
            );
          }
        }
        return doc;
      },
    ],
  },
  fields: [
    {
      name: "quotationNumber",
      type: "text",
      unique: true,
      admin: {
        description:
          "Auto-generated on create (YYYY-##### matching your existing numbering). Editable to override.",
      },
    },
    {
      name: "quotationDate",
      type: "date",
      required: true,
      defaultValue: () => new Date().toISOString(),
    },
    { name: "customerName", type: "text", label: "Customer Name" },
    { name: "company", type: "text", label: "Company" },
    { name: "address", type: "text" },
    { name: "contactNumber", type: "text" },
    {
      name: "salesPerson",
      type: "text",
      admin: {
        description:
          "Manual entry for now -- once roles/accounts exist, this can become a relationship to a Users collection.",
      },
    },
    {
      name: "items",
      type: "array",
      label: "Line Items",
      fields: [
        { name: "qty", type: "number", required: true, defaultValue: 1 },
        { name: "unit", type: "text", defaultValue: "pcs" },
        { name: "description", type: "textarea", required: true },
        {
          name: "sizeDescription",
          type: "text",
          label: "Size / Specs (Optional)",
        },
        {
          name: "unitCost",
          type: "number",
          defaultValue: 0,
          admin: {
            description:
              "Supplier wholesale cost per unit. Internal only -- never printed on the client quotation.",
          },
        },
        {
          name: "marginAmount",
          type: "number",
          defaultValue: 0,
          admin: {
            description:
              "Flat markup amount (₱) added to cost. Internal only -- never printed on the client quotation.",
          },
        },
        { name: "unitPrice", type: "number", required: true, defaultValue: 0 },
      ],
    },
    {
      name: "vatRate",
      type: "number",
      defaultValue: 12,
      label: "VAT Rate (%)",
    },
    {
      name: "sourceRequestId",
      type: "text",
      admin: {
        readOnly: true,
        description:
          "Internal: links back to the originating quotation-request, if generated from one. Prevents duplicate quotations for the same request.",
      },
    },
    {
      name: "discountAmount",
      type: "number",
      defaultValue: 0,
      label: "Discount (₱)",
    },
    {
      name: "deliveryFee",
      type: "number",
      defaultValue: 0,
      label: "Delivery Fee (₱)",
    },
    {
      name: "status",
      type: "select",
      admin: {
        description:
          'Sales/negotiation stage only. Once "Order Confirmed", use the Convert to Order button to hand off to fulfillment tracking.',
      },
      options: [
        { label: "Draft", value: "draft" },
        { label: "Pending Approval", value: "pending_approval" },
        { label: "Quotation Approved", value: "quotation_approved" },
        { label: "Order Confirmed", value: "order_confirmed" },
        { label: "Cancelled", value: "cancelled" },
      ],
      defaultValue: "draft",
    },
  ],
};
