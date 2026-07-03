import { matchesSidoInText, matchesSigunguInAddress } from '../sido-sigungu/region-match'
import type { NeisSchoolItem } from './types'

export function filterNeisSchoolsByRegion(
  schools: NeisSchoolItem[],
  sido: string,
  sigungu: string,
): NeisSchoolItem[] {
  if (!sido.trim()) return schools

  return schools.filter(school => {
    const haystack = [school.orgRdnma, school.lctnScNm, school.atptOfcdcScNm].join(' ')

    if (!matchesSidoInText(haystack, sido)) return false
    return matchesSigunguInAddress(school.orgRdnma, sigungu)
  })
}
