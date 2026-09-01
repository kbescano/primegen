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
    hidden: ({ user }) => user?.role === 'marketing',
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
      // "Send approval quotation" -- fires whether the quotation was
      // already a saved draft flipping to pending_approval (update), OR
      // sent for approval on its very first save with no draft step in
      // between (create -- clicking "Send for Approval" always saves
      // regardless of whether a draft existed first). Admin gets a link to
      // the Pending Approval list view (shows everything awaiting action,
      // not just this one); Marketing gets the same event, no link.
      async ({ doc, previousDoc, operation, req }) => {
        const isNewlyPendingApproval =
          (operation === "create" && doc.status === "pending_approval") ||
          (operation === "update" &&
            doc.status === "pending_approval" &&
            previousDoc?.status !== "pending_approval");

        if (isNewlyPendingApproval) {
          try {
            await req.payload.create({
              collection: "notifications" as any,
              data: {
                message: `Quotation ${doc.quotationNumber || ""} for ${doc.customerName || "a customer"} is ready for approval.`,
                link: `/admin-dashboard/client-quotation?id=${doc.id}`,
                audienceRoles: ["admin"],
                read: false,
              },
            });
            await req.payload.create({
              collection: "notifications" as any,
              data: {
                message: `Quotation ${doc.quotationNumber || ""} for ${doc.customerName || "a customer"} was sent for approval.`,
                audienceRoles: ["marketing"],
                read: false,
              },
            });
          } catch (err) {
            console.error("Failed to notify of quotation sent for approval:", err);
          }
        }
        return doc;
      },
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
      // The hook above only ever COPIES items into the order once, at the
      // moment status first becomes "order_confirmed" -- after that, the
      // order's items are a frozen snapshot. Editing the quotation later
      // (qty, cost, margin, adding/removing a line, VAT/discount/delivery
      // fee) silently stopped showing up in the order and the pipeline's
      // Step 3+ views, even though the quotation itself stayed editable.
      // Keep them in sync on every subsequent edit instead.
      async ({ doc, previousDoc, operation, req }) => {
        if (operation !== "update" || !previousDoc) return doc;
        // The hook above already seeds the order from `doc.items` at the
        // exact moment of this same request when it's the create-order
        // transition -- re-running the sync here would just be a
        // redundant, no-op write against what it just wrote.
        if (doc.status === "order_confirmed" && previousDoc.status !== "order_confirmed") {
          return doc;
        }
        const itemsChanged = JSON.stringify(doc.items || []) !== JSON.stringify(previousDoc.items || []);
        const pricingChanged =
          doc.vatRate !== previousDoc.vatRate ||
          doc.discountAmount !== previousDoc.discountAmount ||
          doc.deliveryFee !== previousDoc.deliveryFee;
        if (!itemsChanged && !pricingChanged) return doc;

        try {
          const existingOrders = await req.payload.find({
            collection: "orders",
            where: { sourceQuotationId: { equals: String(doc.id) } },
            limit: 1,
          });
          const order: any = existingOrders.docs[0];
          if (!order) return doc;

          const priorItems: any[] = Array.isArray(order.items) ? order.items : [];
          // No stable id links a quotation line item to its order copy (the
          // create-order hook above never carries `id` across), so match by
          // description + size -- good enough to survive a qty/cost/margin
          // edit on the same line, which is the overwhelmingly common case.
          const matchKey = (i: any) =>
            `${String(i.description || "").trim().toLowerCase()}|${String(i.sizeDescription || "").trim().toLowerCase()}`;
          const priorByKey = new Map(priorItems.map((i) => [matchKey(i), i]));

          const newItems = (Array.isArray(doc.items) ? doc.items : []).map((i: any) => {
            const prior = priorByKey.get(matchKey(i));
            return {
              description: i.description || "",
              sizeDescription: i.sizeDescription || "",
              qty: i.qty || 1,
              unit: i.unit || "pcs",
              unitPrice: i.unitPrice || 0,
              unitCost: i.unitCost || 0,
              // Carry over this line's existing supplier-PO assignment, if
              // any -- never silently sever an already-issued PO just
              // because the quotation was re-saved.
              ...(prior?.assignedPOId ? { assignedPOId: prior.assignedPOId } : {}),
            };
          });

          // The order mirrors the quotation exactly, including removals --
          // a line dropped from the quotation disappears from the order
          // even if it was already tied to an issued PO. That PO keeps its
          // own copy of the line (it's a separate array on a separate
          // collection, untouched here), so nothing is destroyed -- it's
          // just now a PO line with no matching order item, for a human to
          // reconcile. Silently keeping a removed line in the order was
          // the previous behavior; it's exactly what stayed stale in the
          // pipeline.
          await req.payload.update({
            collection: "orders",
            id: order.id,
            data: {
              items: newItems,
              vatRate: doc.vatRate ?? order.vatRate,
              discountAmount: doc.discountAmount ?? order.discountAmount,
              deliveryFee: doc.deliveryFee ?? order.deliveryFee,
            },
          });
        } catch (err) {
          console.error("Failed to sync client-quotation edit to its order:", err);
        }
        return doc;
      },
      async ({ doc, previousDoc, operation, req }) => {
        // Skip statuses that already have their own dedicated notification
        // above (pending_approval, quotation_approved) or trigger the
        // Order-created notification (order_confirmed, handled in
        // Orders.ts) -- otherwise this generic hook fires a redundant
        // "Someone changed status from X to Y" broadcast right alongside
        // the specific one, doubling up the bell for the same event.
        const DEDICATED_STATUSES = ["pending_approval", "quotation_approved", "order_confirmed"];
        if (
          operation === "update" &&
          previousDoc &&
          doc.status !== previousDoc.status &&
          !DEDICATED_STATUSES.includes(doc.status)
        ) {
          try {
            const changedBy = req.user?.name || req.user?.email || "Someone";
            await req.payload.create({
              collection: "notifications" as any,
              data: {
                message: `${changedBy} changed quotation ${doc.quotationNumber || ""} from "${previousDoc.status}" to "${doc.status}"`,
                link: `/admin-dashboard/client-quotation?id=${doc.id}`,
                read: false,
              },
            });
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