import { useCallback, useLayoutEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { Table } from 'antd'
import { CalendarOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { CmsButton } from '@/shared/ui'
import { ConfirmModal } from '@/shared/ui/confirm-modal'
import type { UjatVolunteerRecruitHalf } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import type { UjatVolunteerApplicantRow } from '@/data/mock/ujat-volunteer-applicants-mock'
import { buildUjatVolunteerInterview2FilterRows } from './ujat-volunteer-interview2-filter-fields'
import { useUjatVolunteerInterview2 } from './use-ujat-volunteer-interview2'
import {
  useUjatVolunteerApplicantDetail,
  type UjatVolunteerApplicantDetailMetaChangeHandler,
} from './use-ujat-volunteer-applicant-detail'
import { UjatVolunteerApplicantDetailView } from './ujat-volunteer-applicant-detail-view'
import { UjatVolunteerInterviewEvaluationModal } from './ujat-volunteer-interview-evaluation-modal'
import { UjatVolunteerInterview2BulkPassModal } from './ujat-volunteer-interview2-bulk-pass-modal'
import { UjatVolunteerDocPassedCalendarView } from './ujat-volunteer-doc-passed-calendar-view'
import { UJAT_VOLUNTEER_INTERVIEW2_TABLE_SCROLL_X } from './ujat-volunteer-interview2-columns'
import './ujat-volunteer-interview2-section.css'
import './ujat-volunteer-doc-screening-section.css'
import '@/features/program/shared/ui/program-detail/applicant-list/applicants-detail.css'

const noopApplyDocumentScreeningStatus = () => undefined
const noopShowDocumentScreeningConfirm = () => undefined

export interface UjatVolunteerInterview2SectionProps {
  programId: string
  half: UjatVolunteerRecruitHalf
  onRegisterApplicantCloseHandler?: (fn: (() => boolean) | null) => void
  onVolunteerApplicantDetailMetaChange?: UjatVolunteerApplicantDetailMetaChangeHandler
}

export function UjatVolunteerInterview2Section({
  programId,
  half,
  onRegisterApplicantCloseHandler,
  onVolunteerApplicantDetailMetaChange,
}: UjatVolunteerInterview2SectionProps) {
  const tableWrapRef = useRef<HTMLDivElement>(null)
  const [tableScrollX, setTableScrollX] = useState(UJAT_VOLUNTEER_INTERVIEW2_TABLE_SCROLL_X)

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
    interview2Confirm,
    closeInterview2Confirm,
    filterRowsSource,
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
  } = useUjatVolunteerInterview2({ programId, half })

  const { selectedApplicant, openApplicantDetail } = useUjatVolunteerApplicantDetail({
    programId,
    half,
    list,
    detailVariant: 'interview2',
    applyDocumentScreeningStatus: noopApplyDocumentScreeningStatus,
    onRegisterApplicantCloseHandler,
    onVolunteerApplicantDetailMetaChange,
    showDocumentScreeningConfirm: noopShowDocumentScreeningConfirm,
  })

  const filterRows = useMemo(
    () => buildUjatVolunteerInterview2FilterRows(filterRowsSource),
    [filterRowsSource]
  )

  useLayoutEffect(() => {
    const el = tableWrapRef.current
    if (!el) return
    const minW = UJAT_VOLUNTEER_INTERVIEW2_TABLE_SCROLL_X
    const update = () => {
      const w = el.getBoundingClientRect().width
      setTableScrollX(Math.max(minW, Math.floor(w)))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

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
    requestInterview2Fail(selectedApplicant.id)
  }, [requestInterview2Fail, selectedApplicant])

  const handleDetailInterviewPass = useCallback(() => {
    if (!selectedApplicant) return
    requestInterview2Pass(selectedApplicant.id)
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

  const bulkPassModal = (
    <UjatVolunteerInterview2BulkPassModal
      open={bulkPassModalOpen}
      count={bulkPassCount}
      onCancel={closeBulkPassModal}
      onConfirm={confirmBulkPass}
    />
  )

  const evaluationModal =
    evaluationTarget != null ? (
      <UjatVolunteerInterviewEvaluationModal
        open
        applicant={evaluationTarget}
        onCancel={closeEvaluationModal}
        onConfirm={saveInterviewEvaluation}
      />
    ) : null

  if (selectedApplicant) {
    return (
      <>
        <UjatVolunteerApplicantDetailView
          variant="interview2"
          applicant={selectedApplicant}
          onWithdrawActivity={handleDetailWithdrawActivity}
          onInterviewFail={handleDetailInterviewFail}
          onInterviewPass={handleDetailInterviewPass}
          onOpenInterviewEvaluation={handleDetailOpenEvaluation}
        />
        {interview2ConfirmModal}
        {withdrawConfirmModal}
        {bulkPassModal}
        {evaluationModal}
      </>
    )
  }

  return (
    <div className="ujat-volunteer-interview2 applicant-details">
      {interview2ConfirmModal}
      {withdrawConfirmModal}
      {bulkPassModal}
      {evaluationModal}
      <FilterTableLayout
        bordered={false}
        className="ujat-volunteer-interview2__filter-layout"
        rows={filterRows}
        filters={pendingFilters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        title={
          <div className="ujat-volunteer-interview2__toolbar-main">
            <span className="ujat-volunteer-interview2__toolbar-title">
              봉사자 2차 면접 대상자 목록
            </span>
            <span className="ujat-volunteer-interview2__toolbar-count">{count}건</span>
          </div>
        }
        actions={
          <div className="ujat-volunteer-interview2__actions">
            <CmsButton
              type="button"
              variant="delete"
              size="large"
              width={160}
              disabled={selectedRowKeys.length === 0}
              onClick={handleBulkFail}
            >
              선택 불합격
            </CmsButton>
            <CmsButton
              type="button"
              variant="secondary"
              size="large"
              width={160}
              disabled={selectedRowKeys.length === 0}
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
                리스트로 보기
              </CmsButton>
            )}
          </div>
        }
      >
        {viewMode === 'list' ? (
          <div ref={tableWrapRef} className="ujat-volunteer-interview2__table-wrap">
            <Table<UjatVolunteerApplicantRow>
              rowKey="id"
              className="cms-data-table cms-data-table--fluid clickable-table"
              columns={columns}
              dataSource={tableData}
              pagination={false}
              scroll={{ x: tableScrollX }}
              rowSelection={{
                selectedRowKeys,
                onChange: keys => setSelectedRowKeys(keys),
              }}
              rowClassName={record =>
                record.interviewAssignmentStatus === 'withdrawn'
                  ? 'ujat-volunteer-doc-passed__row--withdrawn'
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
            <UjatVolunteerDocPassedCalendarView
              events={calendarEvents}
              onItemClick={openApplicantDetail}
            />
          </div>
        )}
      </FilterTableLayout>
    </div>
  )
}
