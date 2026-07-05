import type { CollectionConfig } from 'payload'

// Supplier directory -- vendors and material sources you buy from, separate
// from QuotationRequests (which are customer-side leads).
export const Suppliers: CollectionConfig = {
  slug: 'suppliers',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'company', 'phone', 'status'],
    group: 'Directory',
    description: 'Supplier directory. Add and edit supplier records here.',
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: { description: 'Contact person or supplier name' },
    },
    {
      name: 'company',
      type: 'text',
    },
    {
      name: 'phone',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      type: 'email',
    },
    {
      name: 'address',
      type: 'textarea',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Internal notes',
    },
  ],
  timestamps: true,
}
