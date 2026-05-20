import { useCallback, useLayoutEffect, useRef, useState, type MouseEvent } from 'react'
import { Table } from 'antd'
import { CalendarOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { CmsButton } from '@/shared/ui'
import { ConfirmModal } from '@/shared/ui/confirm-modal'
import type { UjatVolunteerRecruitHalf } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import type { UjatVolunteerApplicantRow } from '@/data/mock/ujat-volunteer-applicants-mock'
import { buildUjatVolunteerDocPassedFilterRows } from './ujat-volunteer-doc-passed-filter-fields'
import { useUjatVolunteerDocPassed } from './use-ujat-volunteer-doc-passed'
import { useUjatVolunteerApplicantDetail } from './use-ujat-volunteer-applicant-detail'
import { UjatVolunteerApplicantDetailView } from './ujat-volunteer-applicant-detail-view'
import { UjatVolunteerDocPassedCalendarView } from './ujat-volunteer-doc-passed-calendar-view'
import { UJAT_VOLUNTEER_DOC_PASSED_TABLE_SCROLL_X } from './ujat-volunteer-doc-passed-columns'
import './ujat-volunteer-doc-passed-section.css'
import './ujat-volunteer-doc-screening-section.css'
import '@/features/program/shared/ui/program-detail/applicant-list/applicants-detail.css'

const FILTER_ROWS = buildUjatVolunteerDocPassedFilterRows()

const noopApplyDocumentScreeningStatus = () => undefined
const noopShowDocumentScreeningConfirm = () => undefined

export interface UjatVolunteerDocPassedSectionProps {
  programId: string
  half: UjatVolunteerRecruitHalf
  onRegisterApplicantCloseHandler?: (fn: (() => boolean) | null) => void
  onVolunteerApplicantDetailTitleChange?: (title: string | null) => void
}

export function UjatVolunteerDocPassedSection({
  programId,
  half,
  onRegisterApplicantCloseHandler,
  onVolunteerApplicantDetailTitleChange,
}: UjatVolunteerDocPassedSectionProps) {
  const tableWrapRef = useRef<HTMLDivElement>(null)
  const [tableScrollX, setTableScrollX] = useState(UJAT_VOLUNTEER_DOC_PASSED_TABLE_SCROLL_X)

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
    requestWithdrawActivity,
    cancelWithdrawActivity,
    confirmWithdrawActivity,
    withdrawTarget,
  } = useUjatVolunteerDocPassed({ programId, half })

  const { selectedApplicant, openApplicantDetail } = useUjatVolunteerApplicantDetail({
    programId,
    half,
    list,
    detailVariant: 'doc_passed',
    applyDocumentScreeningStatus: noopApplyDocumentScreeningStatus,
    onRegisterApplicantCloseHandler,
    onVolunteerApplicantDetailTitleChange,
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

  useLayoutEffect(() => {
    const el = tableWrapRef.current
    if (!el) return
    const minW = UJAT_VOLUNTEER_DOC_PASSED_TABLE_SCROLL_X
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

  if (selectedApplicant) {
    return (
      <>
        <UjatVolunteerApplicantDetailView
          variant="doc_passed"
          applicant={selectedApplicant}
          onAssignInterview={handleDetailAssignInterview}
          onWithdrawActivity={handleDetailWithdrawActivity}
        />
        {withdrawConfirmModal}
      </>
    )
  }

  return (
    <div className="ujat-volunteer-doc-passed applicant-details">
      <FilterTableLayout
        bordered={false}
        className="ujat-volunteer-doc-passed__filter-layout"
        rows={FILTER_ROWS}
        filters={pendingFilters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        title={
          <div className="ujat-volunteer-doc-passed__toolbar-main">
            <span className="ujat-volunteer-doc-passed__toolbar-title">
              봉사자 1차 서류 합격자 목록
            </span>
            <span className="ujat-volunteer-doc-passed__toolbar-count">{count}건</span>
          </div>
        }
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
      >
        {viewMode === 'list' ? (
          <div ref={tableWrapRef} className="ujat-volunteer-doc-passed__table-wrap">
            <Table<UjatVolunteerApplicantRow>
              rowKey="id"
              className="cms-data-table cms-data-table--fluid clickable-table"
              columns={columns}
              dataSource={tableData}
              pagination={false}
              scroll={{ x: tableScrollX }}
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
          <div className="ujat-volunteer-doc-passed__calendar-container">
            <UjatVolunteerDocPassedCalendarView
              events={calendarEvents}
              onItemClick={openApplicantDetail}
            />
          </div>
        )}
      </FilterTableLayout>
      {withdrawConfirmModal}
    </div>
  )
}
