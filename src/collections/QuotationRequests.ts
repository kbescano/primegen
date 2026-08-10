import type { CollectionConfig } from 'payload'

export const QuotationRequests: CollectionConfig = {
  slug: 'quotation-requests',
  admin: {
    useAsTitle: 'customerName',
    defaultColumns: ['customerName', 'assignedTo', 'projectType', 'status', 'createdAt'],
    group: 'Leads',
    description:
      'Customer quotation requests. Review here and follow up manually -- nothing is sent automatically.',
  },
  access: {
    create: () => true,
    // Admins see everything. Staff (role: 'user') only see requests
    // assigned to them.
    read: ({ req }) => {
      if (!req.user) return false
      if (req.user.role === 'admin') return true
      return { assignedTo: { equals: req.user.id } }
    },
    update: ({ req }) => {
      if (!req.user) return false
      if (req.user.role === 'admin') return true
      // Staff can update (e.g. change status) only on their own assigned
      // requests -- they cannot reassign or touch anyone else's.
      return { assignedTo: { equals: req.user.id } }
    },
    delete: ({ req }) => Boolean(req.user && req.user.role === 'admin'),
  },
  hooks: {
    afterChange: [
      // Fire a notification when a request is newly assigned or
      // reassigned to a staff member.
      async ({ doc, previousDoc, operation, req }) => {
        if (
          operation === 'update' &&
          doc.assignedTo &&
          String(doc.assignedTo) !== String(previousDoc?.assignedTo || '')
        ) {
          try {
            await req.payload.create({
              // Notifications may be provided by an optional plugin and are
              // not included in the generated Payload collection union.
              collection: 'notifications' as any,
              data: {
                recipient: doc.assignedTo,
                message: `You've been assigned a new RFQ from ${doc.customerName || 'a customer'}`,
                link: `/admin-dashboard/pipeline/${doc.id}`,
                read: false,
              },
            })
          } catch {
            // non-critical
          }
        }
        return doc
      },
    ],
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
      name: 'assignedTo',
      type: 'relationship',
      relationTo: 'users',
      label: 'Assigned Staff',
      filterOptions: {
        role: { equals: 'user' },
      },
      admin: {
        description: 'Which sales staff member owns following up on this request. Only admins can change this.',
      },
      access: {
        update: ({ req }) => Boolean(req.user && req.user.role === 'admin')
      },
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
        { label: 'Rejected', value: 'rejected' },
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