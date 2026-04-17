import type { ColumnDef, Table } from '@tanstack/react-table'
import type { ColumnsType } from 'antd/es/table'
import type { Dispatch, SetStateAction } from 'react'
import type {
  TableSearchParamRule,
} from '@/shared/hooks/use-table-search'

export type TablePageColumns<TData, TContext> = {
  /** TanStack Table 인스턴스용 컬럼 (필터/rowModel 계산에 사용) */
  tanstack: ColumnDef<TData>[]
  /** TanStack Table에서 URL ↔ columnFilters 동기화 대상 컬럼 id */
  filterKeys: string[]
  /** Ant Design Table 표시용 컬럼 */
  resolveAntdColumns: (context: TContext) => ColumnsType<TData>
}

export type TablePageFiltersSyncArgs<TData, TFilters extends Record<string, unknown>, TContext> = {
  context: TContext
  searchParams: URLSearchParams
  table: Table<TData>
  columnFilters: { id: string; value: unknown }[]
  setPendingFilters: Dispatch<SetStateAction<TFilters>>
}

/** 필터 카드(TableFilterGroup) → pendingFilters 반영 시 커스텀 매핑용 */
export type TablePageOnFilterChangeArgs<TFilters, TContext> = {
  prev: TFilters
  key: string
  value: unknown
  context: TContext
}

export type TablePageFilterArgs<TData, TContext> = {
  context: TContext
  data: TData[]
  searchParams: URLSearchParams
}

export type TablePageSearchSync<TFilters extends Record<string, unknown>> = {
  paramConfig: readonly TableSearchParamRule<TFilters>[]
  tableConfig: Record<string, (filters: TFilters) => unknown>
  afterApplyParams?: (nextParams: URLSearchParams, filters: TFilters) => void
}

export interface TablePageConfig<
  TData,
  TFilters extends Record<string, unknown>,
  TContext,
> {
  columns: TablePageColumns<TData, TContext>

  filters: {
    initialPending: TFilters
    /** URL/컬럼 필터 → pendingFilters 동기화 */
    syncPendingFromUrl: (args: TablePageFiltersSyncArgs<TData, TFilters, TContext>) => void
    /** 활성 필터 여부(표시 건수/empty state 판단과 동일 규칙 유지) */
    hasActiveFilters: (args: {
      context: TContext
      searchParams: URLSearchParams
      columnFilters: { id: string; value: unknown }[]
    }) => boolean
    /** 필터가 없을 때 표시되는 기준 건수(기존 동작 유지용) */
    getBaseCount: (args: { context: TContext; filteredData: TData[] }) => number
    /** 필드 키·값을 pendingFilters 형태로 변환(미지정 시 `{ ...prev, [key]: value }`) */
    onFilterChange?: (args: TablePageOnFilterChangeArgs<TFilters, TContext>) => TFilters
  }

  /** 테이블에 들어갈 데이터(필터 파이프라인) */
  filterFn: (args: TablePageFilterArgs<TData, TContext>) => {
    dataForTable: TData[]
    /** displayedCount 계산에서 사용하는 기준 데이터 */
    filteredData: TData[]
  }

  /** URL 쿼리 + 컬럼 필터 적용 규칙(useTableSearch용) */
  getSearchSync: (context: TContext) => TablePageSearchSync<TFilters>
}

