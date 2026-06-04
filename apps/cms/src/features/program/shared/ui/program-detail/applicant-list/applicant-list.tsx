import { useLayoutEffect, useRef, useState } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { CmsButton } from '@/shared/ui'
import {
  updateApplicantSchoolApprovalStatus,
  patchApplicantSchoolForApprovalStatus,
  type ApplicantSchoolRow,
} from '@/data/mock/applicant-institutions'
import {
  patchApplicantInstructorForApprovalStatus,
  updateApplicantInstructorApprovalStatus,
  type ApplicantInstructorRow,
} from '@/data/mock/applicant-instructors'
import {
  updateGeneralIndividualApplicantApprovalStatus,
  patchGeneralIndividualApplicantForApprovalStatus,
  type GeneralIndividualApplicantRow,
} from '@/data/mock/general-individual-applications-mock'
import type { Program } from '@/types/domain'
import type { FilterFieldConfig } from '@/shared/ui/unified-filter-card'
import { ApplicantCalendarView } from './applicant-calendar-view'
import { mapApplicantDataToCalendarEvents } from './applicant-calendar-events'
import { ApplicantsDetailContents, type ApplicantType } from './applicants-detail-contents'
import type { ApplicantDetailMeta } from './use-applicants-detail'
import { ApplicationApprovalModal } from '@/features/program/shared/ui/detail-modal/components/application-approval-modal'
import { useApplicantsDetail } from './use-applicants-detail'
import type {
  ApplicantListMenu,
  InstitutionColumnPreset,
  InstructorColumnPreset,
  SessionLinePreset,
} from './applicant-list-menu'
import './applicants-detail.css'
import './applicant-list.css'
import { CalendarOutlined, UnorderedListOutlined } from '@ant-design/icons'

export interface ApplicantListProps {
  menu: ApplicantListMenu | ''
  /** 신청 강사 상세 게시글 탭 등에 사용 */
  program?: Program | null
  /** FilterTableLayout 타이틀 (일반 상세 LNB 라벨) */
  listTitle?: string
  filterFields?: FilterFieldConfig[]
  institutionColumnPreset?: InstitutionColumnPreset
  instructorColumnPreset?: InstructorColumnPreset
  sessionLinePreset?: SessionLinePreset
  programId?: string
  /** 풀페이지 모달 X: 상세가 열려 있으면 목록으로만 돌아가도록 등록 (true면 모달은 닫지 않음) */
  onRegisterApplicantCloseHandler?: (fn: (() => boolean) | null) => void
  /** 일반 프로그램 상세: 신규 UI / legacy 구분 */
  detailVariant?: 'legacy' | 'general'
  onApplicantDetailMetaChange?: (meta: ApplicantDetailMeta) => void
}

