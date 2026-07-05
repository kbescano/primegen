import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
  },
  access: {
    // Only logged-in admins can see/manage user accounts
    read: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'role',
      type: 'select',
      defaultValue: 'admin',
      options: [
        { label: 'Admin (client)', value: 'admin' },
        { label: 'Super Admin (agency/you)', value: 'super-admin' },
      ],
    },
  ],
}
