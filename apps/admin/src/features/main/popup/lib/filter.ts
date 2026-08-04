import type { MainPopup, MainPopupFilters } from '../model/types'
import dayjs from 'dayjs'

export function filterMainPopups(rows: MainPopup[], filters: MainPopupFilters): MainPopup[] {
  return rows.filter(row => {
    if (filters.active === 'active' && !row.active) return false
    if (filters.active === 'inactive' && row.active) return false

    const nameQ = filters.name.trim().toLowerCase()
    if (nameQ && !row.name.toLowerCase().includes(nameQ)) return false

    const altQ = filters.altText.trim().toLowerCase()
    if (altQ && !row.altText.toLowerCase().includes(altQ)) return false

    if (filters.startDate || filters.endDate) {
      const rangeStart = filters.startDate ? dayjs(filters.startDate).startOf('day') : null
      const rangeEnd = filters.endDate ? dayjs(filters.endDate).endOf('day') : null
      const rowStart = dayjs(row.startDate).startOf('day')
      const rowEnd = dayjs(row.endDate).endOf('day')
      if (rangeStart && rowEnd.isBefore(rangeStart)) return false
      if (rangeEnd && rowStart.isAfter(rangeEnd)) return false
    }

    return true
  })
}
