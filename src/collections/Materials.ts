import type { CollectionConfig } from 'payload'

export const Materials: CollectionConfig = {
  slug: 'materials',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'price', 'unit', 'inStock'],
    group: 'Content',
  },
  access: {
    read: () => true,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'photo', type: 'upload', relationTo: 'media', required: false },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Cement & Concrete', value: 'cement-concrete' },
        { label: 'Steel & Rebar', value: 'steel-rebar' },
        { label: 'Sand & Aggregates', value: 'sand-aggregates' },
        { label: 'Lumber & Wood', value: 'lumber-wood' },
        { label: 'Roofing', value: 'roofing' },
        { label: 'Plumbing Supplies', value: 'plumbing' },
        { label: 'Electrical Supplies', value: 'electrical' },
        { label: 'Tools & Hardware', value: 'tools-hardware' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'price',
      type: 'number',
      required: true,
      min: 0,
      admin: { description: 'Price in PHP (Php)', step: 0.01 },
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
    { name: 'inStock', type: 'checkbox', defaultValue: true, label: 'In stock / available' },
    { name: 'featured', type: 'checkbox', defaultValue: false, label: 'Show in homepage highlights' },
    {
      name: 'weightCalcProduct',
      type: 'relationship',
      relationTo: 'weight-calc-products',
      required: false,
      admin: { description: 'Optional: link a weight calculator shape/formula for this material\'s detail page' },
    },
  ],
}
