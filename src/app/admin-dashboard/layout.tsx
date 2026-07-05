import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { headers as getHeaders } from 'next/headers'
import { getPayloadClient } from '@/lib/getPayloadClient'
import DashboardShell from '../../components/DashboardShell'

export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const payload = await getPayloadClient()
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })

  if (!user) {
    redirect('/admin/login?redirect=/admin-dashboard')
  }

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'Inter, sans-serif', background: '#f7f9fc' }}>
        <DashboardShell>{children}</DashboardShell>
      </body>
    </html>
  )
}