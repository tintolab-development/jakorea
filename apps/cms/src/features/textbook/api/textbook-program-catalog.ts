import { listTextbooks } from '@/features/textbook/api/textbook-mock-store'
import type { TextbookRow } from '@/features/textbook/model/textbook.types'
import { formatInstitutionApplicationGradeDisplay } from '@/features/program/general/lib/institution-application-detail-edit-policy'
import {
  filterTextbooksForApplicant,
  filterTextbooksForIndividualApplicant,
  resolveProgramEducationTarget,
  resolveProgramEducationTargets,
} from '@/features/program/general/lib/filter-textbooks-for-applicant'
import { normalizeProgramBusinessAreaValue } from '@/features/program/shared/lib/program-detail-info-constants'
import type { MatchesParams } from '@/shared/api/generated/data-management/schemas'
import type { Program } from '@/types/domain'

/** 기관·프로그램 폼용 — 사업분야 + 교육대상 */
export function buildTextbookMatchesParamsFromProgram(program: Program): MatchesParams {
  const educationTarget = resolveProgramEducationTarget(program)
  const businessArea = normalizeProgramBusinessAreaValue(program.businessArea) || undefined
  return {
    businessArea,
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

/**
 * 개인 참여자 교재 셀렉 — `businessArea` + `grade`만.
 * @see individual-textbook-select-frontend-handoff-2026-09-28.md
 */
export function buildIndividualTextbookMatchesParams(
  program: Program,
  educationGrade?: string
): MatchesParams | null {
  const businessArea = normalizeProgramBusinessAreaValue(program.businessArea)
  const grade = educationGrade?.trim()
  if (!businessArea || !grade) return null
  return {
    businessArea,
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

export function serializeIndividualTextbookCatalogKey(
  program: Program,
  educationGrade?: string
): string {
  const params = buildIndividualTextbookMatchesParams(program, educationGrade)
  if (!params) return ''
  return `${params.businessArea ?? ''}|${params.grade ?? ''}`
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

  const educationTargets = resolveProgramEducationTargets(program)
  return listTextbooks().filter(row => {
    if (row.useStatus !== 'USED') return false
    if (program.businessArea && row.businessArea !== program.businessArea) return false
    if (
      educationTargets.length > 0 &&
      !educationTargets.includes(row.educationTarget)
    ) {
      return false
    }
    return true
  })
}

/** 개인 참여자용 mock — 사업분야 + 신청 학년만 */
export function listMockTextbookCatalogForIndividualApplicant(
  program: Program,
  educationGrade?: string
): TextbookRow[] {
  const grade = educationGrade?.trim()
  if (!grade || !program.businessArea?.trim()) return []
  return filterTextbooksForIndividualApplicant(program, grade)
}
