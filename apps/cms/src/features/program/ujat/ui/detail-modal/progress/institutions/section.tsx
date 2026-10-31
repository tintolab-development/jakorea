import { useEffect, useMemo, type MouseEvent } from 'react'
import type { ColumnsType } from 'antd/es/table'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { useUjatCanWrite } from '@/features/program/ujat/lib/use-can-write'
import { FilterTableToolbarButton } from '@/shared/ui'
import { useContainerFitTableScrollX } from '@/shared/lib/resolve-table-min-scroll-x'
import type { EducationProgressHalfKey } from '../tabs'
import { useUjatProgramScheduleDates } from '@/features/program/ujat/ui/detail-modal/application-institution/use-program-schedule-dates'
import { buildUjatEducationProgressInstitutionFilterFields } from './filter-fields'
import { UjatEducationProgressInstitutionsCalendarView } from './calendar-view'
import { useUjatEducationProgressInstitutions } from './use-list'
import type { UjatEducationProgressInstitutionRow } from './types'
import { ButtonCalendarIcon, ButtonListIcon } from '@/shared/ui/icons/ButtonIcons'
import './section.css'
import { CmsDataTable } from '@/shared/ui/cms-data-table'

export function UjatEducationProgressInstitutionsSection({
  programId,
  half,
  onOpenDetail,
}: {
  programId: string
  half: EducationProgressHalfKey
  onOpenDetail?: (institutionId: string) => void
}) {
  const canWrite = useUjatCanWrite()
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

  const { tableWrapRef, tableScrollX } = useContainerFitTableScrollX(
    columns as ColumnsType<unknown>,
    {
      includeSelection: false,
      enabled: viewMode === 'table',
    }
  )

  const { dates: scheduleDates } = useUjatProgramScheduleDates(programId)
  const filterFields = useMemo(
    () => buildUjatEducationProgressInstitutionFilterFields(half, scheduleDates),
    [half, scheduleDates]
  )

  useEffect(() => {
    resetHalfState()
  }, [half, resetHalfState])

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
          <div className="ujat-education-progress-institutions__actions program-application-list-toolbar">
            {viewMode === 'table' ? (
              <FilterTableToolbarButton
                type="button"
                variant="secondary"
                icon={<ButtonCalendarIcon />}
                onClick={() => setViewMode('calendar')}
              >
                캘린더 뷰로 보기
              </FilterTableToolbarButton>
            ) : (
              <FilterTableToolbarButton
                type="button"
                variant="secondary"
                icon={<ButtonListIcon />}
                onClick={() => setViewMode('table')}
              >
                리스트 뷰로 보기
              </FilterTableToolbarButton>
            )}
          </div>
        }
        excelExport={
          canWrite
            ? {
                columns,
                data: tableData,
              }
            : undefined
        }
      >
        {viewMode === 'table' ? (
          <div ref={tableWrapRef} className="ujat-education-progress-institutions__table-wrap">
            <CmsDataTable<UjatEducationProgressInstitutionRow>
              rowKey="id"
              className="cms-data-table ujat-education-progress-institutions__table clickable-table"
              columns={columns}
              dataSource={tableData}
              pagination={false}
              tableLayout="fixed"
              scroll={tableScrollX != null ? { x: tableScrollX } : undefined}
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
