import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { UjatEssayColumnKey } from './ujat-volunteer-doc-screening-columns'
import { Table } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { AppButton } from '@/shared/ui/app-button'
import type { UjatVolunteerRecruitHalf } from '@/features/program/model/ujat-volunteer-screening-constants'
import type { UjatVolunteerApplicantRow } from '@/data/mock/ujat-volunteer-applicants-mock'
import { buildUjatVolunteerDocScreeningFilterRows } from './ujat-volunteer-doc-screening-filter-fields'
import { UjatVolunteerDocScreeningResizableTitle } from './ujat-volunteer-doc-screening-resizable-title'
import { useUjatVolunteerDocScreeningColumnWidths } from './use-ujat-volunteer-doc-screening-column-widths'
import { useUjatVolunteerDocScreening } from './use-ujat-volunteer-doc-screening'
import './ujat-volunteer-doc-screening-section.css'

const FILTER_ROWS = buildUjatVolunteerDocScreeningFilterRows()

const tableComponents = {
  header: {
    cell: UjatVolunteerDocScreeningResizableTitle,
  },
}

export interface UjatVolunteerDocScreeningSectionProps {
  programId: string
  half: UjatVolunteerRecruitHalf
}

export function UjatVolunteerDocScreeningSection({
  programId,
  half,
}: UjatVolunteerDocScreeningSectionProps) {
  const tableWrapRef = useRef<HTMLDivElement>(null)
  const {
    essayColumnWidths,
    handleEssayColumnResizeStart,
    handleEssayColumnResizeStop,
    minTableScrollX,
    isResizingRef,
  } = useUjatVolunteerDocScreeningColumnWidths()
  const [tableScrollX, setTableScrollX] = useState(minTableScrollX)
  const [isResizing, setIsResizing] = useState(false)

  const onEssayColumnResizeStart = useCallback(() => {
    handleEssayColumnResizeStart()
    setIsResizing(true)
  }, [handleEssayColumnResizeStart])

  const onEssayColumnResizeStop = useCallback(
    (key: UjatEssayColumnKey, width: number) => {
      handleEssayColumnResizeStop(key, width)
      setIsResizing(false)
    },
    [handleEssayColumnResizeStop]
  )

  const {
    pendingFilters,
    handleFilterChange,
    handleSearch,
    tableData,
    columns,
    selectedRowKeys,
    setSelectedRowKeys,
    handleBulkReject,
    handleBulkApprove,
    handleExportExcel,
    isExporting,
    count,
  } = useUjatVolunteerDocScreening({
    programId,
    half,
    essayColumnWidths,
    onEssayColumnResizeStart,
    onEssayColumnResizeStop,
    tableWrapRef,
  })

  useLayoutEffect(() => {
    const el = tableWrapRef.current
    if (!el) return
    const update = () => {
      if (isResizingRef.current) return
      const w = el.getBoundingClientRect().width
      setTableScrollX(Math.max(minTableScrollX, Math.floor(w)))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [minTableScrollX, isResizingRef])

  useLayoutEffect(() => {
    if (isResizingRef.current) return
    const el = tableWrapRef.current
    if (!el) return
    const w = el.getBoundingClientRect().width
    setTableScrollX(Math.max(minTableScrollX, Math.floor(w)))
  }, [minTableScrollX, isResizingRef])

  const scrollConfig = useMemo(() => ({ x: tableScrollX }), [tableScrollX])

  return (
    <div className="ujat-volunteer-doc-screening">
      <FilterTableLayout
        bordered={false}
        className="ujat-volunteer-doc-screening__filter-layout"
        rows={FILTER_ROWS}
        filters={pendingFilters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        title={`봉사자 신청 목록 (${count.toLocaleString()})`}
        actions={
          <div className="ujat-volunteer-doc-screening__actions">
            <AppButton
              variant="danger"
              size="filter"
              disabled={selectedRowKeys.length === 0}
              onClick={handleBulkReject}
            >
              선택 반려
            </AppButton>
            <AppButton
              variant="cancel"
              size="filter"
              disabled={selectedRowKeys.length === 0}
              onClick={handleBulkApprove}
            >
              선택 승인
            </AppButton>
            <AppButton
              variant="primary"
              size="filter"
              icon={<DownloadOutlined />}
              className="ujat-volunteer-doc-screening__btn-excel"
              loading={isExporting}
              disabled={tableData.length === 0}
              onClick={handleExportExcel}
            >
              엑셀 다운로드
            </AppButton>
          </div>
        }
      >
        <div
          ref={tableWrapRef}
          className={`ujat-volunteer-doc-screening__table-wrap${isResizing ? ' ujat-volunteer-doc-screening__table-wrap--resizing' : ''}`}
        >
          <Table<UjatVolunteerApplicantRow>
            rowKey="id"
            className="cms-data-table cms-data-table--fluid"
            columns={columns}
            components={tableComponents}
            dataSource={tableData}
            pagination={false}
            scroll={scrollConfig}
            rowSelection={{
              selectedRowKeys,
              onChange: keys => setSelectedRowKeys(keys),
            }}
            onRow={() => ({
              onClick: e => {
                const target = e.target as HTMLElement
                if (
                  target.closest('.ant-table-selection-column') ||
                  target.closest('.ant-checkbox-wrapper') ||
                  target.closest('.status-dropdown-cell__status-trigger') ||
                  target.closest('.react-resizable-handle')
                ) {
                  return
                }
              },
            })}
          />
        </div>
      </FilterTableLayout>
    </div>
  )
}
