/**
 * CMS 개인 봉사 배정과 동일 semantics.
 * BE `distanceKm`만 표시 — 실측 number 또는 null(지오코딩/경로 실패) → '-'. 클라이언트 재계산 금지.
 * `(장거리)` 접미어는 BE `longDistance`가 true일 때만. km 임계값 판정 금지.
 * 자택 geocoding query 규칙: `@jakorea/location/juso` `BE_MEMBER_ADDRESS_GEOCODING_QA_ONE_LINER`
 */
export const VOLUNTEER_DISTANCE_UNAVAILABLE_TOOLTIP = '주소 미등록 또는 거리 미산출'

export function formatVolunteerDistanceKm(
  km: number | null | undefined,
  options?: { longDistance?: boolean | null }
): string {
  if (km == null || Number.isNaN(km)) return '-'
  const oneDecimal = Math.round(km * 10) / 10
  const label = `${oneDecimal.toFixed(1).replace(/\.0$/, '')}km`
  if (options?.longDistance === true) {
    return `${label} (장거리)`
  }
  return label
}
