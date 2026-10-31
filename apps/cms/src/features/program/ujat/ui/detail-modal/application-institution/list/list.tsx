import { useEffect } from 'react'
import { Spin } from 'antd'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { FilterTableToolbarButton } from '@/shared/ui'
import { useUjatCanWrite } from '@/features/program/ujat/lib/use-can-write'
import { UJAT_INSTITUTION_APPLICATION_FILTER_FIELDS } from './filter-fields'
import { UjatInstitutionApplicationRegionTabs } from './region-tabs'
import { useUjatInstitutionEducationRegion } from '../use-institution-education-region'
import { UjatInstitutionApplicationCalendarView } from './calendar-view'
import { ujatInstitutionApplicationTableScrollX } from './columns'
import type { UjatInstitutionApplicationRow } from './types'
import { useUjatInstitutionApplicationList } from './use-list'
import { UjatInstitutionApplicationActionModal } from './action-modal'
import { TemporaryActionModal } from '../temporary-action-modal'
import { useGatedInfiniteScroll } from '@/shared/hooks/use-gated-infinite-scroll'
import { ButtonCalendarIcon, ButtonListIcon } from '@/shared/ui/icons/ButtonIcons'
import './list.css'
import { CmsDataTable } from '@/shared/ui/cms-data-table'

export function UjatInstitutionApplicationList({
  onOpenDetail,
  onOpenScheduleAssign,
  programId,
}: {
  onOpenDetail: (row: UjatInstitutionApplicationRow) => void
  onOpenScheduleAssign?: () => void
  programId?: string | null
}) {
  const canWrite = useUjatCanWrite()
  const { activeRegion, setActiveRegion } = useUjatInstitutionEducationRegion()
  const {
    pendingFilters,
    handleFilterChange,
    handleSearch,
    tableData,
    totalElements,
    columns,
    scheduleColumnCount,
    selectedRowKeys,
    setSelectedRowKeys,
    viewMode,
    setViewMode,
    maxClassesPerDay,
    handleBulkApplicationReject,
    handleBulkTempReject,
    handleBulkTempAssign,
    pendingTempAction,
    tempActionLoading,
    closeTempActionModal,
    confirmBulkTempAssign,
    confirmBulkTempReject,
    eligibleTempAssignRows,
    eligibleTempRejectRows,
    eligibleApplicationRejectRows,
    pendingApplicationRejectModal,
    closeApplicationRejectModal,
    confirmApplicationRejectModal,
    resetRegionState,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    infiniteScrollResetKey,
    isListPending,
  } = useUjatInstitutionApplicationList(activeRegion, programId)
  const { sentinelRef: loadMoreRef } = useGatedInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    resetKey: infiniteScrollResetKey,
  })
  useEffect(() => {
    resetRegionState()
  }, [activeRegion, resetRegionState])

  const titleNote =
    maxClassesPerDay == null ? null : (
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
        contentVariant={viewMode === 'calendar' ? 'calendar' : 'table'}
        fields={UJAT_INSTITUTION_APPLICATION_FILTER_FIELDS}
        filters={pendingFilters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        title="기관 신청 목록"
        titleNote={titleNote}
        description={`${totalElements}건`}
        actions={
          <div className="ujat-institution-application-list__actions">
            {canWrite ? (
              <>
            <FilterTableToolbarButton
              type="button"
              variant="delete"
              onClick={handleBulkApplicationReject}
            >
              선택 신청 반려
            </FilterTableToolbarButton>
            <FilterTableToolbarButton
              type="button"
              variant="delete"
              onClick={handleBulkTempReject}
            >
              선택 임시 반려
            </FilterTableToolbarButton>
            <FilterTableToolbarButton
              type="button"
              variant="secondary"
              onClick={handleBulkTempAssign}
            >
              선택 임시 배정
            </FilterTableToolbarButton>
              </>
            ) : null}
            {viewMode === 'table' ? (
              <FilterTableToolbarButton
                type="button"
                variant="secondary"
                icon={<ButtonCalendarIcon />}
                onClick={() => setViewMode('calendar')} >
                캘린더 뷰로 보기
              </FilterTableToolbarButton>
            ) : (
              <FilterTableToolbarButton
                type="button"
                variant="secondary"
                icon={<ButtonListIcon />}
                onClick={() => setViewMode('table')} >
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
                selectedRowKeys,
              }
            : undefined
        }
      >
        {viewMode === 'table' ? (
          <div className="ujat-institution-application-list__table-wrap">
            <CmsDataTable<UjatInstitutionApplicationRow>
              rowKey="id"
              className="cms-data-table ujat-institution-application-list__table"
              columns={columns}
              dataSource={tableData}
              pagination={false}
              tableLayout="fixed"
              scroll={{ x: ujatInstitutionApplicationTableScrollX(scheduleColumnCount) }}
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
            programId={programId}
            rows={tableData}
            selectedRowKeys={selectedRowKeys}
            onSelectionChange={setSelectedRowKeys}
            onOpenDetail={onOpenDetail}
            listPending={isListPending}
          />
        )}
        <div ref={loadMoreRef} aria-hidden={!isFetchingNextPage} style={{ minHeight: 1 }}>
          {isFetchingNextPage ? <Spin size="small" /> : null}
        </div>
      </FilterTableLayout>
      {viewMode === 'calendar' ? (
        <div className="ujat-institution-application-list__page-bottom-spacer" aria-hidden />
      ) : null}

      {pendingTempAction ? (
        <TemporaryActionModal
          open
          kind={pendingTempAction}
          institutionNames={(
            pendingTempAction === 'temp_assign'
              ? eligibleTempAssignRows
              : eligibleTempRejectRows
          ).map(row => row.institutionName)}
          loading={tempActionLoading}
          onCancel={closeTempActionModal}
          onConfirm={() => {
            if (pendingTempAction === 'temp_assign') {
              confirmBulkTempAssign()
              onOpenScheduleAssign?.()
              return
            }
            void confirmBulkTempReject()
          }}
        />
      ) : null}

      {pendingApplicationRejectModal ? (
        <UjatInstitutionApplicationActionModal
          open
          action="application_reject"
          variant={eligibleApplicationRejectRows.length === 1 ? 'single' : 'bulk'}
          institutionName={eligibleApplicationRejectRows[0]?.institutionName}
          selectionCount={eligibleApplicationRejectRows.length}
          onCancel={closeApplicationRejectModal}
          onConfirm={payload => {
            void confirmApplicationRejectModal(payload)
          }}
        />
      ) : null}
    </div>
  )
}
