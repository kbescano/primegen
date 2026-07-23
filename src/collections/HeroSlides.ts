import type { CollectionConfig } from 'payload'

// Manages the homepage video hero playlist. Each slide is a video with a
// label, headline, and CTA button. Editable directly from /admin -- no
// code changes needed to add, remove, reorder, or swap videos.
export const HeroSlides: CollectionConfig = {
  slug: 'hero-slides',
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'title', 'order', 'enabled'],
    group: 'Content',
    description: 'Homepage video hero playlist. Lower "order" numbers show first.',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      required: true,
      admin: { description: 'Small eyebrow label, e.g. "Fabrication & Steel"' },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: { description: 'Big headline text shown on this slide' },
    },
    {
      name: 'cta',
      type: 'text',
      required: true,
      defaultValue: 'Learn More',
    },
    {
      name: 'href',
      type: 'text',
      required: true,
      defaultValue: '/products',
      admin: { description: 'Where the CTA button links to, e.g. /quote' },
    },
    {
      name: 'video',
      type: 'text',
      required: true,
      admin: { description: 'Direct video file URL (.mp4) or local path like /videos/hero-1.mp4' },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: { description: 'Lower numbers show first in the playlist' },
    },
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Uncheck to hide this slide without deleting it' },
    },
  ],
  timestamps: true,
}
