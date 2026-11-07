function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

function hasDashboardDtoShape(value: Record<string, unknown>): boolean {
  return (
    'programCount' in value ||
    'items' in value ||
    'summaries' in value ||
    'unreadCount' in value ||
    'counts' in value ||
    'widgetId' in value ||
    'updatedCount' in value
  )
}

/** 대시보드 DTO는 ApiResponse 래퍼 없이 최상위 필드를 쓴다. envelope만 벗긴다. */
export function unwrapDashboardBody<T>(payload: unknown): T {
  if (!isRecord(payload)) return payload as T
  if (hasDashboardDtoShape(payload)) return payload as T
  const nested = payload.data
  if (isRecord(nested) && hasDashboardDtoShape(nested)) {
    return nested as T
  }
  const looksLikeEnvelope =
    isRecord(nested) &&
    (('success' in payload && typeof payload.success === 'boolean') ||
      (typeof payload.status === 'number' && !('programCount' in payload) && !('items' in payload)))
  if (looksLikeEnvelope) return nested as T
  return payload as T
}
