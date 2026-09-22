import type { GlobalConfig } from 'payload'

// Single toggle for when the admin is away (e.g. on leave) and can't be the
// one reviewing every Client Quotation / OPEX approval. While ON, sales
// staff get the same approve/revert controls admin normally has -- on the
// Pipeline's Step 2 (Quotation Approval) and on Order OPEX requests. Every
// self-approval while this is on gets logged as an admin-facing
// notification so nothing slips through unreviewed once the admin is back.
export const ApprovalSettings: GlobalConfig = {
  slug: 'approval-settings',
  label: 'Approval Settings',
  admin: {
    description:
      'Auto-Approve Mode: when ON, sales staff can approve (or revert) quotations and OPEX requests themselves instead of waiting on an admin. Meant for when the admin is on leave/unavailable -- turn it back OFF once they return.',
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'autoApproveMode',
      type: 'checkbox',
      defaultValue: false,
      label: 'Auto-Approve Mode',
    },
  ],
}
