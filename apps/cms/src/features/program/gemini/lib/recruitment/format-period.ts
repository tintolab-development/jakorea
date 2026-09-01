import dayjs from 'dayjs'
import { formatDateDot, formatDateRangeDot } from '@/shared/utils'

const KO_DOW = ['일', '월', '화', '수', '목', '금', '토'] as const

/** 목록 기간 날짜 — YYYY.MM.DD */
export function formatRecruitmentPeriodDate(iso: string): string {
  return formatDateDot(iso)
}

export function formatRecruitmentPeriodRange(start: string, end: string): string {
  return formatDateRangeDot(start, end)
}

/** `2025.12.08(월) 09:15` — 담당자명은 `DetailInfoForm.InputsSeparator`로 분리 */
export function formatRecruitmentAuditDate(iso: string): string {
  const x = dayjs(iso)
  if (!x.isValid()) return '-'
  return `${x.format('YYYY.MM.DD')}(${KO_DOW[x.day()]}) ${x.format('HH:mm')}`
}
