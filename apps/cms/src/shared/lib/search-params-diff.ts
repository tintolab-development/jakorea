/**
 * URL 쿼리 쓰기 중복 제거용 헬퍼.
 *
 * react-router는 값이 같아도 `replaceState`를 실행하므로, 결과가 동일한 정규화 쓰기는
 * 주소창만 한 번 더 바뀌게 만든다. `replace` 경로에서는 이 함수로 먼저 걸러낸다.
 */

export type SearchParamUpdates = Record<string, string | undefined | null>

/** `useQueryParams.setParams`와 동일한 삭제 규칙 */
function isRemoval(value: string | undefined | null): boolean {
  return value == null || value === '' || value === 'undefined'
}

/** updates를 base에 적용한 쿼리스트링 */
export function applySearchParamUpdates(
  base: string | URLSearchParams,
  updates: SearchParamUpdates
): string {
  const next = new URLSearchParams(base)
  for (const [key, value] of Object.entries(updates)) {
    if (isRemoval(value)) next.delete(key)
    else next.set(key, value as string)
  }
  return next.toString()
}

/** updates를 현재 주소에 적용했을 때 쿼리스트링이 실제로 달라지는지 */
export function searchWithUpdatesDiffersFromLocation(
  updates: SearchParamUpdates,
  search: string = typeof window !== 'undefined' ? window.location.search : ''
): boolean {
  const current = new URLSearchParams(search)
  return applySearchParamUpdates(current, updates) !== current.toString()
}
