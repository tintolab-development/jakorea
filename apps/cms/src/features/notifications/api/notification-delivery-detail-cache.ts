/** 알림 발송 상세 원문 — 목록 캐시와 분리, 닫기·오류 시 잔존 금지 (Class G). */

export const notificationDeliveryDetailQueryCache = {
  staleTime: 0,
  gcTime: 0,
  retry: false as const,
} as const

/** 상세 GET 실패·미도착이면 목록 row를 원문으로 쓰지 않는다. */
export function notificationDeliveryDetailView<T>(
  detail: T | undefined,
  isError: boolean
): T | null {
  if (isError) return null
  return detail ?? null
}
