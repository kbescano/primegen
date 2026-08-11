import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
  },
  access: {
    // 🔒 1. THE MAGIC LINE: Strictly limits the Payload CMS Dashboard to admins only
    admin: ({ req: { user } }) => user?.role === 'admin',

    // 2. Only admins can create or delete accounts
    create: ({ req: { user } }) => user?.role === 'admin',
    delete: ({ req: { user } }) => user?.role === 'admin',

    // 3. Admins can see everyone; regular users can only read their own profile
    read: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      if (user) return { id: { equals: user.id } } // Allows them to load their own data
      return false
    },

    // 4. Admins can update anyone; regular users can only update themselves
    update: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      if (user) return { id: { equals: user.id } }
      return false
    },
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      defaultValue: 'user',
      required: true,
      saveToJWT: true,
      options: [
        { label: 'User', value: 'user' },
        { label: 'Super Admin', value: 'admin' },
        { label: 'Marketing', value: 'marketing' },
      ],
      access: {
        // 🔒 Prevents standard users/marketing from modifying their own role via the API
        update: ({ req: { user } }) => user?.role === 'admin', 
      },
    },
    {
      name: 'name',
      type: 'text',
    },
  ],
}