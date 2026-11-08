import { useCallback, useMemo, type MouseEvent } from 'react'
import { Spin } from 'antd'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { FilterTableToolbarButton } from '@/shared/ui'
import { CMS_DATA_TABLE_ROW_DISABLED_CLASS } from '@/shared/constants/table'
import type { Program } from '@/types/domain'
import type { GeneralVolunteerApplicantRow } from '@/features/program/general/model/volunteer-applicant'
import { buildGeneralVolunteerDocPassedFilterFields } from '@/features/program/general/lib/volunteer-doc-screening-filter-fields'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import {
  screeningDocPassedListTitle,
  type ScreeningSubjectKind,
} from '@/features/program/general/lib/screening-subject-kind'
import { ApplicationGiveUpReasonModal } from '@/features/program/shared/ui/application-give-up-reason-modal'
import {
  useGeneralVolunteerApplicantDetail,
  type GeneralVolunteerApplicantDetailMetaChangeHandler,
} from './use-detail'
import { GeneralVolunteerApplicantDetailView } from './detail-view'
import { GeneralVolunteerInterviewAssignModals } from './general-volunteer-interview-assign-modals'
import { GeneralVolunteerDocumentCancelApprovalModal } from './general-volunteer-document-cancel-approval-modal'
import { GeneralVolunteerDocumentCancelRejectModal } from './general-volunteer-document-cancel-reject-modal'
import { GeneralVolunteerDocPassedCalendarView } from './general-volunteer-doc-passed-calendar-view'
import { GeneralParticipantApplicantDetailView } from '../participant-screening/participant-applicant-detail-view'
import { mapVolunteerScreeningRowToParticipant } from '@/features/program/general/lib/participant-volunteer-row-adapter'
import type { ApplicantDetailMeta } from '@/features/program/shared/ui/program-detail/applicant-list/use-applicants-detail'
import { useGeneralVolunteerDocPassed } from './use-doc-passed'
import { useGatedInfiniteScroll } from '@/shared/hooks/use-gated-infinite-scroll'
import { ButtonCalendarIcon, ButtonListIcon } from '@/shared/ui/icons/ButtonIcons'
import '@/features/program/shared/ui/program-detail/applicant-list/applicant-list.css'
import './doc-passed-section.css'
import './volunteer-screening.css'

