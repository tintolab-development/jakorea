/**
 * 일반 프로그램 상세 표시 — null/빈값만 "-", false·enum·0·[]는 의미 있는 라벨로.
 */

export function isBlankDisplayValue(value: unknown): boolean {
  if (value == null) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  return false
}

/** 첫 non-null / non-empty 후보 */
export function pickDisplayValue<T>(...candidates: Array<T | null | undefined>): T | undefined {
  for (const candidate of candidates) {
    if (isBlankDisplayValue(candidate)) continue
    return candidate as T
  }
  return undefined
}

export function pickDisplayString(...candidates: Array<string | null | undefined>): string {
  return pickDisplayValue(...candidates) ?? '-'
}

export function labelBool(
  value: boolean | null | undefined,
  yes: string,
  no: string
): string {
  if (value == null) return '-'
  return value ? yes : no
}

export function labelEnum(
  value: string | null | undefined,
  map: Record<string, string>
): string {
  if (value == null || value === '') return '-'
  return map[value] ?? value
}

export function formatCountLabel(value: number | null | undefined, suffix: string): string {
  if (value == null || Number.isNaN(value)) return '-'
  return `${value}${suffix}`
}
