import { headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayloadClient } from '@/lib/getPayloadClient'

// Deliberately not linked from AdminSidebar's nav -- reachable only by
// typing/bookmarking this exact URL. Access is still enforced here (and
// again, independently, in /api/db-backup's own auth check) regardless of
// whether someone finds the link, so leaving it out of the nav is just
// about not cluttering it, not the actual security boundary.
export default async function DbBackupPage() {
  const payload = await getPayloadClient()
  const reqHeaders = await getHeaders()
  const { user } = await payload.auth({ headers: reqHeaders })

  if (!user || (user.role !== 'admin' && user.role !== 'marketing')) {
    redirect('/admin-dashboard')
  }

  return (
    <div className="w-full max-w-[560px] mx-auto py-16 px-4">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center">
        <div className="w-10 h-[3px] bg-[#149911] mx-auto mb-5" />
        <a
          href="/api/db-backup"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#01172f] text-white rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-[#149911] transition-colors shadow-md hover:shadow-lg"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 3v13m0 0l-5-5m5 5l5-5M4 21h16" />
          </svg>
          Download Data Backup
        </a>
      </div>
    </div>
  )
}
