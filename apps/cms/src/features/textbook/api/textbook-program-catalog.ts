import { listTextbooks } from '@/features/textbook/api/textbook-lnb-seed-catalog'
import type { TextbookRow } from '@/features/textbook/model/textbook.types'
import { formatInstitutionApplicationGradeDisplay } from '@/features/program/general/lib/institution-application-detail-edit-policy'
import {
  filterTextbooksForApplicant,
  filterTextbooksForIndividualApplicant,
  resolveProgramEducationTargets,
  textbookMatchesProgramEducationTargets,
} from '@/features/program/general/lib/filter-textbooks-for-applicant'
import { normalizeProgramBusinessAreaValue } from '@/features/program/shared/lib/program-detail-info-constants'
import type { MatchesParams } from '@/shared/api/generated/data-management/schemas'
import type { Program } from '@/types/domain'

/**
 * 기관·프로그램 폼용 — 사업분야 + 교육대상.
 * matches는 educationTarget을 하나만 받는다. 대상이 둘 이상이면 그 파라미터를 빼서
 * 다른 대상 교재가 응답에서 빠지지 않게 하고, 화면에서는 대상 합집합으로 거른다.
 */
export function buildTextbookMatchesParamsFromProgram(program: Program): MatchesParams {
  const educationTargets = resolveProgramEducationTargets(program)
  const businessArea = normalizeProgramBusinessAreaValue(program.businessArea) || undefined
  return {
    businessArea,
    educationTarget: educationTargets.length === 1 ? educationTargets[0] : undefined,
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

/** 참여 기관 교재 셀렉트 — 사업분야만 조회 */
export function buildParticipatingInstitutionTextbookMatchesParams(
  program: Program
): MatchesParams {
  const businessArea = normalizeProgramBusinessAreaValue(program.businessArea) || undefined
  return { businessArea }
}

export function serializeParticipatingInstitutionTextbookCatalogKey(program: Program): string {
  const params = buildParticipatingInstitutionTextbookMatchesParams(program)
  return `business-area|${params.businessArea ?? ''}`
}

export function listMockTextbooksByBusinessArea(program: Program): TextbookRow[] {
  const businessArea = normalizeProgramBusinessAreaValue(program.businessArea)
  if (!businessArea) return []
  return listTextbooks().filter(row => {
    if (row.useStatus !== 'USED') return false
    return normalizeProgramBusinessAreaValue(row.businessArea) === businessArea
  })
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
    return textbookMatchesProgramEducationTargets(row.educationTarget, educationTargets)
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
