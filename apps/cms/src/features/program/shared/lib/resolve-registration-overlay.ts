export type ServiceDetailOverlaySource = {
  registration?: {
    overlay?: Record<string, unknown> | null
  } | null
  /**
   * Legacy JSON root. 더 이상 읽지 않는다(루트만 있는 행 0건 확인 후 part4에서 제거).
   * 쓰기 경로는 `omitRootRegistrationOverlay`로 계속 떼어 낸다.
   */
  registrationOverlay?: Record<string, unknown> | null
}

export function isRegistrationOverlayRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

/**
 * 조회용 overlay 정본 = 안쪽 `registration.overlay`만.
 * 루트 `registrationOverlay`는 읽지 않는다(레거시 fallback 제거).
 */
export function resolveRegistrationOverlay(
  detail: ServiceDetailOverlaySource | null | undefined
): Record<string, unknown> {
  return isRegistrationOverlayRecord(detail?.registration?.overlay)
    ? { ...detail.registration.overlay }
    : {}
}

export function resolvedRegistrationOverlayOrUndefined(
  detail: ServiceDetailOverlaySource | null | undefined
): Record<string, unknown> | undefined {
  const merged = resolveRegistrationOverlay(detail)
  return Object.keys(merged).length > 0 ? merged : undefined
}

/** 일반·봉사자·1사1교 persist JSON에서 루트 사본을 제거한다. TT/UJAT/Gemini에는 쓰지 말 것. */
export function omitRootRegistrationOverlay<T extends Record<string, unknown>>(
  serviceDetail: T
): Omit<T, 'registrationOverlay'> {
  if (!Object.prototype.hasOwnProperty.call(serviceDetail, 'registrationOverlay')) {
    return serviceDetail
  }
  const { registrationOverlay: _drop, ...rest } = serviceDetail
  return rest
}
