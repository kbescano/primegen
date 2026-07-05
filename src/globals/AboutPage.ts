import type { GlobalConfig } from 'payload'

// Single-document settings for the About page: title, description, address,
// contact info, and a Google Maps embed. Edited as one form in /admin
// (Globals -> About Page) rather than a list of records, since there's
// only ever one About page.
export const AboutPage: GlobalConfig = {
  slug: 'about-page',
  admin: {
    description: 'Content for the About page: title, description, address, contact, and map.',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      defaultValue: 'About Primegen Trading Corporation',
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      admin: { description: 'Main paragraph describing the company' },
    },
    {
      name: 'address',
      type: 'textarea',
      required: true,
      admin: { description: 'Physical address, shown on the About page' },
    },
    {
      name: 'phone',
      type: 'text',
    },
    {
      name: 'email',
      type: 'email',
    },
    {
      name: 'mapEmbedUrl',
      type: 'text',
      admin: {
        description:
          'Google Maps embed URL. In Google Maps: search your location, click Share -> Embed a map -> Copy HTML, then paste ONLY the src="..." URL from that code here.',
      },
    },
  ],
}
