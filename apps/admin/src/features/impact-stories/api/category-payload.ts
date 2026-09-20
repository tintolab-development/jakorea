/**
 * Admin 카테고리 list/create/update 응답 정규화
 * OpenAPI는 배열·CategoryResponse 이지만, `{success,data}` / `{items}` 도 허용
 */

export type CategoryPayloadRow = {
  id?: number
  name?: string
  storyCount?: number
  createdAt?: string
  updatedAt?: string
  version?: number
}

export function unwrapEnvelope<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const o = payload as Record<string, unknown>
    if (o.success === true && 'data' in o) {
      return unwrapEnvelope<T>(o.data)
    }
  }
  return payload as T
}

function isCategoryRow(row: unknown): row is CategoryPayloadRow {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return false
  const o = row as Record<string, unknown>
  if (typeof o.id === 'number') return Number.isFinite(o.id) && o.id > 0
  if (typeof o.id === 'string' && o.id.trim() !== '') {
    const n = Number(o.id)
    return Number.isFinite(n) && n > 0
  }
  return typeof o.name === 'string' && o.name.trim() !== ''
}

function asCategoryRows(value: unknown): CategoryPayloadRow[] {
  if (!Array.isArray(value)) return []
  return value.filter(isCategoryRow).map(row => {
    const id = typeof row.id === 'number' ? row.id : Number(row.id)
    return {
      ...row,
      ...(Number.isFinite(id) && id > 0 ? { id } : {}),
    }
  })
}

/** GET /categories — 배열 · envelope · `{items}` */
export function normalizeCategoryListPayload(payload: unknown): CategoryPayloadRow[] {
  const unwrapped = unwrapEnvelope<unknown>(payload)
  if (Array.isArray(unwrapped)) return asCategoryRows(unwrapped)
  if (unwrapped && typeof unwrapped === 'object') {
    const o = unwrapped as Record<string, unknown>
    if (Array.isArray(o.items)) return asCategoryRows(o.items)
    if (Array.isArray(o.content)) return asCategoryRows(o.content)
    if (Array.isArray(o.data)) return asCategoryRows(o.data)
  }
  return []
}

/** POST/PUT 단건 */
export function normalizeCategoryPayload(payload: unknown): CategoryPayloadRow {
  const unwrapped = unwrapEnvelope<unknown>(payload)
  if (!isCategoryRow(unwrapped)) {
    throw new Error('카테고리 응답이 올바르지 않습니다.')
  }
  const id = typeof unwrapped.id === 'number' ? unwrapped.id : Number(unwrapped.id)
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error('카테고리 응답이 올바르지 않습니다.')
  }
  return { ...unwrapped, id }
}
