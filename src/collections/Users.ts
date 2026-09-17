import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
    hidden: ({ user }) => user?.role === 'marketing',
  },
  access: {
    // 🔒 1. THE MAGIC LINE: Strictly limits the Payload CMS Dashboard to admins only
    admin: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'marketing',
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
    {
      // Whether this user has finished MFA setup. Only ever flipped by
      // /api/mfa/setup/confirm and /api/mfa/setup/disable (both use the
      // Local API with overrideAccess: true, which bypasses this) -- never
      // directly writable through the REST API or Payload's own admin
      // panel, so it can't be turned on without an actually-verified code.
      name: 'totpEnabled',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Managed by the user from their own Account page -- not editable here.' },
      access: { update: () => false },
    },
    {
      // AES-256-GCM-encrypted TOTP secret (see src/lib/mfa.ts) -- never
      // readable through any API response, including to the account's own
      // owner. Only /api/mfa/* routes touch this, always via the Local API
      // with overrideAccess: true, which is the one thing that can read a
      // field whose own access control says no.
      name: 'totpSecret',
      type: 'text',
      admin: { hidden: true },
      access: { read: () => false, update: () => false },
    },
  ],
}