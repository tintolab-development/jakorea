/** CMS 개인 봉사 배정과 동일. null/NaN → '-'. FE invent/0 coerce 금지. */
export function formatVolunteerDistanceKm(km: number | null | undefined): string {
  if (km == null || Number.isNaN(km)) return '-'
  const rounded = Math.round(km)
  return km >= 100 ? `${rounded}km (장거리)` : `${rounded}km`
}
