import { notFound } from 'next/navigation'

// Catches any URL that doesn't match a more specific route (Next.js tries
// specific routes first; this only gets reached when nothing else did).
// Calling notFound() here, inside the (frontend) group, is what makes
// ../not-found.tsx's styled page apply to genuinely unmatched URLs too,
// not just explicit notFound() calls from within existing pages (e.g. a
// missing product slug) -- without needing a shared root layout.tsx,
// which this app deliberately doesn't have (frontend/admin-dashboard/
// admin-login each render their own independent <html> document).
export default function CatchAll() {
  notFound()
}
