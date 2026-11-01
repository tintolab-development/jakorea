import { useCallback, useMemo, type MouseEvent } from 'react'
import { Spin } from 'antd'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import {
  FilterTableToolbarButton,
} from '@/shared/ui'
import { useUjatCanWrite } from '@/features/program/ujat/lib/use-can-write'
import { ConfirmModal } from '@/shared/ui/confirm-modal'
import type { UjatVolunteerRecruitHalf } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import type {
  UjatVolunteerApplicantRow,
  UjatVolunteerInterviewEvaluationPayload,
} from '@/features/program/ujat/model/ujat-volunteer-applicant'
import { buildUjatVolunteerInterview2FilterRows } from './filter-fields'
import { useUjatVolunteerInterview2 } from './use-list'
import { ActivityWithdrawScheduleModal } from '@/features/program/shared/ui/activity-withdraw-schedule-modal'
import { filterScheduleDatesByHalf } from '@/features/program/ujat/ui/detail-modal/application-institution/education-schedule'
import { useUjatProgramScheduleDates } from '@/features/program/ujat/ui/detail-modal/application-institution/use-program-schedule-dates'
import { useApplicantDetail, type ApplicantDetailMetaChangeHandler } from '../applicant/use-detail'
import { ApplicantDetailView } from '../applicant/detail-view'
import { UjatVolunteerInterview2BulkPassModal } from './bulk-pass-modal'
import { isUjatVolunteerInterview2SelectableForResult } from './display'
import { GeneralVolunteerInterview2FailModal } from '@/features/program/general/ui/detail-modal/applications/volunteer-screening/general-volunteer-interview2-fail-modal'
import { GeneralVolunteerInterview2BulkFailModal } from '@/features/program/general/ui/detail-modal/applications/volunteer-screening/general-volunteer-interview2-bulk-fail-modal'
import { UjatInterview2ResultCompleteModal } from './result-complete-modal'
import { UjatVolunteerInterview2CalendarView } from './calendar-view'
import { CMS_DATA_TABLE_ROW_DISABLED_CLASS } from '@/shared/constants/table'
import { useContainerFitTableScrollX } from '@/shared/lib/resolve-table-min-scroll-x'
import type { ColumnsType } from 'antd/es/table'
import { useGatedInfiniteScroll } from '@/shared/hooks/use-gated-infinite-scroll'
import { ButtonCalendarIcon, ButtonListIcon } from '@/shared/ui/icons/ButtonIcons'
import './section.css'
import '@/features/program/shared/ui/program-detail/applicant-list/applicants-detail.css'
import { CmsDataTable } from '@/shared/ui/cms-data-table'

export interface Interview2SectionProps {
  programId: string
  half: UjatVolunteerRecruitHalf
  onRegisterApplicantCloseHandler?: (fn: (() => boolean) | null) => void
  onVolunteerApplicantDetailMetaChange?: ApplicantDetailMetaChangeHandler
}

