import type { CollectionConfig } from 'payload'

export const Notifications: CollectionConfig = {
  slug: 'notifications',
  admin: {
    useAsTitle: 'message',
    group: 'Leads',
    hidden: true, // internal-only, no admin UI section needed
  },
  access: {
    read: ({ req }) => {
      if (!req.user) return false
      if (req.user.role === 'admin' || req.user.role === 'marketing') return true
      return { recipient: { equals: req.user.id } }
    },
    create: ({ req }) => Boolean(req.user), // created by hooks/server logic
    update: ({ req }) => {
      if (!req.user) return false
      if (req.user.role === 'admin' || req.user.role === 'marketing') return true
      // Staff can only mark their own notifications read
      return { recipient: { equals: req.user.id } }
    },
    delete: ({ req }) => Boolean(req.user && req.user.role === 'admin'),
  },
  fields: [
    {
      name: 'recipient',
      type: 'relationship',
      relationTo: 'users',
      required: false,
      admin: {
        description:
          'Leave empty for admin-broadcast notifications (e.g. status changes, new RFQs). Any admin can already read every notification regardless of recipient, so broadcast events only need ONE document -- not one per admin. Set a specific user only for notifications meant for a single person (assignment, approval result, etc).',
      },
    },
    { name: 'message', type: 'text', required: true },
    { name: 'link', type: 'text' },
    { name: 'read', type: 'checkbox', defaultValue: false },
  ],
  timestamps: true,
}