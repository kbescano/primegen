import type { CollectionConfig } from 'payload'

export const Deliveries: CollectionConfig = {
  slug: 'deliveries',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'location', 'deliveryDate'],
    group: 'Content',
  },
  access: {
    read: () => true,
  },
  fields: [
    { name: 'title', type: 'text', required: true, admin: { description: 'e.g. "I-Beams Delivered"' } },
    { name: 'location', type: 'text', admin: { description: 'e.g. "Quezon City"' } },
    { name: 'deliveryDate', type: 'date', required: true, defaultValue: () => new Date().toISOString() },
    { name: 'photos', type: 'upload', relationTo: 'media', hasMany: true, required: true },
    { name: 'permalinkUrl', type: 'text', label: 'Facebook Post Link (optional)' },
    { name: 'visible', type: 'checkbox', defaultValue: true, admin: { description: 'Uncheck to hide from the site without deleting.' } },
  ],
}
