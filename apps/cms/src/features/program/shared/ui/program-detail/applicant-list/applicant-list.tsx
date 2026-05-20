import { useLayoutEffect, useRef, useState } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { CmsButton } from '@/shared/ui'
import type { TabKey } from '@/features/program/general/ui/detail-modal/program-detail-nav-types'
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
import { ApplicationApprovalModal } from '@/features/program/shared/ui/detail-modal/components/application-approval-modal'
import { useApplicantsDetail } from './use-applicants-detail'
import './applicants-detail.css'
import './applicant-list.css'
import { CalendarOutlined, UnorderedListOutlined } from '@ant-design/icons'

export interface ApplicantListProps {
  menu: TabKey | ''
  /** 신청 강사 상세 게시글 탭 등에 사용 */
  program?: Program | null
  /** 풀페이지 모달 X: 상세가 열려 있으면 목록으로만 돌아가도록 등록 (true면 모달은 닫지 않음) */
  onRegisterApplicantCloseHandler?: (fn: (() => boolean) | null) => void
}

export function ApplicantList({
  menu,
  program = null,
  onRegisterApplicantCloseHandler,
}: ApplicantListProps) {
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

  const tableHorizontalScrollX = menu === 'institutions' ? institutionTableScrollX : tableScrollX

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
          }}
      />
      {!selectedItem && menu ? (
        <FilterTableLayout
          className="applicant-details__filter-table-layout"
          bordered={false}
          fields={fields}
          filters={pendingFilters}
          onFilterChange={handleFilterChange}
          onSearch={handleSearch}
          title={title}
          description={`${tableData.length}건`}
          actions={
            <div style={{ display: 'flex', gap: '8px' }}>
              <CmsButton variant="delete" size="large" width={160} onClick={handleBulkReject}>
                선택 반려
              </CmsButton>
              <CmsButton variant="secondary" size="large" width={160} onClick={handleBulkApprove}>
                선택 승인
              </CmsButton>
              {viewMode === 'table' && (
                <CmsButton
                  icon={<CalendarOutlined />}
                  variant="secondary"
                  size="large" style={{ minWidth: 180 }}
                  onClick={handleViewCalendar}
                >
                  캘린더 뷰로 보기
                </CmsButton>
              )}
              {viewMode === 'calendar' && (
                <CmsButton
                  variant="secondary"
                  icon={<UnorderedListOutlined />}
                  size="large" style={{ minWidth: 180 }}
                  onClick={() => setViewMode('table')}
                >
                  리스트로 보기
                </CmsButton>
              )}
            </div>
          }
        >
          {viewMode === 'table' ? (
            <div ref={menu === 'institutions' ? institutionTableWrapRef : undefined}>
              <Table<ApplicantSchoolRow | ApplicantInstructorRow>
                rowKey="id"
                columns={columns as ColumnsType<ApplicantSchoolRow | ApplicantInstructorRow>}
                dataSource={tableData}
                className="cms-data-table cms-data-table--fluid"
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
        </FilterTableLayout>
      ) : null}
    </div>
  )
}
