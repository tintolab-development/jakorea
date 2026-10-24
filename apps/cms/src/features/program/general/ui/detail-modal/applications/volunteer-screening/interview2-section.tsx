import { useCallback, useMemo, type MouseEvent } from 'react'
import { Spin } from 'antd'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { CMS_APPLICATION_LIST_BULK_BUTTON_WIDTH, FilterTableToolbarButton } from '@/shared/ui'
import type { Program } from '@/types/domain'
import type {
  GeneralVolunteerApplicantRow,
  GeneralVolunteerInterviewEvaluationPayload,
} from '@/features/program/general/model/volunteer-applicant'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import {
  buildGeneralVolunteerInterview2CalendarFilterFields,
  buildGeneralVolunteerInterview2FilterFields,
} from '@/features/program/general/lib/volunteer-doc-screening-filter-fields'
import {
  screeningInterview2ListTitle,
  type ScreeningSubjectKind,
} from '@/features/program/general/lib/screening-subject-kind'
import { resolveGeneralInterview2TableScrollX } from './interview2-columns'
import {
  useGeneralVolunteerApplicantDetail,
  type GeneralVolunteerApplicantDetailMetaChangeHandler,
} from './use-detail'
import { GeneralVolunteerApplicantDetailView } from './detail-view'
import { GeneralVolunteerInterview2BulkFailCompleteModal } from './general-volunteer-interview2-bulk-fail-complete-modal'
import { GeneralVolunteerInterview2BulkFailModal } from './general-volunteer-interview2-bulk-fail-modal'
import { GeneralVolunteerInterview2BulkPassModal } from './general-volunteer-interview2-bulk-pass-modal'
import { GeneralVolunteerInterview2FailCompleteModal } from './general-volunteer-interview2-fail-complete-modal'
import { GeneralVolunteerInterview2FailModal } from './general-volunteer-interview2-fail-modal'
import { GeneralVolunteerInterview2PassCompleteModal } from './general-volunteer-interview2-pass-complete-modal'
import { GeneralVolunteerInterview2PassModal } from './general-volunteer-interview2-pass-modal'
import { GeneralVolunteerInterview2CancelPassModal } from './general-volunteer-interview2-cancel-pass-modal'
import { GeneralVolunteerInterview2CancelFailModal } from './general-volunteer-interview2-cancel-fail-modal'
import { GeneralVolunteerInterview2CalendarView } from './general-volunteer-interview2-calendar-view'
import { GeneralParticipantApplicantDetailView } from '../participant-screening/participant-applicant-detail-view'
import { mapVolunteerScreeningRowToParticipant } from '@/features/program/general/lib/participant-volunteer-row-adapter'
import { useGeneralVolunteerInterview2 } from './use-interview2'
import { useGeneralInterviewEvaluationAccess } from '@/features/program/general/hooks/use-interview-evaluation-access'
import { useGatedInfiniteScroll } from '@/shared/hooks/use-gated-infinite-scroll'
import { GeneralVolunteerScreeningActivityWithdrawModal } from './general-volunteer-screening-activity-withdraw-modal'
import { GeneralVolunteerScreeningActivityWithdrawCompleteModal } from './general-volunteer-screening-activity-withdraw-complete-modal'
import { CMS_DATA_TABLE_ROW_DISABLED_CLASS } from '@/shared/constants/table'
import { isGeneralVolunteerInterview2SelectableForResult } from './general-volunteer-interview2-actions'
import { ButtonCalendarIcon, ButtonListIcon } from '@/shared/ui/icons/ButtonIcons'
import '@/features/program/shared/ui/program-detail/applicant-list/applicant-list.css'
import './volunteer-screening.css'
import './interview2-section.css'

