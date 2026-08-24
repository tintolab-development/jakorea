/**
 * CMS 프로그램 목록 (필터 카드 + 테이블/캘린더)
 */

import { Spin, Table } from 'antd'
import { Suspense, lazy, useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { TableSearchSetSearchParams } from '@/shared/hooks/use-table-search'
import type { Program, ProgramLifecycleStatus } from '@/types/domain'
import './program-list.css'

/** 캘린더 CSS는 캘린더 뷰일 때만 로드 — 목록만 거쳐도 대시보드 위젯 보더에 영향 주지 않음 */
const ProgramCalendarView = lazy(async () => {
  const mod = await import('./program-calendar-view')
  return { default: mod.ProgramCalendarView }
})
import {
  programListFilterFields,
  resolveProgramListFilterFields,
} from './table/program-list-filter-fields'
import { buildProgramListFilters } from './table/program-list-filter-builder'
import type { ProgramListProgramMode } from '../model/program-list-program-mode'
import type {
  ProgramListColumnPreset,
  ProgramListView,
} from './table/program-table-column-resolver'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { FilterTableLayout } from '@/shared/ui'
import { ExcelButton } from '@/shared/ui/excel-button'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import { useTablePage } from '@/shared/components/table-system/model/use-table-page'
import { getProgramTablePageConfig, type ProgramTableContext } from './program-table.config'

export type ProgramListTableVariant = 'general' | 'overview'

export type { ProgramListProgramMode } from '../model/program-list-program-mode'

export type ProgramListConfig = {
  mode?: ProgramListProgramMode
  view?: ProgramListView
  tableType?: 'student' | 'instructor'
  lifecycleStatus?: ProgramLifecycleStatus | null
  columnPreset?: ProgramListColumnPreset
}

export interface ProgramListProps {
  data: Program[]
  loading?: boolean
  headerTitle?: string
  onView: (program: Program) => void
  /** 행 hover 시 상세 prefetch (remote 목록) */
  onPrefetch?: (program: Program) => void
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
  /** 엑셀 다운로드 버튼 우측 툴바 액션 (예: 프로그램 신규 등록) */
  toolbarActionsAfterExcel?: React.ReactNode
  /** 상위에서 URL 쿼리를 단일 관리할 때 전달 (일반 프로그램 상세 LNB와 충돌 방지) */
  searchParams?: URLSearchParams
  setSearchParams?: TableSearchSetSearchParams
  /** 상세 모달 등이 열려 있을 때 테이블 state→URL 동기화 비활성화 */
  disableUrlSync?: boolean
  /** 조회(applySearch) 핸들러 등록 — 상세 닫을 때 목록 필터 URL flush용 */
  onRegisterApplySearch?: (applySearch: () => void) => void
}

export function ProgramList({
  data,
  loading,
  onView,
  onPrefetch,
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
  toolbarActionsAfterExcel,
  searchParams: searchParamsProp,
  setSearchParams: setSearchParamsProp,
  disableUrlSync = false,
  onRegisterApplySearch,
}: ProgramListProps) {
  const [internalSearchParams, internalSetSearchParams] = useSearchParams()
  const searchParams = searchParamsProp ?? internalSearchParams
  const setSearchParams = setSearchParamsProp ?? internalSetSearchParams
  const listView: ProgramListView = config?.view ?? 'ALL'
  const tableType = config?.tableType
  const mode = config?.mode ?? 'general'
  const effectiveLifecycleStatus = config?.lifecycleStatus
  const columnPreset = config?.columnPreset ?? 'default'

  const tableContext = useMemo<ProgramTableContext>(
    () => ({
      mode,
      view: listView,
      tableType,
      effectiveLifecycleStatus,
      columnPreset,
    }),
    [mode, listView, tableType, effectiveLifecycleStatus, columnPreset]
  )

  const tableConfig = useMemo(
    () => getProgramTablePageConfig(tableContext),
    [mode, listView, tableType, effectiveLifecycleStatus, columnPreset]
  )

  const {
    pendingFilters,
    applySearch: handleSearch,
    hasActiveFilters,
    displayedCount,
    antdColumns,
    handleFilterChange,
    tableData,
  } = useTablePage(tableConfig, {
    data,
    searchParams,
    setSearchParams,
    context: tableContext,
    disableUrlSync,
  })

  useEffect(() => {
    onRegisterApplySearch?.(handleSearch)
  }, [handleSearch, onRegisterApplySearch])

  useEffect(() => {
    onDisplayCountChange?.(displayedCount, hasActiveFilters)
  }, [displayedCount, hasActiveFilters, onDisplayCountChange])

  const [internalSelectedRowKeys, setInternalSelectedRowKeys] = useState<React.Key[]>([])
  const [internalViewMode] = useState<'list' | 'calendar'>('list')
  const viewMode = externalViewMode ?? internalViewMode
  const isOverviewTable = tableContext.mode === 'overview'
  const overviewViewClass =
    listView === 'SCHEDULED'
      ? 'program-list-table-wrapper--program-list-period-columns program-list-card--program-list-period-columns'
      : listView === 'ALL'
        ? 'program-list-table-wrapper--program-list-all-programs program-list-card--program-list-all-programs'
        : listView === 'IN_PROGRESS'
          ? 'program-list-table-wrapper--program-list-in-progress program-list-card--program-list-in-progress'
          : listView === 'COMPLETED'
            ? 'program-list-table-wrapper--program-list-completed program-list-card--program-list-completed'
            : ''
  const overviewSelectionClass =
    isOverviewTable && showRowSelection
      ? 'program-list-table-wrapper--program-list-overview-selection'
      : ''
  const filterTableLayoutClassName = [
    isOverviewTable && 'program-list-card--program-list-overview',
    isOverviewTable && 'program-list-table-wrapper--program-list-overview',
    isOverviewTable && overviewViewClass,
    overviewSelectionClass,
  ]
    .filter(Boolean)
    .join(' ')
  const tableClassName = [
    'cms-data-table',
    isOverviewTable && 'cms-data-table--program-list-overview',
  ]
    .filter(Boolean)
    .join(' ')

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
        completedViewActive: listView === 'COMPLETED',
      })
    }
    return programListFilterFields
  }, [tableContext.mode, listView])

  /**
   * useTablePage.tableData를 사용한다.
   * TanStack `table` 인스턴스 참조는 data 갱신 후에도 동일할 수 있어,
   * `getFilteredRowModel()`을 `[table]`만으로 메모하면 새로고침 직후 빈 목록이 고착된다.
   */
  const filteredRows = tableData

  const { exportExcel, isExporting: isExcelExporting } = useTableExcelExport({
    columns: antdColumns,
    data: filteredRows,
    filename: headerTitle ?? '프로그램 목록',
  })

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
          actionsAfterExcel={toolbarActionsAfterExcel}
          className={filterTableLayoutClassName}
          excelExport={{
            columns: antdColumns,
            data: filteredRows,
          }}
        >
          <Table
            className={tableClassName}
            rowSelection={
              showRowSelection && (onBulkDelete != null || onSelectionChange != null)
                ? {
                    columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
                    selectedRowKeys: effectiveSelectedRowKeys,
                    onChange: handleSelectionChange,
                  }
                : undefined
            }
            dataSource={filteredRows}
            columns={antdColumns}
            rowKey="id"
            loading={loading}
            scroll={
              isOverviewTable && listView !== 'SCHEDULED'
                ? { x: 'max-content' }
                : undefined
            }
            tableLayout={
              isOverviewTable
                ? listView === 'SCHEDULED'
                  ? 'fixed'
                  : 'auto'
                : undefined
            }
            onRow={record => ({
              onClick: () => onView(record),
              onMouseEnter: onPrefetch ? () => onPrefetch(record) : undefined,
              style: { cursor: 'pointer' },
            })}
            pagination={false}
          />
        </FilterTableLayout>
      ) : null}

      {showCalendarView && viewMode === 'calendar' ? (
        <div className="program-list-calendar-view-container">
          <Suspense
            fallback={
              <div className="page-content-loading" role="status">
                <Spin size="large" />
              </div>
            }
          >
            <ProgramCalendarView
              items={filteredRows}
              loading={loading}
              onItemClick={onView}
              view={listView}
              toolbar={
                <div className="table-header-actions">
                  <div className="table-header-title--wrapper">
                    <span className="table-title">{headerTitle}</span>
                    <span className="table-description">{`총 ${displayedCount.toLocaleString()}건`}</span>
                  </div>
                  <div className="table-header-actions--wrapper">
                    {children}
                    <ExcelButton onClick={exportExcel} loading={isExcelExporting} />
                    {toolbarActionsAfterExcel}
                  </div>
                </div>
              }
            />
          </Suspense>
        </div>
      ) : null}
    </>
  )
}
