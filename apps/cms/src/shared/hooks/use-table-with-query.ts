/**
 * 공통 테이블 훅 (Query Parameter 동기화)
 * Phase 1.5: 테이블 훅 공통화
 */
/* eslint-disable react-hooks/incompatible-library -- TanStack Table 사용 */

import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type ColumnFiltersState,
  type PaginationState,
  type ColumnDef,
  type TableOptions,
} from '@tanstack/react-table'
import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useQueryParams } from './use-query-params'

/**
 * 테이블 필터 타입 (도메인별로 확장)
 */
export interface TableFilters {
  [key: string]: string | undefined
}

/**
 * 공통 테이블 훅 옵션
 */
export interface UseTableWithQueryOptions<TData> {
  data: TData[]
  columns: ColumnDef<TData>[]
  filterKeys?: string[]
  /**
   * 기본 페이지 사이즈
   * @default 10
   */
  defaultPageSize?: number
  /**
   * 쿼리 파라미터 매핑 (다른 쿼리 키를 필터 키로 매핑)
   * 예: { 'status': 'lifecycleStatus' } - status 쿼리를 lifecycleStatus 필터로 매핑
   */
  queryParamMapping?: Record<string, string>
  /** true면 테이블 state→URL 동기화를 끔 (풀페이지 상세 programId 등 다른 쿼리와 충돌 방지) */
  disableUrlSync?: boolean
  tableOptions?: Omit<
    TableOptions<TData>,
    | 'data'
    | 'columns'
    | 'state'
    | 'onColumnFiltersChange'
    | 'onPaginationChange'
    | 'getCoreRowModel'
    | 'getFilteredRowModel'
    | 'getPaginationRowModel'
  >
}

/**
 * 공통 테이블 훅 반환 타입
 */
export interface UseTableWithQueryReturn<TData> {
  table: ReturnType<typeof useReactTable<TData>>
  columnFilters: ColumnFiltersState
  pagination: PaginationState
  resetFilters: () => void
  resetPagination: () => void
}

