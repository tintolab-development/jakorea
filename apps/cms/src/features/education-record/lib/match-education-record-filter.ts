import { parseRegionTokens, getRowQuarter, getRowYear } from './education-record-region'
import { normalizeEducationRecordBusinessArea } from './education-record-labels'
import type { EducationRecordPendingFilters, EducationRecordRow } from '../model/education-record-types'

const EDUCATION_TYPE_ALIASES: Record<string, string[]> = {
  online: ['online', '온라인'],
  offline: ['offline', '오프라인'],
  hybrid: ['hybrid', '온/오프라인', '혼합', '온+오프라인', '온오프라인'],
}

function includesIgnoreCase(source: string | null | undefined, query: string): boolean {
  if (!query) return true
  if (!source) return false
  return source.toLowerCase().includes(query.toLowerCase())
}

function matchesEducationType(rowValue: string | undefined, filter: string): boolean {
  if (!filter) return true
  const aliases = EDUCATION_TYPE_ALIASES[filter] ?? [filter]
  const raw = (rowValue ?? '').trim().toLowerCase().replace(/\s+/g, '')
  return aliases.some(alias => alias.toLowerCase().replace(/\s+/g, '') === raw)
}

export function matchesEducationRecordFilter(
  row: EducationRecordRow,
  filters: EducationRecordPendingFilters
): boolean {
  const yearNum = filters.year ? Number(filters.year) : null
  if (yearNum != null) {
    const year = getRowYear(row)
    if (year !== yearNum) return false
  }

  if (filters.quarter !== 'ALL') {
    const quarter = getRowQuarter(row)
    if (quarter !== filters.quarter) return false
  }

  const businessAreaQ = filters.businessArea.trim()
  if (businessAreaQ) {
    const rowArea = normalizeEducationRecordBusinessArea(row.businessArea)
    if (rowArea !== normalizeEducationRecordBusinessArea(businessAreaQ)) return false
  }

  const sidoQ = filters.sido.trim()
  const sigunguQ = filters.sigungu.trim()
  if (sidoQ || sigunguQ) {
    const tokens = {
      si: row.si ?? '',
      gun: row.gun ?? '',
      gu: row.gu ?? '',
    }
    if (!row.si && !row.gun && !row.gu && row.district) {
      const parsed = parseRegionTokens(row.district)
      tokens.si = parsed.si
      tokens.gun = parsed.gun
      tokens.gu = parsed.gu
    }
    const rowSido = row.sido ?? ''
    if (sidoQ && rowSido !== sidoQ) return false
    if (sigunguQ && tokens.si !== sigunguQ && tokens.gun !== sigunguQ && tokens.gu !== sigunguQ) {
      return false
    }
  }

  if (!includesIgnoreCase(row.sponsorNameKo, filters.sponsorName.trim())) return false
  if (!includesIgnoreCase(row.mainTitle, filters.mainTitle.trim())) return false
  if (!includesIgnoreCase(row.title, filters.title.trim())) return false
  if (!includesIgnoreCase(row.textbookName, filters.textbookName.trim())) return false
  if (!includesIgnoreCase(row.schoolOrOrganizationName, filters.institutionName.trim())) {
    return false
  }

  const ipsQ = filters.ips.trim()
  if (ipsQ && (row.ips ?? '').trim() !== ipsQ) return false

  if (!matchesEducationType(row.educationType, filters.educationType.trim())) return false

  return true
}
