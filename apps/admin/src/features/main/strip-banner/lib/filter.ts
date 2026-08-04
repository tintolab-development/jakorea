import type { StripBanner, StripBannerFilters } from '../model/types'
import dayjs from 'dayjs'

export function filterStripBanners(
  rows: StripBanner[],
  filters: StripBannerFilters
): StripBanner[] {
  return rows.filter(row => {
    if (filters.active === 'active' && !row.active) return false
    if (filters.active === 'inactive' && row.active) return false

    const textQ = filters.text.trim().toLowerCase()
    if (textQ && !row.text.toLowerCase().includes(textQ)) return false

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
