import type { CollectionConfig } from 'payload'

// Daily pull of ad performance from Meta's Insights API, stored so the
// analytics dashboard can chart trends without re-hitting the Meta API
// on every page load.
export const AdSnapshots: CollectionConfig = {
  slug: 'ad-snapshots',
  admin: {
    useAsTitle: 'date',
    defaultColumns: ['date', 'spend', 'leads', 'costPerLead'],
    group: 'Ads Agent',
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
  },
  fields: [
    { name: 'date', type: 'date', required: true },
    { name: 'campaignId', type: 'text' },
    { name: 'campaignName', type: 'text' },
    { name: 'spend', type: 'number', required: true, admin: { description: 'PHP' } },
    { name: 'impressions', type: 'number' },
    { name: 'clicks', type: 'number' },
    { name: 'ctr', type: 'number', admin: { description: 'Click-through rate, %' } },
    { name: 'leads', type: 'number', defaultValue: 0 },
    { name: 'costPerLead', type: 'number', admin: { description: 'PHP' } },
  ],
  timestamps: true,
}
