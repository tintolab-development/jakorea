/** BE `distanceKm` 표시 — NAVER Maps 실측(편도 km, 소수 1자리). null/undefined = 미산출. */
export const API_DISTANCE_UNAVAILABLE_TOOLTIP = '주소 미등록 또는 거리 미산출'

/**
 * 거리 숫자만 포맷 — 항상 소수 1자리(`0.0km`, `12.0km`). `(장거리)` 접미어는 BE `longDistance` / `longDistanceYn`이 true일 때만.
 * FE에서 km 임계값으로 판정하지 않는다 (SSOT: SettlementAmountPolicy.isLongDistanceDisplay).
 */
export function formatApiDistanceKmDisplay(
  km: number | null | undefined,
  options?: { longDistance?: boolean | null }
): string {
  // `!km` 금지 — 0.0은 계산된 값이다. null/undefined만 미산출.
  if (km == null || Number.isNaN(km)) return '-'
  const core = `${km.toFixed(1)}km`
  if (options?.longDistance === true) {
    return `${core} (장거리)`
  }
  return core
}
