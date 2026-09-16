import type { ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'
import { formatInstitutionApplicationGradeDisplay } from '@/features/program/general/lib/institution-application-detail-edit-policy'
import {
  filterTextbooksForApplicant,
  resolveTextbookOptionLabel,
} from '@/features/program/general/lib/filter-textbooks-for-applicant'
import type { TextbookRow } from '@/features/textbook/model/textbook.types'
import type { Program } from '@/types/domain'
import type { TextbookSelectOption } from '@/features/program/general/hooks/use-applicant-institution-detail-edit'

export const APPLICANT_INSTITUTION_TEXTBOOK_UNDECIDED_LABEL = '미정'

export function buildApplicantInstitutionTextbookOptions(
  program: Program | null | undefined,
  educationGrade: string | undefined,
  catalog?: TextbookRow[]
): TextbookSelectOption[] {
  if (!program) return []
  const grade = educationGrade?.trim()
  if (!grade) return []
  return filterTextbooksForApplicant(program, grade, catalog).map(row => ({
    value: row.id,
    label: resolveTextbookOptionLabel(row),
    textbookName: row.textbookName,
  }))
}

/** CMS 기관 신청 상세 — 교재명 (교육대상) 표시. 예: 성공하는 경제생활 (초등) */
export function resolveApplicantInstitutionTextbookDisplayLabel(params: {
  program: Program | null | undefined
  institution: ApplicantSchoolRow
  catalog?: TextbookRow[]
}): string {
  const { program, institution, catalog } = params
  const detail = institution.detail
  const textbookId = detail?.textbookId?.trim()
  const textbookName = detail?.textbookName?.trim()

  if (!textbookId && !textbookName) {
    return APPLICANT_INSTITUTION_TEXTBOOK_UNDECIDED_LABEL
  }

  const grade = formatInstitutionApplicationGradeDisplay(institution.educationGrade ?? '')
  const catalogRows = catalog ?? []

  const matchedById = textbookId ? catalogRows.find(row => row.id === textbookId) : undefined
  const matchedByName =
    !matchedById && textbookName
      ? catalogRows.find(row => row.textbookName.trim() === textbookName)
      : undefined
  const matched = matchedById ?? matchedByName

  if (matched) {
    return resolveTextbookOptionLabel(matched)
  }

  if (program && grade && textbookName) {
    const filtered = filterTextbooksForApplicant(program, grade, catalog)
    const fromFilter =
      (textbookId ? filtered.find(row => row.id === textbookId) : undefined) ??
      filtered.find(row => row.textbookName.trim() === textbookName)
    if (fromFilter) {
      return resolveTextbookOptionLabel(fromFilter)
    }
  }

  return textbookName || APPLICANT_INSTITUTION_TEXTBOOK_UNDECIDED_LABEL
}
