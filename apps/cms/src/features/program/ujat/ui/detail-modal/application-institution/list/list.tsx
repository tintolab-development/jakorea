import { useEffect, useState } from 'react'
import { Table } from 'antd'
import { CalendarOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { CmsButton } from '@/shared/ui'
import type { UjatInstitutionApplicationRegionKey } from './regions'
import { UJAT_INSTITUTION_APPLICATION_FILTER_FIELDS } from './filter-fields'
import { UjatInstitutionApplicationRegionTabs } from './region-tabs'
import { UjatInstitutionApplicationCalendarView } from './calendar-view'
import {
  UJAT_INSTITUTION_APPLICATION_TABLE_MIN_SCROLL_X,
} from './columns'
import type { UjatInstitutionApplicationRow } from './types'
import { useUjatInstitutionApplicationList } from './use-list'
import { UjatInstitutionApplicationActionModal } from './action-modal'
import './list.css'

export function UjatInstitutionApplicationList({
  onOpenDetail,
}: {
  onOpenDetail: (row: UjatInstitutionApplicationRow) => void
}) {
  const [activeRegion, setActiveRegion] =
    useState<UjatInstitutionApplicationRegionKey>('seoul')
  const {
    pendingFilters,
    handleFilterChange,
    handleSearch,
    tableData,
    columns,
    selectedRowKeys,
    setSelectedRowKeys,
    viewMode,
    setViewMode,
    maxClassesPerDay,
    handleBulkApplicationReject,
    handleBulkTempReject,
    handleBulkTempAssign,
    pendingBulkModalAction,
    closeBulkActionModal,
    confirmBulkActionModal,
    selectedApplications,
    resetRegionState,
  } = useUjatInstitutionApplicationList(activeRegion)
  useEffect(() => {
    resetRegionState()
  }, [activeRegion, resetRegionState])

  const titleNote = (
    <>
      예상 1일 최대 학급 수 :{' '}
      <span className="filter-table-layout__title-note-em">{maxClassesPerDay}</span>학급
    </>
  )

  return (
    <div className="ujat-institution-application-list">
      <UjatInstitutionApplicationRegionTabs
        activeRegion={activeRegion}
        onChange={setActiveRegion}
      />

      <FilterTableLayout
        className="ujat-institution-application-list__filter-layout"
        bordered={false}
        fields={UJAT_INSTITUTION_APPLICATION_FILTER_FIELDS}
        filters={pendingFilters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        title="기관 신청 목록"
        titleNote={titleNote}
        description={`${tableData.length}건`}
        actions={
          <div className="ujat-institution-application-list__actions">
            <CmsButton
              type="button"
              variant="delete"
              size="large"
              width={160}
              onClick={handleBulkApplicationReject}
            >
              선택 신청 반려
            </CmsButton>
            <CmsButton
              type="button"
              variant="delete"
              size="large"
              width={160}
              onClick={handleBulkTempReject}
            >
              선택 임시 반려
            </CmsButton>
            <CmsButton
              type="button"
              variant="secondary"
              size="large"
              width={160}
              onClick={handleBulkTempAssign}
            >
              선택 임시 배정
            </CmsButton>
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
          <div className="ujat-institution-application-list__table-wrap">
            <Table<UjatInstitutionApplicationRow>
              rowKey="id"
              className="cms-data-table ujat-institution-application-list__table"
              columns={columns}
              dataSource={tableData}
              pagination={false}
              tableLayout="fixed"
              scroll={{ x: UJAT_INSTITUTION_APPLICATION_TABLE_MIN_SCROLL_X }}
              rowSelection={{
                selectedRowKeys,
                onChange: keys => setSelectedRowKeys(keys),
              }}
              onRow={record => ({
                onClick: e => {
                  const target = e.target as HTMLElement
                  if (
                    target.closest('.ant-table-selection-column') ||
                    target.closest('.ant-checkbox-wrapper')
                  ) {
                    return
                  }
                  onOpenDetail(record)
                },
                style: { cursor: 'pointer' },
              })}
            />
          </div>
        ) : (
          <UjatInstitutionApplicationCalendarView
            rows={tableData}
            selectedRowKeys={selectedRowKeys}
            onSelectionChange={setSelectedRowKeys}
          />
        )}
      </FilterTableLayout>
      {viewMode === 'calendar' ? (
        <div className="ujat-institution-application-list__page-bottom-spacer" aria-hidden />
      ) : null}

      {pendingBulkModalAction ? (
        <UjatInstitutionApplicationActionModal
          open
          action={pendingBulkModalAction}
          variant={selectedApplications.length === 1 ? 'single' : 'bulk'}
          institutionName={selectedApplications[0]?.institutionName}
          selectionCount={selectedApplications.length}
          onCancel={closeBulkActionModal}
          onConfirm={() => confirmBulkActionModal()}
        />
      ) : null}
    </div>
  )
}
