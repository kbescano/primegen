import type { CollectionConfig } from "payload";

// Lightweight admin -> staff task/notice, shown as a panel at the top of
// the Quotation Inbox (not attached to any one request card -- Admin
// pastes in a pipeline link, or any other link, if it's relevant to a
// specific request). Admin opens one; the recipient reads it, can comment,
// and marks it Solved; Admin closes it once satisfied, which is what drops
// it off the panel for good.
export const ActionItems: CollectionConfig = {
  slug: "action-items",
  labels: { singular: "Action Item", plural: "Action Items" },
  admin: {
    useAsTitle: "message",
    defaultColumns: ["message", "recipient", "status", "createdAt"],
    group: "Leads",
  },
  access: {
    create: ({ req }) => req.user?.role === "admin",
    read: ({ req }) => {
      if (!req.user) return false;
      if (req.user.role === "admin") return true;
      return { recipient: { equals: req.user.id } };
    },
    // All writes (comment / solve / close) go through
    // /api/action-items/[id]/action, which enforces who can make each
    // transition and calls the Local API with overrideAccess: true. Nobody
    // gets to shortcut that via the generic REST update endpoint.
    update: () => false,
    delete: ({ req }) => Boolean(req.user && req.user.role === "admin"),
  },
  hooks: {
    beforeChange: [
      ({ data, operation, req }) => {
        if (operation === "create") {
          data.createdByName = req.user?.name || req.user?.email || "Admin";
        }
        return data;
      },
    ],
  },
  fields: [
    { name: "message", type: "textarea", required: true, label: "Message" },
    {
      // Kept as "text" (not "textarea") so this doesn't trigger another
      // drizzle column-type migration -- the custom panel UI already
      // renders/collects this as a multi-line field regardless of the
      // Payload field type; this only changes what the auto-generated
      // Payload admin view looks like, which isn't how this gets edited.
      name: "link",
      type: "text",
      label: "Links (optional)",
      admin: {
        description: "One or more pipeline links (or any other relevant URLs), one per line, instead of attaching this to a specific request.",
      },
    },
    {
      name: "recipient",
      type: "relationship",
      relationTo: "users",
      required: true,
      label: "For (Staff)",
      // Same carve-out as QuotationRequests.assignedTo -- filterOptions is
      // re-checked server-side on every save, not just for the UI picker.
      filterOptions: {
        or: [
          { role: { equals: "user" } },
          { email: { equals: "nica@primegen.admin" } },
        ],
      },
      index: true,
    },
    {
      name: "status",
      type: "select",
      defaultValue: "pending",
      index: true,
      options: [
        { label: "Action Needed", value: "pending" },
        { label: "Solved", value: "solved" },
        { label: "Closed", value: "closed" },
      ],
    },
    {
      name: "comments",
      type: "array",
      label: "Comments",
      fields: [
        { name: "message", type: "textarea", required: true },
        { name: "authorName", type: "text" },
        {
          name: "authorRole",
          type: "select",
          options: [
            { label: "Admin", value: "admin" },
            { label: "Staff", value: "user" },
          ],
        },
        { name: "createdAt", type: "date", defaultValue: () => new Date().toISOString() },
      ],
    },
    { name: "createdByName", type: "text", admin: { readOnly: true } },
  ],
  timestamps: true,
};
