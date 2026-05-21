import { useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { Table } from 'antd'
import { CalendarOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { CmsButton } from '@/shared/ui'
import type { EducationProgressHalfKey } from '../ujat-education-progress-tabs'
import { buildUjatEducationProgressInstitutionFilterFields } from './filter-fields'
import { UJAT_EDU_PROGRESS_INSTITUTIONS_TABLE_MIN_SCROLL_X } from './columns'
import { UjatEducationProgressInstitutionsCalendarView } from './calendar-view'
import { useUjatEducationProgressInstitutions } from './use-ujat-education-progress-institutions'
import type { UjatEducationProgressInstitutionRow } from './types'
import './ujat-education-progress-institutions-section.css'

export function UjatEducationProgressInstitutionsSection({
  programId,
  half,
  onOpenDetail,
}: {
  programId: string
  half: EducationProgressHalfKey
  onOpenDetail?: (institutionId: string) => void
}) {
  const tableWrapRef = useRef<HTMLDivElement>(null)
  const [tableScrollX, setTableScrollX] = useState(UJAT_EDU_PROGRESS_INSTITUTIONS_TABLE_MIN_SCROLL_X)

  const {
    pendingFilters,
    handleFilterChange,
    handleSearch,
    tableData,
    columns,
    viewMode,
    setViewMode,
    resetHalfState,
  } = useUjatEducationProgressInstitutions(programId, half)

  const filterFields = useMemo(
    () => buildUjatEducationProgressInstitutionFilterFields(half),
    [half]
  )

  useEffect(() => {
    resetHalfState()
  }, [half, resetHalfState])

  useLayoutEffect(() => {
    const el = tableWrapRef.current
    if (!el) return
    const minW = UJAT_EDU_PROGRESS_INSTITUTIONS_TABLE_MIN_SCROLL_X
    const update = () => {
      const w = el.getBoundingClientRect().width
      setTableScrollX(Math.max(minW, Math.floor(w)))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const handleRowClick = (record: UjatEducationProgressInstitutionRow, _e: MouseEvent) => {
    onOpenDetail?.(record.sourceInstitutionId)
  }

  return (
    <div className="ujat-education-progress-institutions">
      <FilterTableLayout
        className="ujat-education-progress-institutions__filter-layout"
        bordered={false}
        fields={filterFields}
        filters={pendingFilters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        title="기관 신청 목록"
        description={`${tableData.length}건`}
        actions={
          <div className="ujat-education-progress-institutions__actions">
            {viewMode === 'table' ? (
              <CmsButton
                type="button"
                variant="secondary"
                size="large"
                style={{ minWidth: 180 }}
                icon={<CalendarOutlined />}
                onClick={() => setViewMode('calendar')}
              >
                캘린더 뷰로 보기
              </CmsButton>
            ) : (
              <CmsButton
                type="button"
                variant="secondary"
                size="large"
                style={{ minWidth: 180 }}
                icon={<UnorderedListOutlined />}
                onClick={() => setViewMode('table')}
              >
                리스트 뷰로 보기
              </CmsButton>
            )}
          </div>
        }
      >
        {viewMode === 'table' ? (
          <div
            ref={tableWrapRef}
            className="ujat-education-progress-institutions__table-wrap"
          >
            <Table<UjatEducationProgressInstitutionRow>
              rowKey="id"
              className="cms-data-table ujat-education-progress-institutions__table clickable-table"
              columns={columns}
              dataSource={tableData}
              pagination={false}
              tableLayout="fixed"
              scroll={{ x: tableScrollX }}
              onRow={record => ({
                onClick: e => handleRowClick(record, e),
              })}
            />
          </div>
        ) : (
          <UjatEducationProgressInstitutionsCalendarView rows={tableData} half={half} />
        )}
      </FilterTableLayout>
      {viewMode === 'calendar' ? (
        <div className="ujat-education-progress-institutions__page-bottom-spacer" aria-hidden />
      ) : null}
    </div>
  )
}
