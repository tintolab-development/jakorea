/**
 * FE 탭 key ↔ BE educationRegionCode.
 * 정본은 GET /api/admin/ujat/education-regions 의 `code` (대문자 시드·CUSTOM_*).
 * 빈 값·unknown 을 SEOUL 로 바꾸지 않는다.
 */

export function toUjatEducationRegionCode(regionKey: string): string {
  const trimmed = regionKey.trim()
  if (!trimmed) return ''
  if (/^[A-Z0-9_]+$/.test(trimmed)) return trimmed
  return trimmed.toUpperCase()
}

export function fromUjatEducationRegionCode(code: string | null | undefined): string {
  return code?.trim() ?? ''
}
