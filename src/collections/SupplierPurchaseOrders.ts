import type { CollectionConfig } from 'payload'

export const SupplierPurchaseOrders: CollectionConfig = {
  slug: 'supplier-purchase-orders',
  labels: { singular: 'Supplier PO', plural: 'Supplier POs' },
  admin: {
    useAsTitle: 'poNumber',
    defaultColumns: ['poNumber', 'supplierName', 'project', 'poDate', 'status'],
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
        if (operation === 'create' && !data.poNumber) {
          const year = new Date().getFullYear()
          const existing = await req.payload.find({
            collection: 'supplier-purchase-orders',
            where: { poNumber: { like: `SPO-${year}-` } },
            sort: '-poNumber',
            limit: 1,
          })
          let next = 1
          if (existing.docs.length > 0) {
            const last = existing.docs[0].poNumber as string
            next = parseInt(last.split('-').pop() || '0', 10) + 1
          }
          data.poNumber = `SPO-${year}-${String(next).padStart(4, '0')}`
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'poNumber',
      type: 'text',
      unique: true,
      admin: {
        description: 'Auto-generated on create (SPO-YYYY-####). Editable to override.',
      },
    },
    { name: 'poDate', type: 'date', required: true, defaultValue: () => new Date().toISOString() },
    { name: 'project', type: 'text', label: 'Project Name / Site' },
    { name: 'deliveryDate', type: 'text', label: 'Delivery / Service Date' },
    { name: 'supplierName', type: 'text' },
    { name: 'supplierAddress', type: 'textarea' },
    {
      name: 'items',
      type: 'array',
      label: 'Line Items',
      fields: [
        { name: 'description', type: 'text', required: true },
        { name: 'qty', type: 'number', required: true, defaultValue: 1 },
        { name: 'uom', type: 'text', defaultValue: 'pcs', label: 'UOM' },
        { name: 'unitPrice', type: 'number', required: true, defaultValue: 0 },
      ],
    },
    { name: 'vatRate', type: 'number', defaultValue: 12, label: 'VAT Rate (%)' },
    { name: 'paymentTerms', type: 'text', defaultValue: 'Net 30' },
    {
      name: 'terms',
      type: 'group',
      label: 'Terms & Conditions',
      fields: [
        { name: 'delivery', type: 'textarea', label: 'Delivery / Site Access Instructions' },
        { name: 'warranty', type: 'textarea', label: 'Warranty / Quality Standards' },
        { name: 'rejection', type: 'textarea', label: 'Rejection Clause' },
        { name: 'compliance', type: 'textarea', label: 'Compliance' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Issued', value: 'issued' },
        { label: 'Fulfilled', value: 'fulfilled' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      defaultValue: 'draft',
    },
  ],
}
