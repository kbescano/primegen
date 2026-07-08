import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { headers as getHeaders } from 'next/headers'
import { getPayloadClient } from '@/lib/getPayloadClient'
import AdminSidebar from '@/components/AdminSidebar'

export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const payload = await getPayloadClient()
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })

  if (!user) {
    redirect('/admin/login?redirect=/admin-dashboard')
  }

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'Inter, sans-serif', background: '#ffffff' }}>
        <AdminSidebar>{children}</AdminSidebar>
      </body>
    </html>
  )
}
