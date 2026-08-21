import type { CollectionConfig } from 'payload'

// Shared check: only admin or marketing roles may access this collection
// at all. Used identically across every operation below.
const isAdminOrMarketing = ({ req }: { req: { user?: { role?: string } | null } }) =>
  Boolean(req.user && (req.user.role === 'admin' || req.user.role === 'marketing'))

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'slug', 'order'],
  },
  access: {
    create: isAdminOrMarketing,
    read: isAdminOrMarketing,
    update: isAdminOrMarketing,
    delete: isAdminOrMarketing,
  },
  fields: [
    { name: 'label', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: { description: 'Used in URLs and to match existing products (e.g. "steel-bars").' },
    },
    { name: 'description', type: 'textarea' },
    { name: 'image', type: 'upload', relationTo: 'media' },
    { name: 'order', type: 'number', defaultValue: 0, admin: { description: 'Lower numbers show first.' } },
  ],
}