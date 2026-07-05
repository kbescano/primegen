import type { CollectionConfig } from 'payload'

// Product shapes available in the weight calculator. Each shape has its own
// standard engineering formula (applied in the calculator UI); density and
// standard piece length are editable here so the same shape can be reused
// for different metals (steel, aluminum, stainless) without code changes.
export const WeightCalcProducts: CollectionConfig = {
  slug: 'weight-calc-products',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'shape', 'density', 'order', 'enabled'],
    group: 'Content',
    description: 'Products available in the Weight Calculator tool.',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: { description: 'e.g. "Deformed Steel Bar (Rebar)"' },
    },
    {
      name: 'shape',
      type: 'select',
      required: true,
      options: [
        { label: 'Round Bar', value: 'round-bar' },
        { label: 'Square Bar', value: 'square-bar' },
        { label: 'Flat Bar', value: 'flat-bar' },
        { label: 'Round Pipe / Tube', value: 'round-pipe' },
        { label: 'Angle Bar (Equal Legs)', value: 'angle-bar' },
        { label: 'Sheet / Plate', value: 'sheet-plate' },
      ],
    },
    {
      name: 'density',
      type: 'number',
      required: true,
      defaultValue: 7850,
      admin: { description: 'kg per cubic meter. Steel = 7850, Aluminum = 2700, Stainless = 8000' },
    },
    {
      name: 'standardLength',
      type: 'number',
      defaultValue: 6,
      admin: { description: 'Standard piece length in meters (e.g. 6 for rebar, 6.096 for 20ft pipe). Not used for Sheet/Plate.' },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: true,
    },
  ],
  timestamps: true,
}
