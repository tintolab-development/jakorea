import type {
  UjatEducationRegion,
  UjatEducationRegionFilters,
} from '@/features/program/ujat/model/education-region.types'

export function filterUjatEducationRegions(
  rows: readonly UjatEducationRegion[],
  filters: UjatEducationRegionFilters
): UjatEducationRegion[] {
  const nameQuery = filters.name.trim().toLowerCase()
  return rows.filter(row => {
    if (filters.usageStatus === 'active' && !row.active) return false
    if (filters.usageStatus === 'inactive' && row.active) return false
    if (nameQuery && !row.name.toLowerCase().includes(nameQuery)) return false
    return true
  })
}

export function formatUjatEducationRegionDateTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '-'
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  return `${y}.${m}.${d} ${hh}:${mm}:${ss}`
}