export function GeneralVolunteerDocPassedSection({
  program,
  subjectKind = 'volunteer',
  onRegisterApplicantCloseHandler,
  onVolunteerApplicantDetailMetaChange,
}: {
  program: Program
  subjectKind?: ScreeningSubjectKind
  onRegisterApplicantCloseHandler?: (fn: (() => boolean) | null) => void
  onVolunteerApplicantDetailMetaChange?: GeneralVolunteerApplicantDetailMetaChangeHandler
}) {
  const programId = program.id
  const filterFields = useMemo(
    () => buildGeneralVolunteerDocPassedFilterFields(subjectKind),
    [subjectKind]
  )
  const listTitle = screeningDocPassedListTitle(subjectKind)
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
    handleAssignInterview,
    assignFlow,
    closeAssignModal,
    closeAssignCompleteModal,
    confirmAssignInterview,
    requestWithdrawActivity,
    cancelWithdrawActivity,
    confirmWithdrawActivity,
    withdrawTarget,
    cancelApprovalVolunteer,
    cancelRejectVolunteer,
    closeCancelApprovalModal,
    closeCancelRejectModal,
    openCancelApprovalModal,
    openCancelRejectModal,
    handleCancelApprovalConfirm,
    handleCancelRejectConfirm,
    applicationsLoading,
    isRemoteDataSource,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useGeneralVolunteerDocPassed({ programId, subjectKind })
  const { sentinelRef: loadMoreRef } = useGatedInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    resetKey: `${programId}:${subjectKind}:${viewMode}`,
  })

  const { selectedApplicant, openApplicantDetail } = useGeneralVolunteerApplicantDetail({
    programId,
    list,
    variant: 'doc_passed',
    subjectKind,
    loading: applicationsLoading,
    onRegisterApplicantCloseHandler,
    onVolunteerApplicantDetailMetaChange,
  })

  const handleDetailAssignInterview = useCallback(() => {
    if (!selectedApplicant) return
    handleAssignInterview(selectedApplicant)
  }, [handleAssignInterview, selectedApplicant])

  const handleDetailWithdrawActivity = useCallback(() => {
    if (!selectedApplicant) return
    requestWithdrawActivity(selectedApplicant)
  }, [requestWithdrawActivity, selectedApplicant])

  const handleParticipantDetailMetaChange = useCallback(
    (meta: ApplicantDetailMeta) => {
      if (!meta) {
        onVolunteerApplicantDetailMetaChange?.(null)
        return
      }
      onVolunteerApplicantDetailMetaChange?.({
        title: meta.title,
        breadcrumbLabel: meta.breadcrumbLabel,
      })
    },
    [onVolunteerApplicantDetailMetaChange]
  )

  const handleRowClick = useCallback(
    (record: GeneralVolunteerApplicantRow, e: MouseEvent) => {
      if (record.interviewAssignmentStatus === 'withdrawn') return
      const target = e.target as HTMLElement
      if (target.closest('.ant-btn') || target.closest('button')) return
      openApplicantDetail(record)
    },
    [openApplicantDetail]
  )

  const withdrawConfirmModal = (
    <ApplicationGiveUpReasonModal
      open={withdrawTarget != null}
      onCancel={cancelWithdrawActivity}
      onConfirm={confirmWithdrawActivity}
    />
  )

  const documentCancelModals = (
    <>
      <GeneralVolunteerDocumentCancelApprovalModal
        open={cancelApprovalVolunteer != null}
        volunteer={cancelApprovalVolunteer}
        onCancel={closeCancelApprovalModal}
        onConfirm={handleCancelApprovalConfirm}
      />
      <GeneralVolunteerDocumentCancelRejectModal
        open={cancelRejectVolunteer != null}
        volunteer={cancelRejectVolunteer}
        onCancel={closeCancelRejectModal}
        onConfirm={handleCancelRejectConfirm}
      />
    </>
  )

  const assignModals = (
    <GeneralVolunteerInterviewAssignModals
      program={program}
      list={list}
      assignFlow={assignFlow}
      applicationsUseRemote={isRemoteDataSource}
      subjectKind={subjectKind}
      onClosePick={closeAssignModal}
      onConfirmPick={confirmAssignInterview}
      onCloseComplete={closeAssignCompleteModal}
    />
  )

  const viewToggleButton =
    viewMode === 'list' ? (
      <FilterTableToolbarButton
        type="button"
        variant="secondary"
        icon={<ButtonCalendarIcon />}
        onClick={handleViewCalendar} >
        캘린더 뷰로 보기
      </FilterTableToolbarButton>
    ) : (
      <FilterTableToolbarButton
        type="button"
        variant="secondary"
        icon={<ButtonListIcon />}
        onClick={handleViewList} >
        리스트 뷰로 보기
      </FilterTableToolbarButton>
    )

  if (selectedApplicant) {
    if (subjectKind === 'participant') {
      return (
        <>
          <GeneralParticipantApplicantDetailView
            program={program}
            applicantId={selectedApplicant.id}
            screeningStage="doc_passed"
            applicant={
              selectedApplicant.participantApplicant ??
              mapVolunteerScreeningRowToParticipant(selectedApplicant)
            }
            onRegisterApplicantCloseHandler={onRegisterApplicantCloseHandler}
            onApplicantDetailMetaChange={handleParticipantDetailMetaChange}
          />
          {assignModals}
          {documentCancelModals}
        </>
      )
    }

    return (
      <>
        <GeneralVolunteerApplicantDetailView
          variant="doc_passed"
          applicant={selectedApplicant}
          onAssignInterview={handleDetailAssignInterview}
          onWithdrawActivity={handleDetailWithdrawActivity}
          onCancelDocumentApproval={() => openCancelApprovalModal(selectedApplicant)}
          onCancelDocumentRejection={() => openCancelRejectModal(selectedApplicant)}
        />
        {withdrawConfirmModal}
        {assignModals}
        {documentCancelModals}
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
        'general-volunteer-doc-passed applicant-details',
        viewMode === 'calendar' ? 'general-program-detail--calendar-view' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <FilterTableLayout
        bordered={false}
        contentVariant={viewMode === 'calendar' ? 'calendar' : 'table'}
        className="general-volunteer-doc-passed__filter-layout applicant-details__filter-table-layout"
        fields={filterFields}
        filters={pendingFilters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        title={listTitle}
        description={`${count.toLocaleString()}건`}
        actions={viewToggleButton}
        excelExport={{
          accessLog: { downloadKind: 'PROGRAM_SCREENING_DOC_PASSED_EXPORT', containedPiiTypes: ['NAME'] },
          columns,
          data: tableData,
        }}
      >
        {viewMode === 'list' ? (
          <div className="general-volunteer-doc-passed__table-wrap">
            <CmsDataTable<GeneralVolunteerApplicantRow>
              rowKey="id"
              className="cms-data-table cms-data-table--fluid clickable-table general-volunteer-doc-passed__table"
              columns={columns}
              dataSource={tableData}
              pagination={false}
              tableLayout="fixed"
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
          <div className="general-volunteer-doc-passed__calendar-container">
            <GeneralVolunteerDocPassedCalendarView
              events={calendarEvents}
              onItemClick={openApplicantDetail}
            />
          </div>
        )}
        <div ref={loadMoreRef} aria-hidden style={{ height: 1 }} />
      </FilterTableLayout>
      {viewMode === 'calendar' ? (
        <div className="applicant-details__calendar-page-bottom-spacer" aria-hidden />
      ) : null}
      {withdrawConfirmModal}
      {assignModals}
    </div>
  )
}
