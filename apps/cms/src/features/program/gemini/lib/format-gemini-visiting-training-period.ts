import dayjs from 'dayjs'

const KO_DOW = ['일', '월', '화', '수', '목', '금', '토'] as const

/** `2026. 6. 10(월)` — 스크린샷 기간 표기 */
export function formatGeminiVisitingTrainingPeriodDate(iso: string): string {
  const x = dayjs(iso)
  return `${x.format('YYYY. M. D')}(${KO_DOW[x.day()]})`
}

export function formatGeminiVisitingTrainingPeriodRange(start: string, end: string): string {
  return `${formatGeminiVisitingTrainingPeriodDate(start)} ~ ${formatGeminiVisitingTrainingPeriodDate(end)}`
}