export function GeneralVolunteerInterview2Section({
  program,
  programId,
  subjectKind = 'volunteer',
  onRegisterApplicantCloseHandler,
  onVolunteerApplicantDetailMetaChange,
}: {
  program: Program
  programId: string
  subjectKind?: ScreeningSubjectKind
  onRegisterApplicantCloseHandler?: (fn: (() => boolean) | null) => void
  onVolunteerApplicantDetailMetaChange?: GeneralVolunteerApplicantDetailMetaChangeHandler
}) {
  const listTitle = screeningInterview2ListTitle(subjectKind)

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
    bulkFailModalOpen,
    closeBulkFailModal,
    confirmBulkFail,
    bulkFailCount,
    bulkFailCompleteCount,
    closeBulkFailCompleteModal,
    passModalVolunteer,
    failModalVolunteer,
    closePassModal,
    closeFailModal,
    handlePassModalConfirm,
    handleFailModalConfirm,
    passCompleteVolunteerName,
    failCompleteVolunteer,
    closePassCompleteModal,
    closeFailCompleteModal,
    requestWithdrawActivity,
    cancelWithdrawActivity,
    confirmWithdrawActivity,
    withdrawTarget,
    withdrawSubmitting,
    activityWithdrawScheduleOptions,
    withdrawCompleteVolunteerName,
    closeWithdrawCompleteModal,
    requestInterview2Pass,
    requestInterview2Fail,
    cancelPassVolunteer,
    cancelFailVolunteer,
    openCancelPassModal,
    closeCancelPassModal,
    openCancelFailModal,
    closeCancelFailModal,
    handleCancelPassConfirm,
    handleCancelFailConfirm,
    saveInterviewEvaluation,
    filterRowsSource,
    applicationsLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useGeneralVolunteerInterview2({ programId, program, subjectKind })
  const evaluationAccess = useGeneralInterviewEvaluationAccess(programId)
  const { sentinelRef: loadMoreRef } = useGatedInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    resetKey: `${programId}:${subjectKind}:${viewMode}`,
  })

  const filterFields = useMemo(
    () =>
      viewMode === 'calendar'
        ? buildGeneralVolunteerInterview2CalendarFilterFields(filterRowsSource, subjectKind)
        : buildGeneralVolunteerInterview2FilterFields(filterRowsSource, subjectKind),
    [filterRowsSource, subjectKind, viewMode]
  )

  const { selectedApplicant, openApplicantDetail } = useGeneralVolunteerApplicantDetail({
    programId,
    list,
    variant: 'interview2',
    subjectKind,
    loading: applicationsLoading,
    onRegisterApplicantCloseHandler,
    onVolunteerApplicantDetailMetaChange,
  })

  const handleRowClick = useCallback(
    (record: GeneralVolunteerApplicantRow, e: MouseEvent) => {
      if (record.interviewAssignmentStatus === 'withdrawn') return
      const target = e.target as HTMLElement
      if (
        target.closest('.ant-btn') ||
        target.closest('button') ||
        target.closest('.ant-checkbox-wrapper') ||
        target.closest('.ant-checkbox')
      ) {
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

  const handleDetailCancelInterviewPass = useCallback(() => {
    if (!selectedApplicant) return
    openCancelPassModal(selectedApplicant)
  }, [openCancelPassModal, selectedApplicant])

  const handleDetailCancelInterviewFail = useCallback(() => {
    if (!selectedApplicant) return
    openCancelFailModal(selectedApplicant)
  }, [openCancelFailModal, selectedApplicant])

  const handleDetailSaveInterviewEvaluation = useCallback(
    async (payload: GeneralVolunteerInterviewEvaluationPayload) => {
      if (!selectedApplicant) return false
      return saveInterviewEvaluation(selectedApplicant, payload)
    },
    [saveInterviewEvaluation, selectedApplicant]
  )

  const withdrawConfirmModal = (
    <>
      <GeneralVolunteerScreeningActivityWithdrawModal
        open={withdrawTarget != null}
        volunteerName={withdrawTarget?.name ?? ''}
        scheduleOptions={activityWithdrawScheduleOptions}
        confirming={withdrawSubmitting}
        onCancel={cancelWithdrawActivity}
        onConfirm={confirmWithdrawActivity}
      />
      <GeneralVolunteerScreeningActivityWithdrawCompleteModal
        open={withdrawCompleteVolunteerName != null}
        volunteerName={withdrawCompleteVolunteerName ?? ''}
        onClose={closeWithdrawCompleteModal}
      />
    </>
  )

  const bulkPassModal = (
    <GeneralVolunteerInterview2BulkPassModal
      open={bulkPassModalOpen}
      count={bulkPassCount}
      onCancel={closeBulkPassModal}
      onConfirm={confirmBulkPass}
    />
  )

  const bulkFailModal = (
    <GeneralVolunteerInterview2BulkFailModal
      open={bulkFailModalOpen}
      selectionCount={bulkFailCount}
      onCancel={closeBulkFailModal}
      onConfirm={confirmBulkFail}
    />
  )

  const passFailModals = (
    <>
      <GeneralVolunteerInterview2PassModal
        open={passModalVolunteer != null}
        volunteerName={passModalVolunteer?.name ?? ''}
        onCancel={closePassModal}
        onConfirm={handlePassModalConfirm}
      />
      <GeneralVolunteerInterview2FailModal
        open={failModalVolunteer != null}
        volunteerName={failModalVolunteer?.name ?? ''}
        onCancel={closeFailModal}
        onConfirm={handleFailModalConfirm}
      />
      <GeneralVolunteerInterview2CancelPassModal
        open={cancelPassVolunteer != null}
        volunteer={cancelPassVolunteer}
        onCancel={closeCancelPassModal}
        onConfirm={handleCancelPassConfirm}
      />
      <GeneralVolunteerInterview2CancelFailModal
        open={cancelFailVolunteer != null}
        volunteer={cancelFailVolunteer}
        onCancel={closeCancelFailModal}
        onConfirm={handleCancelFailConfirm}
      />
    </>
  )

  const bulkFailCompleteModal = (
    <GeneralVolunteerInterview2BulkFailCompleteModal
      open={bulkFailCompleteCount != null}
      selectionCount={bulkFailCompleteCount ?? 0}
      onClose={closeBulkFailCompleteModal}
    />
  )

  const completeModals = (
    <>
      <GeneralVolunteerInterview2PassCompleteModal
        open={passCompleteVolunteerName != null}
        volunteerName={passCompleteVolunteerName ?? ''}
        onClose={closePassCompleteModal}
      />
      <GeneralVolunteerInterview2FailCompleteModal
        open={failCompleteVolunteer != null}
        volunteerName={failCompleteVolunteer?.name ?? ''}
        failReason={failCompleteVolunteer?.reason ?? ''}
        onClose={closeFailCompleteModal}
      />
      {bulkFailCompleteModal}
    </>
  )

  if (selectedApplicant) {
    if (subjectKind === 'participant') {
      return (
        <>
          <GeneralParticipantApplicantDetailView
            program={program}
            applicantId={selectedApplicant.id}
            screeningStage="interview2"
            applicant={
              selectedApplicant.participantApplicant ??
              mapVolunteerScreeningRowToParticipant(selectedApplicant)
            }
            onRegisterApplicantCloseHandler={onRegisterApplicantCloseHandler}
            onApplicantDetailMetaChange={meta => {
              if (!meta) {
                onVolunteerApplicantDetailMetaChange?.(null)
                return
              }
              onVolunteerApplicantDetailMetaChange?.({
                title: meta.title,
                breadcrumbLabel: meta.breadcrumbLabel,
              })
            }}
          />
          {passFailModals}
          {withdrawConfirmModal}
          {bulkPassModal}
          {bulkFailModal}
          {completeModals}
        </>
      )
    }

    return (
      <>
        <GeneralVolunteerApplicantDetailView
          variant="interview2"
          applicant={selectedApplicant}
          onWithdrawActivity={handleDetailWithdrawActivity}
          onInterviewFail={handleDetailInterviewFail}
          onInterviewPass={handleDetailInterviewPass}
          onCancelInterviewPass={handleDetailCancelInterviewPass}
          onCancelInterviewFail={handleDetailCancelInterviewFail}
          canFillBothEvaluationSlots={evaluationAccess.canFillBothSlots}
          currentAdminId={evaluationAccess.currentAdminId}
          onSaveInterviewEvaluation={handleDetailSaveInterviewEvaluation}
        />
        {passFailModals}
        {withdrawConfirmModal}
        {bulkPassModal}
        {bulkFailModal}
        {completeModals}
      </>
    )
  }

  if (applicationsLoading && list.length === 0) {
    return (
      <div className="detail-fullpage-modal__loading" role="status">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div
      className={[
        'general-volunteer-interview2 applicant-details',
        viewMode === 'calendar' ? 'general-program-detail--calendar-view' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {passFailModals}
      {withdrawConfirmModal}
      {bulkPassModal}
      {bulkFailModal}
      {completeModals}
      <FilterTableLayout
        bordered={false}
        contentVariant={viewMode === 'calendar' ? 'calendar' : 'table'}
        className="general-volunteer-interview2__filter-layout applicant-details__filter-table-layout"
        fields={filterFields}
        filters={pendingFilters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        title={
          <div className="general-volunteer-interview2__toolbar-main">
            <span className="general-volunteer-interview2__toolbar-title">{listTitle}</span>
            <span className="general-volunteer-interview2__toolbar-count">{count}건</span>
          </div>
        }
        actions={
          <div className="general-volunteer-interview2__actions">
            <FilterTableToolbarButton
              type="button"
              variant="delete"
              className="cms-button--application-list-bulk"
              width={CMS_APPLICATION_LIST_BULK_BUTTON_WIDTH}
              onClick={handleBulkFail}
            >
              선택 불합격
            </FilterTableToolbarButton>
            <FilterTableToolbarButton
              type="button"
              variant="secondary"
              className="cms-button--application-list-bulk"
              width={CMS_APPLICATION_LIST_BULK_BUTTON_WIDTH}
              onClick={handleBulkPass}
            >
              선택 합격
            </FilterTableToolbarButton>
            {viewMode === 'list' ? (
              <FilterTableToolbarButton
                type="button"
                variant="secondary"
                icon={<ButtonCalendarIcon />}
                onClick={handleViewCalendar}
              >
                캘린더 뷰로 보기
              </FilterTableToolbarButton>
            ) : (
              <FilterTableToolbarButton
                type="button"
                variant="secondary"
                icon={<ButtonListIcon />}
                onClick={handleViewList}
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
        {viewMode === 'list' ? (
          <div className="general-volunteer-interview2__table-wrap">
            <CmsDataTable<GeneralVolunteerApplicantRow>
              rowKey="id"
              className="cms-data-table cms-data-table--fluid clickable-table"
              columns={columns}
              dataSource={tableData}
              pagination={false}
              tableLayout="fixed"
              scroll={{ x: resolveGeneralInterview2TableScrollX(subjectKind) }}
              rowClassName={record =>
                record.interviewAssignmentStatus === 'withdrawn'
                  ? CMS_DATA_TABLE_ROW_DISABLED_CLASS
                  : ''
              }
              rowSelection={{
                selectedRowKeys,
                onChange: keys => setSelectedRowKeys(keys),
                getCheckboxProps: record => ({
                  disabled: !isGeneralVolunteerInterview2SelectableForResult(record),
                }),
              }}
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
          <div className="general-volunteer-interview2__calendar-container">
            <GeneralVolunteerInterview2CalendarView
              events={calendarEvents}
              selectedRowKeys={selectedRowKeys}
              onSelectionChange={setSelectedRowKeys}
              onItemClick={openApplicantDetail}
            />
          </div>
        )}
        <div ref={loadMoreRef} aria-hidden style={{ height: 1 }} />
      </FilterTableLayout>
      {viewMode === 'calendar' ? (
        <div className="applicant-details__calendar-page-bottom-spacer" aria-hidden />
      ) : null}
    </div>
  )
}
