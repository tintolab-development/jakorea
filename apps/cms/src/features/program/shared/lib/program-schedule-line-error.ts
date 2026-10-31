/** BE B1~B4 — 일정 라인 파싱·ACTIVE 일정 필수. OpenAPI enum 없어도 wire `error.code`가 SoT. */

export const SCHEDULE_LINE_UNPARSEABLE = 'SCHEDULE_LINE_UNPARSEABLE' as const
export const GENERAL_PROGRAM_ACTIVE_SCHEDULE_REQUIRED =
  'GENERAL_PROGRAM_ACTIVE_SCHEDULE_REQUIRED' as const

export const SCHEDULE_LINE_UNPARSEABLE_MESSAGE =
  '교육 일정 날짜/시간 형식을 해석할 수 없습니다. 날짜와 시간을 확인해 주세요.'

export const GENERAL_PROGRAM_ACTIVE_SCHEDULE_REQUIRED_MESSAGE =
  '일정형 일반 프로그램에는 유효한 교육 일정이 필요합니다. 사전교육만으로는 일정형 요건을 충족하지 않습니다.'

export const PROGRAM_SCHEDULE_LINE_ERROR_MESSAGES: Record<string, string> = {
  [SCHEDULE_LINE_UNPARSEABLE]: SCHEDULE_LINE_UNPARSEABLE_MESSAGE,
  [GENERAL_PROGRAM_ACTIVE_SCHEDULE_REQUIRED]: GENERAL_PROGRAM_ACTIVE_SCHEDULE_REQUIRED_MESSAGE,
}

export function resolveProgramScheduleLineErrorMessage(
  code: string | undefined,
  serverMessage?: string | null
): string | undefined {
  if (!code || !PROGRAM_SCHEDULE_LINE_ERROR_MESSAGES[code]) return undefined
  const trimmed = serverMessage?.trim()
  if (trimmed && trimmed !== code) return trimmed
  return PROGRAM_SCHEDULE_LINE_ERROR_MESSAGES[code]
}
