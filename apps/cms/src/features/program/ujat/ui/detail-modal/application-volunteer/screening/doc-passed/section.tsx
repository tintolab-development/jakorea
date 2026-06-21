import { useCallback, useMemo, type MouseEvent } from 'react'
import { Table } from 'antd'
import { CalendarOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { CmsButton } from '@/shared/ui'
import { ConfirmModal } from '@/shared/ui/confirm-modal'
import type { UjatVolunteerRecruitHalf } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import type { UjatVolunteerApplicantRow } from '@/data/mock/ujat-volunteer-applicants-mock'
import { buildUjatVolunteerDocPassedFilterRows } from './filter-fields'
import { useUjatEducationRegions } from '@/features/program/ujat/hooks/use-ujat-education-regions'
import { useUjatVolunteerDocPassed } from './use-list'
import {
  useApplicantDetail,
  type ApplicantDetailMetaChangeHandler,
} from '../applicant/use-detail'
import { ApplicantDetailView } from '../applicant/detail-view'
import { UjatVolunteerDocPassedCalendarView } from './calendar-view'
import { DOC_PASSED_TABLE_SCROLL_X } from './columns'
import { UjatVolunteerInterviewAssignModal } from '../interview-assign/modal'
import { UjatVolunteerInterviewAssignCompleteModal } from '../interview-assign/complete-modal'
import { CMS_DATA_TABLE_ROW_DISABLED_CLASS } from '@/shared/constants/table'
import './section.css'
import '../doc-screening/section.css'
import '@/features/program/shared/ui/program-detail/applicant-list/applicants-detail.css'

const noopApplyDocumentScreeningStatus = () => undefined
const noopShowDocumentScreeningConfirm = () => undefined

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
  } = useUjatVolunteerDocPassed({ programId, half })

  const { selectedApplicant, openApplicantDetail } = useApplicantDetail({
    programId,
    half,
    list,
    detailVariant: 'doc_passed',
    applyDocumentScreeningStatus: noopApplyDocumentScreeningStatus,
    onRegisterApplicantCloseHandler,
    onVolunteerApplicantDetailMetaChange,
    showDocumentScreeningConfirm: noopShowDocumentScreeningConfirm,
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

  const withdrawConfirmModal = withdrawTarget ? (
    <ConfirmModal
      open
      title="활동 포기"
      content={`${withdrawTarget.name} 봉사자를 활동 포기 처리하시겠습니까?`}
      confirmText="활동 포기"
      danger
      onConfirm={confirmWithdrawActivity}
      onCancel={cancelWithdrawActivity}
    />
  ) : null

  const assignPickFlow = assignFlow?.type === 'pick' ? assignFlow : null
  const assignCompleteFlow = assignFlow?.type === 'complete' ? assignFlow : null

  const assignInterviewModal = assignPickFlow ? (
    <UjatVolunteerInterviewAssignModal
      open
      applicant={assignPickFlow.target}
      programId={programId}
      allApplicants={list}
      mode={
        assignPickFlow.target.interviewAssignmentStatus === 'assigned' ? 'reassign' : 'assign'
      }
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
              리스트로 보기
            </CmsButton>
          )
        }
        excelExport={{
          columns,
          data: tableData,
        }}
      >
        {viewMode === 'list' ? (
          <div className="ujat-volunteer-doc-passed__table-wrap">
            <Table<UjatVolunteerApplicantRow>
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
      </FilterTableLayout>
      {withdrawConfirmModal}
      {assignInterviewModal}
      {assignCompleteModal}
    </div>
  )
}
