/**
 * 공식 OpenAPI 스키마에 없으나 런타임 JSON에 남을 수 있는 필드 읽기(계약 갱신 전 하위호환).
 * 새 필드는 BE OpenAPI 반영 후 generated 타입으로 이전한다.
 */
export function readRuntimeField(
  record: object,
  key: string
): unknown {
  return (record as Record<string, unknown>)[key]
}

export function readRuntimeString(record: object, key: string): string | undefined {
  const value = readRuntimeField(record, key)
  if (value == null) return undefined
  if (typeof value === 'string') return value
  return String(value)
}

export function readRuntimeNumber(record: object, key: string): number | undefined {
  const value = readRuntimeField(record, key)
  if (typeof value === 'number' && Number.isFinite(value)) return value
  return undefined
}

export function readRuntimeBoolean(record: object, key: string): boolean | undefined {
  const value = readRuntimeField(record, key)
  if (typeof value === 'boolean') return value
  return undefined
}
