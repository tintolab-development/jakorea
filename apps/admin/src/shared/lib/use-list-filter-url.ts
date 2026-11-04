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

const APPLIED_FILTER_SKIP_KEYS = new Set(['page', 'size', 'sort', 'order'])

function isListFilterApplied(applied: unknown): boolean {
  if (applied == null) return false
  if (typeof applied === 'boolean') return true
  if (typeof applied === 'number') return true
  if (typeof applied === 'string') return applied.trim().length > 0
  if (Array.isArray(applied)) return applied.length > 0
  if (typeof applied === 'object') {
    for (const [key, value] of Object.entries(applied as Record<string, unknown>)) {
      if (APPLIED_FILTER_SKIP_KEYS.has(key)) continue
      if (isListFilterApplied(value)) return true
    }
  }
  return false
}

export type UseListFilterUrlReturn<TPending extends Record<string, unknown>, TApplied> = {
  searchParams: URLSearchParams
  setSearchParams: TableSearchSetSearchParams
  pendingFilters: TPending
  setPendingFilters: Dispatch<SetStateAction<TPending>>
  /**
   * 텍스트 필터 타이핑용. React state 없이 ref만 갱신해 테이블 리렌더를 막는다.
   * Select/Date·조회 버튼의 setPendingFilters / applySearch는 ref를 SSOT로 본다.
   */
  patchPendingFilters: Dispatch<SetStateAction<TPending>>
  /** 조회 후 리스트 필터 — searchParams 파생 */
  applied: TApplied
  applySearch: () => void
  /** 정렬 등 즉시 URL 부분 패치 (replace) */
  patchSearchParams: (mutator: (next: URLSearchParams) => void) => void
  /** 조회 적용된 필터가 있으면 true — CmsDataTable empty variant */
  hasActiveFilters: boolean
}

export function useListFilterUrl<TPending extends Record<string, unknown>, TApplied>(
  options: UseListFilterUrlOptions<TPending, TApplied>
): UseListFilterUrlReturn<TPending, TApplied> {
  const { initialPending, paramConfig, parseApplied, syncPendingFromUrl, afterApplyParams } =
    options

  const [searchParams, setSearchParams] = useSearchParams()
  const searchParamsKey = searchParams.toString()

  const [pendingFilters, setPendingFiltersState] = useState<TPending>(initialPending)
  const pendingFiltersRef = useRef(pendingFilters)

  const resolvePending = useCallback((action: SetStateAction<TPending>): TPending => {
    const base = pendingFiltersRef.current
    return typeof action === 'function'
      ? (action as (prevState: TPending) => TPending)(base)
      : action
  }, [])

  /**
   * applySearch / Enter는 같은 틱에서 setState 직후 ref를 읽는다.
   * 렌더 때만 ref를 맞추면 연속 입력이 stale pending을 조회에 실을 수 있다.
   * 텍스트 patchPendingFilters 이후 Select 등이 호출해도 ref를 base로 써서 입력을 보존한다.
   */
  const setPendingFilters = useCallback(
    (action: SetStateAction<TPending>) => {
      setPendingFiltersState(() => {
        const next = resolvePending(action)
        pendingFiltersRef.current = next
        return next
      })
    },
    [resolvePending]
  )

  const patchPendingFilters = useCallback(
    (action: SetStateAction<TPending>) => {
      const next = resolvePending(action)
      pendingFiltersRef.current = next
    },
    [resolvePending]
  )

  const syncRef = useRef(syncPendingFromUrl)
  syncRef.current = syncPendingFromUrl

  useEffect(() => {
    syncRef.current({
      searchParams,
      setPendingFilters,
    })
    // URL 내용은 searchParamsKey로만 감지 (참조 불안정 방지)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see above
  }, [searchParamsKey, setPendingFilters])

  const applied = useMemo(
    () => parseApplied(searchParams),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- searchParamsKey
    [parseApplied, searchParamsKey]
  )

  const hasActiveFilters = useMemo(() => isListFilterApplied(applied), [applied])

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
    patchPendingFilters,
    applied,
    applySearch,
    patchSearchParams,
    hasActiveFilters,
  }
}
