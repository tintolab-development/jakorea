/**
 * 1사1교 교사 화면 날짜 라벨 — 기획(11/10) 형식 「YYYY.MM.DD(요일)」. 예) 2026.11.12(목)
 * 플랫폼 공통 날짜 규칙(「YYYY년 MM월 DD일(요일)」)은 그대로 두고 1사1교 분기에서만 쓴다.
 */
import { toSeoulDisplayParts } from '../../../../../shared/lib/format-display-date.ts'

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'] as const

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

export function formatCompanySchoolDottedDate(input: string | null | undefined): string {
  const parts = toSeoulDisplayParts(input)
  if (!parts) return ''
  const weekday = WEEKDAY_KO[new Date(parts.year, parts.month - 1, parts.day).getDay()] ?? ''
  return `${parts.year}.${pad2(parts.month)}.${pad2(parts.day)}(${weekday})`
}
