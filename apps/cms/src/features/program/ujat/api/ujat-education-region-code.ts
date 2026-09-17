/**
 * FE region key ↔ BE educationRegionCode
 * BE seed: SEOUL, GYEONGGI_SOUTH, …
 */

export function toUjatEducationRegionCode(regionKey: string): string {
  const trimmed = regionKey.trim()
  if (!trimmed) return 'SEOUL'
  if (/^[A-Z0-9_]+$/.test(trimmed)) return trimmed
  return trimmed.toUpperCase()
}

export function fromUjatEducationRegionCode(code: string | null | undefined): string {
  const trimmed = code?.trim()
  if (!trimmed) return 'seoul'
  return trimmed.toLowerCase()
}
