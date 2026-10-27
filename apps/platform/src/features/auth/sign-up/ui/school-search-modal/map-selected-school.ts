import {
  getResultLocation,
  toCareerNetDisplayName,
  type SchoolSearchResultItem,
} from './school-search-sort.ts'

export type SelectedSchool = {
  name: string
  organizationId?: number
  /** NEIS `sdSchulCode` 또는 커리어넷 `seq` — `schoolSelection.externalSchoolCode` */
  neisCode?: string
  /** NEIS 교육청 코드 (`ATPT_OFCDC_SC_CODE`) */
  educationOfficeCode?: string
  /** NEIS 소재지 도로명 주소 — 확인 화면 소속/학교 표시용 */
  address?: string
  source?: 'neis' | 'careerNet'
}

export const SCHOOL_SELECTION_INCOMPLETE_MESSAGE =
  '선택한 학교 정보가 올바르지 않습니다. 학교를 다시 선택해 주세요.'

export function mapSearchResultToSelectedSchool(
  result: SchoolSearchResultItem,
): SelectedSchool | null {
  if (result.source === 'neis') {
    const school = result.item
    const name = school.schulNm?.trim()
    const neisCode = school.sdSchulCode?.trim()
    if (!name || !neisCode) return null

    return {
      name,
      neisCode,
      educationOfficeCode: school.atptOfcdcScCode?.trim() || undefined,
      address: school.orgRdnma?.trim() || undefined,
      source: 'neis',
    }
  }

  const university = result.item
  const name = toCareerNetDisplayName(university).trim()
  const seq = university.seq?.trim()
  if (!name || !seq) return null

  const location = getResultLocation(result)
  return {
    name,
    neisCode: seq,
    address: location !== '-' ? location : undefined,
    source: 'careerNet',
  }
}
