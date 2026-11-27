// Single source of truth for the admin portal's navigation.
//
// The portal is organised by *what you are doing* (follow a deal, plan
// deliveries, read reports, look someone up) rather than by document type.
// Every page keeps its existing URL -- this file only decides which top
// section and which sub-tab a URL belongs to, and who gets to see it.

export type AdminRole = 'admin' | 'user' | 'marketing'

export type NavTab = {
  href: string
  label: string
  roles: AdminRole[]
  /** Label shown in the top bar when this is the only tab a role can see. */
  soloLabel?: string
  /** Extra path prefixes that count as being on this tab. */
  also?: string[]
}

export type NavSection = {
  key: string
  label: string
  tabs: NavTab[]
}

const A = '/admin-dashboard'

export const NAV_SECTIONS: NavSection[] = [
  {
    key: 'deals',
    label: 'Inquiry',
    tabs: [
      // The inbox lists every inquiry together with the stage it has reached;
      // the workflow page (/pipeline/<id>) is that same deal opened up.
      { href: A, label: 'All inquiries', roles: ['admin', 'user'], also: [`${A}/pipeline`, `${A}/deal`] },
      { href: `${A}/client-quotation`, label: 'Quotations', roles: ['admin'] },
      { href: `${A}/orders`, label: 'Orders', roles: ['admin'] },
      { href: `${A}/supplier-po`, label: 'Supplier POs', roles: ['admin'] },
    ],
  },
  {
    key: 'logistics',
    label: 'Logistics',
    tabs: [{ href: `${A}/deliveries`, label: 'Logistics', roles: ['admin', 'marketing', 'user'] }],
  },
  {
    key: 'reports',
    label: 'Reports',
    tabs: [
      { href: `${A}/reports`, label: 'Profit', roles: ['admin'] },
      { href: `${A}/inquiry-tracker`, label: 'Inquiry overview', roles: ['admin', 'marketing'], soloLabel: 'Inquiries' },
      { href: `${A}/reports/expenses`, label: 'Expenses', roles: ['admin'] },
      { href: `${A}/reports/export`, label: 'Export', roles: ['admin'] },
      { href: `${A}/sales-report`, label: 'My sales', roles: ['user'], soloLabel: 'My Sales' },
    ],
  },
  {
    key: 'directory',
    label: 'Directory',
    tabs: [
      { href: `${A}/clients`, label: 'Clients', roles: ['admin', 'marketing'] },
      { href: `${A}/suppliers`, label: 'Suppliers', roles: ['admin', 'marketing'] },
    ],
  },
]

export type ResolvedTab = { href: string; label: string; active: boolean }
export type ResolvedSection = {
  key: string
  label: string
  href: string
  active: boolean
  tabs: ResolvedTab[]
}

/** Length of the longest path prefix of `tab` that `pathname` falls under (0 = no match). */
function matchLength(tab: NavTab, pathname: string): number {
  let best = 0
  for (const candidate of [tab.href, ...(tab.also || [])]) {
    // The root page only matches itself -- as a prefix it would swallow every
    // other admin URL.
    const hit =
      candidate === A
        ? pathname === A || pathname === `${A}/`
        : pathname === candidate || pathname.startsWith(`${candidate}/`)
    if (hit) best = Math.max(best, candidate.length)
  }
  return best
}

/**
 * Sections and tabs the given role may see, with the one that matches
 * `pathname` marked active. The most specific tab wins, so /reports/expenses
 * lights up "Expenses" rather than "Profit".
 */
export function buildNav(role: string | undefined, pathname: string): ResolvedSection[] {
  const r = (role || 'user') as AdminRole

  const visible = NAV_SECTIONS.map((section) => ({
    section,
    tabs: section.tabs.filter((t) => t.roles.includes(r)),
  })).filter((s) => s.tabs.length > 0)

  let activeHref: string | null = null
  let bestLen = 0
  for (const { tabs } of visible) {
    for (const tab of tabs) {
      const len = matchLength(tab, pathname)
      if (len > bestLen) {
        bestLen = len
        activeHref = tab.href
      }
    }
  }

  return visible.map(({ section, tabs }) => ({
    key: section.key,
    label: tabs.length === 1 && tabs[0].soloLabel ? tabs[0].soloLabel : section.label,
    href: tabs[0].href,
    active: tabs.some((t) => t.href === activeHref),
    tabs: tabs.map((t) => ({ href: t.href, label: t.label, active: t.href === activeHref })),
  }))
}

// ---------------------------------------------------------------------------
// "Back" from the deal workflow page
// ---------------------------------------------------------------------------

// The workflow page is reached from several lists. AdminSidebar records the
// page (including its filters) a person clicked from, and the workflow page's
// back arrow returns there instead of always dropping them on the inbox.
export const DEAL_ORIGIN_KEY = 'admin:dealOrigin'

const BACK_LABELS: [string, string][] = [
  [`${A}/orders`, 'Orders'],
  [`${A}/client-quotation`, 'Quotations'],
  [`${A}/supplier-po`, 'Supplier POs'],
  [`${A}/deliveries`, 'Logistics'],
  [`${A}/inquiry-tracker`, 'Inquiry overview'],
  [`${A}/clients`, 'Clients'],
  [`${A}/suppliers`, 'Suppliers'],
  [`${A}/reports`, 'Reports'],
]

export function isDealPath(pathname: string): boolean {
  return pathname.startsWith(`${A}/pipeline/`) || pathname === `${A}/deal` || pathname.startsWith(`${A}/deal/`)
}

/** Where the workflow page's back arrow should go, given the stored origin (if any). */
export function backTarget(origin: string | null | undefined): { href: string; label: string } {
  const fallback = { href: A, label: 'Inquiries' }
  if (!origin || !origin.startsWith(A)) return fallback
  const path = origin.split('?')[0].split('#')[0]
  // Only ever return to a plain admin page (never another workflow page, and
  // never anything that merely starts with the same letters).
  if (path !== A && !path.startsWith(`${A}/`)) return fallback
  if (isDealPath(path)) return fallback
  if (path === A) return { href: origin, label: 'Inquiries' }
  const hit = BACK_LABELS.find(([prefix]) => path === prefix || path.startsWith(`${prefix}/`))
  return { href: origin, label: hit ? hit[1] : 'previous page' }
}
