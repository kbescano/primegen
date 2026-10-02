// Stored Cloudinary URLs are untransformed (plain .jpg/.png as uploaded),
// so browsers never get offered a next-gen format. Cloudinary supports
// inserting transformation params directly into the URL path --
// f_auto negotiates WebP/AVIF/etc. per-browser, q_auto picks a sensible
// compression level -- entirely on Cloudinary's own CDN, so this never
// touches Vercel's (separately metered, previously-capped) Image
// Optimization. Next's own <Image> optimizer is already off site-wide
// (see next.config.js), so this is the only place that lever exists.
export function cloudinaryOptimized(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  const marker = '/upload/'
  const i = url.indexOf(marker)
  if (!url.includes('res.cloudinary.com') || i === -1) return url
  // Already has a transformation segment (e.g. re-processed elsewhere) --
  // don't stack a second one.
  const afterUpload = url.slice(i + marker.length)
  if (/^[a-z]_[^/]+\//.test(afterUpload)) return url
  return `${url.slice(0, i + marker.length)}f_auto,q_auto/${afterUpload}`
}
