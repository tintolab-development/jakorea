import { listTextbooks } from '@/features/textbook/api/textbook-mock-store'
import type { TextbookRow } from '@/features/textbook/model/textbook.types'
import { formatInstitutionApplicationGradeDisplay } from '@/features/program/general/lib/institution-application-detail-edit-policy'
import {
  filterTextbooksForApplicant,
  resolveProgramEducationTarget,
} from '@/features/program/general/lib/filter-textbooks-for-applicant'
import type { MatchesParams } from '@/shared/api/generated/data-management/schemas'
import type { Program } from '@/types/domain'

export function buildTextbookMatchesParamsFromProgram(program: Program): MatchesParams {
  const educationTarget = resolveProgramEducationTarget(program)
  return {
    businessArea: program.businessArea || undefined,
    educationTarget: educationTarget || undefined,
  }
}

export function buildTextbookMatchesParamsForApplicant(
  program: Program,
  educationGrade?: string
): MatchesParams {
  const base = buildTextbookMatchesParamsFromProgram(program)
  const grade = educationGrade?.trim()
  if (!grade) return base
  return {
    ...base,
    grade: formatInstitutionApplicationGradeDisplay(grade),
  }
}

export function serializeProgramTextbookCatalogKey(
  program: Program,
  educationGrade?: string
): string {
  const params = buildTextbookMatchesParamsForApplicant(program, educationGrade)
  return `${params.businessArea ?? ''}|${params.educationTarget ?? ''}|${params.grade ?? ''}`
}

/** API 비활성 시 프로그램·신청 학년 기준 mock 교재 카탈로그 */
export function listMockTextbookCatalogForProgram(
  program: Program,
  educationGrade?: string
): TextbookRow[] {
  const grade = educationGrade?.trim()
  if (grade) {
    return filterTextbooksForApplicant(program, grade)
  }

  const educationTarget = resolveProgramEducationTarget(program)
  return listTextbooks().filter(row => {
    if (row.useStatus !== 'USED') return false
    if (program.businessArea && row.businessArea !== program.businessArea) return false
    if (educationTarget && row.educationTarget !== educationTarget) return false
    return true
  })
}
