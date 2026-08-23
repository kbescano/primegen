import type { CollectionConfig } from 'payload'

export const Clients: CollectionConfig = {
  slug: 'clients',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'company', 'phone', 'status'],
    group: 'Content',
    hidden: ({ user }) => user?.role === 'marketing',
  },
  access: {
    // Client records contain PII (phone, email, address) and are managed
    // internally -- there's no public-facing use case for this collection,
    // so every operation requires a logged-in staff account. Create/update/
    // delete already default to this same check when left unspecified, but
    // `read` previously overrode it to `() => true`, which let anyone on the
    // internet list every client's contact details via the REST/GraphQL API.
    read: ({ req }) => Boolean(req.user),
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'company', type: 'text' },
    { name: 'phone', type: 'text' },
    { name: 'email', type: 'text' },
    { name: 'address', type: 'textarea' },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
    },
  ],
}
