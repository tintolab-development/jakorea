/**
 * TanStack Query key용 안정 직렬화.
 * undefined/null/빈 문자열을 빼고 키를 정렬해 JSON.stringify 흔들림·중복 캐시를 줄인다.
 */
export function stableNotificationQueryKey(input: Record<string, unknown>): string {
  const entries = Object.entries(input)
    .filter(([, value]) => {
      if (value === undefined || value === null) return false
      if (typeof value === 'string' && value.trim() === '') return false
      return true
    })
    .map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value] as const)
    .sort(([a], [b]) => a.localeCompare(b))
  return JSON.stringify(Object.fromEntries(entries))
}
