/**
 * 실적 관리 목록 페이지
 * - 공통 필터(UnifiedFilterCard/TableFilterGroup)를 페이지 루트에 한 번 렌더
 * - 그 아래 구분선 + 탭 nav + 쿼리 파라미터(`?tab=data` / `?tab=summary`)에 따른 본문
 * - 실적 데이터 탭은 `useTablePage` 결과(antdColumns/tableData/displayedCount)를 prop 으로 수신
 * - 합계 탭은 공통 필터와 독립된(목업) 집계 뷰를 렌더
 */

import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DownloadOutlined } from '@ant-design/icons'
import type { Program } from '@/types/domain'
import { Divider } from '@/shared/components/divider'
import { TableFilterGroup } from '@/shared/components/table-filter-group'
import { useTablePage } from '@/shared/components/table-system/model/use-table-page'
import { mockPrograms } from '@/data/mock'
import { createEducationRecordFilterFields } from '@/features/education-record/model/education-record-filter-fields'
import { exportEducationRecordExcel } from '@/features/education-record/lib/education-record-export'
import { educationRecordTablePageConfig } from '@/features/education-record/model/education-record-table.config'
import type {
  EducationRecordTabKey,
  EducationRecordTableContext,
} from '@/features/education-record/model/education-record-types'
import { getAvailableYears } from '@/features/education-record/lib/education-record-region'
import { EducationRecordDataTab } from '@/features/education-record/ui/education-record-data-tab'
import { EducationRecordSummaryTab } from '@/features/education-record/ui/education-record-summary-tab'
import { EducationRecordTabNav } from '@/features/education-record/ui/education-record-tab-nav'
import { CmsButton } from '@/shared/ui/cms-button'
import './education-record-list-page.css'

const TAB_PARAM = 'tab'

function parseTabKey(raw: string | null): EducationRecordTabKey {
  if (raw === 'data' || raw === 'summary') return raw
  return 'data'
}

export function EducationRecordListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeKey = parseTabKey(searchParams.get(TAB_PARAM))
  const [isExporting, setIsExporting] = useState(false)

  const availableYears = useMemo(() => getAvailableYears(mockPrograms), [])
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
    data: mockPrograms as Program[],
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

  const handleExportExcel = useCallback(async () => {
    if (isExporting) return
    if (tableData.length === 0) {
      return
    }
    setIsExporting(true)
    try {
      await exportEducationRecordExcel(antdColumns, tableData, '실적데이터')
    } catch (error) {
      console.error('[education-record] excel export failed', error)
    } finally {
      setIsExporting(false)
    }
  }, [antdColumns, isExporting, tableData])

  return (
    <div className="education-record-list-page">
      <div className="education-record-list-page__filter-card">
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

        <div className="education-record-list-page__top-nav">
          <EducationRecordTabNav activeTab={activeKey} onTabChange={handleTabChange} />
          <div className="education-record-list-page__top-nav-actions">
            <CmsButton
              variant="primary"
              icon={<DownloadOutlined />}
              onClick={handleExportExcel}
              loading={isExporting}
              disabled={tableData.length === 0}
              width={180}
              style={{ height: 44 }}
            >
              엑셀 다운로드
            </CmsButton>
          </div>
        </div>

        {activeKey === 'data' ? (
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
