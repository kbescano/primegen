import type { CollectionConfig } from 'payload'

// Turns "Base Plate" into "base-plate". Strips anything that isn't a
// letter/number/space/hyphen first, so names with special characters
// (e.g. "G.I. Pipe") still produce a clean slug.
function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'price', 'unit', 'inStock'],
    group: 'Content',
  },
  access: {
    read: () => true,
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, req, originalDoc }) => {
        // Only auto-generate once, on create, or if the slug field is
        // ever cleared out manually -- otherwise leave an existing slug
        // alone so editing a product's name later doesn't silently break
        // every link/bookmark/indexed search result pointing at the old
        // slug.
        if ((operation === 'create' || !data.slug) && data.name) {
          const base = slugify(data.name)
          let candidate = base
          let suffix = 2

          // Guard against duplicate slugs (e.g. two products both named
          // "Anchor Bolts" in different categories) by appending -2, -3,
          // etc. until unique.
          while (true) {
            const existing = await req.payload.find({
              collection: 'products',
              where: {
                and: [
                  { slug: { equals: candidate } },
                  ...(originalDoc?.id ? [{ id: { not_equals: originalDoc.id } }] : []),
                ],
              },
              limit: 1,
            })
            if (existing.docs.length === 0) break
            candidate = `${base}-${suffix}`
            suffix++
          }

          data.slug = candidate
        }
        return data
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      admin: {
        description:
          'Auto-generated from the product name (e.g. "Base Plate" -> "base-plate"). Used in the public product URL. Editable, but changing it will change the URL.',
      },
    },
    { name: 'photo', type: 'upload', relationTo: 'media', required: false },
    {
      name: 'category',
      type: 'select',
      required: true,
       options: [
       { label: 'Bolts & Fasteners', value: 'bolts-fasteners' },
       { label: 'Steel Plates', value: 'steel-plates' },
       { label: 'Sheet Pile', value: 'sheet-pile' },
       { label: 'Steel Bars & Tubing', value: 'steel-bars' },
       { label: 'Beams', value: 'beams' },
       { label: 'Black Iron', value: 'black-iron' },
       { label: 'Galvanized Iron', value: 'galvanized-iron' },
       { label: 'Copper', value: 'copper' },
       { label: 'Stainless', value: 'stainless' },
       { label: 'Pipe Fittings', value: 'pipe-fittings' },
       { label: 'Fence & Wire', value: 'fence-wire' },
       { label: 'PPE', value: 'ppe' },
       { label: 'Electrical & Cabling', value: 'electrical-cabling' },
       { label: 'Steel Fabrication', value: 'steel-fabrication' },
  ],
    },
    {
      name: 'unit',
      type: 'select',
      required: true,
      defaultValue: 'piece',
      options: [
        { label: 'per piece', value: 'piece' },
        { label: 'per bag', value: 'bag' },
        { label: 'per kg', value: 'kg' },
        { label: 'per sack', value: 'sack' },
        { label: 'per cubic meter', value: 'cbm' },
        { label: 'per sq. meter', value: 'sqm' },
        { label: 'per linear meter', value: 'lm' },
        { label: 'per length/bar', value: 'length' },
        { label: 'per set', value: 'set' },
      ],
    },
    { name: 'description', type: 'textarea' },
    { name: 'material', type: 'text'},
    { name: 'usage', type: 'text'},
    { name: 'inStock', type: 'checkbox', defaultValue: true, label: 'In stock / available' },
    { name: 'featured', type: 'checkbox', defaultValue: false, label: 'Show in homepage highlights' },
    {
      name: 'weightCalcProduct',
      type: 'relationship',
      relationTo: 'weight-calc-products',
      required: false,
      admin: { description: 'Optional: link a weight calculator shape/formula for this material\'s detail page' },
    },
    {
  name: 'categoryRef',
  type: 'relationship',
  relationTo: 'categories',
  admin: { description: 'New category relationship. Migrating away from the old category select field.' },
},
  ],
}