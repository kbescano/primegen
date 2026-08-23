import type { Metadata } from 'next'
import AdminLoginForm from '@/components/AdminLoginForm'

// Public but not something that should ever show up in search results --
// robots.ts also disallows crawling it, but that alone doesn't guarantee
// de-indexing of a URL that's already been linked/discovered elsewhere.
export const metadata: Metadata = {
  title: 'Admin Login',
  robots: { index: false, follow: false },
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>
}) {
  const { redirect: redirectTo } = await searchParams
  return <AdminLoginForm redirectTo={redirectTo || '/admin-dashboard'} />
}
