/**
 * CMS 프로그램 목록 (필터 카드 + 테이블/캘린더)
 */

import { Table } from 'antd'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Program, ProgramLifecycleStatus } from '@/types/domain'
import './program-list.css'
import { ProgramCalendarView } from './program-calendar-view'
import {
  programListFilterFields,
  resolveProgramListFilterFields,
} from './table/program-list-filter-fields'
import { buildProgramListFilters } from './table/program-list-filter-builder'
import type { ProgramListProgramMode } from '../model/program-list-program-mode'
import type { ProgramListView } from './table/program-table-column-resolver'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { FilterTableLayout } from '@/shared/ui'
import { useTablePage } from '@/shared/components/table-system/model/use-table-page'
import { getProgramTablePageConfig, type ProgramTableContext } from './program-table.config'

export type ProgramListTableVariant = 'general' | 'overview'

export type { ProgramListProgramMode } from '../model/program-list-program-mode'

export type ProgramListConfig = {
  mode?: ProgramListProgramMode
  view?: ProgramListView
  tableType?: 'student' | 'instructor'
  lifecycleStatus?: ProgramLifecycleStatus | null
}

export interface ProgramListProps {
  data: Program[]
  loading?: boolean
  headerTitle?: string
  onView: (program: Program) => void
  onBulkDelete?: (programs: Program[]) => void
  onSelectionChange?: (selectedKeys: React.Key[]) => void
  selectedRowKeys?: React.Key[]
  showRowSelection?: boolean
  showCalendarView?: boolean
  viewMode?: 'list' | 'calendar'
  tableVariant?: ProgramListTableVariant
  onDisplayCountChange?: (count: number, hasActiveFilters: boolean) => void
  config?: ProgramListConfig
  children?: React.ReactNode
}

export function ProgramList({
  data,
  loading,
  onView,
  headerTitle,
  onBulkDelete,
  onSelectionChange,
  selectedRowKeys: externalSelectedRowKeys,
  showRowSelection = false,
  showCalendarView = false,
  viewMode: externalViewMode,
  tableVariant: _tableVariant = 'general',
  onDisplayCountChange,
  config,
  children,
}: ProgramListProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const listView: ProgramListView = config?.view ?? 'ALL'
  const tableType = config?.tableType
  const mode = config?.mode ?? 'general'
  const effectiveLifecycleStatus = config?.lifecycleStatus

  const tableContext = useMemo<ProgramTableContext>(
    () => ({
      mode,
      view: listView,
      tableType,
      effectiveLifecycleStatus,
    }),
    [mode, listView, tableType, effectiveLifecycleStatus]
  )

  const tableConfig = useMemo(
    () => getProgramTablePageConfig(tableContext),
    [mode, listView, tableType, effectiveLifecycleStatus]
  )

  const {
    table,
    pendingFilters,
    applySearch: handleSearch,
    hasActiveFilters,
    displayedCount,
    antdColumns,
    handleFilterChange,
  } = useTablePage(tableConfig, {
    data,
    searchParams,
    setSearchParams,
    context: tableContext,
  })

  useEffect(() => {
    onDisplayCountChange?.(displayedCount, hasActiveFilters)
  }, [displayedCount, hasActiveFilters, onDisplayCountChange])

  const [internalSelectedRowKeys, setInternalSelectedRowKeys] = useState<React.Key[]>([])
  const [internalViewMode] = useState<'list' | 'calendar'>('list')
  const viewMode = externalViewMode ?? internalViewMode

  const effectiveSelectedRowKeys =
    externalSelectedRowKeys !== undefined ? externalSelectedRowKeys : internalSelectedRowKeys

  const handleSelectionChange = useCallback(
    (keys: React.Key[]) => {
      if (externalSelectedRowKeys !== undefined) {
        onSelectionChange?.(keys)
      } else {
        setInternalSelectedRowKeys(keys)
        onSelectionChange?.(keys)
      }
    },
    [externalSelectedRowKeys, onSelectionChange]
  )
  const filterFieldsForLayout = useMemo(() => {
    if (tableContext.mode === 'overview') {
      return resolveProgramListFilterFields({
        scheduledViewActive: listView === 'SCHEDULED',
        inProgressViewActive: listView === 'IN_PROGRESS',
      })
    }
    return programListFilterFields
  }, [tableContext.mode, listView])

  return (
    <>
      {viewMode === 'list' ? (
        <FilterTableLayout
          fields={filterFieldsForLayout}
          filters={buildProgramListFilters(
            pendingFilters,
            tableContext.mode,
            tableContext.view === 'SCHEDULED'
          )}
          onFilterChange={handleFilterChange}
          onSearch={handleSearch}
          bordered={false}
          title={headerTitle}
          description={`총 ${displayedCount.toLocaleString()}건`}
          actions={children}
          excelExport={{
            columns: antdColumns,
            data: table.getFilteredRowModel().rows.map(row => row.original),
          }}
        >
          <Table
            className="cms-data-table"
            rowSelection={
              showRowSelection && (onBulkDelete != null || onSelectionChange != null)
                ? {
                    columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
                    selectedRowKeys: effectiveSelectedRowKeys,
                    onChange: handleSelectionChange,
                  }
                : undefined
            }
            dataSource={table.getFilteredRowModel().rows.map(row => row.original)}
            columns={antdColumns}
            rowKey="id"
            loading={loading}
            onRow={record => ({
              onClick: () => onView(record),
              style: { cursor: 'pointer' },
            })}
            pagination={false}
          />
        </FilterTableLayout>
      ) : null}

      {showCalendarView && viewMode === 'calendar' ? (
        <div className="program-list-calendar-view-container">
          <ProgramCalendarView
            items={table.getFilteredRowModel().rows.map(row => row.original)}
            loading={loading}
            onItemClick={onView}
            view={listView}
            toolbar={
              <div className="table-header-actions">
                <div className="table-header-title-wrapper">
                  <span className="table-title">{headerTitle}</span>
                  <span className="table-description">{`총 ${displayedCount.toLocaleString()}건`}</span>
                </div>
                {children}
              </div>
            }
          />
        </div>
      ) : null}
    </>
  )
}
