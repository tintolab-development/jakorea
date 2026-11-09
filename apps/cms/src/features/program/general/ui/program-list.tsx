/**
 * CMS 프로그램 목록 (필터 카드 + 테이블/캘린더)
 */

import { Spin } from 'antd'
import { Suspense, lazy, useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { TableSearchSetSearchParams } from '@/shared/hooks/use-table-search'
import type { Program, ProgramLifecycleStatus } from '@/types/domain'
import './program-list.css'
import { CmsDataTable } from '@/shared/ui/cms-data-table'

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
import { FilterTableLayout, type FilterFieldConfig } from '@/shared/ui'
import { ExcelButton } from '@/shared/ui/excel-button'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import { useTablePage } from '@/shared/components/table-system/model/use-table-page'
import { getProgramTablePageConfig, type ProgramTableContext } from './program-table.config'

const TRAINED_TEACHERS_SELECTION_COL_WIDTH = 60

export type ProgramListTableVariant = 'general' | 'overview'

export type { ProgramListProgramMode } from '../model/program-list-program-mode'

export type ProgramListConfig = {
  mode?: ProgramListProgramMode
  view?: ProgramListView
  tableType?: 'student' | 'instructor'
  lifecycleStatus?: ProgramLifecycleStatus | null
  columnPreset?: ProgramListColumnPreset
  /** 지정 시 위젯별 기본 필터 필드 대신 사용 (교육받은 교사 등) */
  filterFields?: FilterFieldConfig[]
  /**
   * overview 클라 보조 필터를 끈다.
   * 교육받은 교사 원격 목록처럼 서버가 targetLevel·progressPhase·기간을 필터할 때.
   * 생략 시 기존 클라 필터 유지 (일반·1사1교 기본).
   */
  serverSideOverviewFilters?: boolean
  /**
   * 프로그램 관리 캘린더 `GET /api/admin/program-calendar` 의 programType.
   * GENERAL | COMPANY_SCHOOL | TRAINED_TEACHER | …
   */
  calendarProgramType?: string
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
  /** 서버 `totalElements`. 있으면 헤더 건수로 사용 (무한스크롤 로드 건수와 구분) */
  headerCount?: number
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
  headerTitle,
  onBulkDelete,
  onSelectionChange,
  selectedRowKeys: externalSelectedRowKeys,
  showRowSelection = false,
  showCalendarView = false,
  viewMode: externalViewMode,
  tableVariant: _tableVariant = 'general',
  onDisplayCountChange,
  headerCount,
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
  const serverSideOverviewFilters = config?.serverSideOverviewFilters === true

  const tableContext = useMemo<ProgramTableContext>(
    () => ({
      mode,
      view: listView,
      tableType,
      effectiveLifecycleStatus,
      columnPreset,
      serverSideOverviewFilters,
    }),
    [mode, listView, tableType, effectiveLifecycleStatus, columnPreset, serverSideOverviewFilters]
  )

  const tableConfig = useMemo(
    () => getProgramTablePageConfig(tableContext),
    [mode, listView, tableType, effectiveLifecycleStatus, columnPreset, serverSideOverviewFilters]
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
  // 캘린더 우측 목록의 선택 표시용 상태. 목록 행 일괄 삭제 선택과 분리한다.
  const [calendarSelectedProgramIds, setCalendarSelectedProgramIds] = useState<React.Key[]>([])
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
  /** 교육 받은 교사 목록 — 탭별 피그마 고정 열 폭은 `program-list.css`의 `--trained-teachers` 규칙 */
  const isTrainedTeachersOverview = isOverviewTable && columnPreset === 'trainedTeachers'
  const overviewSelectionClass =
    isOverviewTable && showRowSelection
      ? 'program-list-table-wrapper--program-list-overview-selection'
      : ''
  const filterTableLayoutClassName = [
    isOverviewTable && 'program-list-card--program-list-overview',
    isOverviewTable && 'program-list-table-wrapper--program-list-overview',
    isOverviewTable && overviewViewClass,
    isTrainedTeachersOverview && 'program-list-card--trained-teachers',
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
  const handleCalendarProgramSelectionChange = useCallback(
    (programIds: React.Key[]) => {
      setCalendarSelectedProgramIds(programIds)
    },
    []
  )
  const filterFieldsOverride = config?.filterFields
  const filterFieldsForLayout = useMemo(() => {
    if (filterFieldsOverride) return filterFieldsOverride
    if (tableContext.mode === 'overview') {
      return resolveProgramListFilterFields({
        scheduledViewActive: listView === 'SCHEDULED',
        inProgressViewActive: listView === 'IN_PROGRESS',
        completedViewActive: listView === 'COMPLETED',
      })
    }
    return programListFilterFields
  }, [filterFieldsOverride, tableContext.mode, listView])

  /**
   * useTablePage.tableData를 사용한다.
   * TanStack `table` 인스턴스 참조는 data 갱신 후에도 동일할 수 있어,
   * `getFilteredRowModel()`을 `[table]`만으로 메모하면 새로고침 직후 빈 목록이 고착된다.
   */
  const filteredRows = tableData

  const countForHeader = headerCount ?? displayedCount

  const overviewRowSelectionActive =
    showRowSelection && (onBulkDelete != null || onSelectionChange != null)

  const excelSelectedRowKeys = overviewRowSelectionActive
    ? viewMode === 'calendar'
      ? calendarSelectedProgramIds
      : effectiveSelectedRowKeys
    : undefined

  const { exportExcel, isExporting: isExcelExporting } = useTableExcelExport({
    accessLog: { downloadKind: 'PROGRAM_LIST_EXPORT', containedPiiTypes: [] },
    columns: antdColumns,
    data: filteredRows,
    filename: headerTitle ?? '프로그램 목록',
    selectedRowKeys: excelSelectedRowKeys,
  })

  return (
    <>
      {viewMode === 'list' ? (
        <FilterTableLayout
          hasActiveFilters={hasActiveFilters}
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
          description={`총 ${countForHeader.toLocaleString()}건`}
          actions={children}
          actionsAfterExcel={toolbarActionsAfterExcel}
          className={filterTableLayoutClassName}
          excelExport={{
            accessLog: { downloadKind: 'PROGRAM_LIST_EXPORT', containedPiiTypes: [] },
            columns: antdColumns,
            data: filteredRows,
            selectedRowKeys: excelSelectedRowKeys,
          }}
        >
          <div className="program-list-table-fit-wrap">
            <CmsDataTable
              className={tableClassName}
              rowSelection={
                overviewRowSelectionActive
                  ? {
                      columnWidth: isTrainedTeachersOverview
                        ? TRAINED_TEACHERS_SELECTION_COL_WIDTH
                        : TABLE_COLUMN_WIDTHS.checkbox,
                      selectedRowKeys: effectiveSelectedRowKeys,
                      onChange: handleSelectionChange,
                      getCheckboxProps: (record: Program) => ({
                        disabled: record.listDeleteBlocked === true,
                      }),
                    }
                  : undefined
              }
              dataSource={filteredRows}
              columns={antdColumns}
              rowKey="id"
              loading={loading}
              tableLayout={isOverviewTable ? 'fixed' : undefined}
              onRow={record => ({
                onClick: () => onView(record),
                style: { cursor: 'pointer' },
              })}
              pagination={false}
            />
          </div>
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
              onItemClick={onView}
              view={listView}
              calendarProgramType={config?.calendarProgramType}
              listKeyword={
                typeof pendingFilters.title === 'string' ? pendingFilters.title : undefined
              }
              toolbar={
                <div className="table-header-actions">
                  <div className="table-header-title--wrapper">
                    <span className="table-title">{headerTitle}</span>
                    <span className="table-description">{`총 ${countForHeader.toLocaleString()}건`}</span>
                  </div>
                  <div className="table-header-actions--wrapper">
                    {children}
                    <ExcelButton onClick={exportExcel} loading={isExcelExporting} />
                    {toolbarActionsAfterExcel}
                  </div>
                </div>
              }
              selectedProgramIds={showRowSelection ? calendarSelectedProgramIds : undefined}
              onProgramSelectionChange={
                showRowSelection ? handleCalendarProgramSelectionChange : undefined
              }
            />
          </Suspense>
        </div>
      ) : null}
    </>
  )
}
