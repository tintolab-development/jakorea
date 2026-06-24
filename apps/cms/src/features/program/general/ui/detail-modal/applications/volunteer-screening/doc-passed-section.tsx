import { useCallback, useMemo, type MouseEvent } from 'react'
import { Table } from 'antd'
import { CalendarOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { CmsButton } from '@/shared/ui'
import { CMS_DATA_TABLE_ROW_DISABLED_CLASS } from '@/shared/constants/table'
import type { Program } from '@/types/domain'
import type { GeneralVolunteerApplicantRow } from '@/data/mock/general-volunteer-applicants-mock'
import { buildGeneralVolunteerDocPassedFilterRows } from '@/features/program/general/lib/volunteer-doc-screening-filter-fields'
import {
  screeningDocPassedListTitle,
  type ScreeningSubjectKind,
} from '@/features/program/general/lib/screening-subject-kind'
import { getGeneralVolunteerActivityWithdrawScheduleOptions } from '@/features/program/general/lib/general-volunteer-activity-withdraw'
import { ActivityWithdrawScheduleModal } from '@/features/program/shared/ui/activity-withdraw-schedule-modal'
import {
  useGeneralVolunteerApplicantDetail,
  type GeneralVolunteerApplicantDetailMetaChangeHandler,
} from './use-detail'
import { GeneralVolunteerApplicantDetailView } from './detail-view'
import { GeneralVolunteerInterviewAssignModals } from './general-volunteer-interview-assign-modals'
import { GeneralVolunteerDocPassedCalendarView } from './general-volunteer-doc-passed-calendar-view'
import { GeneralParticipantApplicantDetailView } from '../participant-screening/participant-applicant-detail-view'
import { useGeneralVolunteerDocPassed } from './use-doc-passed'
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
  const filterRows = useMemo(
    () => buildGeneralVolunteerDocPassedFilterRows(subjectKind),
    [subjectKind]
  )
  const listTitle = screeningDocPassedListTitle(subjectKind)
  const activityWithdrawScheduleOptions = useMemo(
    () => getGeneralVolunteerActivityWithdrawScheduleOptions(program),
    [program]
  )

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
  } = useGeneralVolunteerDocPassed({ programId, subjectKind })

  const { selectedApplicant, openApplicantDetail } = useGeneralVolunteerApplicantDetail({
    programId,
    list,
    variant: 'doc_passed',
    subjectKind,
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
    <ActivityWithdrawScheduleModal
      open={withdrawTarget != null}
      scheduleOptions={activityWithdrawScheduleOptions}
      onCancel={cancelWithdrawActivity}
      onConfirm={confirmWithdrawActivity}
    />
  )

  const assignModals = (
    <GeneralVolunteerInterviewAssignModals
      program={program}
      list={list}
      assignFlow={assignFlow}
      onClosePick={closeAssignModal}
      onConfirmPick={confirmAssignInterview}
      onCloseComplete={closeAssignCompleteModal}
    />
  )

  const viewToggleButton =
    viewMode === 'list' ? (
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
    )

  if (selectedApplicant) {
    if (subjectKind === 'participant') {
      return (
        <>
          <GeneralParticipantApplicantDetailView
            program={program}
            applicantId={selectedApplicant.id}
            screeningStage="doc_passed"
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
          {assignModals}
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
        />
        {withdrawConfirmModal}
        {assignModals}
      </>
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
        rows={filterRows}
        filters={pendingFilters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        title={listTitle}
        description={`${count.toLocaleString()}건`}
        actions={viewToggleButton}
        excelExport={{
          columns,
          data: tableData,
        }}
      >
        {viewMode === 'list' ? (
          <div className="general-volunteer-doc-passed__table-wrap">
            <Table<GeneralVolunteerApplicantRow>
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
      </FilterTableLayout>
      {viewMode === 'calendar' ? (
        <div className="applicant-details__calendar-page-bottom-spacer" aria-hidden />
      ) : null}
      {withdrawConfirmModal}
      {assignModals}
    </div>
  )
}
