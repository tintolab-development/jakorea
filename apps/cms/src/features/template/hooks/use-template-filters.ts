import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import type { Template, TemplateStatus } from '@/types/template'

export function useTemplateFilters<T extends Template>(initialRows: T[]) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<TemplateStatus | 'all'>('all')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return initialRows
      .filter(r => (status === 'all' ? true : r.status === status))
      .filter(r => {
        if (!q) return true
        return (
          r.title.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.tags.some(t => t.toLowerCase().includes(q))
        )
      })
      .sort((a, b) => dayjs(b.updatedAt).valueOf() - dayjs(a.updatedAt).valueOf())
  }, [query, initialRows, status])

  return {
    query,
    setQuery,
    status,
    setStatus,
    filtered,
  }
}
