/** 이전 활동 기수 표시 — 저장값이 `30` / `30기` 모두 `30기`로 맞춘다. */
export function formatUjatPreviousActivityTermLabel(term: string | null | undefined): string {
  const raw = term?.trim().replace(/기$/u, '') ?? ''
  return raw ? `${raw}기` : ''
}

/** 이전 활동 년도 표시 — `2023` / `2023년도` 모두 `2023년도`로 맞춘다. */
export function formatUjatPreviousActivityYearLabel(year: string | null | undefined): string {
  const raw = year?.trim().replace(/년도$/u, '') ?? ''
  return raw ? `${raw}년도` : ''
}
