import { useCallback, useMemo, type MouseEvent } from 'react'
import { Spin } from 'antd'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { FilterTableToolbarButton } from '@/shared/ui'
import type { UjatVolunteerRecruitHalf } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import type { UjatVolunteerApplicantRow } from '@/features/program/ujat/model/ujat-volunteer-applicant'
import { buildUjatVolunteerDocPassedFilterRows } from './filter-fields'
import { ActivityWithdrawScheduleModal } from '@/features/program/shared/ui/activity-withdraw-schedule-modal'
import { filterScheduleDatesByHalf } from '@/features/program/ujat/ui/detail-modal/application-institution/education-schedule'
import { useUjatProgramScheduleDates } from '@/features/program/ujat/ui/detail-modal/application-institution/use-program-schedule-dates'
import { useUjatEducationRegions } from '@/features/program/ujat/hooks/use-ujat-education-regions'
import { useUjatVolunteerDocPassed } from './use-list'
import { useApplicantDetail, type ApplicantDetailMetaChangeHandler } from '../applicant/use-detail'
import { ApplicantDetailView } from '../applicant/detail-view'
import { UjatVolunteerDocPassedCalendarView } from './calendar-view'
import { DOC_PASSED_TABLE_SCROLL_X } from './columns'
import { useGatedInfiniteScroll } from '@/shared/hooks/use-gated-infinite-scroll'
import { UjatVolunteerInterviewAssignModal } from '../interview-assign/modal'
import { UjatVolunteerInterviewAssignCompleteModal } from '../interview-assign/complete-modal'
import { CMS_DATA_TABLE_ROW_DISABLED_CLASS } from '@/shared/constants/table'
import { ButtonCalendarIcon, ButtonListIcon } from '@/shared/ui/icons/ButtonIcons'
import './section.css'
import '../doc-screening/section.css'
import '@/features/program/shared/ui/program-detail/applicant-list/applicants-detail.css'
import { CmsDataTable } from '@/shared/ui/cms-data-table'

export interface DocPassedSectionProps {
  programId: string
  half: UjatVolunteerRecruitHalf
  onRegisterApplicantCloseHandler?: (fn: (() => boolean) | null) => void
  onVolunteerApplicantDetailMetaChange?: ApplicantDetailMetaChangeHandler
}

export function DocPassedSection({
  programId,
  half,
  onRegisterApplicantCloseHandler,
  onVolunteerApplicantDetailMetaChange,
}: DocPassedSectionProps) {
  const { labels: educationRegionLabels } = useUjatEducationRegions()
  const filterFields = useMemo(
    () => buildUjatVolunteerDocPassedFilterRows()[0] ?? [],
    [educationRegionLabels]
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
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    infiniteScrollResetKey,
  } = useUjatVolunteerDocPassed({ programId, half })
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
    detailVariant: 'doc_passed',
    onRegisterApplicantCloseHandler,
    onVolunteerApplicantDetailMetaChange,
  })

  const { dates: scheduleDates } = useUjatProgramScheduleDates(programId)
  const activityWithdrawScheduleOptions = useMemo(
    () =>
      filterScheduleDatesByHalf(scheduleDates, half).map(entry => ({
        value: entry.isoDate,
        label: entry.title,
      })),
    [half, scheduleDates]
  )

  const handleDetailAssignInterview = useCallback(() => {
    if (!selectedApplicant) return
    handleAssignInterview(selectedApplicant)
  }, [handleAssignInterview, selectedApplicant])

  const handleDetailWithdrawActivity = useCallback(() => {
    if (!selectedApplicant) return
    requestWithdrawActivity(selectedApplicant)
  }, [requestWithdrawActivity, selectedApplicant])

  const handleRowClick = useCallback(
    (record: UjatVolunteerApplicantRow, e: MouseEvent) => {
      if (record.interviewAssignmentStatus === 'withdrawn') return
      const target = e.target as HTMLElement
      if (target.closest('.ant-btn') || target.closest('button')) {
        return
      }
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
      subjectName={withdrawTarget?.name ?? ''}
      subjectKind="person"
    />
  )

  const assignPickFlow = assignFlow?.type === 'pick' ? assignFlow : null
  const assignCompleteFlow = assignFlow?.type === 'complete' ? assignFlow : null

  const assignInterviewModal = assignPickFlow ? (
    <UjatVolunteerInterviewAssignModal
      open
      applicant={assignPickFlow.target}
      programId={programId}
      allApplicants={list}
      mode={assignPickFlow.target.interviewAssignmentStatus === 'assigned' ? 'reassign' : 'assign'}
      onCancel={closeAssignModal}
      onConfirm={confirmAssignInterview}
    />
  ) : null

  const assignCompleteModal = (
    <UjatVolunteerInterviewAssignCompleteModal
      open={assignCompleteFlow != null}
      applicantName={assignCompleteFlow?.applicantName ?? ''}
      mode={assignCompleteFlow?.mode ?? 'assign'}
      payload={
        assignCompleteFlow?.payload ?? {
          dateLabel: '',
          timeRange: '',
          notifyTiming: 'immediate',
        }
      }
      onClose={closeAssignCompleteModal}
    />
  )

  if (selectedApplicant) {
    return (
      <>
        <ApplicantDetailView
          variant="doc_passed"
          applicant={selectedApplicant}
          onAssignInterview={handleDetailAssignInterview}
          onWithdrawActivity={handleDetailWithdrawActivity}
        />
        {withdrawConfirmModal}
        {assignInterviewModal}
        {assignCompleteModal}
      </>
    )
  }

  return (
    <div className="ujat-volunteer-doc-passed applicant-details">
      <FilterTableLayout
        bordered={false}
        className="ujat-volunteer-doc-passed__filter-layout"
        multiRowGridMode="responsive"
        multiRowResponsiveLayout="merged-auto-fill"
        mergedAutoFillInlineSearch
        fields={filterFields}
        filters={pendingFilters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        title="봉사자 1차 서류 합격자 목록"
        description={`${count.toLocaleString()}건`}
        actions={
          viewMode === 'list' ? (
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
              리스트로 보기
            </FilterTableToolbarButton>
          )
        }
        excelExport={{
          columns,
          data: tableData,
        }}
      >
        {viewMode === 'list' ? (
          <div className="ujat-volunteer-doc-passed__table-wrap">
            <CmsDataTable<UjatVolunteerApplicantRow>
              rowKey="id"
              className="cms-data-table cms-data-table--fluid clickable-table ujat-volunteer-doc-passed__table"
              columns={columns}
              dataSource={tableData}
              pagination={false}
              tableLayout="fixed"
              scroll={{ x: DOC_PASSED_TABLE_SCROLL_X }}
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
          <div className="ujat-volunteer-doc-passed__calendar-container">
            <UjatVolunteerDocPassedCalendarView
              events={calendarEvents}
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
      {withdrawConfirmModal}
      {assignInterviewModal}
      {assignCompleteModal}
    </div>
  )
}
