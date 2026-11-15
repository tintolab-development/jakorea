/**
 * UJAT 교육 진행 · 참여 기관 상세 — 기관 신청 상세 GET의 participant 상태(BE 2026-11 추가 필드).
 * generated 스키마 재생성 전이라 로컬 리더로 읽는다. 값이 없으면 null(보완 금지).
 */

/** 서버 ApplicationDecisionService.isAlreadyGivenUp 과 같은 값 */
const GIVEN_UP_PARTICIPANT_STATUSES = new Set([
  'GIVE_UP',
  'GAVE_UP',
  'WITHDRAWN',
  'WITHDRAWN_AFTER_START',
])

export type UjatInstitutionParticipantState = {
  /** program_participant.participant_status 원문. participant가 없으면 null */
  participantStatus: string | null
  /** AvailableActions.organizationParticipant. participant가 없으면 null */
  participantAvailableActions: string[] | null
  /**
   * 응답에 participantAvailableActions 키가 있었는지.
   * 필드 추가 전 서버(키 없음)에서는 버튼을 막지 않고 서버 give-up 검증에 맡긴다.
   */
  participantAvailableActionsProvided: boolean
}

export function readUjatInstitutionParticipantState(
  dto: object | null | undefined
): UjatInstitutionParticipantState {
  const record = (dto ?? {}) as {
    participantStatus?: unknown
    participantAvailableActions?: unknown
  }
  const status =
    typeof record.participantStatus === 'string' && record.participantStatus.trim()
      ? record.participantStatus.trim()
      : null
  const actions = Array.isArray(record.participantAvailableActions)
    ? record.participantAvailableActions.filter(
        (action): action is string => typeof action === 'string'
      )
    : null
  return {
    participantStatus: status,
    participantAvailableActions: actions,
    participantAvailableActionsProvided: Object.prototype.hasOwnProperty.call(
      record,
      'participantAvailableActions'
    ),
  }
}

export function isUjatInstitutionParticipantGivenUp(participantStatus: string | null): boolean {
  if (!participantStatus) return false
  return GIVEN_UP_PARTICIPANT_STATUSES.has(participantStatus.trim().toUpperCase())
}

/**
 * [활동 포기] 허용 — 서버 participantAvailableActions에 GIVE_UP이 있을 때만.
 * 필드 자체가 없는 이전 서버 응답이면 막지 않는다(서버가 PROGRAM_PARTICIPANT_GIVE_UP_NOT_ALLOWED로 검증).
 */
export function canRequestUjatInstitutionGiveUp(state: UjatInstitutionParticipantState): boolean {
  if (isUjatInstitutionParticipantGivenUp(state.participantStatus)) return false
  if (!state.participantAvailableActionsProvided) return true
  return state.participantAvailableActions?.includes('GIVE_UP') === true
}
