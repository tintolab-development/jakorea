/**
 * 공통 테이블 훅 (Query Parameter 동기화)
 * Phase 1.5: 테이블 훅 공통화
 */

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
import { useState, useEffect, useMemo, useRef } from 'react'
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
  /**
   * 테이블 데이터
   */
  data: TData[]
  /**
   * 컬럼 정의
   */
  columns: ColumnDef<TData>[]
  /**
   * 필터 키 목록 (URL 파라미터와 동기화할 필터)
   */
  filterKeys?: string[]
  /**
   * 기본 페이지 사이즈
   * @default 10
   */
  defaultPageSize?: number
  /**
   * 추가 테이블 옵션
   */
  tableOptions?: Omit<TableOptions<TData>, 'data' | 'columns' | 'state' | 'onColumnFiltersChange' | 'onPaginationChange' | 'getCoreRowModel' | 'getFilteredRowModel' | 'getPaginationRowModel'>
}

/**
 * 공통 테이블 훅 반환 타입
 */
export interface UseTableWithQueryReturn<TData> {
  /**
   * TanStack Table 인스턴스
   */
  table: ReturnType<typeof useReactTable<TData>>
  /**
   * 현재 컬럼 필터 상태
   */
  columnFilters: ColumnFiltersState
  /**
   * 현재 페이지네이션 상태
   */
  pagination: PaginationState
  /**
   * 필터 초기화 함수
   */
  resetFilters: () => void
  /**
   * 페이지네이션 초기화 함수
   */
  resetPagination: () => void
}

/**
 * Query Parameter와 동기화되는 공통 테이블 훅
 * 
 * @example
 * ```tsx
 * const { table, columnFilters, pagination, resetFilters } = useTableWithQuery({
 *   data: applications,
 *   columns: applicationColumns,
 *   filterKeys: ['programId', 'subjectType', 'status'],
 *   defaultPageSize: 10,
 * })
 * ```
 */
export function useTableWithQuery<TData>({
  data,
  columns,
  filterKeys = [],
  defaultPageSize = 10,
  tableOptions = {},
}: UseTableWithQueryOptions<TData>): UseTableWithQueryReturn<TData> {
  type QueryParams = Record<string, string | undefined> & {
    page?: string
    pageSize?: string
  }

  const { params, setParams } = useQueryParams<Record<string, string | undefined>>() as {
    params: QueryParams
    setParams: (updates: Partial<QueryParams>) => void
  }

  // 초기 마운트 여부 추적 (초기 마운트 시 URL 업데이트 방지)
  const isMounted = useRef(false)

  // 초기 필터 상태 (URL 파라미터에서 읽어옴)
  const initialFilters = useMemo<ColumnFiltersState>(() => {
    const filters: ColumnFiltersState = []
    filterKeys.forEach(key => {
      if (params[key]) {
        filters.push({ id: key, value: params[key] })
      }
    })
    return filters
  }, [filterKeys, params])

  // 초기 페이지네이션 상태 (URL 파라미터에서 읽어옴)
  const initialPagination = useMemo<PaginationState>(
    () => ({
      pageIndex: params.page ? parseInt(params.page) - 1 : 0,
      pageSize: params.pageSize ? parseInt(params.pageSize) : defaultPageSize,
    }),
    [params.page, params.pageSize, defaultPageSize]
  )

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(initialFilters)
  const [pagination, setPagination] = useState<PaginationState>(initialPagination)

  // 이전 값 추적 (무한 루프 방지)
  const prevParamsRef = useRef<string>('')
  const isUpdatingFromParamsRef = useRef(false)
  const isUpdatingFromStateRef = useRef(false)

  // params의 관련 값만 추출하여 문자열로 변환
  const paramsKey = useMemo(() => {
    const relevant: Record<string, string | undefined> = {}
    filterKeys.forEach(key => {
      relevant[key] = params[key]
    })
    relevant.page = params.page
    relevant.pageSize = params.pageSize
    return JSON.stringify(relevant)
  }, [filterKeys, params])

  // URL 파라미터 변경 시 필터/페이지네이션 동기화 (외부에서 URL 변경된 경우)
  useEffect(() => {
    // 초기 마운트 시에는 이미 initialFilters/initialPagination으로 설정되었으므로 스킵
    if (!isMounted.current) {
      isMounted.current = true
      prevParamsRef.current = paramsKey
      return
    }

    // 상태에서 URL로 업데이트 중이면 스킵 (우리가 방금 업데이트한 것이므로)
    if (isUpdatingFromStateRef.current) {
      isUpdatingFromStateRef.current = false
      prevParamsRef.current = paramsKey
      return
    }

    // params가 실제로 변경되었는지 확인
    if (paramsKey === prevParamsRef.current) {
      return
    }

    isUpdatingFromParamsRef.current = true

    const newFilters: ColumnFiltersState = []
    filterKeys.forEach(key => {
      if (params[key]) {
        newFilters.push({ id: key, value: params[key] })
      }
    })
    
    const newPagination: PaginationState = {
      pageIndex: params.page ? parseInt(params.page) - 1 : 0,
      pageSize: params.pageSize ? parseInt(params.pageSize) : defaultPageSize,
    }

    setColumnFilters(newFilters)
    setPagination(newPagination)
    
    prevParamsRef.current = paramsKey
    isUpdatingFromParamsRef.current = false
  }, [paramsKey, filterKeys, params, defaultPageSize])

  // 필터/페이지네이션 변경 시 URL 파라미터 동기화
  useEffect(() => {
    if (!isMounted.current) {
      return
    }

    // URL에서 상태로 업데이트 중이면 스킵
    if (isUpdatingFromParamsRef.current) {
      return
    }

    const filterParams: Record<string, string | undefined> = {}
    columnFilters.forEach(filter => {
      if (filter.value && filterKeys.includes(filter.id)) {
        filterParams[filter.id] = filter.value as string
      }
    })

    const updates: Partial<QueryParams> = { ...filterParams }

    // 페이지네이션 파라미터 (기본값이 아닌 경우에만 추가)
    if (pagination.pageIndex > 0) {
      updates.page = String(pagination.pageIndex + 1)
    } else {
      updates.page = undefined
    }

    if (pagination.pageSize !== defaultPageSize) {
      updates.pageSize = String(pagination.pageSize)
    } else {
      updates.pageSize = undefined
    }

    // 업데이트할 값들을 문자열로 변환하여 비교
    const updatesKey = JSON.stringify(updates)
    
    // 실제로 변경이 필요한 경우에만 업데이트
    if (updatesKey !== prevParamsRef.current) {
      isUpdatingFromStateRef.current = true
      setParams(updates)
      // setParams는 비동기적으로 URL을 업데이트하므로, 다음 렌더에서 paramsKey가 업데이트될 것
      // prevParamsRef는 첫 번째 useEffect에서 업데이트됨
    }
  }, [columnFilters, pagination, setParams, filterKeys, defaultPageSize])

  // 테이블 인스턴스 생성
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

  // 필터 초기화 함수
  const resetFilters = () => {
    setColumnFilters([])
    const updates: Partial<QueryParams> = {}
    filterKeys.forEach(key => {
      updates[key] = undefined
    })
    setParams(updates)
  }

  // 페이지네이션 초기화 함수
  const resetPagination = () => {
    setPagination({
      pageIndex: 0,
      pageSize: defaultPageSize,
    })
    setParams({
      page: undefined,
      pageSize: undefined,
    })
  }

  return {
    table,
    columnFilters,
    pagination,
    resetFilters,
    resetPagination,
  }
}

