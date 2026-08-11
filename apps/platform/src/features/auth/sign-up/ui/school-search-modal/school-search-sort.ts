import type { CareerNetUniversityItem } from '@jakorea/location/career-net'
import type { NeisSchoolItem } from '@jakorea/location/neis'

export type SchoolSearchResultItem =
  | { source: 'neis'; item: NeisSchoolItem }
  | { source: 'careerNet'; item: CareerNetUniversityItem }

const SCHOOL_LEVEL_RANK: Record<string, number> = {
  고등: 0,
  중등: 1,
  중학: 1,
  초등: 2,
  유치: 3,
}

export function toCareerNetDisplayName(item: CareerNetUniversityItem): string {
  return item.campusName ? `${item.schoolName} (${item.campusName})` : item.schoolName
}

export function getResultDisplayName(result: SchoolSearchResultItem): string {
  if (result.source === 'neis') {
    return result.item.schulNm
  }
  return toCareerNetDisplayName(result.item)
}

export function getResultSchoolLevel(result: SchoolSearchResultItem): string {
  if (result.source === 'neis') {
    return result.item.schulKndScNm?.trim() || '-'
  }
  return (
    result.item.schoolType?.trim() ||
    result.item.schoolGubun?.trim() ||
    '대학'
  )
}

export function getResultLocation(result: SchoolSearchResultItem): string {
  if (result.source === 'neis') {
    return result.item.orgRdnma?.trim() || result.item.lctnScNm?.trim() || '-'
  }
  return result.item.address?.trim() || result.item.region?.trim() || '-'
}

function getSchoolLevelRank(level: string): number {
  const normalized = level.trim()
  for (const [key, rank] of Object.entries(SCHOOL_LEVEL_RANK)) {
    if (normalized.includes(key)) {
      return rank
    }
  }
  return 99
}

/** 학교명 > 소재지 > 학교급(고등→중등→초등→유치원) */
export function compareSchoolSearchResults(
  a: SchoolSearchResultItem,
  b: SchoolSearchResultItem,
): number {
  const nameCompare = getResultDisplayName(a).localeCompare(getResultDisplayName(b), 'ko')
  if (nameCompare !== 0) return nameCompare

  const locationCompare = getResultLocation(a).localeCompare(getResultLocation(b), 'ko')
  if (locationCompare !== 0) return locationCompare

  return getSchoolLevelRank(getResultSchoolLevel(a)) - getSchoolLevelRank(getResultSchoolLevel(b))
}

export function getResultKey(result: SchoolSearchResultItem): string {
  if (result.source === 'neis') {
    const school = result.item
    return `neis-${school.sdSchulCode}-${school.schulNm}-${school.orgRdnma}`
  }
  const item = result.item
  return `careerNet-${item.seq}-${item.schoolName}-${item.campusName}-${item.address}`
}
