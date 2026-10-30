/**
 * DEV 자동입력 — 사용자가 이미 고른 값은 덮지 않고 빈 칸만 채운다.
 */

export function isDevAutofillBlankSlot(value: unknown): boolean {
  if (value == null) return true
  if (typeof value === 'boolean') return false
  if (typeof value === 'number') return !Number.isFinite(value)
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0 || value.every(isDevAutofillBlankSlot)
  if (typeof value === 'object') {
    const entries = Object.values(value as Record<string, unknown>)
    return entries.length === 0 || entries.every(isDevAutofillBlankSlot)
  }
  return false
}

export function mergeDevAutofillSparse<T extends Record<string, unknown>>(
  existing: T,
  incoming: T
): T {
  const next = { ...existing }
  for (const [key, incomingValue] of Object.entries(incoming)) {
    const current = existing[key as keyof T]
    if (!isDevAutofillBlankSlot(current)) continue
    next[key as keyof T] = incomingValue as T[keyof T]
  }
  return next
}
