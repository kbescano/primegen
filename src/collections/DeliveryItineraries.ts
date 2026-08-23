import type { CollectionConfig } from 'payload'

export const DeliveryItineraries: CollectionConfig = {
  slug: 'delivery-itineraries',
  admin: {
    useAsTitle: 'trackingNumber',
    defaultColumns: ['trackingNumber', 'sourceOrderId', 'status', 'driverName', 'updatedAt'],
    group: 'Logistics',
    description: 'Delivery routes and waybills generated from confirmed orders.',

  },
  access: {
    // This is only ever read/written from the internal admin dashboard
    // (see DeliveryItineraryTracker.tsx) -- there's no public tracking page
    // that needs anonymous access. It previously allowed anyone on the
    // internet to list every customer's delivery route (names, phone
    // numbers, addresses), create fake itineraries, or tamper with existing
    // ones (e.g. mark a real delivery "Delivered").
    create: ({ req }) => Boolean(req.user),
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user && req.user.role === 'admin'),
  },
  fields: [
    {
      name: 'trackingNumber',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'sourceOrderId',
      type: 'relationship',
      relationTo: 'orders',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'scheduled',
      options: [
        { label: 'Scheduled', value: 'scheduled' },
        { label: 'In Transit', value: 'in-transit' },
        { label: 'Delivered', value: 'delivered' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'driverName',
      type: 'text',
      label: 'Assigned Driver',
    },
    {
      name: 'vehicleDetails',
      type: 'text',
      label: 'Vehicle / Plate #',
    },
    {
      name: 'stops',
      type: 'array',
      label: 'Route Stops',
      fields: [
        {
          name: 'type',
          type: 'select',
          required: true,
          options: [
            { label: 'Pick Up', value: 'pickup' },
            { label: 'Drop Off', value: 'dropoff' },
          ],
        },
        {
          name: 'address',
          type: 'text',
          required: true,
        },
        {
          name: 'contactName',
          type: 'text',
        },
        {
          name: 'contactPhone',
          type: 'text',
        },
        // ✨ NEW FIELD ADDED HERE:
        {
          name: 'scheduledDate',
          type: 'date',
          label: 'Scheduled Time',
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
        },
        {
          name: 'status',
          type: 'select',
          defaultValue: 'pending',
          options: [
            { label: 'Pending', value: 'pending' },
            { label: 'Driver Arrived', value: 'arrived' },
            { label: 'Completed', value: 'completed' },
          ],
        },
      ],
    },
  ],
  timestamps: true,
}