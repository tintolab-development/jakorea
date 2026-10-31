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

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

export function mergeDevAutofillSparse<T extends Record<string, unknown>>(
  existing: T,
  incoming: T
): T {
  const next = { ...existing }
  for (const [key, incomingValue] of Object.entries(incoming)) {
    const current = existing[key as keyof T]
    // rounds 등 중첩 객체·배열은 칸 단위로 빈 슬롯만 채운다 (기수 curriculum 등).
    if (Array.isArray(current) && Array.isArray(incomingValue)) {
      const length = Math.max(current.length, incomingValue.length)
      const merged: unknown[] = []
      for (let index = 0; index < length; index += 1) {
        const curItem = current[index]
        const inItem = incomingValue[index]
        if (isPlainRecord(curItem) && isPlainRecord(inItem)) {
          merged[index] = mergeDevAutofillSparse(curItem, inItem)
        } else if (isDevAutofillBlankSlot(curItem)) {
          merged[index] = inItem
        } else {
          merged[index] = curItem
        }
      }
      next[key as keyof T] = merged as T[keyof T]
      continue
    }
    if (isPlainRecord(current) && isPlainRecord(incomingValue)) {
      next[key as keyof T] = mergeDevAutofillSparse(current, incomingValue) as T[keyof T]
      continue
    }
    if (!isDevAutofillBlankSlot(current)) continue
    next[key as keyof T] = incomingValue as T[keyof T]
  }
  return next
}
