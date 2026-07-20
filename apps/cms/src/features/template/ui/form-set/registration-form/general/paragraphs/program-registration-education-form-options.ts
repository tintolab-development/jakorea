/** 교육 형태 — CmsSelect `options` / CmsRadio `value` 공통 */
export type ProgramRegistrationEducationFormOption = {
  value: string
  label: string
}

const PROGRAM_REGISTRATION_EDUCATION_FORM_BASE: ProgramRegistrationEducationFormOption[] = [
  { value: 'online', label: '온라인' },
  { value: 'offline', label: '오프라인' },
  { value: 'hybrid', label: '온/오프라인' },
]

const PROGRAM_REGISTRATION_EDUCATION_FORM_PARTICIPANT_SELECTION: ProgramRegistrationEducationFormOption =
  { value: 'participant_selection', label: '참여자 선택' }

export type ProgramRegistrationEducationFormOptionsContext = 'common' | 'perScheduleBlock'

/**
 * 참여자 유형이 학교/기관(`participantOrganization`)일 때만 「참여자 선택」 항목을 붙인다.
 * 개인만 선택된 경우는 기본 3개 옵션만.
 *
 * `perScheduleBlock` — 회차/세부 일정 블록 내 교육 형태: 일정 별 상이 설정 시「참여자 선택」제외.
 */
export function getProgramRegistrationEducationFormOptions(
  participantOrganization: boolean,
  options?: { context?: ProgramRegistrationEducationFormOptionsContext }
): ProgramRegistrationEducationFormOption[] {
  const context = options?.context ?? 'common'
  if (!participantOrganization || context === 'perScheduleBlock') {
    return [...PROGRAM_REGISTRATION_EDUCATION_FORM_BASE]
  }
  return [...PROGRAM_REGISTRATION_EDUCATION_FORM_BASE, PROGRAM_REGISTRATION_EDUCATION_FORM_PARTICIPANT_SELECTION]
}
