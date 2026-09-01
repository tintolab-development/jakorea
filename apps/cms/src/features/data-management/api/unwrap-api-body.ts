/** Orval axios 응답에서 실제 DTO body 추출 (공통 API 래퍼 대응) */
export function unwrapApiBody<T>(payload: unknown): T {
  if (payload != null && typeof payload === 'object') {
    const o = payload as Record<string, unknown>
    if (o.success === true && 'data' in o) {
      return unwrapApiBody(o.data)
    }
    if (
      'data' in o &&
      'status' in o &&
      typeof (o as { status: unknown }).status === 'number'
    ) {
      return (o as { data: T }).data
    }
  }
  return payload as T
}
