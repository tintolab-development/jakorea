/**
 * 실적 관리 목록 페이지
 * - 탭: 페이지 상단(권한 승인과 동일 CmsTextTabs). 필터·테이블 카드 밖
 * - 데이터 탭: FilterTableLayout(필터 + 본문)
 * - 합계 탭: 필터 비노출, 본문만
 * - 쿼리 파라미터: `?tab=data`(기본) / `?tab=summary`
 */

import { useCallback, useMemo } from 'react'
import { Alert } from 'antd'
import { useSearchParams } from 'react-router-dom'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
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
import { usePerformanceListQuery } from '@/features/education-record/hooks/use-performance-list-query'
import { usePerformanceSummaryQuery } from '@/features/education-record/hooks/use-performance-summary-query'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
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

  const listQuery = usePerformanceListQuery()
  const sourceRows = listQuery.data ?? []
  const isDataTab = activeKey === 'data'
  const summaryQuery = usePerformanceSummaryQuery(activeKey === 'summary')

  const availableYears = useMemo(() => getAvailableYearsFromRows(sourceRows), [sourceRows])
  const context = useMemo<EducationRecordTableContext>(() => ({ availableYears }), [availableYears])

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
      businessArea: pendingFilters.businessArea || undefined,
      sido: pendingFilters.sido || undefined,
      sigungu: pendingFilters.sigungu || undefined,
      sponsorName: pendingFilters.sponsorName,
      mainTitle: pendingFilters.mainTitle,
      title: pendingFilters.title,
      textbookName: pendingFilters.textbookName,
      institutionName: pendingFilters.institutionName,
      ips: pendingFilters.ips || undefined,
      educationType: pendingFilters.educationType || undefined,
    }),
    [pendingFilters]
  )

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
    <div
      className={[
        'education-record-list-page',
        isDataTab ? undefined : 'education-record-list-page--summary',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {isDataTab && listQuery.isError ? (
        <Alert
          type="error"
          showIcon
          message={MESSAGES.error.performanceRecordsLoadFailed}
          className="education-record-list-page__remote-notice"
        />
      ) : null}

      <CmsTextTabs
        className="education-record-list-page__tabs"
        activeKey={activeKey}
        onChange={handleTabChange}
        ariaLabel="실적 관리 탭"
        items={[
          { key: 'data', label: '실적 데이터' },
          { key: 'summary', label: '합계' },
        ]}
        trailing={
          <ExcelButton
            onClick={handleExportExcel}
            loading={isExporting}
            disabled={tableData.length === 0 || listQuery.isLoading}
          />
        }
      />

      <FilterTableLayout
        className={[
          'education-record-list-page__layout',
          isDataTab ? undefined : 'education-record-list-page__layout--summary',
        ]
          .filter(Boolean)
          .join(' ')}
        showFilter={isDataTab}
        fields={filterFields}
        filters={filters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        showTitle={false}
        hideExcelDownload
        contentLoading={listQuery.isLoading && isDataTab}
      >
        {isDataTab ? (
          <EducationRecordDataTab
            antdColumns={antdColumns}
            tableData={tableData}
            displayedCount={displayedCount}
          />
        ) : (
          <EducationRecordSummaryTab
            view={summaryQuery.data}
            loading={summaryQuery.isLoading || summaryQuery.isFetching}
            error={summaryQuery.isError}
            errorMessage={MESSAGES.error.performanceRecordsLoadFailed}
          />
        )}
      </FilterTableLayout>
    </div>
  )
}
