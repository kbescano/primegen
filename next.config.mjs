import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { hostname: 'localhost' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
    // Cloudinary already resizes/optimizes on upload, so running its URLs
    // through Vercel's own Image Optimization on top was pure redundancy
    // -- and it's a separately metered, capped resource (Image
    // Optimization Transformations), unlike plain bandwidth. Once that
    // monthly cap is hit, every image Vercel hasn't already optimized and
    // cached starts 402ing (newest product photos first), even though
    // nothing is actually broken. Turning optimization off site-wide -- a
    // handful of static/branding images plus a product catalog that's
    // already served pre-optimized by Cloudinary -- removes the failure
    // mode entirely instead of just buying more headroom.
    unoptimized: true,
  },
  // Baseline security headers on every response. Deliberately not adding a
  // Content-Security-Policy here: Payload's admin UI needs inline
  // scripts/styles, and a CSP tight enough to matter but loose enough not
  // to break /admin would need to be scoped per-route and tested against
  // it directly rather than bolted on blind.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
        ],
      },
    ]
  },
}

export default withPayload(nextConfig)
