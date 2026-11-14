import { toSchoolLevel, type SchoolLevel } from '../../lib/school-grade.ts'
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
  /**
   * 학교급 — 학년 옵션 범위에 쓴다. NEIS는 학교종류명(schulKndScNm),
   * 커리어넷은 검색 모달에서 고른 학교급(대학교·전문대학). 알 수 없으면 없음.
   */
  schoolLevel?: SchoolLevel
}

export const SCHOOL_SELECTION_INCOMPLETE_MESSAGE =
  '선택한 학교 정보가 올바르지 않습니다. 학교를 다시 선택해 주세요.'

export function mapSearchResultToSelectedSchool(
  result: SchoolSearchResultItem,
  /** 검색 모달에서 고른(또는 고정된) 학교급 — 커리어넷 결과의 학교급 */
  searchedSchoolLevel?: string,
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
      schoolLevel: toSchoolLevel(school.schulKndScNm),
    }
  }

  const university = result.item
  const name = toCareerNetDisplayName(university).trim()
  const seq = university.seq?.trim()
  if (!name || !seq) return null

  const location = getResultLocation(result)
  const careerNetLevel = toSchoolLevel(searchedSchoolLevel)
  return {
    name,
    neisCode: seq,
    address: location !== '-' ? location : undefined,
    source: 'careerNet',
    schoolLevel:
      careerNetLevel === '대학교' || careerNetLevel === '전문대학' ? careerNetLevel : undefined,
  }
}
