/**
 * 테이블 검색 시 pending 필터를 URL 쿼리와 TanStack Table 컬럼 필터에 선언적으로 반영한다.
 */

import { useCallback } from 'react'
import type { Table } from '@tanstack/react-table'

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

/** react-router `useSearchParams()[1]`와 호환 — 훅 내부에서는 URLSearchParams만 전달한다. */
export type TableSearchSetSearchParams = (
  nextInit: URLSearchParams,
  navigateOpts?: { replace?: boolean; state?: unknown }
) => void

export interface UseTableSearchOptions<
  TFilters extends Record<string, unknown>,
  TData = unknown,
> {
  filters: TFilters
  searchParams: URLSearchParams
  setSearchParams: TableSearchSetSearchParams
  table?: Table<TData>
  paramConfig: readonly TableSearchParamRule<TFilters>[]
  tableConfig: Record<string, (filters: TFilters) => unknown>
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

export function useTableSearch<
  TFilters extends Record<string, unknown>,
  TData = unknown,
>({
  filters,
  searchParams,
  setSearchParams,
  table,
  paramConfig,
  tableConfig,
  afterApplyParams,
}: UseTableSearchOptions<TFilters, TData>): UseTableSearchReturn {
  const applySearch = useCallback(() => {
    const nextParams = new URLSearchParams(searchParams)

    for (const rule of paramConfig) {
      if (rule.kind === 'apply') {
        rule.apply(nextParams, filters)
        continue
      }

      const raw: unknown = filters[rule.filterKey]
      const shouldSet =
        rule.condition?.(filters, raw) ?? defaultShouldSetParam(filters, raw)

      if (!shouldSet) {
        nextParams.delete(rule.paramKey)
        continue
      }

      const str = rule.transform ? rule.transform(raw) : String(raw)
      nextParams.set(rule.paramKey, str)
    }

    afterApplyParams?.(nextParams, filters)

    if (table) {
      for (const [columnId, getValue] of Object.entries(tableConfig)) {
        table.getColumn(columnId)?.setFilterValue(getValue(filters))
      }
    }

    setSearchParams(nextParams, { replace: true })
  }, [
    filters,
    searchParams,
    setSearchParams,
    table,
    paramConfig,
    tableConfig,
    afterApplyParams,
  ])

  return { applySearch }
}
