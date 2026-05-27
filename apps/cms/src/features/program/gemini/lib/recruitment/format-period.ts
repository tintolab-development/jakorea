import dayjs from 'dayjs'

const KO_DOW = ['일', '월', '화', '수', '목', '금', '토'] as const

/** `2026. 6. 10(월)` — 스크린샷 기간 표기 */
export function formatRecruitmentPeriodDate(iso: string): string {
  const x = dayjs(iso)
  return `${x.format('YYYY. M. D')}(${KO_DOW[x.day()]})`
}

export function formatRecruitmentPeriodRange(start: string, end: string): string {
  return `${formatRecruitmentPeriodDate(start)} ~ ${formatRecruitmentPeriodDate(end)}`
}

/** `2025. 12. 08(월) 09:15` — 담당자명은 `DetailInfoForm.InputsSeparator`로 분리 */
export function formatRecruitmentAuditDate(iso: string): string {
  const x = dayjs(iso)
  if (!x.isValid()) return '-'
  return `${x.format('YYYY. MM. DD')}(${KO_DOW[x.day()]}) ${x.format('HH:mm')}`
}
