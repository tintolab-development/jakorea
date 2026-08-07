/** 방문자 수 — 천 단위 구분 */
export function formatVisitorCount(value: number | undefined | null): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '0'
  return value.toLocaleString('ko-KR')
}
