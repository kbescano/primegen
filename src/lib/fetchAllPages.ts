// Client-side counterpart of findAll: walks every page of a Payload REST
// list endpoint, so a picker that filters in the browser sees the whole
// collection instead of just the first `limit` rows.
export async function fetchAllPages(path: string, pageSize = 200, maxPages = 50): Promise<any[]> {
  const docs: any[] = []
  const sep = path.includes('?') ? '&' : '?'
  for (let page = 1; page <= maxPages; page++) {
    const res = await fetch(`${path}${sep}limit=${pageSize}&page=${page}`, { credentials: 'include' })
    const data = await res.json()
    docs.push(...(data.docs || []))
    if (!data.hasNextPage) break
  }
  return docs
}
