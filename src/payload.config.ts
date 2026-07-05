import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { cloudinaryStorage } from 'payload-storage-cloudinary'
import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Materials } from './collections/Materials'
import { Pages } from './collections/Pages'
import { QuotationRequests } from './collections/QuotationRequests'
import { AgentActions } from './collections/AgentActions'
import { AdSnapshots } from './collections/AdSnapshots'
import { HeroSlides } from './collections/HeroSlides'
import { WeightCalcProducts } from './collections/WeightCalcProducts'
import { Suppliers } from './collections/Suppliers'
import { AboutPage } from './globals/AboutPage'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: '- Admin',
    },
  },
  collections: [
    Users,
    Media,
    Materials,
    Pages,
    QuotationRequests,
    AgentActions,
    AdSnapshots,
    HeroSlides,
    WeightCalcProducts,
    Suppliers,
  ],
  globals: [AboutPage],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI,
    },
  }),
  plugins: [
    cloudinaryStorage({
      cloudConfig: {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
        api_key: process.env.CLOUDINARY_API_KEY || '',
        api_secret: process.env.CLOUDINARY_API_SECRET || '',
      },
      collections: {
        media: true,
      },
    }),
  ],
})
