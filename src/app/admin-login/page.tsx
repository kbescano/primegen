import AdminLoginForm from '@/components/AdminLoginForm'

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>
}) {
  const { redirect: redirectTo } = await searchParams
  return <AdminLoginForm redirectTo={redirectTo || '/admin-dashboard'} />
}
