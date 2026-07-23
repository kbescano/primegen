import type { CollectionConfig } from 'payload'

// Captures quotation requests submitted from the public site.
// IMPORTANT: This collection only stores and displays requests for the admin
// to review. Nothing here auto-sends a quotation to the customer -- the admin
// follows up manually through whatever channel they choose (call, email, etc.)
// and then marks the request as "Quote Sent" once they've sent it externally.
export const QuotationRequests: CollectionConfig = {
  slug: 'quotation-requests',
  admin: {
    useAsTitle: 'customerName',
    defaultColumns: ['customerName', 'projectType', 'status', 'createdAt'],
    group: 'Leads',
    description:
      'Customer quotation requests. Review here and follow up manually -- nothing is sent automatically.',
  },
  access: {
    create: () => true,
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'customerName',
      type: 'text',
      required: true,
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
      name: 'projectType',
      type: 'select',
      options: [
        { label: 'Residential', value: 'residential' },
        { label: 'Commercial', value: 'commercial' },
        { label: 'Renovation', value: 'renovation' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'items',
      type: 'array',
      label: 'Products requested',
      admin: {
        description: 'Products and quantities the customer requested',
      },
      fields: [
        {
          name: 'material',
          type: 'relationship',
          relationTo: 'products',
          required: true,
        },
        {
          name: 'quantity',
          type: 'number',
          required: true,
          min: 1,
          defaultValue: 1,
        },
      ],
    },
    {
      name: 'message',
      type: 'textarea',
      label: 'Project details / message from customer',
    },
    {
      name: 'source',
      type: 'select',
      defaultValue: 'website',
      options: [
        { label: 'Website form', value: 'website' },
        { label: 'Facebook ad', value: 'facebook-ad' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Processing', value: 'processing' },
        { label: 'Quote Sent', value: 'quote-sent' },
        { label: 'Completed', value: 'completed' },
      ],
      admin: {
        description: 'Admin updates this manually to track follow-up progress.',
      },
    },
    {
      name: 'internalNotes',
      type: 'textarea',
      label: 'Internal notes (not visible to customer)',
    },
  ],
  timestamps: true,
}
