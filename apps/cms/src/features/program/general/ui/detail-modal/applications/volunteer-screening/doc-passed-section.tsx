import { useCallback, type MouseEvent } from 'react'
import { Table } from 'antd'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { ConfirmModal } from '@/shared/ui/confirm-modal'
import { CMS_DATA_TABLE_ROW_DISABLED_CLASS } from '@/shared/constants/table'
import type { Program } from '@/types/domain'
import type { GeneralVolunteerApplicantRow } from '@/data/mock/general-volunteer-applicants-mock'
import { buildGeneralVolunteerDocPassedFilterRows } from '@/features/program/general/lib/volunteer-doc-screening-filter-fields'
import {
  useGeneralVolunteerApplicantDetail,
  type GeneralVolunteerApplicantDetailMetaChangeHandler,
} from './use-detail'
import { GeneralVolunteerApplicantDetailView } from './detail-view'
import { GeneralVolunteerInterviewAssignModals } from './general-volunteer-interview-assign-modals'
import { useGeneralVolunteerDocPassed } from './use-doc-passed'
import './doc-passed-section.css'
import './volunteer-screening.css'

const FILTER_ROWS = buildGeneralVolunteerDocPassedFilterRows()

export function GeneralVolunteerDocPassedSection({
  program,
  onRegisterApplicantCloseHandler,
  onVolunteerApplicantDetailMetaChange,
}: {
  program: Program
  onRegisterApplicantCloseHandler?: (fn: (() => boolean) | null) => void
  onVolunteerApplicantDetailMetaChange?: GeneralVolunteerApplicantDetailMetaChangeHandler
}) {
  const programId = program.id

  const {
    list,
    pendingFilters,
    handleFilterChange,
    handleSearch,
    tableData,
    columns,
    count,
    handleAssignInterview,
    assignFlow,
    closeAssignModal,
    closeAssignCompleteModal,
    confirmAssignInterview,
    requestWithdrawActivity,
    cancelWithdrawActivity,
    confirmWithdrawActivity,
    withdrawTarget,
  } = useGeneralVolunteerDocPassed({ programId })

  const { selectedApplicant, openApplicantDetail } = useGeneralVolunteerApplicantDetail({
    programId,
    list,
    variant: 'doc_passed',
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

  if (selectedApplicant) {
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
    <div className="general-volunteer-doc-passed applicant-details">
      <FilterTableLayout
        bordered={false}
        className="general-volunteer-doc-passed__filter-layout"
        rows={FILTER_ROWS}
        filters={pendingFilters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        title="봉사자 1차 서류 합격자 목록"
        description={`${count.toLocaleString()}건`}
      >
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
      </FilterTableLayout>
      {withdrawConfirmModal}
      {assignModals}
    </div>
  )
}
