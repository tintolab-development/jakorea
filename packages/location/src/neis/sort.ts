import type { NeisSchoolItem } from './types'

function compareText(left: string, right: string): number {
  return left.trim().localeCompare(right.trim(), 'ko-KR', {
    numeric: true,
    sensitivity: 'base',
  })
}

function schoolRegion(school: NeisSchoolItem): string {
  return [school.atptOfcdcScNm, school.lctnScNm, school.orgRdnma]
    .map(value => value.trim())
    .filter(Boolean)
    .join(' ')
}

/**
 * NEIS 전체 결과를 학교명 → 소재지 → 학교급 순서로 안정 정렬한다.
 * 같은 표시값도 교육청 코드와 학교 코드로 마지막 순서를 고정한다.
 */
export function sortNeisSchools(schools: readonly NeisSchoolItem[]): NeisSchoolItem[] {
  return [...schools].sort((left, right) => {
    return (
      compareText(left.schulNm, right.schulNm) ||
      compareText(schoolRegion(left), schoolRegion(right)) ||
      compareText(left.schulKndScNm, right.schulKndScNm) ||
      compareText(left.atptOfcdcScCode, right.atptOfcdcScCode) ||
      compareText(left.sdSchulCode, right.sdSchulCode)
    )
  })
}
