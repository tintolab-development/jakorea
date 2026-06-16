import { useCallback, useMemo, type MouseEvent } from 'react'
import { Table } from 'antd'
import { CalendarOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { CmsButton, CMS_ACTION_BUTTON_WIDTH } from '@/shared/ui'
import type { Program } from '@/types/domain'
import type { GeneralVolunteerApplicantRow } from '@/data/mock/general-volunteer-applicants-mock'
import {
  buildGeneralVolunteerInterview2CalendarFilterRows,
  buildGeneralVolunteerInterview2FilterRows,
} from '@/features/program/general/lib/volunteer-doc-screening-filter-fields'
import {
  screeningInterview2ListTitle,
  type ScreeningSubjectKind,
} from '@/features/program/general/lib/screening-subject-kind'
import { GENERAL_VOLUNTEER_INTERVIEW2_TABLE_SCROLL_X } from './interview2-columns'
import {
  useGeneralVolunteerApplicantDetail,
  type GeneralVolunteerApplicantDetailMetaChangeHandler,
} from './use-detail'
import { GeneralVolunteerApplicantDetailView } from './detail-view'
import { GeneralVolunteerInterviewEvaluationModal } from './interview-evaluation-modal'
import { GeneralVolunteerInterview2BulkFailCompleteModal } from './general-volunteer-interview2-bulk-fail-complete-modal'
import { GeneralVolunteerInterview2BulkFailModal } from './general-volunteer-interview2-bulk-fail-modal'
import { GeneralVolunteerInterview2BulkPassModal } from './general-volunteer-interview2-bulk-pass-modal'
import { GeneralVolunteerInterview2FailCompleteModal } from './general-volunteer-interview2-fail-complete-modal'
import { GeneralVolunteerInterview2FailModal } from './general-volunteer-interview2-fail-modal'
import { GeneralVolunteerInterview2PassCompleteModal } from './general-volunteer-interview2-pass-complete-modal'
import { GeneralVolunteerInterview2PassModal } from './general-volunteer-interview2-pass-modal'
import { GeneralVolunteerInterview2CalendarView } from './general-volunteer-interview2-calendar-view'
import { GeneralParticipantApplicantDetailView } from '../participant-screening/participant-applicant-detail-view'
import { useGeneralVolunteerInterview2 } from './use-interview2'
import { getGeneralVolunteerActivityWithdrawScheduleOptions } from '@/features/program/general/lib/general-volunteer-activity-withdraw'
import { ActivityWithdrawScheduleModal } from '@/features/program/shared/ui/activity-withdraw-schedule-modal'
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
    requestInterview2Pass,
    requestInterview2Fail,
    openEvaluationModal,
    closeEvaluationModal,
    evaluationTarget,
    saveInterviewEvaluation,
    filterRowsSource,
  } = useGeneralVolunteerInterview2({ programId, subjectKind })

  const activityWithdrawScheduleOptions = useMemo(
    () => getGeneralVolunteerActivityWithdrawScheduleOptions(program),
    [program]
  )

  const filterRows = useMemo(
    () =>
      viewMode === 'calendar'
        ? buildGeneralVolunteerInterview2CalendarFilterRows(filterRowsSource, subjectKind)
        : buildGeneralVolunteerInterview2FilterRows(filterRowsSource, subjectKind),
    [filterRowsSource, subjectKind, viewMode]
  )

  const { selectedApplicant, openApplicantDetail } = useGeneralVolunteerApplicantDetail({
    programId,
    list,
    variant: 'interview2',
    subjectKind,
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

  const handleDetailOpenEvaluation = useCallback(() => {
    if (!selectedApplicant) return
    openEvaluationModal(selectedApplicant)
  }, [openEvaluationModal, selectedApplicant])

  const withdrawConfirmModal = (
    <ActivityWithdrawScheduleModal
      open={withdrawTarget != null}
      scheduleOptions={activityWithdrawScheduleOptions}
      onCancel={cancelWithdrawActivity}
      onConfirm={confirmWithdrawActivity}
    />
  )

  const evaluationModal =
    evaluationTarget != null ? (
      <GeneralVolunteerInterviewEvaluationModal
        open
        applicant={evaluationTarget}
        onCancel={closeEvaluationModal}
        onConfirm={saveInterviewEvaluation}
      />
    ) : null

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
          {evaluationModal}
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
          onOpenInterviewEvaluation={handleDetailOpenEvaluation}
        />
        {passFailModals}
        {withdrawConfirmModal}
        {evaluationModal}
        {bulkPassModal}
        {bulkFailModal}
        {completeModals}
      </>
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
      {evaluationModal}
      {bulkPassModal}
      {bulkFailModal}
      {completeModals}
      <FilterTableLayout
        bordered={false}
        contentVariant={viewMode === 'calendar' ? 'calendar' : 'table'}
        className="general-volunteer-interview2__filter-layout applicant-details__filter-table-layout"
        rows={filterRows}
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
            <CmsButton
              type="button"
              variant="delete"
              size="large"
              className="cms-button--action"
              width={CMS_ACTION_BUTTON_WIDTH}
              onClick={handleBulkFail}
            >
              선택 불합격
            </CmsButton>
            <CmsButton
              type="button"
              variant="secondary"
              size="large"
              className="cms-button--action"
              width={CMS_ACTION_BUTTON_WIDTH}
              onClick={handleBulkPass}
            >
              선택 합격
            </CmsButton>
            {viewMode === 'list' ? (
              <CmsButton
                type="button"
                variant="secondary"
                size="large"
                style={{ minWidth: 180 }}
                icon={<CalendarOutlined />}
                onClick={handleViewCalendar}
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
                onClick={handleViewList}
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
        {viewMode === 'list' ? (
          <div className="general-volunteer-interview2__table-wrap">
            <Table<GeneralVolunteerApplicantRow>
              rowKey="id"
              className="cms-data-table cms-data-table--fluid clickable-table"
              columns={columns}
              dataSource={tableData}
              pagination={false}
              tableLayout="fixed"
              scroll={{ x: GENERAL_VOLUNTEER_INTERVIEW2_TABLE_SCROLL_X }}
              rowSelection={{
                selectedRowKeys,
                onChange: keys => setSelectedRowKeys(keys),
              }}
              onRow={record => ({
                onClick: e => handleRowClick(record, e),
                style: {
                  cursor: record.interviewAssignmentStatus === 'withdrawn' ? 'default' : 'pointer',
                },
              })}
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
      </FilterTableLayout>
      {viewMode === 'calendar' ? (
        <div className="applicant-details__calendar-page-bottom-spacer" aria-hidden />
      ) : null}
    </div>
  )
}
