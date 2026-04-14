/**
 * 회원 상세 등 진행년도 필터: 올해 포함 최근 5개 연도(올해 − 4 ~ 올해), 내림차순.
 * 예: 올해가 2026이면 2026, 2025, …, 2022.
 */
export function buildProgressYearSelectOptions(allValue = ''): { label: string; value: string }[] {
  const currentYear = new Date().getFullYear()
  const minYear = currentYear - 4
  const options: { label: string; value: string }[] = [{ label: '전체', value: allValue }]
  for (let y = currentYear; y >= minYear; y -= 1) {
    options.push({ label: `${y}년`, value: String(y) })
  }
  return options
}
