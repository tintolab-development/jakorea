/** 진행년도 필터 — 전체. 목록 조회에서는 `businessYear`를 생략한다. */
export const UJAT_PROGRESS_YEAR_ALL = '__all__' as const

export type UjatProgressYearFilter = typeof UJAT_PROGRESS_YEAR_ALL | number

export type UjatProgressYearOption = {
  label: string
  value: UjatProgressYearFilter
}

/** API `years`만 선택지로 쓴다. 빈 배열이면 「전체」만 남기고 연도를 만들지 않는다. */
export function buildUjatProgressYearFieldOptions(
  years: readonly number[]
): UjatProgressYearOption[] {
  const yearOptions = years.flatMap(year =>
    Number.isInteger(year) ? [{ label: `${year}년`, value: year }] : []
  )
  return [{ label: '전체', value: UJAT_PROGRESS_YEAR_ALL }, ...yearOptions]
}
