import { useEffect, useState } from 'react'
import { Table } from 'antd'
import { CalendarOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { CmsButton } from '@/shared/ui'
import type { UjatInstitutionApplicationRegionKey } from '../list/regions'
import { UjatInstitutionApplicationRegionTabs } from '../list/region-tabs'
import { UJAT_SCHEDULE_CONFIRM_TABLE_MIN_SCROLL_X } from './columns'
import { UjatInstitutionScheduleConfirmCalendarView } from './calendar-view'
import { useUjatScheduleConfirmList } from './use-schedule-confirm-list'
import type { UjatScheduleConfirmRow } from './types'
import './list.css'

export function UjatInstitutionScheduleConfirmList({
  onOpenDetail,
}: {
  onOpenDetail: (row: UjatScheduleConfirmRow) => void
}) {
  const [activeRegion, setActiveRegion] =
    useState<UjatInstitutionApplicationRegionKey>('seoul')
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
  } = useUjatScheduleConfirmList(activeRegion)

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
        excelExport={{
          columns,
          data: tableData,
        }}
      >
        {viewMode === 'table' ? (
          <div className="ujat-schedule-confirm-list__table-wrap">
            <Table<UjatScheduleConfirmRow>
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
