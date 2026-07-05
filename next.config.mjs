import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { hostname: 'localhost' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
}

export default withPayload(nextConfig)
