'use client'

import { useEffect, useState } from 'react'

export type ClientOption = {
  id: string | number
  name: string
  company?: string
  address?: string
  phone?: string
  email?: string
}

const PAGE_SIZE = 50

// Server-side search: the clients list is too long to load in full, so each
// query asks the API for matches on name, company, phone, or email.
export function useClientSearch(enabled = true) {
  const [query, setQuery] = useState('')
  const [clients, setClients] = useState<ClientOption[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!enabled) return

    const controller = new AbortController()
    const term = query.trim()

    const params = new URLSearchParams({ limit: String(PAGE_SIZE), sort: 'name' })
    if (term) {
      ;['name', 'company', 'phone', 'email'].forEach((field, i) => {
        params.set(`where[or][${i}][${field}][contains]`, term)
      })
    }

    setLoading(true)
    const timer = setTimeout(
      () => {
        fetch(`/api/clients?${params}`, { credentials: 'include', signal: controller.signal })
          .then((res) => res.json())
          .then((data) => {
            setClients(data.docs || [])
            setTotal(data.totalDocs ?? (data.docs || []).length)
            setLoading(false)
          })
          .catch((err) => {
            if (err?.name === 'AbortError') return
            setClients([])
            setTotal(0)
            setLoading(false)
          })
      },
      term ? 250 : 0,
    )

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query, enabled])

  return { query, setQuery, clients, total, loading, pageSize: PAGE_SIZE }
}
