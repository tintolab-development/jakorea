/**
 * 프로그램 수정 가능 기간 409 — codegen 없이 코드 문자열을 직접 비교한다.
 * 모집 기간 코드는 모집 저장과 신청 양식 저장이 문장이 다르므로, 서버 `error.message`를 우선한다.
 */

export const PROGRAM_COMMON_INFO_EDIT_PERIOD_ENDED = 'PROGRAM_COMMON_INFO_EDIT_PERIOD_ENDED'
export const PROGRAM_PARTICIPANT_TYPE_IMMUTABLE = 'PROGRAM_PARTICIPANT_TYPE_IMMUTABLE'
export const PROGRAM_PARTICIPANT_RECRUITMENT_EDIT_PERIOD_ENDED =
  'PROGRAM_PARTICIPANT_RECRUITMENT_EDIT_PERIOD_ENDED'
export const PROGRAM_INSTRUCTOR_RECRUITMENT_EDIT_PERIOD_ENDED =
  'PROGRAM_INSTRUCTOR_RECRUITMENT_EDIT_PERIOD_ENDED'
export const PROGRAM_VOLUNTEER_RECRUITMENT_EDIT_PERIOD_ENDED =
  'PROGRAM_VOLUNTEER_RECRUITMENT_EDIT_PERIOD_ENDED'

export const PROGRAM_COMMON_INFO_EDIT_PERIOD_ENDED_MESSAGE =
  '사업 종료일 이후에는 공통 정보를 수정할 수 없습니다.'

export const PROGRAM_PARTICIPANT_TYPE_IMMUTABLE_MESSAGE =
  '참여자 유형은 프로그램 등록 후 수정할 수 없습니다.'

/** 신청 양식 저장이 모집 시작 이후 거절될 때의 서버 문장. 클라이언트 선차단에도 쓴다. */
export const PROGRAM_APPLICATION_FORM_EDIT_PERIOD_ENDED_MESSAGE =
  '모집 시작 이후에는 신청 양식을 수정할 수 없습니다.'

/** @deprecated 신청 양식 문장. `PROGRAM_APPLICATION_FORM_EDIT_PERIOD_ENDED_MESSAGE` */
export const PROGRAM_RECRUITMENT_EDIT_PERIOD_ENDED_MESSAGE =
  PROGRAM_APPLICATION_FORM_EDIT_PERIOD_ENDED_MESSAGE

export const PROGRAM_RECRUITMENT_INFO_OPERATION_STARTED_MESSAGE =
  '프로그램 운영이 시작된 이후에는 모집 정보를 수정할 수 없습니다.'

const RECRUITMENT_EDIT_PERIOD_CODES = new Set([
  PROGRAM_PARTICIPANT_RECRUITMENT_EDIT_PERIOD_ENDED,
  PROGRAM_INSTRUCTOR_RECRUITMENT_EDIT_PERIOD_ENDED,
  PROGRAM_VOLUNTEER_RECRUITMENT_EDIT_PERIOD_ENDED,
])

export function isProgramRecruitmentEditPeriodCode(code: string | undefined | null): boolean {
  const normalized = code?.trim()
  return normalized != null && RECRUITMENT_EDIT_PERIOD_CODES.has(normalized)
}

export function programEditWindowErrorMessage(code: string | undefined | null): string | undefined {
  const normalized = code?.trim()
  if (!normalized) return undefined
  if (normalized === PROGRAM_COMMON_INFO_EDIT_PERIOD_ENDED) {
    return PROGRAM_COMMON_INFO_EDIT_PERIOD_ENDED_MESSAGE
  }
  if (normalized === PROGRAM_PARTICIPANT_TYPE_IMMUTABLE) {
    return PROGRAM_PARTICIPANT_TYPE_IMMUTABLE_MESSAGE
  }
  return undefined
}
