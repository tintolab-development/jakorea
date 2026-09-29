/** create POST 직전 — BE `serviceDetailJson must be a valid JSON object` / INVALID_VALUE 방지 */
export function assertServiceDetailJsonForCreate(
  value: string | undefined | null
): asserts value is string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('serviceDetailJson is required for program create')
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(value)
  } catch {
    throw new Error('serviceDetailJson must be a valid JSON object')
  }
  if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('serviceDetailJson must be a valid JSON object')
  }
}

/** overlay에 실수로 섞인 등록 완료 메타 — serviceDetailJson.registration에 넣지 않음 */
export function stripRegistrationOverlayDebugKeys(
  overlay: Record<string, unknown>
): Record<string, unknown> {
  const next = { ...overlay }
  delete next.idempotencyKey
  delete next.preparedFormBindings
  return next
}
