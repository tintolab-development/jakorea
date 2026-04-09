import { useEffect, useMemo, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { ColumnFiltersState } from '@tanstack/react-table'
import type { ColumnsType } from 'antd/es/table'
import { useTableSearch } from '@/shared/hooks/use-table-search'
import { useTableWithQuery } from '@/shared/hooks/use-table-with-query'
import type { TablePageConfig } from '../types/table-page-config'
import type { TableSearchSetSearchParams } from '@/shared/hooks/use-table-search'

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

  const { dataForTable, filteredData } = useMemo(
    () => config.filterFn({ context, data, searchParams }),
    [config, context, data, searchParams]
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
  }, [columnFilters, config, context, searchParams, table])

  const hasActiveFilters = useMemo(
    () => config.filters.hasActiveFilters({ context, searchParams, columnFilters }),
    [columnFilters, config, context, searchParams]
  )

  const displayedCount = useMemo(() => {
    return hasActiveFilters
      ? table.getFilteredRowModel().rows.length
      : config.filters.getBaseCount({ context, filteredData })
  }, [config, context, filteredData, hasActiveFilters, table])

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
    [table]
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
  }
}