export function Interview2Section({
  programId,
  half,
  onRegisterApplicantCloseHandler,
  onVolunteerApplicantDetailMetaChange,
}: Interview2SectionProps) {
  const canWrite = useUjatCanWrite()
  const {
    list,
    pendingFilters,
    handleFilterChange,
    handleSearch,
    tableData,
    columns,
    count,
    viewMode,
    handleViewCalendar,
    handleViewList,
    calendarEvents,
    selectedRowKeys,
    setSelectedRowKeys,
    handleBulkFail,
    handleBulkPass,
    bulkPassModalOpen,
    closeBulkPassModal,
    confirmBulkPass,
    bulkPassCount,
    bulkPassSubjectName,
    interview2Confirm,
    closeInterview2Confirm,
    failModal,
    closeFailModal,
    confirmInterview2Fail,
    resultCompleteKind,
    closeResultCompleteModal,
    filterRowsSource,
    requestWithdrawActivity,
    cancelWithdrawActivity,
    confirmWithdrawActivity,
    withdrawTarget,
    requestInterview2Pass,
    requestInterview2Fail,
    saveInterviewEvaluation,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    infiniteScrollResetKey,
  } = useUjatVolunteerInterview2({ programId, half })
  const { sentinelRef: loadMoreRef } = useGatedInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    resetKey: infiniteScrollResetKey,
  })

  const { selectedApplicant, openApplicantDetail } = useApplicantDetail({
    programId,
    half,
    list,
    detailVariant: 'interview2',
    onRegisterApplicantCloseHandler,
    onVolunteerApplicantDetailMetaChange,
  })

  const filterFields = useMemo(
    () =>
      buildUjatVolunteerInterview2FilterRows(filterRowsSource, {
        includeInterviewDate: viewMode === 'list',
      })[0] ?? [],
    [filterRowsSource, viewMode]
  )

  const { tableWrapRef, tableScrollX } = useContainerFitTableScrollX(
    columns as ColumnsType<unknown>,
    { enabled: viewMode === 'list', includeSelection: true }
  )

  const { dates: scheduleDates } = useUjatProgramScheduleDates(programId)
  const activityWithdrawScheduleOptions = useMemo(
    () =>
      filterScheduleDatesByHalf(scheduleDates, half).map(entry => ({
        value: entry.isoDate,
        label: entry.title,
      })),
    [half, scheduleDates]
  )

  const handleRowClick = useCallback(
    (record: UjatVolunteerApplicantRow, e: MouseEvent) => {
      if (record.interviewAssignmentStatus === 'withdrawn') return
      const target = e.target as HTMLElement
      if (target.closest('.ant-btn') || target.closest('button')) {
        return
      }
      if (target.closest('.ant-checkbox-wrapper') || target.closest('.ant-checkbox')) {
        return
      }
      openApplicantDetail(record)
    },
    [openApplicantDetail]
  )

  const handleDetailWithdrawActivity = useCallback(() => {
    if (!selectedApplicant) return
    requestWithdrawActivity(selectedApplicant)
  }, [requestWithdrawActivity, selectedApplicant])

  const handleDetailInterviewFail = useCallback(() => {
    if (!selectedApplicant) return
    requestInterview2Fail(selectedApplicant)
  }, [requestInterview2Fail, selectedApplicant])

  const handleDetailInterviewPass = useCallback(() => {
    if (!selectedApplicant) return
    requestInterview2Pass(selectedApplicant)
  }, [requestInterview2Pass, selectedApplicant])

  const handleDetailSaveInterviewEvaluation = useCallback(
    async (payload: UjatVolunteerInterviewEvaluationPayload) => {
      if (!selectedApplicant) return false
      return saveInterviewEvaluation(selectedApplicant, payload)
    },
    [saveInterviewEvaluation, selectedApplicant]
  )

  const interview2ConfirmModal =
    interview2Confirm != null ? (
      <ConfirmModal
        open
        title={interview2Confirm.title}
        content={interview2Confirm.content}
        confirmText={interview2Confirm.confirmText}
        cancelText="취소"
        danger={interview2Confirm.danger}
        onConfirm={() => {
          interview2Confirm.onConfirm()
          closeInterview2Confirm()
        }}
        onCancel={closeInterview2Confirm}
      />
    ) : null

  const withdrawConfirmModal = (
    <ActivityWithdrawScheduleModal
      open={withdrawTarget != null}
      scheduleOptions={activityWithdrawScheduleOptions}
      onCancel={cancelWithdrawActivity}
      onConfirm={confirmWithdrawActivity}
      subjectName={withdrawTarget?.name ?? ''}
      subjectKind="person"
    />
  )

  const bulkPassModal = (
    <UjatVolunteerInterview2BulkPassModal
      open={bulkPassModalOpen}
      subjectName={bulkPassSubjectName}
      count={bulkPassCount}
      onCancel={closeBulkPassModal}
      onConfirm={confirmBulkPass}
    />
  )

  const interview2FailModal =
    failModal != null && failModal.ids.length === 1 ? (
      <GeneralVolunteerInterview2FailModal
        open
        volunteerName={failModal.volunteerName}
        onCancel={closeFailModal}
        onConfirm={payload => {
          void confirmInterview2Fail(payload)
        }}
      />
    ) : failModal != null ? (
      <GeneralVolunteerInterview2BulkFailModal
        open
        selectionCount={failModal.ids.length}
        onCancel={closeFailModal}
        onConfirm={payload => {
          void confirmInterview2Fail(payload)
        }}
      />
    ) : null

  const resultCompleteModal = (
    <UjatInterview2ResultCompleteModal
      open={resultCompleteKind != null}
      kind={resultCompleteKind}
      onClose={closeResultCompleteModal}
    />
  )

  if (selectedApplicant) {
    return (
      <>
        <ApplicantDetailView
          variant="interview2"
          applicant={selectedApplicant}
          onWithdrawActivity={handleDetailWithdrawActivity}
          onInterviewFail={handleDetailInterviewFail}
          onInterviewPass={handleDetailInterviewPass}
          onSaveInterviewEvaluation={handleDetailSaveInterviewEvaluation}
        />
        {interview2ConfirmModal}
        {interview2FailModal}
        {withdrawConfirmModal}
        {bulkPassModal}
        {resultCompleteModal}
      </>
    )
  }

  return (
    <div className="ujat-volunteer-interview2 applicant-details">
      {interview2ConfirmModal}
      {interview2FailModal}
      {withdrawConfirmModal}
      {bulkPassModal}
      {resultCompleteModal}
      <FilterTableLayout
        bordered={false}
        className="ujat-volunteer-interview2__filter-layout"
        multiRowGridMode="responsive"
        multiRowResponsiveLayout="merged-auto-fill"
        mergedAutoFillInlineSearch
        fields={filterFields}
        filters={pendingFilters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        title="봉사자 2차 면접 대상자 목록"
        description={`${count.toLocaleString()}건`}
        actions={
          <div className="ujat-volunteer-interview2__actions">
            {canWrite ? (
              <>
            <FilterTableToolbarButton
              type="button"
              variant="delete"
              onClick={handleBulkFail} >
              선택 불합격
            </FilterTableToolbarButton>
            <FilterTableToolbarButton
              type="button"
              variant="secondary"
              onClick={handleBulkPass} >
              선택 합격
            </FilterTableToolbarButton>
              </>
            ) : null}
            {viewMode === 'list' ? (
              <FilterTableToolbarButton
                type="button"
                variant="secondary"
                style={{ minWidth: 180 }}
                icon={<ButtonCalendarIcon />}
                onClick={handleViewCalendar} >
                캘린더뷰 보기
              </FilterTableToolbarButton>
            ) : (
              <FilterTableToolbarButton
                type="button"
                variant="secondary"
                style={{ minWidth: 180 }}
                icon={<ButtonListIcon />}
                onClick={handleViewList} >
                리스트로 보기
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
        {viewMode === 'list' ? (
          <div ref={tableWrapRef} className="ujat-volunteer-interview2__table-wrap">
            <CmsDataTable<UjatVolunteerApplicantRow>
              rowKey="id"
              className="cms-data-table cms-data-table--fluid clickable-table"
              columns={columns}
              dataSource={tableData}
              pagination={false}
              tableLayout="fixed"
              scroll={tableScrollX != null ? { x: tableScrollX } : undefined}
              rowSelection={{
                selectedRowKeys,
                onChange: keys => setSelectedRowKeys(keys),
                getCheckboxProps: record => ({
                  disabled: !isUjatVolunteerInterview2SelectableForResult(record),
                }),
              }}
              rowClassName={record =>
                record.interviewAssignmentStatus === 'withdrawn'
                  ? CMS_DATA_TABLE_ROW_DISABLED_CLASS
                  : ''
              }
              onRow={record => {
                const withdrawn = record.interviewAssignmentStatus === 'withdrawn'
                return {
                  onClick: withdrawn ? undefined : e => handleRowClick(record, e),
                  style: { cursor: withdrawn ? 'default' : 'pointer' },
                }
              }}
            />
          </div>
        ) : (
          <div className="ujat-volunteer-interview2__calendar-container">
            <UjatVolunteerInterview2CalendarView
              events={calendarEvents}
              selectedRowKeys={selectedRowKeys}
              onSelectionChange={setSelectedRowKeys}
              onItemClick={openApplicantDetail}
            />
          </div>
        )}
        <div ref={loadMoreRef} aria-hidden={!isFetchingNextPage} style={{ minHeight: 1 }}>
          {isFetchingNextPage ? <Spin size="small" /> : null}
        </div>
      </FilterTableLayout>
      {viewMode === 'calendar' ? (
        <div className="applicant-details__calendar-page-bottom-spacer" aria-hidden />
      ) : null}
    </div>
  )
}
