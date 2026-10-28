// payload.find() returns at most `limit` rows -- a plain `limit: 1000` call
// silently drops everything past it. Aggregates, exports and backups need
// the full set, so this walks every page: page 1 first (for the page count),
// then the rest a few at a time in parallel instead of strictly one by one.
export async function findAll(
  payload: any,
  args: Record<string, any>,
  pageSize = 500,
  maxPages = 200,
  concurrency = 4,
): Promise<{ docs: any[]; totalDocs: number }> {
  const first = await payload.find({ ...args, limit: pageSize, page: 1 })
  const totalPages = Math.min(first.totalPages ?? 1, maxPages)
  if (totalPages <= 1) return { docs: first.docs, totalDocs: first.docs.length }

  const pages: any[][] = [first.docs]
  for (let start = 2; start <= totalPages; start += concurrency) {
    const batch = []
    for (let p = start; p < start + concurrency && p <= totalPages; p++) {
      batch.push(payload.find({ ...args, limit: pageSize, page: p }).then((r: any) => r.docs))
    }
    pages.push(...(await Promise.all(batch)))
  }
  const docs = pages.flat()
  return { docs, totalDocs: docs.length }
}
