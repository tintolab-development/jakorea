/** BE `distanceKm` 표시 — NAVER Maps 실측(편도 km, 소수 1자리). null/undefined = 미산출. */
export const API_DISTANCE_UNAVAILABLE_TOOLTIP = '주소 미등록 또는 거리 미산출'

export function formatApiDistanceKmDisplay(
  km: number | null | undefined,
  options?: { longDistanceSuffix?: boolean }
): string {
  if (km == null || Number.isNaN(km)) return '-'
  const oneDecimal = Math.round(km * 10) / 10
  const core = `${oneDecimal.toFixed(1).replace(/\.0$/, '')}km`
  if (options?.longDistanceSuffix && oneDecimal >= 100) {
    return `${core} (장거리)`
  }
  return core
}
