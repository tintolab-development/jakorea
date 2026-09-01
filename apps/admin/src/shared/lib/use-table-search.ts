/**
 * pending 필터 → URL 쿼리 반영.
 * CMS `use-table-search` 이식 (TanStack table 동기화 제외).
 * `filtersRef`는 매 렌더 최신 pending을 가리키므로 조회 직후에도 올바른 스냅샷을 읽는다.
 */

import { useCallback, type MutableRefObject } from 'react'

/** 단일 쿼리 키 ↔ filters 필드 매핑 */
export type TableSearchParamRuleParam<TFilters extends Record<string, unknown>> = {
  kind: 'param'
  filterKey: keyof TFilters & string
  paramKey: string
  /** false면 해당 paramKey 삭제 */
  condition?: (filters: TFilters, value: unknown) => boolean
  /** set 직전 문자열화 (trim, 날짜 포맷 등) */
  transform?: (value: unknown) => string
}

/** 두 개 이상의 쿼리 키·조건을 한 번에 다룰 때 */
export type TableSearchParamRuleApply<TFilters> = {
  kind: 'apply'
  apply: (nextParams: URLSearchParams, filters: TFilters) => void
}

export type TableSearchParamRule<TFilters extends Record<string, unknown>> =
  | TableSearchParamRuleParam<TFilters>
  | TableSearchParamRuleApply<TFilters>

/** react-router `useSearchParams()[1]`와 호환 */
export type TableSearchSetSearchParams = (
  nextInit:
    | URLSearchParams
    | Record<string, string | string[]>
    | ((prev: URLSearchParams) => URLSearchParams),
  navigateOpts?: { replace?: boolean; state?: unknown }
) => void

export interface UseTableSearchOptions<TFilters extends Record<string, unknown>> {
  filtersRef: MutableRefObject<TFilters>
  setSearchParams: TableSearchSetSearchParams
  paramConfig: readonly TableSearchParamRule<TFilters>[]
  afterApplyParams?: (nextParams: URLSearchParams, filters: TFilters) => void
}

export interface UseTableSearchReturn {
  applySearch: () => void
}

function defaultShouldSetParam<TFilters extends Record<string, unknown>>(
  _filters: TFilters,
  value: unknown
): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.length > 0
  return true
}

export function mergeFiltersIntoSearchParams<TFilters extends Record<string, unknown>>(
  nextParams: URLSearchParams,
  filtersLive: TFilters,
  paramConfig: readonly TableSearchParamRule<TFilters>[],
  afterApplyParams?: (next: URLSearchParams, f: TFilters) => void
): void {
  for (const rule of paramConfig) {
    if (rule.kind === 'apply') {
      rule.apply(nextParams, filtersLive)
      continue
    }

    const raw: unknown = filtersLive[rule.filterKey]
    const shouldSet =
      rule.condition?.(filtersLive, raw) ?? defaultShouldSetParam(filtersLive, raw)

    if (!shouldSet) {
      nextParams.delete(rule.paramKey)
      continue
    }

    const str = rule.transform ? rule.transform(raw) : String(raw)
    nextParams.set(rule.paramKey, str)
  }

  afterApplyParams?.(nextParams, filtersLive)
}

export function useTableSearch<TFilters extends Record<string, unknown>>({
  filtersRef,
  setSearchParams,
  paramConfig,
  afterApplyParams,
}: UseTableSearchOptions<TFilters>): UseTableSearchReturn {
  const applySearch = useCallback(() => {
    const filtersLive = filtersRef.current

    setSearchParams(prev => {
      const nextParams = new URLSearchParams(prev.toString())
      mergeFiltersIntoSearchParams(nextParams, filtersLive, paramConfig, afterApplyParams)
      return nextParams
    }, { replace: true })
  }, [filtersRef, setSearchParams, paramConfig, afterApplyParams])

  return { applySearch }
}
