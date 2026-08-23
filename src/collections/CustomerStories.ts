import type { CollectionConfig } from 'payload'

export const CustomerStories: CollectionConfig = {
  slug: 'customer-stories',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['logo', 'title', 'category', 'order'],
    group: 'Content',
  },
  access: {
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
  },
  fields: [
    { name: 'logo', type: 'text', required: true, admin: { description: 'Short company name shown on the tab, e.g. "AYALA LAND"' } },
    { name: 'category', type: 'text', required: true, admin: { description: 'e.g. "Commercial Real Estate"' } },
    { name: 'title', type: 'text', required: true },
    { name: 'description', type: 'textarea', required: true },
    { name: 'image', type: 'upload', relationTo: 'media', required: true },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: { description: 'Lower numbers appear first (left-most tab).' },
    },
    { name: 'visible', type: 'checkbox', defaultValue: true, admin: { description: 'Uncheck to hide without deleting.' } },
  ],
}