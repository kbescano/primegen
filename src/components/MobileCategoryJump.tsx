'use client'

export default function MobileCategoryJump({
  categories,
}: {
  categories: { slug: string; label: string }[]
}) {
  return (
    <select
      onChange={(e) => {
        const slug = e.target.value
        if (slug) {
          document.getElementById(slug)?.scrollIntoView({ behavior: 'smooth' })
        }
        e.target.value = '' // reset so choosing the same option again still triggers a jump
      }}
      defaultValue=""
      className="w-full px-4 py-3 border border-[#3D5F3B]/15 text-[13px] font-bold uppercase tracking-wide text-[#3D5F3B] bg-[#fdfffc] appearance-none pr-9 bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%233D5F3B%22 stroke-width=%222%22><path d=%22M6 9l6 6 6-6%22/></svg>')] bg-no-repeat bg-[right_16px_center]"
    >
      <option value="" disabled>
        Browse Category
      </option>
      {categories.map((c) => (
        <option key={c.slug} value={c.slug}>
          {c.label}
        </option>
      ))}
    </select>
  )
}
