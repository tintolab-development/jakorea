import { useEffect } from 'react'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { FilterTableToolbarButton } from '@/shared/ui'
import { UjatInstitutionApplicationRegionTabs } from '../list/region-tabs'
import { useUjatInstitutionEducationRegion } from '../use-institution-education-region'
import { UJAT_SCHEDULE_CONFIRM_TABLE_MIN_SCROLL_X } from './columns'
import { UjatInstitutionScheduleConfirmCalendarView } from './calendar-view'
import { useUjatScheduleConfirmList } from './use-schedule-confirm-list'
import type { UjatScheduleConfirmRow } from './types'
import { ButtonCalendarIcon, ButtonListIcon } from '@/shared/ui/icons/ButtonIcons'
import './list.css'
import { CmsDataTable } from '@/shared/ui/cms-data-table'

export function UjatInstitutionScheduleConfirmList({
  programId,
  onOpenDetail,
}: {
  programId?: string | null
  onOpenDetail: (row: UjatScheduleConfirmRow) => void
}) {
  const { activeRegion, setActiveRegion } = useUjatInstitutionEducationRegion()
  const {
    pendingFilters,
    filterFields,
    handleFilterChange,
    handleSearch,
    tableData,
    columns,
    viewMode,
    setViewMode,
    resetRegionState,
  } = useUjatScheduleConfirmList(activeRegion, programId)

  useEffect(() => {
    resetRegionState()
  }, [activeRegion, resetRegionState])

  return (
    <div className="ujat-schedule-confirm-list">
      <UjatInstitutionApplicationRegionTabs
        activeRegion={activeRegion}
        onChange={setActiveRegion}
      />

      <FilterTableLayout
        className="ujat-schedule-confirm-list__filter-layout"
        bordered={false}
        fields={filterFields}
        filters={pendingFilters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        title="기관 신청 목록"
        description={`${tableData.length}건`}
        actions={
          <div className="ujat-schedule-confirm-list__actions">
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
        excelExport={{
          columns,
          data: tableData,
        }}
      >
        {viewMode === 'table' ? (
          <div className="ujat-schedule-confirm-list__table-wrap">
            <CmsDataTable<UjatScheduleConfirmRow>
              rowKey="id"
              className="cms-data-table ujat-schedule-confirm-list__table"
              columns={columns}
              dataSource={tableData}
              pagination={false}
              tableLayout="fixed"
              scroll={{ x: UJAT_SCHEDULE_CONFIRM_TABLE_MIN_SCROLL_X }}
              onRow={record => ({
                onClick: () => onOpenDetail(record),
                style: { cursor: 'pointer' },
              })}
            />
          </div>
        ) : (
          <UjatInstitutionScheduleConfirmCalendarView
            rows={tableData}
            onOpenDetail={onOpenDetail}
          />
        )}
      </FilterTableLayout>
      {viewMode === 'calendar' ? (
        <div className="ujat-schedule-confirm-list__page-bottom-spacer" aria-hidden />
      ) : null}
    </div>
  )
}
