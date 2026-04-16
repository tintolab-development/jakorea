import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { ColumnFiltersState } from '@tanstack/react-table'
import type { ColumnsType } from 'antd/es/table'
import { useTableSearch } from '@/shared/hooks/use-table-search'
import { useTableWithQuery } from '@/shared/hooks/use-table-with-query'
import type { TablePageConfig } from '../types/table-page-config'
import type { TableSearchSetSearchParams } from '@/shared/hooks/use-table-search'

/** 빈 `context`가 필요할 때 매 렌더 `{{}}`를 넘기지 말고 이 참조를 사용한다(메모·effect 의존성 안정화). */
export const EMPTY_TABLE_PAGE_CONTEXT: Record<string, never> = Object.freeze({})

export type UseTablePageArgs<TData, TContext> = {
  data: TData[]
  searchParams: URLSearchParams
  setSearchParams: TableSearchSetSearchParams
  context: TContext
}

export type UseTablePageReturn<TData, TFilters, TContext> = {
  context: TContext
  antdColumns: ColumnsType<TData>
  table: ReturnType<typeof useTableWithQuery<TData>>['table']
  columnFilters: ColumnFiltersState
  pendingFilters: TFilters
  setPendingFilters: Dispatch<SetStateAction<TFilters>>
  applySearch: () => void
  hasActiveFilters: boolean
  displayedCount: number
  /** AntD Table dataSource용 */
  tableData: TData[]
  /** displayedCount의 base가 되는 데이터 */
  filteredData: TData[]
  /** TableFilterGroup / FilterTableLayout용 — `config.filters.onFilterChange`가 있으면 그 결과로 pending 반영 */
  handleFilterChange: (key: string, value: unknown) => void
}

export function useTablePage<
  TData,
  TFilters extends Record<string, unknown>,
  TContext,
>(
  config: TablePageConfig<TData, TFilters, TContext>,
  args: UseTablePageArgs<TData, TContext>
): UseTablePageReturn<TData, TFilters, TContext> {
  const { data, searchParams, setSearchParams, context } = args

  /** URLSearchParams 참조는 라우터마다 렌더마다 바뀔 수 있어, effect deps는 직렬화 문자열만 사용한다. */
  const searchParamsKey = searchParams.toString()

  const { dataForTable, filteredData } = useMemo(
    () => config.filterFn({ context, data, searchParams }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- searchParams 참조는 searchParamsKey로 대체
    [config, context, data, searchParamsKey]
  )

  const { table, columnFilters } = useTableWithQuery<TData>({
    data: dataForTable,
    columns: config.columns.tanstack,
    filterKeys: config.columns.filterKeys,
  })

  const [pendingFilters, setPendingFilters] = useState<TFilters>(config.filters.initialPending)

  useEffect(() => {
    config.filters.syncPendingFromUrl({
      context,
      searchParams,
      table,
      columnFilters,
      setPendingFilters,
    })
    // `table`·`searchParams` 참조는 렌더마다 바뀔 수 있어 deps에 넣지 않는다. URL 내용은 `searchParamsKey`로만 감지한다.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- 위 주석
  }, [columnFilters, config, context, searchParamsKey])

  const hasActiveFilters = useMemo(
    () => config.filters.hasActiveFilters({ context, searchParams, columnFilters }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- searchParams 참조는 searchParamsKey로 대체
    [columnFilters, config, context, searchParamsKey]
  )

  const displayedCount = useMemo(() => {
    return hasActiveFilters
      ? table.getFilteredRowModel().rows.length
      : config.filters.getBaseCount({ context, filteredData })
    // `table` 참조만으로는 데이터 갱신을 감지하지 못함(TanStack Table 인스턴스 안정) — 소스 배열 변경 시 재계산
  }, [config, context, filteredData, hasActiveFilters, table, dataForTable])

  const searchSync = useMemo(() => config.getSearchSync(context), [config, context])

  const { applySearch } = useTableSearch<TFilters, TData>({
    filters: pendingFilters,
    searchParams,
    setSearchParams,
    table,
    paramConfig: searchSync.paramConfig,
    tableConfig: searchSync.tableConfig,
    afterApplyParams: searchSync.afterApplyParams,
  })

  const antdColumns = useMemo(
    () => config.columns.resolveAntdColumns(context),
    [config, context]
  )

  const tableData = useMemo(
    () => table.getFilteredRowModel().rows.map(row => row.original),
    // `table`만 deps에 두면 행 추가·삭제 후에도 메모가 갱신되지 않을 수 있음(인스턴스 참조 유지)
    [table, dataForTable]
  )

  const handleFilterChange = useCallback(
    (key: string, value: unknown) => {
      setPendingFilters(prev => {
        if (config.filters.onFilterChange) {
          return config.filters.onFilterChange({
            prev,
            key,
            value,
            context,
          })
        }
        return {
          ...prev,
          [key]: value,
        }
      })
    },
    [config, context]
  )

  return {
    context,
    antdColumns,
    table,
    columnFilters,
    pendingFilters,
    setPendingFilters,
    applySearch,
    hasActiveFilters,
    displayedCount,
    tableData,
    filteredData,
    handleFilterChange,
  }
}

