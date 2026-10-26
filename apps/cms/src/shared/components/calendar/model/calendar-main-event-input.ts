/** `CalendarMain` 이벤트 모드 입력 — 주간 격자·툴팁·색상 맵과 공유 */
export type CalendarMainEventInput = {
  id: string | number
  title?: string
  startDate: string
  endDate: string
  originalItem?: unknown
  /** 주간 시간 격자: HH:mm. 없으면 종일(00:00–24:00) */
  startTime?: string
  endTime?: string
  timeGridLabel?: string
  weekGridSurface?: { bg: string; border: string; text: string }
  /** 주간 종일 집약 대표 선정 — 프로그램 운영 시작일(YYYY-MM-DD) */
  programOperationStartDate?: string
}
