import type { HistoryFilters, HistoryItem, HistorySort } from '../model/types'

function dayStart(isoDate: string): number {
  return new Date(`${isoDate}T00:00:00`).getTime()
}

function dayEnd(isoDate: string): number {
  return new Date(`${isoDate}T23:59:59.999`).getTime()
}

export function filterHistoryItems(
  items: HistoryItem[],
  filters: HistoryFilters
): HistoryItem[] {
  const keyword = filters.content.trim().toLowerCase()

  return items.filter(item => {
    if (filters.visibility !== 'all' && item.visibility !== filters.visibility) {
      return false
    }
    if (filters.year !== 'all' && item.year !== filters.year) return false
    if (filters.month !== 'all' && item.month !== filters.month) return false
    if (keyword && !item.content.toLowerCase().includes(keyword)) return false

    const created = new Date(item.createdAt).getTime()
    if (filters.createdFrom && created < dayStart(filters.createdFrom)) return false
    if (filters.createdTo && created > dayEnd(filters.createdTo)) return false
    return true
  })
}

export function sortHistoryItems(items: HistoryItem[], sort: HistorySort): HistoryItem[] {
  const next = [...items]
  if (sort === 'created-desc') {
    next.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    return next
  }
  next.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year
    if (a.month !== b.month) return b.month - a.month
    return +new Date(b.createdAt) - +new Date(a.createdAt)
  })
  return next
}
