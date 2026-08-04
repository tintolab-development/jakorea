import type { AwardFilters, AwardItem, AwardSort } from '../model/types'

function dayStart(isoDate: string): number {
  return new Date(`${isoDate}T00:00:00`).getTime()
}

function dayEnd(isoDate: string): number {
  return new Date(`${isoDate}T23:59:59.999`).getTime()
}

export function filterAwardItems(items: AwardItem[], filters: AwardFilters): AwardItem[] {
  const titleKeyword = filters.title.trim().toLowerCase()
  const orgKeyword = filters.organization.trim().toLowerCase()

  return items.filter(item => {
    if (filters.visibility !== 'all' && item.visibility !== filters.visibility) {
      return false
    }
    if (titleKeyword && !item.title.toLowerCase().includes(titleKeyword)) return false
    if (orgKeyword && !item.organization.toLowerCase().includes(orgKeyword)) return false

    const awarded = dayStart(item.awardedOn)
    if (filters.awardedFrom && awarded < dayStart(filters.awardedFrom)) return false
    if (filters.awardedTo && awarded > dayEnd(filters.awardedTo)) return false

    const created = new Date(item.createdAt).getTime()
    if (filters.createdFrom && created < dayStart(filters.createdFrom)) return false
    if (filters.createdTo && created > dayEnd(filters.createdTo)) return false
    return true
  })
}

export function sortAwardItems(items: AwardItem[], sort: AwardSort): AwardItem[] {
  const next = [...items]
  if (sort === 'created-desc') {
    next.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    return next
  }
  next.sort((a, b) => {
    const byDate = dayStart(b.awardedOn) - dayStart(a.awardedOn)
    if (byDate !== 0) return byDate
    return +new Date(b.createdAt) - +new Date(a.createdAt)
  })
  return next
}
