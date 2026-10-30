import type { ProgramDetailCase, ProgramTab } from '../model/types'
import { programTabLabels } from './constants.ts'

const PORTAL_CATEGORY_CODE: Record<string, ProgramTab> = {
  INSTRUCTOR: 'instructor',
  ORGANIZATION: 'institution',
  YOUTH_YOUNG: 'youth',
}

/** 참여하기 프로그램 목록과 동일한 카테고리 순서. */
const PORTAL_CATEGORY_ORDER = ['INSTRUCTOR', 'ORGANIZATION', 'YOUTH_YOUNG'] as const

export function isUjatProgramType(programType: string | undefined): boolean {
  const type = (programType ?? '').trim().toUpperCase()
  return type === 'UJAT' || type === 'UJAT_PROGRAM'
}

export function fallbackPortalTab(programType: string | undefined): ProgramTab {
  switch ((programType ?? '').trim().toUpperCase()) {
    case 'TRAINED_TEACHER':
      return 'institution'
    case 'GENERAL_ORGANIZATION':
    case 'GEMINI':
    case 'GEMINI_TRAINING':
    case 'COMPANY_SCHOOL':
    case 'ECONOMY':
      return 'institution'
    default:
      return 'youth'
  }
}

/**
 * 참여하기 프로그램 목록의 portalCategories/programType 분류와 동일한 매핑.
 * portalCategories가 없을 때만 레거시 programType fallback을 사용한다.
 */
export function mapPortalTabs(
  categories: readonly string[] | undefined,
  programType: string | undefined
): ProgramTab[] {
  if (categories == null) return [fallbackPortalTab(programType)]

  const codes = new Set(
    categories
      .map(item => item.trim().toUpperCase())
      .filter(Boolean)
      .filter(code => !(isUjatProgramType(programType) && code === 'INSTRUCTOR'))
  )

  return PORTAL_CATEGORY_ORDER.flatMap(code => {
    const tab = PORTAL_CATEGORY_CODE[code]
    return codes.has(code) && tab ? [tab] : []
  })
}

export function mapPortalCategoryLabel(
  categories: readonly string[] | undefined,
  programType: string | undefined
): string {
  return programTabLabels(mapPortalTabs(categories, programType))
}

/**
 * 프로그램 상세 상단 탭. 목록은 기관·강사를 같이 둘 수 있지만
 * 상세 헤더는 둘 다 그리지 않는다. 진입 탭이 있으면 그것만, 없으면 상세 케이스에 맞는 한쪽만 남긴다.
 */
export function resolveProgramDetailCategoryTabs(input: {
  tabs: readonly ProgramTab[]
  detailCase: ProgramDetailCase
  focusedTab?: ProgramTab | null
}): ProgramTab[] {
  if (input.focusedTab) return [input.focusedTab]
  const hasInstructor = input.tabs.includes('instructor')
  const hasInstitution = input.tabs.includes('institution')
  if (!(hasInstructor && hasInstitution)) return [...input.tabs]
  if (input.detailCase === 'instructor') {
    return input.tabs.filter(tab => tab !== 'institution')
  }
  return input.tabs.filter(tab => tab !== 'instructor')
}
