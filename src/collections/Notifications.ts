import type { CollectionConfig, Where } from 'payload'

export const Notifications: CollectionConfig = {
  slug: 'notifications',
  admin: {
    useAsTitle: 'message',
    group: 'Leads',
    hidden: true,
  },
  access: {
    read: ({ req }) => {
      if (!req.user) return false
      const role = req.user.role

      if (role === 'admin' || role === 'marketing') {
        const clause: Where = {
          or: [
            { recipient: { equals: req.user.id } },
            {
              and: [
                { recipient: { exists: false } },
                { audienceRoles: { exists: false } },
              ],
            },
            {
              and: [
                { recipient: { exists: false } },
                { audienceRoles: { contains: role } },
              ],
            },
          ],
        }
        return clause
      }

      const clause: Where = { recipient: { equals: req.user.id } }
      return clause
    },
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => {
      if (!req.user) return false
      const role = req.user.role

      if (role === 'admin' || role === 'marketing') {
        const clause: Where = {
          or: [
            { recipient: { equals: req.user.id } },
            {
              and: [
                { recipient: { exists: false } },
                { audienceRoles: { exists: false } },
              ],
            },
            {
              and: [
                { recipient: { exists: false } },
                { audienceRoles: { contains: role } },
              ],
            },
          ],
        }
        return clause
      }

      const clause: Where = { recipient: { equals: req.user.id } }
      return clause
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
          'Set only for notifications meant for one specific person (assignment, approval result, delivery status for the assigned rep, etc). Leave empty for role-broadcast notifications and use audienceRoles instead.',
      },
    },
    {
      name: 'audienceRoles',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Marketing', value: 'marketing' },
      ],
      admin: {
        description:
          'Only used for broadcast notifications (no specific recipient). Leave empty to broadcast to BOTH Admin and Marketing (legacy default). Set to restrict a broadcast to just one role.',
      },
    },
    { name: 'message', type: 'text', required: true },
    { name: 'link', type: 'text' },
    { name: 'read', type: 'checkbox', defaultValue: false },
  ],
  timestamps: true,
}