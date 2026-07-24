import type { ReactNode } from 'react'
// @ts-ignore: allow importing global CSS without module declarations in this nested layout
import '../(frontend)/globals.css'

export default function AdminLoginLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  )
}
