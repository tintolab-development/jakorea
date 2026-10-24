import type { ProgramTab } from '../model/types'
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
