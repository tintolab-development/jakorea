/** 면접 진행 가능 시간 팝업 옵션 (QA-0350-4f7f) */

/** 값이 없을 때 팝업 시작 시각 09:00 (종료는 시작 + 1시간) */
export const INTERVIEW_TIME_DEFAULT_START = { hour: 9, minute: 0 } as const

/** 분 선택지는 슬롯 간격에 맞춘다 — 15분: 00/15/30/45, 30분: 00/30, 1시간: 00 */
export function interviewTimeMinuteStep(unit: string): number {
  const minutes = Number(unit)
  if (!Number.isFinite(minutes) || minutes <= 0) return 30
  return Math.min(60, minutes)
}
