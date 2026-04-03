import { useLayoutEffect, useRef, useState } from 'react'
import { Table, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { UnifiedFilterCard } from '@/shared/ui/unified-filter-card'
import { AppButton } from '@/shared/ui/app-button'
import type { TabKey } from '../program-detail-nav-types'
import {
  updateApplicantSchoolApprovalStatus,
  type ApplicantSchoolRow,
} from '@/data/mock/applicant-institutions'
import {
  patchApplicantInstructorForApprovalStatus,
  updateApplicantInstructorApprovalStatus,
  type ApplicantInstructorRow,
} from '@/data/mock/applicant-instructors'
import type { Program } from '@/types/domain'
import { ApplicantCalendarView } from './applicant-calendar-view'
import { mapApplicantDataToCalendarEvents } from './applicant-calendar-events'
import { ApplicantsDetailContents, type ApplicantType } from './applicants-detail-contents'
import { ApplicationApprovalModal } from '../components/application-approval-modal'
import { useApplicantsDetail } from './use-applicants-detail'
import './applicants-detail.css'
import { CalendarOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { Divider } from '@/shared/components/divider'

export interface ApplicantDetailsProps {
  menu: TabKey | ''
  /** 신청 강사 상세 게시글 탭 등에 사용 */
  program?: Program | null
  /** 풀페이지 모달 X: 상세가 열려 있으면 목록으로만 돌아가도록 등록 (true면 모달은 닫지 않음) */
  onRegisterApplicantCloseHandler?: (fn: (() => boolean) | null) => void
}

export function ApplicantDetails({
  menu,
  program = null,
  onRegisterApplicantCloseHandler,
}: ApplicantDetailsProps) {
  const {
    applicantsCalendarGranularity,
    setApplicantsCalendarGranularity,
    pendingFilters,
    fields,
    setInstitutionList,
    setInstructorList,
    selectedItem,
    setSelectedItem,
    viewMode,
    setViewMode,
    selectedRowKeys,
    setSelectedRowKeys,
    instructorApprovalTarget,
    setInstructorApprovalTarget,
    handleFilterChange,
    handleSearch,
    handleBulkReject,
    handleBulkApprove,
    handleCancelApproval,
    handleCancelApprovalInstructor,
    handleCancelRejectInstructor,
    handleCancelRejectInstitution,
    handleViewCalendar,
    title,
    tableData,
    columns,
    tableScrollX,
  } = useApplicantsDetail({ menu, onRegisterApplicantCloseHandler })

  const institutionTableWrapRef = useRef<HTMLDivElement>(null)
  const [institutionTableScrollX, setInstitutionTableScrollX] = useState(1280)

  useLayoutEffect(() => {
    if (menu !== 'institutions' || viewMode !== 'table' || selectedItem) return
    const el = institutionTableWrapRef.current
    if (!el) return
    const minW = 1280
    const update = () => {
      const w = el.getBoundingClientRect().width
      setInstitutionTableScrollX(Math.max(minW, Math.floor(w)))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [menu, viewMode, selectedItem])

  const tableHorizontalScrollX =
    menu === 'institutions' ? institutionTableScrollX : tableScrollX

  return (
    <div className="applicant-details">
      {selectedItem ? (
        <ApplicantsDetailContents
          type={menu as ApplicantType}
          data={selectedItem}
          program={program}
          onBack={() => setSelectedItem(null)}
          onApprove={id => {
            if (menu === 'institutions') {
              setInstitutionList(prev =>
                prev.map(row =>
                  row.id === id ? { ...row, approvalStatus: 'approved' as const } : row
                )
              )
              updateApplicantSchoolApprovalStatus(id, 'approved')
              message.success('승인되었습니다.')
              setSelectedItem(null)
            } else if (menu === 'instructors') {
              const row = selectedItem
              if (row && 'instructorName' in row && row.id === id) {
                setInstructorApprovalTarget({ id, name: row.instructorName })
              }
            }
          }}
          onReject={id => {
            if (menu === 'institutions') {
              setInstitutionList(prev =>
                prev.map(row =>
                  row.id === id ? { ...row, approvalStatus: 'rejected' as const } : row
                )
              )
              updateApplicantSchoolApprovalStatus(id, 'rejected')
              message.success('반려되었습니다.')
              setSelectedItem(null)
            } else if (menu === 'instructors') {
              setInstructorList(prev =>
                prev.map(row =>
                  row.id === id ? patchApplicantInstructorForApprovalStatus(row, 'rejected') : row
                )
              )
              setSelectedItem(prev =>
                prev && 'instructorName' in prev && prev.id === id
                  ? patchApplicantInstructorForApprovalStatus(prev, 'rejected')
                  : prev
              )
              updateApplicantInstructorApprovalStatus(id, 'rejected')
              message.success('참여 반려되었습니다.')
            }
          }}
          onCancelApproval={
            menu === 'institutions'
              ? handleCancelApproval
              : menu === 'instructors'
                ? handleCancelApprovalInstructor
                : undefined
          }
          onCancelReject={
            menu === 'instructors'
              ? handleCancelRejectInstructor
              : menu === 'institutions'
                ? handleCancelRejectInstitution
                : undefined
          }
        />
      ) : null}
      <ApplicationApprovalModal
        open={instructorApprovalTarget != null && menu === 'instructors'}
        instructorName={instructorApprovalTarget?.name ?? ''}
        onCancel={() => setInstructorApprovalTarget(null)}
        onConfirm={() => {
          if (!instructorApprovalTarget) return
          const { id } = instructorApprovalTarget
          setInstructorApprovalTarget(null)
          setInstructorList(prev =>
            prev.map(row =>
              row.id === id ? patchApplicantInstructorForApprovalStatus(row, 'approved') : row
            )
          )
          setSelectedItem(prev =>
            prev && 'instructorName' in prev && prev.id === id
              ? patchApplicantInstructorForApprovalStatus(prev, 'approved')
              : prev
          )
          updateApplicantInstructorApprovalStatus(id, 'approved')
          message.success('참여 승인되었습니다.')
        }}
      />
      {!selectedItem ? (
        <>
          {fields.length > 0 && (
            <UnifiedFilterCard
              fields={fields}
              filters={pendingFilters}
              onFilterChange={handleFilterChange}
              onSearch={handleSearch}
              bordered={false}
              cardStyle={{
                marginBottom: 0,
                background: 'transparent',
              }}
            />
          )}
          <Divider className="applicant-details__divider" />
          {menu && (
            <div className="applicant-details__below-divider">
              <div className="applicant-details__table-header">
                <div className="applicant-details__table-heading">
                  <span className="applicant-details__table-title">{title}</span>
                  <span className="applicant-details__table-description">{tableData.length}건</span>
                </div>
                <div className="applicant-details__table-actions">
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <AppButton variant="danger" size="filter" onClick={handleBulkReject}>
                      선택 반려
                    </AppButton>
                    <AppButton variant="cancel" size="filter" onClick={handleBulkApprove}>
                      선택 승인
                    </AppButton>
                    {viewMode === 'table' && (
                      <AppButton
                        icon={<CalendarOutlined />}
                        variant="cancel"
                        size="filter-wide"
                        onClick={handleViewCalendar}
                      >
                        캘린더 뷰로 보기
                      </AppButton>
                    )}
                    {viewMode === 'calendar' && (
                      <AppButton
                        variant="cancel"
                        icon={<UnorderedListOutlined />}
                        size="filter-wide"
                        onClick={() => setViewMode('table')}
                      >
                        리스트로 보기
                      </AppButton>
                    )}
                  </div>
                </div>
              </div>

              {viewMode === 'table' ? (
                <div
                  ref={menu === 'institutions' ? institutionTableWrapRef : undefined}
                  className="applicant-details__table-wrap"
                >
                  <Table<ApplicantSchoolRow | ApplicantInstructorRow>
                    rowKey="id"
                    columns={columns as ColumnsType<ApplicantSchoolRow | ApplicantInstructorRow>}
                    dataSource={tableData}
                    size="middle"
                    className="applicant-details__table cms-data-table applicant-details__table--clickable"
                    onRow={record => ({
                      onClick: e => {
                        const target = e.target as HTMLElement
                        if (
                          target.closest('.status-dropdown-cell__cell-status') ||
                          target.closest('.status-dropdown-cell__status-trigger') ||
                          target.closest('.ant-table-selection-column') ||
                          target.closest('.ant-checkbox-wrapper')
                        )
                          return
                        setSelectedItem(record)
                      },
                      style: { cursor: 'pointer' },
                    })}
                    scroll={{ x: tableHorizontalScrollX }}
                    pagination={false}
                    rowSelection={{
                      selectedRowKeys,
                      onChange: keys => setSelectedRowKeys(keys),
                    }}
                  />
                </div>
              ) : (
                <div className="applicant-calendar-view-container">
                  <ApplicantCalendarView
                    events={mapApplicantDataToCalendarEvents(tableData, menu)}
                    loading={false}
                    selectedRowKeys={selectedRowKeys}
                    onSelectionChange={setSelectedRowKeys}
                    onItemClick={setSelectedItem}
                    calendarGranularity={applicantsCalendarGranularity}
                    onCalendarGranularityChange={setApplicantsCalendarGranularity}
                  />
                </div>
              )}
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}
