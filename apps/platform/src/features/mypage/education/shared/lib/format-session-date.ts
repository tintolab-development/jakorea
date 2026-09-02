const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'] as const

/** 2026년 04월 03일(금) */
export function formatEducationSessionDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const w = WEEKDAY_KO[date.getDay()] ?? ''
  return `${y}년 ${m}월 ${d}일(${w})`
}
