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
    afterChange: [
      // Trigger when status changes TO 'pending_approval': this is the
      // "Send for Internal Approval" transition. Mirrors the sourceRequestId
      // lookup pattern used below for order_confirmed, just targeting the
      // quotation-requests collection's status instead of creating an order.
      async ({ doc, previousDoc, operation, req }) => {
  if (
    operation === 'update' &&
    doc.status === 'pending_approval' &&
    previousDoc?.status !== 'pending_approval' &&
    doc.sourceRequestId
  ) {
    try {
      const targetId = isNaN(Number(doc.sourceRequestId))
        ? doc.sourceRequestId
        : Number(doc.sourceRequestId)

      await req.payload.update({
        collection: 'quotation-requests',
        id: targetId,
        data: { status: 'processing' },
      })
    } catch (err) {
      console.error('Failed to update quotation-request status to processing:', err)
    }
  }
  return doc
},
      async ({ doc, previousDoc, operation, req }) => {
        // Trigger only when status changes TO 'order_confirmed'
        if (
          operation === 'update' && 
          doc.status === 'order_confirmed' && 
          previousDoc.status !== 'order_confirmed'
        ) {
          // 1. Check if an order already exists to prevent duplicate creation
          const existing = await req.payload.find({
            collection: 'orders',
            where: { sourceQuotationId: { equals: String(doc.id) } },
            limit: 1,
          })

          if (existing.docs.length === 0) {
            // 2. Auto-generate the new Order Number using your existing format logic
            const year = new Date().getFullYear()
            const existingOrders = await req.payload.find({
              collection: 'orders',
              where: { orderNumber: { like: `${year}-` } },
              sort: '-orderNumber',
              limit: 1,
            })
            
            let next = 1
            if (existingOrders.docs.length > 0) {
              const last = existingOrders.docs[0].orderNumber as string
              next = parseInt(last.split('-').pop() || '0', 10) + 1
            }
            
            const orderNumber = `${year}-${String(next).padStart(5, '0')}`

            // 3. Map items carefully to match the Orders schema
            const mappedItems = Array.isArray(doc.items) ? doc.items.map((i: any) => ({
              description: i.description || '',
              qty: i.qty || 1,
              unit: i.unit || 'pcs',
              unitPrice: i.unitPrice || 0,
              unitCost: i.unitCost || 0,
            })) : []

            // 4. Create the order automatically
            await req.payload.create({
              collection: 'orders',
              data: {
                orderNumber,
                sourceQuotationId: String(doc.id),
                customerName: doc.customerName || '',
                company: doc.company || '',
                address: doc.address || '',
                contactNumber: doc.contactNumber || '',
                salesPerson: doc.salesPerson || '',
                vatRate: doc.vatRate || 12,
                discountAmount: doc.discountAmount || 0,
                deliveryFee: doc.deliveryFee || 0,
                items: mappedItems,
                fulfillmentStatus: 'preparing',
                paymentStatus: 'unpaid',
              },
            })
          }
        }
        return doc
      }
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
        {
          name: 'unitCost',
          type: 'number',
          defaultValue: 0,
          admin: { description: 'Supplier wholesale cost per unit. Internal only -- never printed on the client quotation.' },
        },
        {
          name: 'marginAmount',
          type: 'number',
          defaultValue: 0,
          admin: { description: 'Flat markup amount (₱) added to cost. Internal only -- never printed on the client quotation.' },
        },
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
      admin: { description: 'Sales/negotiation stage only. Once "Order Confirmed", use the Convert to Order button to hand off to fulfillment tracking.' },
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Pending Approval', value: 'pending_approval' },
         { label: 'Quotation Approved', value: 'quotation_approved' },
        { label: 'Order Confirmed', value: 'order_confirmed' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      defaultValue: 'draft',
    },
  ],
}