import type { CollectionConfig } from 'payload'

export const ClientQuotations: CollectionConfig = {
  slug: 'client-quotations',
  labels: { singular: 'Client Quotation', plural: 'Client Quotations' },
  admin: {
    useAsTitle: 'quotationNumber',
    defaultColumns: ['quotationNumber', 'customerName', 'company', 'quotationDate', 'status'],
    group: 'Operations',
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
        if (operation === 'create' && !data.quotationNumber) {
          const year = new Date().getFullYear()
          const existing = await req.payload.find({
            collection: 'client-quotations',
            where: { quotationNumber: { like: `${year}-` } },
            sort: '-quotationNumber',
            limit: 1,
          })
          let next = 1
          if (existing.docs.length > 0) {
            const last = existing.docs[0].quotationNumber as string
            next = parseInt(last.split('-').pop() || '0', 10) + 1
          }
          data.quotationNumber = `${year}-${String(next).padStart(5, '0')}`
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'quotationNumber',
      type: 'text',
      unique: true,
      admin: { description: 'Auto-generated on create (YYYY-##### matching your existing numbering). Editable to override.' },
    },
    { name: 'quotationDate', type: 'date', required: true, defaultValue: () => new Date().toISOString() },
    { name: 'customerName', type: 'text', label: 'Customer Name' },
    { name: 'company', type: 'text', label: 'Company' },
    { name: 'address', type: 'text' },
    { name: 'contactNumber', type: 'text' },
    {
      name: 'salesPerson',
      type: 'text',
      admin: { description: 'Manual entry for now -- once roles/accounts exist, this can become a relationship to a Users collection.' },
    },
    {
      name: 'items',
      type: 'array',
      label: 'Line Items',
      fields: [
        { name: 'qty', type: 'number', required: true, defaultValue: 1 },
        { name: 'unit', type: 'text', defaultValue: 'pcs' },
        { name: 'description', type: 'textarea', required: true },
        { name: 'unitPrice', type: 'number', required: true, defaultValue: 0 },
      ],
    },
    { name: 'vatRate', type: 'number', defaultValue: 12, label: 'VAT Rate (%)' },
    {
      name: 'sourceRequestId',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Internal: links back to the originating quotation-request, if generated from one. Prevents duplicate quotations for the same request.',
      },
    },
    { name: 'discountAmount', type: 'number', defaultValue: 0, label: 'Discount (₱)' },
    { name: 'deliveryFee', type: 'number', defaultValue: 0, label: 'Delivery Fee (₱)' },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Sent', value: 'sent' },
        { label: 'Accepted', value: 'accepted' },
        { label: 'Expired', value: 'expired' },
      ],
      defaultValue: 'draft',
    },
  ],
}
