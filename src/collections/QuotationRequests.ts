import type { CollectionConfig } from "payload";

export const QuotationRequests: CollectionConfig = {
  slug: "quotation-requests",
  admin: {
    useAsTitle: "customerName",
    defaultColumns: [
      "customerName",
      "assignedTo",
      "projectType",
      "status",
      "createdAt",
    ],
    group: "Leads",
    description:
      "Customer quotation requests. Review here and follow up manually -- nothing is sent automatically.",
  },
  access: {
    create: () => true,
    read: ({ req }) => {
      if (!req.user) return false;
      if (req.user.role === "admin" || req.user.role === "marketing") return true;
      return { assignedTo: { equals: req.user.id } };
    },
    update: ({ req }) => {
      if (!req.user) return false;
      if (req.user.role === "admin" || req.user.role === "marketing") return true;
      return { assignedTo: { equals: req.user.id } };
    },
    delete: ({ req }) => Boolean(req.user && req.user.role === "admin"),
  },
  hooks: {
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation !== "create") return doc;
        try {
          // Broadcast: create ONE notification, not one per admin. Any
          // admin can already read every notification regardless of
          // `recipient` (see Notifications.ts access rules), so looping
          // over admins.docs here used to create a duplicate document per
          // admin account -- which showed up as literal duplicate rows in
          // the bell for anyone who could see more than one admin's copy.
          await req.payload.create({
            collection: "notifications" as any,
            data: {
              message: `New RFQ from ${doc.customerName || "a customer"}`,
              link: `/admin-dashboard/pipeline/${doc.id}`,
              read: false,
            },
          });
        } catch (err) {
          console.error("Failed to notify admins of new RFQ:", err);
        }
        return doc;
      },
      async ({ doc, previousDoc, operation, req }) => {
        if (operation === "update") {
          const currentStaffId =
            doc.assignedTo && typeof doc.assignedTo === "object"
              ? doc.assignedTo.id
              : doc.assignedTo;
          const prevStaffId =
            previousDoc?.assignedTo &&
            typeof previousDoc.assignedTo === "object"
              ? previousDoc.assignedTo.id
              : previousDoc?.assignedTo;

          if (
            currentStaffId &&
            String(currentStaffId) !== String(prevStaffId || "")
          ) {
            try {
              const recipientId = isNaN(Number(currentStaffId))
                ? currentStaffId
                : Number(currentStaffId);

              await req.payload.create({
                collection: "notifications" as any,
                data: {
                  recipient: recipientId,
                  message: `You've been assigned a new RFQ from ${doc.customerName || "a customer"}`,
                  link: `/admin-dashboard/pipeline/${doc.id}`,
                  read: false,
                },
              });
            } catch (err) {
              console.error("Failed to create assignment notification:", err);
            }
          }
        }
        return doc;
      },
      async ({ doc, previousDoc, operation, req }) => {
        // ✨ Skip the broadcast when this status change came from an
        // internal system cascade (e.g. Orders.ts auto-completing the RFQ
        // once payment + delivery are both confirmed) rather than a
        // person manually changing status. The delivery notification
        // already covers that event with a proper message -- this generic
        // hook would otherwise show a misleading "Someone changed..."
        // line for something no one actually clicked.
        if (req.context?.skipStatusBroadcast) return doc;

        if (
          operation === "update" &&
          previousDoc &&
          doc.status !== previousDoc.status
        ) {
          try {
            const changedBy = req.user?.name || req.user?.email || "Someone";
            await req.payload.create({
              collection: "notifications" as any,
              data: {
                message: `${changedBy} changed RFQ from ${doc.customerName || "a customer"} from "${previousDoc.status}" to "${doc.status}"`,
                link: `/admin-dashboard/pipeline/${doc.id}`,
                read: false,
              },
            });
          } catch (err) {
            console.error("Failed to notify admins of RFQ status change:", err);
          }
        }
        return doc;
      },
    ],
  },
  fields: [
    { name: "customerName", type: "text", required: true },
    { name: "phone", type: "text" },
    { name: "email", type: "email" },
    {
      name: "assignedTo",
      type: "relationship",
      relationTo: "users",
      label: "Assigned Staff",
      filterOptions: { role: { equals: "user" } },
      // Filtered on directly by the Staff dropdown in the admin dashboard,
      // and by every single non-admin's read access rule (`{ assignedTo:
      // { equals: user.id } }` runs on every list/read a staff account
      // does) -- indexed so both stay a lookup instead of a table scan as
      // the collection grows.
      index: true,
      admin: {
        description:
          "Which sales staff member owns following up on this request. Only admins can change this.",
      },
      access: {
        update: ({ req }) =>
          Boolean(
            req.user &&
            (req.user.role === "admin" || req.user.role === "marketing"),
          ),
      },
    },
    {
      name: "projectType",
      type: "select",
      options: [
        { label: "Residential", value: "residential" },
        { label: "Commercial", value: "commercial" },
        { label: "Renovation", value: "renovation" },
        { label: "Other", value: "other" },
      ],
    },
    {
      name: "items",
      type: "array",
      label: "Products requested",
      admin: { description: "Products and quantities the customer requested" },
      fields: [
        {
          name: "material",
          type: "relationship",
          relationTo: "products",
          required: true,
        },
        {
          name: "sizeDescription",
          type: "text",
          label: "Size / Specs (Optional)",
        },
        {
          name: "quantity",
          type: "number",
          required: true,
          min: 1,
          defaultValue: 1,
        },
      ],
    },
    {
      name: "message",
      type: "textarea",
      label: "Project details / message from customer",
    },
    {
      name: "source",
      type: "select",
      required: true,
      defaultValue: "website",
      options: [
        { label: "Website", value: "website" },
        { label: "Facebook", value: "facebook" },
        { label: "Google", value: "google" },
        { label: "Viber", value: "viber" },
        { label: "Dummy", value: "dummy" },
        { label: "Email", value: "email" },
        { label: "Market Place", value: "marketPlace" },
        { label: "Other", value: "other" }, 
      ],
    },
    {
      name: "facebookLink",
      type: "textarea",
      label: "Facebook Profile / Post Link",
      admin: {
        description:
          "Optional: link to the customer's Facebook profile or the post/message thread this inquiry came from.",
        condition: (data) => data?.source === "facebook",
      },
    },
    {
      name: "sourceOther",
      type: "text",
      label: "Specify Source",
      admin: {
        description: "What was the actual source, since it wasn't in the list?",
        condition: (data) => data?.source === "other",
      },
    },
    {
      name: "status",
      type: "select",
      defaultValue: "pending",
      // Filtered directly by the Status pills in the admin dashboard inbox.
      index: true,
      options: [
        { label: "Pending", value: "pending" },
        { label: "Processing", value: "processing" },
        { label: "Quote Sent", value: "quote-sent" },
        { label: "Informal Quote", value: "informal-quote" },
        { label: "Completed", value: "completed" },
        { label: "Rejected", value: "rejected" },
      ],
      admin: {
        description: "Admin updates this manually to track follow-up progress.",
      },
    },
    {
      name: "internalNotes",
      type: "textarea",
      label: "Internal notes (not visible to customer)",
    },
    {
      name: "statusUpdates",
      type: "array",
      label: "Update Notes",
      admin: {
        description:
          "Running log of manual status updates staff have posted for this request.",
      },
      fields: [
        { name: "note", type: "textarea", required: true },
        {
          name: "postedBy",
          type: "relationship",
          relationTo: "users",
          admin: { readOnly: true },
        },
        { name: "postedByName", type: "text", admin: { readOnly: true } }, // denormalized for display without a populate
      ],
      access: {
        // Staff can add updates only to their own assigned requests; admins/marketing can add to any
        update: ({ req }) => {
          if (!req.user) return false;
          if (req.user.role === "admin" || req.user.role === "marketing")
            return true;
          return true; // field-level access can't easily scope to "own assigned" -- enforced at the collection's update access instead
        },
      },
    },
  ],
  timestamps: true,
};