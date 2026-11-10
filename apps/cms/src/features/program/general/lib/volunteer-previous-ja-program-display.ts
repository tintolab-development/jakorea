import type { VolunteerApplicationEvidenceAttachment } from '@/features/program/general/model/volunteer-applicant'

/** 일반 봉사자 신청서 「이전 참여 JA 봉사 프로그램」 문항 키 (첨부 연결 키와 동일) */
export const GENERAL_VOLUNTEER_PREVIOUS_JA_PROGRAM_QUESTION_KEY =
  'program-volunteer-application-seed-previous-ja-program'

const PREVIOUS_JA_PROGRAM_JOINER = ' · '

/**
 * `previousJaProgram`(「2023 · 프로그램명」) → 표시 조각.
 * 시안: `2023년 | [프로그램명]` — 연도가 4자리 숫자면 `년`을 붙인다.
 */
export function splitGeneralVolunteerPreviousJaProgram(value: string | undefined): string[] {
  const trimmed = value?.trim()
  if (!trimmed) return []
  const joinerIndex = trimmed.indexOf(PREVIOUS_JA_PROGRAM_JOINER)
  if (joinerIndex < 0) return [formatYear(trimmed)]
  const year = trimmed.slice(0, joinerIndex).trim()
  const name = trimmed.slice(joinerIndex + PREVIOUS_JA_PROGRAM_JOINER.length).trim()
  return [formatYear(year), name].filter(Boolean)
}

function formatYear(value: string): string {
  return /^\d{4}$/.test(value) ? `${value}년` : value
}

/** 증빙 첨부 중 이전 참여 JA 문항 첨부만. questionKey가 비어 있으면 포함한다. */
export function filterGeneralVolunteerPreviousJaProgramAttachments(
  files: readonly VolunteerApplicationEvidenceAttachment[] | undefined
): VolunteerApplicationEvidenceAttachment[] {
  return (files ?? []).filter(
    file => !file.questionKey || file.questionKey === GENERAL_VOLUNTEER_PREVIOUS_JA_PROGRAM_QUESTION_KEY
  )
}

/** JA 경험 「있음」이거나 답·첨부가 있으면 섹션 노출 (경험 「없음」이면 숨김 문항) */
export function shouldShowGeneralVolunteerPreviousJaProgramSection(applicant: {
  hasJaVolunteerExperience: boolean
  previousJaProgram?: string
  evidenceAttachments?: readonly VolunteerApplicationEvidenceAttachment[]
}): boolean {
  if (applicant.hasJaVolunteerExperience) return true
  if (applicant.previousJaProgram?.trim()) return true
  return filterGeneralVolunteerPreviousJaProgramAttachments(applicant.evidenceAttachments).length > 0
}
