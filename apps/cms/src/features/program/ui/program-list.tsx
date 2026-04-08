/**
 * CMS 프로그램 목록 (필터 카드 + 테이블/캘린더)
 */

import { Table } from 'antd'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams, useLocation } from 'react-router-dom'
import type { Dayjs } from 'dayjs'
import type { Program, ProgramLifecycleStatus } from '@/types/domain'
import './program-list.css'
import { ProgramCalendarView } from './program-calendar-view'
import {
  programListFilterFields,
  resolveEconomyProgramListFilterFields,
} from './table/program-list-filter-fields'
import { buildProgramListFilters } from './table/program-list-filter-builder'
import type { ProgramListProgramMode } from '../model/program-list-program-mode'
import type { EconomyView } from './table/program-table-column-resolver'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { FilterTableLayout } from '@/shared/ui'
import { useTablePage } from '@/shared/components/table-system/model/use-table-page'
import { getProgramTablePageConfig, type ProgramTableContext } from './program-table.config'

export type ProgramListTableVariant = 'general' | 'economy'

export type { ProgramListProgramMode } from '../model/program-list-program-mode'

export type ProgramListConfig = {
  mode?: ProgramListProgramMode
  view?: EconomyView
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
  tableVariant = 'general',
  onDisplayCountChange,
  config,
  children,
}: ProgramListProps) {
  const location = useLocation()
  const isEconomyPage =
    location.pathname === '/programs/economy-education' || tableVariant === 'economy'
  const [searchParams, setSearchParams] = useSearchParams()
  const economyView: EconomyView = config?.view ?? 'ALL'
  const tableType = config?.tableType
  const mode = config?.mode ?? 'general'
  const effectiveLifecycleStatus = config?.lifecycleStatus

  const tableContext: ProgramTableContext = {
    mode,
    view: economyView,
    tableType,
    effectiveLifecycleStatus,
  }

  const tableConfig = useMemo(() => getProgramTablePageConfig(tableContext), [tableContext])

  const {
    table,
    pendingFilters,
    setPendingFilters,
    applySearch: handleSearch,
    hasActiveFilters,
    displayedCount,
    antdColumns,
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
  const economyFilterFieldsForLayout = useMemo(
    () =>
      resolveEconomyProgramListFilterFields({
        economyScheduledActive: economyView === 'SCHEDULED',
        economyInProgressActive: economyView === 'IN_PROGRESS',
      }),
    [economyView]
  )

  return (
    <>
      {viewMode === 'list' ? (
        <FilterTableLayout
          fields={
            tableContext.mode === 'economy' ? economyFilterFieldsForLayout : programListFilterFields
          }
          filters={buildProgramListFilters(
            pendingFilters,
            tableContext.mode,
            tableContext.view === 'SCHEDULED'
          )}
          onFilterChange={(key, value) => {
            if (key === 'operationPeriod') {
              const dates = value as [Dayjs, Dayjs] | null
              setPendingFilters(prev => ({
                ...prev,
                operationStartDate: dates?.[0] || null,
                operationEndDate: dates?.[1] || null,
              }))
            } else if (
              tableContext.mode === 'economy' &&
              (key === 'category' ||
                key === 'targetLevel' ||
                key === 'lifecycleStatus' ||
                key === 'participantRecruitment')
            ) {
              setPendingFilters(prev => ({
                ...prev,
                [key]:
                  value != null && String(value).trim()
                    ? key === 'lifecycleStatus'
                      ? (value as ProgramLifecycleStatus)
                      : value
                    : undefined,
              }))
            } else {
              setPendingFilters(prev => ({ ...prev, [key]: value }))
            }
          }}
          onSearch={handleSearch}
          bordered={false}
          title={headerTitle}
          description={`총 ${displayedCount.toLocaleString()}건`}
          actions={children}
        >
          <Table
            className="cms-data-table"
            rowSelection={
              showRowSelection && (onBulkDelete != null || onSelectionChange != null)
                ? {
                    columnWidth: isEconomyPage ? 80 : TABLE_COLUMN_WIDTHS.checkbox,
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
        <>
          <div className="table-header-actions ">
            <div className="table-header-title-wrapper">
              <span className="table-title">{headerTitle}</span>
              <span className="table-description">{`총 ${displayedCount.toLocaleString()}건`}</span>
            </div>
            {children}
          </div>
          <ProgramCalendarView
            programs={table.getRowModel().rows.map(row => row.original)}
            loading={loading}
            onProgramClick={onView}
          />
        </>
      ) : null}
    </>
  )
}
