/** 발송 대상 프로그램 UI 상태: 미선택 | 전체(지정 해제) | 특정 프로그램 id */

export const NOTIFICATION_SEND_ALL_PROGRAM_ID = 'all'

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
 * 템플릿 선택 가능 여부.
 * - 미선택: 불가
 * - 전체(지정 해제) 또는 특정 프로그램: 가능
 */
export function canSelectNotificationSendTemplate(
  programId: string | undefined | null
): boolean {
  return !isNotificationSendProgramUnset(programId)
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

/** 대상 프로그램 필드 표시 라벨. 지정 해제(`all`)는 「미선택」. */
export function notificationSendProgramFieldLabel(
  programId: string | undefined | null,
  programName?: string | null
): string | undefined {
  if (isNotificationSendAllProgram(programId)) return '미선택'
  const name = programName?.trim()
  return name || undefined
}
