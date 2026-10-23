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
export const PROGRAM_STRUCTURE_EDIT_PERIOD_ENDED = 'PROGRAM_STRUCTURE_EDIT_PERIOD_ENDED'
export const RECRUITMENT_HAS_APPLICATIONS = 'RECRUITMENT_HAS_APPLICATIONS'

export const PROGRAM_COMMON_INFO_EDIT_PERIOD_ENDED_MESSAGE =
  '사업 종료일 이후에는 공통 정보를 수정할 수 없습니다.'

export const PROGRAM_PARTICIPANT_TYPE_IMMUTABLE_MESSAGE =
  '모집 등록 후 참여자 유형은 변경할 수 없습니다.'

export const PROGRAM_STRUCTURE_EDIT_PERIOD_ENDED_MESSAGE =
  '최초 모집 시작일 이후에는 모집 단위(추가/삭제)를 변경할 수 없습니다.'

export const PROGRAM_RECRUITMENT_INFO_EDIT_BLOCKED_ALERT_TITLE =
  '모집 정보 수정 불가 안내'

export const PROGRAM_RECRUITMENT_ROW_EDIT_PERIOD_ENDED_MESSAGE =
  '모집 시작 후에는 모집 정보를 수정할 수 없습니다.'

export const RECRUITMENT_HAS_APPLICATIONS_MESSAGE =
  '신청자가 있는 모집은 삭제하거나 참여자 유형을 변경할 수 없습니다. 필요한 경우 상태를 INACTIVE로 변경해 주세요.'

export const PROGRAM_APPLICATION_FORM_EDIT_BLOCKED_ALERT_TITLE =
  '신청 양식 수정 불가 안내'

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

const RECRUITMENT_POLICY_MESSAGES: Record<string, string> = {
  [PROGRAM_PARTICIPANT_TYPE_IMMUTABLE]: PROGRAM_PARTICIPANT_TYPE_IMMUTABLE_MESSAGE,
  [PROGRAM_STRUCTURE_EDIT_PERIOD_ENDED]: PROGRAM_STRUCTURE_EDIT_PERIOD_ENDED_MESSAGE,
  [RECRUITMENT_HAS_APPLICATIONS]: RECRUITMENT_HAS_APPLICATIONS_MESSAGE,
  [PROGRAM_PARTICIPANT_RECRUITMENT_EDIT_PERIOD_ENDED]:
    PROGRAM_RECRUITMENT_ROW_EDIT_PERIOD_ENDED_MESSAGE,
  [PROGRAM_INSTRUCTOR_RECRUITMENT_EDIT_PERIOD_ENDED]:
    PROGRAM_RECRUITMENT_ROW_EDIT_PERIOD_ENDED_MESSAGE,
  [PROGRAM_VOLUNTEER_RECRUITMENT_EDIT_PERIOD_ENDED]:
    PROGRAM_RECRUITMENT_ROW_EDIT_PERIOD_ENDED_MESSAGE,
}

export function programRecruitmentPolicyErrorMessage(
  code: string | undefined | null
): string | undefined {
  const normalized = code?.trim()
  if (!normalized) return undefined
  return RECRUITMENT_POLICY_MESSAGES[normalized]
}

/**
 * 서버 `error.message`가 코드와 다르면 그 문장을 쓰고, 없으면 정책 문구를 쓴다.
 * 신청 양식과 모집 정보 저장이 같은 기간 코드를 쓰므로 서버 문장을 먼저 둔다.
 */
export function resolveProgramRecruitmentPolicyErrorMessage(
  code: string | undefined | null,
  serverMessage: string | undefined | null
): string | undefined {
  const fallback = programRecruitmentPolicyErrorMessage(code)
  if (!fallback) return undefined
  const server = serverMessage?.replace(/^CONFLICT:\s*/i, '').trim()
  if (server && server !== code?.trim()) return server
  return fallback
}

export function programEditWindowErrorMessage(code: string | undefined | null): string | undefined {
  const normalized = code?.trim()
  if (!normalized) return undefined
  if (normalized === PROGRAM_COMMON_INFO_EDIT_PERIOD_ENDED) {
    return PROGRAM_COMMON_INFO_EDIT_PERIOD_ENDED_MESSAGE
  }
  return programRecruitmentPolicyErrorMessage(normalized)
}