export function ApplicantList({
  menu,
  program = null,
  listTitle,
  filterFields,
  institutionColumnPreset,
  instructorColumnPreset,
  sessionLinePreset,
  programId,
  onRegisterApplicantCloseHandler,
  detailVariant = 'legacy',
  onApplicantDetailMetaChange,
}: ApplicantListProps) {
  const {
    applicantsCalendarGranularity,
    setApplicantsCalendarGranularity,
    pendingFilters,
    fields,
    institutionList,
    setInstitutionList,
    setInstructorList,
    setIndividualList,
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
    handleCancelApprovalIndividual,
    handleCancelRejectIndividual,
    handleViewCalendar,
    title,
    tableData,
    columns,
    tableScrollX,
  } = useApplicantsDetail({
    menu,
    onRegisterApplicantCloseHandler,
    onApplicantDetailMetaChange,
    listTitle,
    filterFields,
    institutionColumnPreset,
    instructorColumnPreset,
    sessionLinePreset,
    programId,
    detailVariant,
  })

  const institutionTableWrapRef = useRef<HTMLDivElement>(null)
  const [institutionTableScrollX, setInstitutionTableScrollX] = useState(1280)

  const usesInstitutionTableScroll =
    menu === 'institutions' ||
    menu === 'individual-applications' ||
    (menu === 'instructors' && instructorColumnPreset === 'general-detail')

  useLayoutEffect(() => {
    if (!usesInstitutionTableScroll || viewMode !== 'table' || selectedItem) return
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
  }, [usesInstitutionTableScroll, viewMode, selectedItem])

  const tableHorizontalScrollX = usesInstitutionTableScroll ? institutionTableScrollX : tableScrollX

  const isGeneralInstructorCalendar =
    menu === 'instructors' &&
    instructorColumnPreset === 'general-detail' &&
    viewMode === 'calendar' &&
    !selectedItem

  const showInstitutionDetail =
    selectedItem != null && menu === 'institutions' && 'schoolName' in selectedItem
  const showInstructorDetail =
    selectedItem != null && menu === 'instructors' && 'instructorName' in selectedItem
  const showIndividualDetail =
    selectedItem != null && menu === 'individual-applications' && 'applicantName' in selectedItem

  const resolveCancelApproval = () => {
    if (menu === 'individual-applications') return handleCancelApprovalIndividual
    return handleCancelApproval
  }

  const resolveCancelReject = () => {
    if (menu === 'individual-applications') return handleCancelRejectIndividual
    return handleCancelRejectInstitution
  }

  return (
    <div
      className={`applicant-details${isGeneralInstructorCalendar ? ' applicant-details--instructor-calendar' : ''}`}
    >
      {showInstitutionDetail ? (
        <ApplicantsDetailContents
          type={menu as ApplicantType}
          detailVariant={detailVariant}
          data={selectedItem as ApplicantSchoolRow}
          program={program}
          institutionList={institutionList}
          onInstitutionDetailSaved={rows => {
            const updatedById = new Map(rows.map(row => [row.id, row]))
            setInstitutionList(prev =>
              prev.map(row => updatedById.get(row.id) ?? row)
            )
            const current = selectedItem as ApplicantSchoolRow
            const nextSelected = updatedById.get(current.id)
            if (nextSelected) {
              setSelectedItem(nextSelected)
            }
          }}
          onBack={() => setSelectedItem(null)}
          onApprove={id => {
            setInstitutionList(prev =>
              prev.map(row =>
                row.id === id ? patchApplicantSchoolForApprovalStatus(row, 'approved') : row
              )
            )
            updateApplicantSchoolApprovalStatus(id, 'approved')
            if (detailVariant !== 'general') {
              setSelectedItem(null)
            }
          }}
          onReject={id => {
            setInstitutionList(prev =>
              prev.map(row =>
                row.id === id ? patchApplicantSchoolForApprovalStatus(row, 'rejected') : row
              )
            )
            updateApplicantSchoolApprovalStatus(id, 'rejected')
            if (detailVariant !== 'general') {
              setSelectedItem(null)
            }
          }}
          onCancelApproval={resolveCancelApproval()}
          onCancelReject={resolveCancelReject()}
        />
      ) : showIndividualDetail ? (
        <ApplicantsDetailContents
          type="individual-applications"
          detailVariant={detailVariant}
          data={selectedItem as GeneralIndividualApplicantRow}
          program={program}
          onBack={() => setSelectedItem(null)}
          onApprove={id => {
            setIndividualList(prev =>
              prev.map(row =>
                row.id === id ? patchGeneralIndividualApplicantForApprovalStatus(row, 'approved') : row
              )
            )
            updateGeneralIndividualApplicantApprovalStatus(id, 'approved')
          }}
          onReject={id => {
            setIndividualList(prev =>
              prev.map(row =>
                row.id === id ? patchGeneralIndividualApplicantForApprovalStatus(row, 'rejected') : row
              )
            )
            updateGeneralIndividualApplicantApprovalStatus(id, 'rejected')
          }}
          onCancelApproval={handleCancelApprovalIndividual}
          onCancelReject={handleCancelRejectIndividual}
          onIndividualDetailSaved={row => {
            setIndividualList(prev => prev.map(item => (item.id === row.id ? row : item)))
            const current = selectedItem as GeneralIndividualApplicantRow
            if (current.id === row.id) {
              setSelectedItem(row)
            }
          }}
        />
      ) : showInstructorDetail ? (
        <ApplicantsDetailContents
          type={menu as ApplicantType}
          detailVariant={detailVariant}
          data={selectedItem as ApplicantInstructorRow}
          program={program}
          onBack={() => setSelectedItem(null)}
          onApprove={id => {
            const row = selectedItem
            if (row && 'instructorName' in row && row.id === id) {
              setInstructorApprovalTarget({ id, name: row.instructorName })
            }
          }}
          onReject={id => {
            setInstructorList(prev =>
              prev.map(row =>
                row.id === id ? patchApplicantInstructorForApprovalStatus(row, 'rejected') : row
              )
            )
            updateApplicantInstructorApprovalStatus(id, 'rejected')
          }}
          onCancelApproval={handleCancelApprovalInstructor}
          onCancelReject={handleCancelRejectInstructor}
          onInstructorDetailSaved={row => {
            setInstructorList(prev => prev.map(item => (item.id === row.id ? row : item)))
            const current = selectedItem as ApplicantInstructorRow
            if (current.id === row.id) {
              setSelectedItem(row)
            }
          }}
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
          setInstructorList(prev => {
            const next = prev.map(row =>
              row.id === id ? patchApplicantInstructorForApprovalStatus(row, 'approved') : row
            )
            const updated = next.find(row => row.id === id)
            const current = selectedItem
            if (
              updated &&
              current &&
              'instructorName' in current &&
              current.id === id
            ) {
              setSelectedItem(updated)
            }
            return next
          })
          updateApplicantInstructorApprovalStatus(id, 'approved')
        }}
      />
      {!selectedItem && menu ? (
        <FilterTableLayout
          key={
            menu === 'instructors' && instructorColumnPreset === 'general-detail'
              ? `applicant-filter-${viewMode}`
              : 'applicant-filter'
          }
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
                  size="large"
                  style={{ minWidth: 180 }}
                  onClick={handleViewCalendar}
                >
                  캘린더 뷰로 보기
                </CmsButton>
              )}
              {viewMode === 'calendar' && (
                <CmsButton
                  variant="secondary"
                  icon={<UnorderedListOutlined />}
                  size="large"
                  style={{ minWidth: 180 }}
                  onClick={() => setViewMode('table')}
                >
                  리스트 뷰로 보기
                </CmsButton>
              )}
            </div>
          }
        >
          {viewMode === 'table' ? (
            <div ref={usesInstitutionTableScroll ? institutionTableWrapRef : undefined}>
              <Table<ApplicantSchoolRow | ApplicantInstructorRow | GeneralIndividualApplicantRow>
                rowKey="id"
                columns={
                  columns as ColumnsType<
                    ApplicantSchoolRow | ApplicantInstructorRow | GeneralIndividualApplicantRow
                  >
                }
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
                    ) {
                      return
                    }
                    if (menu === 'institutions' && 'schoolName' in record) {
                      setSelectedItem(record)
                    } else if (menu === 'instructors' && 'instructorName' in record) {
                      setSelectedItem(record)
                    } else if (menu === 'individual-applications' && 'applicantName' in record) {
                      setSelectedItem(record)
                    }
                  },
                  style: {
                    cursor: 'pointer',
                  },
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
                events={mapApplicantDataToCalendarEvents(
                  tableData as
                    | ApplicantSchoolRow[]
                    | ApplicantInstructorRow[]
                    | GeneralIndividualApplicantRow[],
                  menu
                )}
                loading={false}
                selectedRowKeys={selectedRowKeys}
                onSelectionChange={setSelectedRowKeys}
                onItemClick={item => {
                  setSelectedItem(item)
                }}
                menu={menu}
                calendarGranularity={applicantsCalendarGranularity}
                onCalendarGranularityChange={setApplicantsCalendarGranularity}
                calendarVariant={
                  instructorColumnPreset === 'general-detail' ? 'general-instructor' : 'default'
                }
              />
            </div>
          )}
        </FilterTableLayout>
      ) : null}
    </div>
  )
}
