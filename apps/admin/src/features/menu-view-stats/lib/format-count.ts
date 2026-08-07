/** 조회수 표시 — 없으면 0 */
export function formatCount(value: number | undefined | null): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '0'
  return String(value)
}
