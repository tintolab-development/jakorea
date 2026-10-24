export type ServiceDetailOverlaySource = {
  registration?: {
    overlay?: Record<string, unknown> | null
  } | null
  /** Legacy JSON root. Read compatibility only — do not send on new writes. */
  registrationOverlay?: Record<string, unknown> | null
}

export function isRegistrationOverlayRecord(
  value: unknown
): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

/**
 * 조회용 overlay 정본.
 * 루트 레거시 위에 안쪽 `registration.overlay`를 덮는다.
 * `null` / `false` / `0` / `[]` / `{}` 도 안쪽 값이면 루트로 대체하지 않는다.
 */
export function resolveRegistrationOverlay(
  detail: ServiceDetailOverlaySource | null | undefined
): Record<string, unknown> {
  const legacy = isRegistrationOverlayRecord(detail?.registrationOverlay)
    ? detail.registrationOverlay
    : {}
  const nested = isRegistrationOverlayRecord(detail?.registration?.overlay)
    ? detail.registration.overlay
    : {}
  return { ...legacy, ...nested }
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
