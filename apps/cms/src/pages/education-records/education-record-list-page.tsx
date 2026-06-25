/**
 * 실적 관리 목록 페이지
 * - 데이터 탭: 공통 필터(TableFilterGroup) + 구분선 + 탭 nav + 본문
 * - 합계 탭: 필터 비노출, 탭 nav + 본문만 렌더
 * - 쿼리 파라미터: `?tab=data`(기본) / `?tab=summary`
 * - 실적 데이터 탭은 `useTablePage` 결과(antdColumns/tableData/displayedCount)를 prop 으로 수신
 * - 합계 탭은 공통 필터와 독립된(목업) 집계 뷰를 렌더
 */

import { useCallback, useMemo } from 'react'
import { Alert, Spin } from 'antd'
import { useSearchParams } from 'react-router-dom'
import { Divider } from '@/shared/components/divider'
import { TableFilterGroup } from '@/shared/components/table-filter-group'
import { useTablePage } from '@/shared/components/table-system/model/use-table-page'
import { createEducationRecordFilterFields } from '@/features/education-record/model/education-record-filter-fields'
import { exportEducationRecordExcel } from '@/features/education-record/lib/education-record-export'
import { educationRecordTablePageConfig } from '@/features/education-record/model/education-record-table.config'
import type {
  EducationRecordTabKey,
  EducationRecordTableContext,
} from '@/features/education-record/model/education-record-types'
import { getAvailableYearsFromRows } from '@/features/education-record/lib/education-record-region'
import { EducationRecordDataTab } from '@/features/education-record/ui/education-record-data-tab'
import { EducationRecordSummaryTab } from '@/features/education-record/ui/education-record-summary-tab'
import { EducationRecordTabNav } from '@/features/education-record/ui/education-record-tab-nav'
import { getPerformanceRemoteFilterNotice } from '@/features/education-record/api/performance-remote-capabilities'
import {
  usePerformanceListQuery,
  usePerformanceRemoteEnabled,
} from '@/features/education-record/hooks/use-performance-list-query'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import { ExcelButton } from '@/shared/ui/excel-button'
import { MESSAGES } from '@/shared/constants'
import './education-record-list-page.css'

const TAB_PARAM = 'tab'

function parseTabKey(raw: string | null): EducationRecordTabKey {
  if (raw === 'data' || raw === 'summary') return raw
  return 'data'
}

export function EducationRecordListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeKey = parseTabKey(searchParams.get(TAB_PARAM))
  const remoteEnabled = usePerformanceRemoteEnabled()

  const listQuery = usePerformanceListQuery()
  const sourceRows = listQuery.data ?? []

  const availableYears = useMemo(() => getAvailableYearsFromRows(sourceRows), [sourceRows])
  const context = useMemo<EducationRecordTableContext>(
    () => ({ availableYears }),
    [availableYears]
  )

  const {
    pendingFilters,
    applySearch: handleSearch,
    handleFilterChange,
    displayedCount,
    tableData,
    antdColumns,
  } = useTablePage(educationRecordTablePageConfig, {
    data: sourceRows,
    searchParams,
    setSearchParams,
    context,
  })

  const filterFields = useMemo(
    () => createEducationRecordFilterFields({ availableYears }),
    [availableYears]
  )

  const filters = useMemo(
    () => ({
      year: pendingFilters.year || undefined,
      quarter: pendingFilters.quarter === 'ALL' ? undefined : pendingFilters.quarter,
      sido: pendingFilters.sido || undefined,
      sigungu: pendingFilters.sigungu || undefined,
      sponsorName: pendingFilters.sponsorName,
      mainTitle: pendingFilters.mainTitle,
      title: pendingFilters.title,
      textbookName: pendingFilters.textbookName,
    }),
    [pendingFilters]
  )

  const remoteFilterNotice = getPerformanceRemoteFilterNotice(remoteEnabled)
  const isDataTab = activeKey === 'data'

  const handleTabChange = useCallback(
    (key: EducationRecordTabKey) => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          if (key === 'data') {
            next.delete(TAB_PARAM)
          } else {
            next.set(TAB_PARAM, key)
          }
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const { exportExcel: handleExportExcel, isExporting } = useTableExcelExport({
    columns: antdColumns,
    data: tableData,
    filename: '실적데이터',
    exporter: exportEducationRecordExcel,
    alertOnEmpty: false,
  })

  return (
    <div className="education-record-list-page">
      <div className="education-record-list-page__filter-card">
        {isDataTab && remoteFilterNotice ? (
          <Alert
            type="info"
            showIcon
            message={remoteFilterNotice}
            className="education-record-list-page__remote-notice"
          />
        ) : null}

        {isDataTab && listQuery.isError ? (
          <Alert
            type="error"
            showIcon
            message={MESSAGES.error.performanceRecordsLoadFailed}
            className="education-record-list-page__remote-notice"
          />
        ) : null}

        {isDataTab ? (
          <>
            <div className="education-record-list-page__filter">
              <TableFilterGroup
                fields={filterFields}
                filters={filters}
                onFilterChange={handleFilterChange}
                onSearch={handleSearch}
              />
            </div>

            <div className="education-record-list-page__divider">
              <Divider />
            </div>
          </>
        ) : null}

        <div className="education-record-list-page__top-nav">
          <EducationRecordTabNav activeTab={activeKey} onTabChange={handleTabChange} />
          <div className="education-record-list-page__top-nav-actions">
            <ExcelButton
              onClick={handleExportExcel}
              loading={isExporting}
              disabled={tableData.length === 0 || listQuery.isLoading}
              style={{ height: 44 }}
            />
          </div>
        </div>

        {listQuery.isLoading && isDataTab ? (
          <div className="education-record-list-page__loading">
            <Spin />
          </div>
        ) : isDataTab ? (
          <EducationRecordDataTab
            antdColumns={antdColumns}
            tableData={tableData}
            displayedCount={displayedCount}
          />
        ) : (
          <EducationRecordSummaryTab />
        )}
      </div>
    </div>
  )
}
