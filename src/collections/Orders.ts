import type { CollectionConfig } from 'payload'

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'orderNumber',
    defaultColumns: ['orderNumber', 'customerName', 'fulfillmentStatus', 'paymentStatus'],
    group: 'Content',
    description: 'Confirmed orders, converted from Client Quotations. Tracks physical fulfillment and payment separately from the sales/quotation stage.',
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation === 'create' && !data.orderNumber) {
          const year = new Date().getFullYear()
          const { totalDocs } = await req.payload.find({
            collection: 'orders',
            where: { orderNumber: { like: `${year}-` } },
            limit: 0,
          })
          data.orderNumber = `${year}-${String(totalDocs + 1).padStart(5, '0')}`
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, operation, req }) => {
        if (
          operation === 'update' &&
          doc.paymentStatus === 'paid' &&
          previousDoc?.paymentStatus !== 'paid' &&
          doc.sourceQuotationId
        ) {
          try {
            const quotation: any = await req.payload.findByID({
              collection: 'client-quotations',
              id: doc.sourceQuotationId,
            })
            if (quotation?.sourceRequestId) {
              await req.payload.update({
                collection: 'quotation-requests',
                id: quotation.sourceRequestId,
                data: { status: 'completed' },
              })
            }
          } catch {
            // non-critical
          }
        }
        return doc
      },
    ],
  },
  fields: [
    { name: 'orderNumber', type: 'text', unique: true, admin: { readOnly: true } },
    {
      name: 'sourceQuotationId',
      type: 'text',
      admin: { readOnly: true, description: 'Links back to the originating Client Quotation. Prevents duplicate conversions.' },
    },
    { name: 'orderDate', type: 'date', defaultValue: () => new Date().toISOString() },
    { name: 'customerName', type: 'text' },
    { name: 'company', type: 'text' },
    { name: 'address', type: 'text' },
    { name: 'contactNumber', type: 'text' },
    { name: 'salesPerson', type: 'text' },
    {
      name: 'items',
      type: 'array',
      fields: [
        { name: 'description', type: 'text' },
        { name: 'qty', type: 'number' },
        { name: 'unit', type: 'text' },
        { name: 'unitPrice', type: 'number' },
        {
          name: 'unitCost',
          type: 'number',
          defaultValue: 0,
          admin: { description: 'Supplier cost per unit, carried over from the source quotation. Used to compute Profit.' },
        },
        {
          name: 'assignedPOId',
          type: 'text',
          admin: { readOnly: true, description: 'Which Supplier PO this specific item was assigned to, if any.' },
        },
      ],
    },
    // 👇 NEW: OPEX Array
    {
      name: 'opex',
      type: 'array',
      label: 'Operating Expenses (OPEX)',
      admin: { description: 'Track incidental costs (delivery, meals, toll). Only "Liquidated" expenses reduce True Net Profit.' },
      fields: [
        { name: 'description', type: 'text', required: true },
        { name: 'amount', type: 'number', required: true, min: 0 },
        { name: 'expenseDate', type: 'date', required: true, defaultValue: () => new Date().toISOString() },
        { name: 'receiptUrl', type: 'text', label: 'Receipt/Proof URL' },
        {
          name: 'status',
          type: 'select',
          defaultValue: 'pending',
          options: [
            { label: 'Pending Approval', value: 'pending' },
            { label: 'Liquidated', value: 'liquidated' },
            { label: 'Rejected', value: 'rejected' },
          ],
        },
      ],
    },
    { name: 'vatRate', type: 'number', defaultValue: 12 },
    { name: 'discountAmount', type: 'number', defaultValue: 0 },
    { name: 'deliveryFee', type: 'number', defaultValue: 0 },
    {
      name: 'fulfillmentStatus',
      type: 'select',
      defaultValue: 'preparing',
      label: 'Fulfillment Status',
      options: [
        { label: 'Preparing', value: 'preparing' },
        { label: 'Shipped', value: 'shipped' },
        { label: 'Delivered', value: 'delivered' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
    },
    {
      name: 'paymentStatus',
      type: 'select',
      defaultValue: 'unpaid',
      label: 'Payment Status',
      admin: { description: 'Revenue in Reports only counts once this is Paid.' },
      options: [
        { label: 'Unpaid', value: 'unpaid' },
        { label: 'Partial', value: 'partial' },
        { label: 'Paid', value: 'paid' },
      ],
    },
  ],
}