/**
 * 목록 페이지 필터 ↔ query param 동기화.
 * CMS `useTablePage`의 URL 동기화 의도만 이식 (pending + apply + searchParams 단일 소스).
 */

import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  useTableSearch,
  type TableSearchParamRule,
  type TableSearchSetSearchParams,
} from '@/shared/lib/use-table-search'

export type UseListFilterUrlOptions<
  TPending extends Record<string, unknown>,
  TApplied,
> = {
  initialPending: TPending
  paramConfig: readonly TableSearchParamRule<TPending>[]
  /** URL → 목록/API에 쓰는 applied filter */
  parseApplied: (searchParams: URLSearchParams) => TApplied
  /** URL → draft UI 복원 */
  syncPendingFromUrl: (args: {
    searchParams: URLSearchParams
    setPendingFilters: Dispatch<SetStateAction<TPending>>
  }) => void
  afterApplyParams?: (nextParams: URLSearchParams, filters: TPending) => void
}

export type UseListFilterUrlReturn<TPending extends Record<string, unknown>, TApplied> = {
  searchParams: URLSearchParams
  setSearchParams: TableSearchSetSearchParams
  pendingFilters: TPending
  setPendingFilters: Dispatch<SetStateAction<TPending>>
  /** 조회 후 리스트 필터 — searchParams 파생 */
  applied: TApplied
  applySearch: () => void
  /** 정렬 등 즉시 URL 부분 패치 (replace) */
  patchSearchParams: (mutator: (next: URLSearchParams) => void) => void
}

export function useListFilterUrl<TPending extends Record<string, unknown>, TApplied>(
  options: UseListFilterUrlOptions<TPending, TApplied>
): UseListFilterUrlReturn<TPending, TApplied> {
  const { initialPending, paramConfig, parseApplied, syncPendingFromUrl, afterApplyParams } =
    options

  const [searchParams, setSearchParams] = useSearchParams()
  const searchParamsKey = searchParams.toString()

  const [pendingFilters, setPendingFilters] = useState<TPending>(initialPending)
  const pendingFiltersRef = useRef(pendingFilters)
  pendingFiltersRef.current = pendingFilters

  const syncRef = useRef(syncPendingFromUrl)
  syncRef.current = syncPendingFromUrl

  useEffect(() => {
    syncRef.current({
      searchParams,
      setPendingFilters,
    })
    // URL 내용은 searchParamsKey로만 감지 (참조 불안정 방지)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see above
  }, [searchParamsKey])

  const applied = useMemo(
    () => parseApplied(searchParams),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- searchParamsKey
    [parseApplied, searchParamsKey]
  )

  const { applySearch } = useTableSearch({
    filtersRef: pendingFiltersRef,
    setSearchParams,
    paramConfig,
    afterApplyParams,
  })

  const patchSearchParams = useCallback(
    (mutator: (next: URLSearchParams) => void) => {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev.toString())
        mutator(next)
        return next
      }, { replace: true })
    },
    [setSearchParams]
  )

  return {
    searchParams,
    setSearchParams,
    pendingFilters,
    setPendingFilters,
    applied,
    applySearch,
    patchSearchParams,
  }
}
