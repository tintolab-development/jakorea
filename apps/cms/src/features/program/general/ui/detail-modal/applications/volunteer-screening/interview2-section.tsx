import { useCallback, useMemo, type MouseEvent } from 'react'
import { Table } from 'antd'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { CmsButton, CMS_ACTION_BUTTON_WIDTH } from '@/shared/ui'
import { ConfirmModal } from '@/shared/ui/confirm-modal'
import type { GeneralVolunteerApplicantRow } from '@/data/mock/general-volunteer-applicants-mock'
import { buildGeneralVolunteerInterview2FilterRows } from '@/features/program/general/lib/volunteer-doc-screening-filter-fields'
import { GENERAL_VOLUNTEER_INTERVIEW2_TABLE_SCROLL_X } from './interview2-columns'
import {
  useGeneralVolunteerApplicantDetail,
  type GeneralVolunteerApplicantDetailMetaChangeHandler,
} from './use-detail'
import { GeneralVolunteerApplicantDetailView } from './detail-view'
import { GeneralVolunteerInterviewEvaluationModal } from './interview-evaluation-modal'
import { GeneralVolunteerInterview2BulkPassModal } from './general-volunteer-interview2-bulk-pass-modal'
import { useGeneralVolunteerInterview2 } from './use-interview2'
import './volunteer-screening.css'
import './interview2-section.css'

export function GeneralVolunteerInterview2Section({
  programId,
  onRegisterApplicantCloseHandler,
  onVolunteerApplicantDetailMetaChange,
}: {
  programId: string
  onRegisterApplicantCloseHandler?: (fn: (() => boolean) | null) => void
  onVolunteerApplicantDetailMetaChange?: GeneralVolunteerApplicantDetailMetaChangeHandler
}) {
  const {
    list,
    pendingFilters,
    handleFilterChange,
    handleSearch,
    tableData,
    columns,
    count,
    selectedRowKeys,
    setSelectedRowKeys,
    handleBulkFail,
    handleBulkPass,
    bulkPassModalOpen,
    closeBulkPassModal,
    confirmBulkPass,
    bulkPassCount,
    requestWithdrawActivity,
    cancelWithdrawActivity,
    confirmWithdrawActivity,
    withdrawTarget,
    requestInterview2Pass,
    requestInterview2Fail,
    interview2Confirm,
    closeInterview2Confirm,
    openEvaluationModal,
    closeEvaluationModal,
    evaluationTarget,
    saveInterviewEvaluation,
    filterRowsSource,
  } = useGeneralVolunteerInterview2({ programId })

  const filterRows = useMemo(
    () => buildGeneralVolunteerInterview2FilterRows(filterRowsSource),
    [filterRowsSource]
  )

  const { selectedApplicant, openApplicantDetail } = useGeneralVolunteerApplicantDetail({
    programId,
    list,
    variant: 'interview2',
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

  if (selectedApplicant) {
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
        {interview2ConfirmModal}
        {withdrawConfirmModal}
        {evaluationModal}
        {bulkPassModal}
      </>
    )
  }

  return (
    <div className="general-volunteer-interview2 applicant-details">
      {interview2ConfirmModal}
      {withdrawConfirmModal}
      {evaluationModal}
      {bulkPassModal}
      <FilterTableLayout
        bordered={false}
        className="general-volunteer-interview2__filter-layout"
        rows={filterRows}
        filters={pendingFilters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        title={
          <div className="general-volunteer-interview2__toolbar-main">
            <span className="general-volunteer-interview2__toolbar-title">
              봉사자 2차 면접 대상자 목록
            </span>
            <span className="general-volunteer-interview2__toolbar-count">{count}건</span>
          </div>
        }
        actions={
          <div className="general-volunteer-screening__actions">
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
          </div>
        }
        excelExport={{
          columns,
          data: tableData,
        }}
      >
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
      </FilterTableLayout>
    </div>
  )
}
