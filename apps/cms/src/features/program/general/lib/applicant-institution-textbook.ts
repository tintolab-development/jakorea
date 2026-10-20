import type { ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'
import { formatInstitutionApplicationGradeDisplay } from '@/features/program/general/lib/institution-application-detail-edit-policy'
import {
  filterTextbooksForIndividualApplicant,
  resolveIndividualTextbookOptionLabel,
} from '@/features/program/general/lib/filter-textbooks-for-applicant'
import {
  TEXTBOOK_NOT_USED_OPTION_VALUE,
  buildIndividualApplicantTextbookOptions,
} from '@/features/program/general/lib/individual-applicant-textbook'
import type { TextbookRow } from '@/features/textbook/model/textbook.types'
import type { Program } from '@/types/domain'
import type { TextbookSelectOption } from '@/features/program/general/hooks/use-applicant-institution-detail-edit'

/** 미지정(textbook null) 표시 — 개인 신청자와 동일 */
export const APPLICANT_INSTITUTION_TEXTBOOK_UNDECIDED_LABEL = '해당 없음'

/**
 * 기관 신청·참여 기관 교재 셀렉.
 * 프로그램 사업 분야 + 신청 학년 포함 교재. 라벨 `교재명 educationTarget`, 맨 앞 「해당 없음」.
 */
export function buildApplicantInstitutionTextbookOptions(
  program: Program | null | undefined,
  educationGrade: string | undefined,
  catalog?: TextbookRow[]
): TextbookSelectOption[] {
  return buildIndividualApplicantTextbookOptions(program, educationGrade?.trim() ?? '', catalog)
}

/** CMS 기관 신청·참여 상세 — 교재명 educationTarget 표시. 예: 성공하는 경제생활 초등학교 */
export function resolveApplicantInstitutionTextbookDisplayLabel(params: {
  program: Program | null | undefined
  institution: ApplicantSchoolRow
  catalog?: TextbookRow[]
}): string {
  const { program, institution, catalog } = params
  const detail = institution.detail
  const textbookId = detail?.textbookId?.trim()
  const textbookName = detail?.textbookName?.trim()

  if (
    (!textbookId && !textbookName) ||
    textbookId === TEXTBOOK_NOT_USED_OPTION_VALUE ||
    textbookName === APPLICANT_INSTITUTION_TEXTBOOK_UNDECIDED_LABEL
  ) {
    return APPLICANT_INSTITUTION_TEXTBOOK_UNDECIDED_LABEL
  }

  const grade = formatInstitutionApplicationGradeDisplay(institution.educationGrade ?? '')
  const catalogRows = catalog ?? []

  const matchedById =
    textbookId && textbookId !== TEXTBOOK_NOT_USED_OPTION_VALUE
      ? catalogRows.find(row => row.id === textbookId)
      : undefined
  const matchedByName =
    !matchedById && textbookName && textbookName !== APPLICANT_INSTITUTION_TEXTBOOK_UNDECIDED_LABEL
      ? catalogRows.find(row => row.textbookName.trim() === textbookName)
      : undefined
  const matched = matchedById ?? matchedByName

  if (matched) {
    return resolveIndividualTextbookOptionLabel(matched)
  }

  if (
    program &&
    grade &&
    textbookName &&
    textbookName !== APPLICANT_INSTITUTION_TEXTBOOK_UNDECIDED_LABEL
  ) {
    const filtered = filterTextbooksForIndividualApplicant(program, grade, catalog)
    const fromFilter =
      (textbookId ? filtered.find(row => row.id === textbookId) : undefined) ??
      filtered.find(row => row.textbookName.trim() === textbookName)
    if (fromFilter) {
      return resolveIndividualTextbookOptionLabel(fromFilter)
    }
  }

  return textbookName || APPLICANT_INSTITUTION_TEXTBOOK_UNDECIDED_LABEL
}
