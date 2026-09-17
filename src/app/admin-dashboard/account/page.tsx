import { headers as getHeaders } from 'next/headers'
import { getPayloadClient } from '@/lib/getPayloadClient'
import AccountSecurityClient from '@/components/AccountSecurityClient'

export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  const payload = await getPayloadClient()
  const reqHeaders = await getHeaders()
  const { user } = await payload.auth({ headers: reqHeaders })

  return <AccountSecurityClient email={user?.email || ''} />
}
