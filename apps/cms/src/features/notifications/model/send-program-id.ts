/** 발송 대상 프로그램 UI 상태: 미선택 | 전체(지정 해제) | 특정 프로그램 id */

export const NOTIFICATION_SEND_ALL_PROGRAM_ID = 'all'

/** POST send-batches 수신자 상한 (SSOT 2026-09-14). 자동 전수 분할 없음. */
export const NOTIFICATION_SEND_BATCH_RECIPIENT_LIMIT = 500

export function isNotificationSendProgramUnset(
  programId: string | undefined | null
): boolean {
  const trimmed = programId?.trim() ?? ''
  return trimmed.length === 0
}

export function isNotificationSendAllProgram(
  programId: string | undefined | null
): boolean {
  return (programId?.trim() ?? '').toLowerCase() === NOTIFICATION_SEND_ALL_PROGRAM_ID
}

/**
 * 대상 프로그램 미선택(진입 빈 값 · 지정 해제 `all`).
 * HTTP `programId` omit · 전체 활성 회원 후보.
 */
export function isNotificationSendWithoutProgram(
  programId: string | undefined | null
): boolean {
  return isNotificationSendProgramUnset(programId) || isNotificationSendAllProgram(programId)
}

/**
 * 템플릿 선택 가능 여부.
 * 미선택(전체회원) · 특정 프로그램 모두 가능.
 * `requiresProgram` 키 템플릿 비활성은 피커/`canUseNotificationSendTemplateForProgram`에서 처리.
 */
export function canSelectNotificationSendTemplate(
  _programId: string | undefined | null
): boolean {
  return true
}

/** BE `programId` int64. `'all'`·빈 값·비숫자는 undefined. */
export function parseNotificationSendProgramId(
  raw: string | undefined | null
): number | undefined {
  const trimmed = raw?.trim()
  if (!trimmed || trimmed.toLowerCase() === NOTIFICATION_SEND_ALL_PROGRAM_ID) {
    return undefined
  }
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : undefined
}

/** 대상 프로그램 필드 표시 라벨. 진입 기본·지정 해제 모두 「미선택」(placeholder 문구 금지). */
export function notificationSendProgramFieldLabel(
  programId: string | undefined | null,
  programName?: string | null
): string | undefined {
  if (isNotificationSendWithoutProgram(programId)) {
    return '미선택'
  }
  const name = programName?.trim()
  return name || undefined
}
