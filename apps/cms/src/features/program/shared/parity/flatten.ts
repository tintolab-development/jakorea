/** parity diff용 — 중첩 객체를 dot path → primitive 로 평탄화 */

export type FlatRecord = Record<string, string | number | boolean | null>

const MAX_DEPTH = 12

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

export function flattenForParity(
  value: unknown,
  prefix = '',
  depth = 0,
  out: FlatRecord = {}
): FlatRecord {
  if (depth > MAX_DEPTH) {
    if (prefix) out[prefix] = '[max_depth]'
    return out
  }
  if (value == null) {
    if (prefix) out[prefix] = null
    return out
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    if (prefix) out[prefix] = value
    return out
  }
  if (Array.isArray(value)) {
    if (prefix) out[prefix] = JSON.stringify(value)
    return out
  }
  if (!isPlainObject(value)) {
    if (prefix) out[prefix] = String(value)
    return out
  }
  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key
    flattenForParity(child, path, depth + 1, out)
  }
  return out
}

export function normalizeHtmlForParity(html: string | undefined | null): string {
  if (!html?.trim()) return ''
  return html.replace(/\s+/g, ' ').trim()
}