export function useTableWithQuery<TData>({
  data,
  columns,
  filterKeys: filterKeysInput = [],
  defaultPageSize = 10,
  queryParamMapping: queryParamMappingInput = {},
  disableUrlSync = false,
  tableOptions = {},
}: UseTableWithQueryOptions<TData>): UseTableWithQueryReturn<TData> {
  type QueryParams = Record<string, string | undefined> & {
    page?: string
    pageSize?: string
  }

  const { params, setParams, clearParams } = useQueryParams<
    Record<string, string | undefined>
  >() as {
    params: QueryParams
    setParams: (updates: Partial<QueryParams>) => void
    clearParams: () => void
  }

  // 초기 마운트 여부 추적
  const isMounted = useRef(false)

  const filterKeysKey = filterKeysInput.join('\u0000')
  const filterKeys = useMemo(() => filterKeysInput, [filterKeysKey])
  const queryParamMappingKey = JSON.stringify(
    Object.entries(queryParamMappingInput).sort(([a], [b]) => a.localeCompare(b))
  )
  const queryParamMapping = useMemo(
    () => queryParamMappingInput,
    [queryParamMappingKey]
  )

  const safeParseInt = (value: string | undefined, fallback: number) => {
    if (!value) return fallback
    const n = Number.parseInt(value, 10)
    return Number.isFinite(n) && n > 0 ? n : fallback
  }

  /**
   * "비교용" 문자열 키 생성: 항상 동일한 키 순서(filterKeys -> page -> pageSize)로 생성
   * - undefined 값은 제외되므로 URL에서 빠진 상태와 동일하게 취급됨
   */
  const makeKey = useCallback(
    (obj: Partial<QueryParams>) => {
      const normalized: Record<string, string> = {}

      // filterKeys 순서 고정
      for (const k of filterKeys) {
        const v = obj[k]
        if (typeof v === 'string' && v.length > 0) normalized[k] = v
      }

      if (typeof obj.page === 'string' && obj.page.length > 0) normalized.page = obj.page
      if (typeof obj.pageSize === 'string' && obj.pageSize.length > 0)
        normalized.pageSize = obj.pageSize

      return JSON.stringify(normalized)
    },
    [filterKeys]
  )

  // 초기 필터 상태 (쿼리 파라미터 매핑 적용)
  const initialFilters = useMemo<ColumnFiltersState>(() => {
    const filters: ColumnFiltersState = []
    for (const key of filterKeys) {
      // 직접 쿼리 파라미터 확인
      if (params[key]) {
        filters.push({ id: key, value: params[key] })
      } else {
        // 쿼리 파라미터 매핑 확인 (예: status -> lifecycleStatus)
        const mappedKey = Object.keys(queryParamMapping).find(
          queryKey => queryParamMapping[queryKey] === key
        )
        if (mappedKey && params[mappedKey]) {
          filters.push({ id: key, value: params[mappedKey] })
        }
      }
    }
    return filters
  }, [filterKeys, params, queryParamMapping])

  // 초기 페이지네이션 상태
  const initialPagination = useMemo<PaginationState>(
    () => ({
      pageIndex: params.page ? safeParseInt(params.page, 1) - 1 : 0,
      pageSize: params.pageSize ? safeParseInt(params.pageSize, defaultPageSize) : defaultPageSize,
    }),
    [params.page, params.pageSize, defaultPageSize]
  )

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(initialFilters)
  const [pagination, setPagination] = useState<PaginationState>(initialPagination)

  // 이전 값/플래그 추적
  const prevParamsRef = useRef<string>('')
  const isUpdatingFromParamsRef = useRef(false) // URL -> state 동기화 중
  const isUpdatingFromStateRef = useRef(false) // state -> URL 동기화 중

  // 현재 URL 기반 비교 키 (쿼리 파라미터 매핑 적용)
  const paramsKey = useMemo(() => {
    const relevant: Partial<QueryParams> = {}
    for (const k of filterKeys) {
      // 직접 쿼리 파라미터 확인
      if (params[k]) {
        relevant[k] = params[k]
      } else {
        // 쿼리 파라미터 매핑 확인
        const mappedKey = Object.keys(queryParamMapping).find(
          queryKey => queryParamMapping[queryKey] === k
        )
        if (mappedKey && params[mappedKey]) {
          relevant[k] = params[mappedKey]
        }
      }
    }
    relevant.page = params.page
    relevant.pageSize = params.pageSize
    return makeKey(relevant)
  }, [filterKeys, params, makeKey, queryParamMapping])

  /**
   * URL 파라미터 변경 시 필터/페이지네이션 동기화
   */
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true
      prevParamsRef.current = paramsKey
      return
    }

    // 우리가 state->URL로 업데이트한 직후 URL 반영이면 스킵
    if (isUpdatingFromStateRef.current) {
      isUpdatingFromStateRef.current = false
      prevParamsRef.current = paramsKey
      return
    }

    if (paramsKey === prevParamsRef.current) return

    // URL -> state 동기화 시작 (여기서는 false로 내리지 않고, 다음 state->URL effect에서 1회 소비)
    isUpdatingFromParamsRef.current = true

    const newFilters: ColumnFiltersState = []
    for (const key of filterKeys) {
      // 직접 쿼리 파라미터 확인
      if (params[key]) {
        newFilters.push({ id: key, value: params[key] })
      } else {
        // 쿼리 파라미터 매핑 확인
        const mappedKey = Object.keys(queryParamMapping).find(
          queryKey => queryParamMapping[queryKey] === key
        )
        if (mappedKey && params[mappedKey]) {
          newFilters.push({ id: key, value: params[mappedKey] })
        }
      }
    }

    const page = params.page ? safeParseInt(params.page, 1) : 1
    const pageSize = params.pageSize
      ? safeParseInt(params.pageSize, defaultPageSize)
      : defaultPageSize

    setColumnFilters(newFilters)
    setPagination({
      pageIndex: page - 1,
      pageSize,
    })

    prevParamsRef.current = paramsKey
  }, [paramsKey, filterKeys, params, defaultPageSize, queryParamMapping])

  /**
   * 필터/페이지네이션 변경 시 URL 파라미터 동기화
   */
  useEffect(() => {
    if (!isMounted.current) return
    if (disableUrlSync) return

    // URL -> state 동기화로 인해 변경된 state라면 1회 소비하고 종료
    if (isUpdatingFromParamsRef.current) {
      isUpdatingFromParamsRef.current = false
      return
    }

    const updates: Partial<QueryParams> = {}

    // filterKeys 순서 고정으로 채움 (columnFilters 순서에 의존하지 않음)
    for (const key of filterKeys) {
      const found = columnFilters.find(f => f.id === key)
      const v = found?.value

      // 쿼리 파라미터 매핑 확인 (예: status 쿼리 -> lifecycleStatus 필터)
      // queryParamMapping: { 'status': 'lifecycleStatus' } -> status 쿼리를 lifecycleStatus 필터로 매핑
      const mappedQueryKey = Object.entries(queryParamMapping).find(
        ([, filterKey]) => filterKey === key
      )?.[0]
      const queryKey = mappedQueryKey || key

      if (typeof v === 'string' && v.length > 0) {
        updates[queryKey] = v
        // 매핑된 경우 원래 필터 키는 undefined로 설정 (쿼리 키만 사용)
        if (mappedQueryKey && queryKey !== key) {
          updates[key] = undefined
        }
      } else {
        updates[queryKey] = undefined
        if (mappedQueryKey && queryKey !== key) {
          updates[key] = undefined
        }
      }
    }

    // 페이지네이션 파라미터 (기본값이 아닌 경우에만 추가)
    updates.page = pagination.pageIndex > 0 ? String(pagination.pageIndex + 1) : undefined
    updates.pageSize =
      pagination.pageSize !== defaultPageSize ? String(pagination.pageSize) : undefined

    const nextKey = makeKey(updates)

    if (nextKey !== prevParamsRef.current) {
      isUpdatingFromStateRef.current = true
      // URL 반영 전이라도 비교 기준을 먼저 갱신해 불필요 반복 호출을 막음
      prevParamsRef.current = nextKey
      setParams(updates)
    }
  }, [
    columnFilters,
    pagination,
    setParams,
    filterKeys,
    defaultPageSize,
    makeKey,
    queryParamMapping,
    disableUrlSync,
  ])

  // 테이블 인스턴스
  const table = useReactTable({
    data,
    columns,
    state: {
      columnFilters,
      pagination,
    },
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    ...tableOptions,
  })

  // 필터 초기화
  const resetFilters = () => {
    isUpdatingFromStateRef.current = true

    setColumnFilters([])
    setPagination({
      pageIndex: 0,
      pageSize: defaultPageSize,
    })

    // ⚠️ clearParams는 테이블 외 쿼리까지 제거할 수 있음
    clearParams()

    prevParamsRef.current = makeKey({})
  }

  // 페이지네이션 초기화
  const resetPagination = () => {
    isUpdatingFromStateRef.current = true

    setPagination({
      pageIndex: 0,
      pageSize: defaultPageSize,
    })

    const updates: Partial<QueryParams> = {
      page: undefined,
      pageSize: undefined,
    }

    prevParamsRef.current = makeKey(updates)
    setParams(updates)
  }

  return {
    table,
    columnFilters,
    pagination,
    resetFilters,
    resetPagination,
  }
}
