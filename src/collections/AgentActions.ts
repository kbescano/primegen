import type { CollectionConfig } from 'payload'

// Every action the AI agent wants to take (or has taken) on the ad account
// lives here. High-risk actions sit as "pending" until an admin approves them
// on the dashboard. Low-risk actions can be configured to auto-execute, but
// are still logged here for full transparency.
export const AgentActions: CollectionConfig = {
  slug: 'agent-actions',
  admin: {
    useAsTitle: 'summary',
    defaultColumns: ['summary', 'actionType', 'riskLevel', 'status', 'createdAt'],
    group: 'Ads Agent',
    description: 'AI agent suggestions and actions on the ad account. Review and approve here.',
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    // Only the backend agent service creates these (via API, using a service user)
    create: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'summary',
      type: 'text',
      required: true,
      admin: {
        description: 'Short human-readable summary, e.g. "Increase Ad Set A budget by 15%"',
      },
    },
    {
      name: 'reasoning',
      type: 'textarea',
      required: true,
      admin: {
        description: "The agent's explanation for why it's suggesting this action",
      },
    },
    {
      name: 'actionType',
      type: 'select',
      required: true,
      options: [
        { label: 'Increase budget', value: 'increase-budget' },
        { label: 'Decrease budget', value: 'decrease-budget' },
        { label: 'Pause ad set', value: 'pause-adset' },
        { label: 'Resume ad set', value: 'resume-adset' },
        { label: 'New campaign', value: 'new-campaign' },
        { label: 'New ad creative/copy', value: 'new-creative' },
        { label: 'Targeting change', value: 'targeting-change' },
        { label: 'Pause all (emergency)', value: 'pause-all' },
      ],
    },
    {
      name: 'riskLevel',
      type: 'select',
      required: true,
      options: [
        { label: 'Low (small budget shift, pausing underperformer)', value: 'low' },
        { label: 'High (new campaign, big budget change, targeting)', value: 'high' },
      ],
      admin: {
        description: 'Determines whether this requires manual approval.',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending approval', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'Auto-executed', value: 'auto-executed' },
        { label: 'Failed', value: 'failed' },
      ],
    },
    {
      name: 'targetCampaignId',
      type: 'text',
      admin: {
        description: 'Meta campaign or ad set ID this action affects',
      },
    },
    {
      name: 'proposedChange',
      type: 'json',
      admin: {
        description: 'Structured payload of the exact change (budget amounts, IDs, etc.)',
      },
    },
    {
      name: 'reviewedBy',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'executedAt',
      type: 'date',
    },
  ],
  timestamps: true,
}
