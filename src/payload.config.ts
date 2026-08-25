import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { cloudinaryStorage } from 'payload-storage-cloudinary'
import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Products } from './collections/Products'
import { QuotationRequests } from './collections/QuotationRequests'
import { AgentActions } from './collections/AgentActions'
import { AdSnapshots } from './collections/AdSnapshots'
import { HeroSlides } from './collections/HeroSlides'
import { WeightCalcProducts } from './collections/WeightCalcProducts'
import { Suppliers } from './collections/Suppliers'
import { Categories } from './collections/Categories'
import { Deliveries } from './collections/Deliveries'
import { Clients } from './collections/Clients'
import { Orders } from './collections/Orders'
import { ClientQuotations } from './collections/ClientQuotations'
import { SupplierPurchaseOrders } from './collections/SupplierPurchaseOrders'
import { AboutPage } from './globals/AboutPage'
import { Notifications } from './collections/Notifications'
import { DeliveryItineraries } from './collections/DeliveryItineraries'
import { CustomerStories } from './collections/CustomerStories'
import { ActionItems } from './collections/ActionItems'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  cors: [
    process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
    'http://localhost:3000',
  ],
  csrf: [
    process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
    'http://localhost:3000',
  ],
  admin: {
    user: 'users', // Matches your Users collection slug
    components: {
      graphics: {
        // In Payload 3, pass the string path to the component
        Logo: '@/components/PayloadLogo',
        Icon: '@/components/PayloadLogo', // Used for the collapsed sidebar
      },
    },
    meta: {
      titleSuffix: '- Primegen Admin',
      icons: [
        {
          rel: 'icon',
          type: 'image/x-icon',
          url: '/favicon.ico',
        },
      ],
      openGraph: {
        images: [
          {
            url: '/branding/primegen_trading_logo.png',
          },
        ],
      },
    },
  },
  collections: [
    Users,
    Media,
    Products,
    QuotationRequests,
    AgentActions,
    AdSnapshots,
    HeroSlides,
    WeightCalcProducts,
    Suppliers,
    Categories,
    Deliveries,
    Clients,
    Orders,
    ClientQuotations,
    SupplierPurchaseOrders,
    Notifications,
    DeliveryItineraries,
    CustomerStories,
    ActionItems
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
