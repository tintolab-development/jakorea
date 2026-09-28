function isBlank(value: unknown): boolean {
  return value == null || (typeof value === 'string' && value.trim() === '')
}

/** 탭 복귀 시 빈 폼 값으로 overlay를 덮지 않기 위한 판정 */
export function isEmptyUjatRecruitOverlayValue(value: unknown): boolean {
  if (value == null) return true
  if (typeof value === 'string') return value.trim() === ''
  if (typeof value === 'boolean' || typeof value === 'number') return false
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    if ('name' in record || 'phone' in record || 'email' in record) {
      return isBlank(record.name) && isBlank(record.phone) && isBlank(record.email)
    }
    if ('start' in record || 'end' in record) {
      return isBlank(record.start) && isBlank(record.end)
    }
    if ('date' in record || 'method' in record) {
      return isBlank(record.date) && isBlank(record.method)
    }
  }
  return false
}

/** 비어 있지 않은 값만 override. 캐시 복원 시 live가 비면 base(캐시)를 유지한다. */
export function coalesceUjatRecruitOverlay(
  base: Record<string, unknown>,
  override: Record<string, unknown>
): Record<string, unknown> {
  const next = { ...base }
  for (const [key, value] of Object.entries(override)) {
    if (isEmptyUjatRecruitOverlayValue(value)) continue
    next[key] = value
  }
  return next
}
