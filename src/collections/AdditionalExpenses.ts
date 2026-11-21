import type { CollectionConfig } from 'payload'

// Company expenses that don't belong to any one order (rent, salaries,
// utilities, ...). Recorded per month; the Reports page deducts the month's
// total from net profit and the Excel export gets its own sheet. Admin only
// -- these are company finances.
const adminOnly = ({ req: { user } }: { req: { user?: any } }) => user?.role === 'admin'

export const AdditionalExpenses: CollectionConfig = {
  slug: 'additional-expenses',
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'amount', 'month', 'year'],
    group: 'Operations',
    description: 'Company expenses not tied to an order. Deducted from net profit in Reports.',
    hidden: ({ user }) => user?.role !== 'admin',
  },
  access: {
    read: adminOnly,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  hooks: {
    beforeChange: [
      ({ data, operation, req }) => {
        if (operation === 'create' && !data.createdByName) {
          data.createdByName = req.user?.name || req.user?.email || ''
        }
        return data
      },
    ],
  },
  fields: [
    { name: 'label', type: 'text', required: true },
    { name: 'amount', type: 'number', required: true, min: 0 },
    {
      name: 'month',
      type: 'number',
      required: true,
      min: 1,
      max: 12,
      admin: { description: 'Month the expense belongs to (1 = January ... 12 = December).' },
    },
    { name: 'year', type: 'number', required: true, min: 2000, max: 2100 },
    { name: 'notes', type: 'textarea' },
    { name: 'createdByName', type: 'text', admin: { readOnly: true } },
  ],
  timestamps: true,
}
