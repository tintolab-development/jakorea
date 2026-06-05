import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { CmsButton } from '@/shared/ui'
import {
  updateApplicantSchoolApprovalStatus,
  patchApplicantSchoolForApprovalStatus,
  patchApplicantSchoolForNotificationResend,
  updateApplicantSchoolNotificationResend,
  type ApplicantSchoolRow,
} from '@/data/mock/applicant-institutions'
import {
  patchApplicantInstructorForApprovalStatus,
  patchApplicantInstructorForNotificationResend,
  updateApplicantInstructorApprovalStatus,
  updateApplicantInstructorCancelApproval,
  updateApplicantInstructorCancelRejection,
  updateApplicantInstructorNotificationResend,
  type ApplicantInstructorRow,
} from '@/data/mock/applicant-instructors'
import {
  updateGeneralIndividualApplicantApprovalStatus,
  patchGeneralIndividualApplicantForApprovalStatus,
  patchGeneralIndividualApplicantForNotificationResend,
  updateGeneralIndividualApplicantNotificationResend,
  type GeneralIndividualApplicantRow,
} from '@/data/mock/general-individual-applications-mock'
import type { Program } from '@/types/domain'
import type { FilterFieldConfig } from '@/shared/ui/unified-filter-card'
import { ApplicantCalendarView } from './applicant-calendar-view'
import { mapApplicantDataToCalendarEvents } from './applicant-calendar-events'
import { ApplicantsDetailContents, type ApplicantType } from './applicants-detail-contents'
import type { ApplicantDetailMeta } from './use-applicants-detail'
import { InstructorFeeApprovalModal } from '@/features/program/shared/ui/detail-modal/components/instructor-fee-approval-modal'
import {
  countAssignedInstitutions,
  InstructorApprovalCompleteModal,
} from '@/features/program/shared/ui/detail-modal/components/instructor-approval-complete-modal'
import { InstructorLectureAssignModal } from '@/features/program/shared/ui/detail-modal/components/instructor-lecture-assign-modal'
import { isGeneralIndividualProgram } from '@/features/program/general/lib/survey-audience'
import {
  resolveApplicantNotificationResendSentAt,
  toApplicantNotificationResendNotifyOptions,
  type ApplicantNotificationResendApprovalStatus,
  type ApplicantNotificationResendSubjectKind,
} from '@/features/program/general/lib/applicant-notification-resend'
import { ApplicantNotificationResendModal } from '@/features/program/shared/ui/detail-modal/components/applicant-notification-resend-modal'
import { patchInstructorForCancelApproval } from '@/features/program/general/lib/instructor-cancel-approval'
import { patchInstructorForCancelRejection, toInstructorCancelRejectionNotifyOptions } from '@/features/program/general/lib/instructor-cancel-rejection'
import { InstructorCancelApprovalCompleteModal } from '@/features/program/shared/ui/detail-modal/components/instructor-cancel-approval-complete-modal'
import { InstructorCancelApprovalModal } from '@/features/program/shared/ui/detail-modal/components/instructor-cancel-approval-modal'
import { InstructorCancelRejectCompleteModal } from '@/features/program/shared/ui/detail-modal/components/instructor-cancel-reject-complete-modal'
import {
  InstructorCancelRejectModal,
  type InstructorCancelRejectionConfirmPayload,
} from '@/features/program/shared/ui/detail-modal/components/instructor-cancel-reject-modal'
import { InstructorBulkApproveModal } from '@/features/program/shared/ui/detail-modal/components/instructor-bulk-approve-modal'
import { InstructorBulkApproveCompleteModal } from '@/features/program/shared/ui/detail-modal/components/instructor-bulk-approve-complete-modal'
import { InstructorBulkRejectCompleteModal } from '@/features/program/shared/ui/detail-modal/components/instructor-bulk-reject-complete-modal'
import { InstructorBulkRejectModal } from '@/features/program/shared/ui/detail-modal/components/instructor-bulk-reject-modal'
import { InstructorRejectCompleteModal } from '@/features/program/shared/ui/detail-modal/components/instructor-reject-complete-modal'
import { InstructorRejectModal } from '@/features/program/shared/ui/detail-modal/components/instructor-reject-modal'
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
    instructorList,
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
    confirmBulkInstructorReject,
    confirmBulkInstructorApprove,
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
  const [instructorBulkApproveOpen, setInstructorBulkApproveOpen] = useState(false)
  const [instructorBulkApproveCompleteCount, setInstructorBulkApproveCompleteCount] = useState<
    number | null
  >(null)
  const [instructorBulkRejectOpen, setInstructorBulkRejectOpen] = useState(false)
  const [instructorBulkRejectCompleteCount, setInstructorBulkRejectCompleteCount] = useState<
    number | null
  >(null)
  const [instructorApprovalComplete, setInstructorApprovalComplete] = useState<{
    instructorName: string
    assignedInstitutionCount: number
  } | null>(null)
  const [instructorRejectTarget, setInstructorRejectTarget] = useState<{
    id: string
    name: string
  } | null>(null)
  const [instructorRejectComplete, setInstructorRejectComplete] = useState<{
    instructorName: string
    rejectionReason: string
  } | null>(null)
  const [instructorCancelApprovalTarget, setInstructorCancelApprovalTarget] = useState<{
    id: string
    name: string
  } | null>(null)
  const [instructorCancelApprovalComplete, setInstructorCancelApprovalComplete] = useState<{
    instructorName: string
    cancellationReason: string
  } | null>(null)
  const [instructorCancelRejectTarget, setInstructorCancelRejectTarget] = useState<{
    id: string
    name: string
  } | null>(null)
  const [instructorCancelRejectComplete, setInstructorCancelRejectComplete] = useState<{
    instructorName: string
  } | null>(null)
  const [notificationResendTarget, setNotificationResendTarget] = useState<{
    id: string
    name: string
    subjectKind: ApplicantNotificationResendSubjectKind
    approvalStatus: ApplicantNotificationResendApprovalStatus
  } | null>(null)

  const useGeneralInstructorBulkActionModal =
    menu === 'instructors' && instructorColumnPreset === 'general-detail'

  const useOrganizationInstructorAssignFlow =
    menu === 'instructors' &&
    instructorColumnPreset === 'general-detail' &&
    detailVariant === 'general' &&
    program != null &&
    !isGeneralIndividualProgram(program)

  const instructorApprovalInstructor = useMemo(() => {
    if (!instructorApprovalTarget) return null
    return (
      instructorList.find(row => row.id === instructorApprovalTarget.id) ??
      (selectedItem && 'instructorName' in selectedItem && selectedItem.id === instructorApprovalTarget.id
        ? (selectedItem as ApplicantInstructorRow)
        : null)
    )
  }, [instructorApprovalTarget, instructorList, selectedItem])

  const instructorCancelApprovalInstructor = useMemo(() => {
    if (!instructorCancelApprovalTarget) return null
    return (
      instructorList.find(row => row.id === instructorCancelApprovalTarget.id) ??
      (selectedItem &&
      'instructorName' in selectedItem &&
      selectedItem.id === instructorCancelApprovalTarget.id
        ? (selectedItem as ApplicantInstructorRow)
        : null)
    )
  }, [instructorCancelApprovalTarget, instructorList, selectedItem])

  const instructorCancelRejectInstructor = useMemo(() => {
    if (!instructorCancelRejectTarget) return null
    return (
      instructorList.find(row => row.id === instructorCancelRejectTarget.id) ??
      (selectedItem &&
      'instructorName' in selectedItem &&
      selectedItem.id === instructorCancelRejectTarget.id
        ? (selectedItem as ApplicantInstructorRow)
        : null)
    )
  }, [instructorCancelRejectTarget, instructorList, selectedItem])

  const handleBulkRejectClick = () => {
    if (selectedRowKeys.length === 0) {
      return
    }
    if (useGeneralInstructorBulkActionModal) {
      setInstructorBulkRejectOpen(true)
      return
    }
    handleBulkReject()
  }

  const handleBulkApproveClick = () => {
    if (selectedRowKeys.length === 0) {
      return
    }
    if (useGeneralInstructorBulkActionModal) {
      setInstructorBulkApproveOpen(true)
      return
    }
    handleBulkApprove()
  }

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

  const isGeneralInstitutionCalendar =
    menu === 'institutions' &&
    institutionColumnPreset === 'general-detail' &&
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

  const handleOpenNotificationResend = () => {
    const item = selectedItem
    if (!item) return

    if (menu === 'instructors' && 'instructorName' in item) {
      const row = item as ApplicantInstructorRow
      if (row.approvalStatus !== 'approved' && row.approvalStatus !== 'rejected') return
      setNotificationResendTarget({
        id: row.id,
        name: row.instructorName,
        subjectKind: 'instructor',
        approvalStatus: row.approvalStatus,
      })
      return
    }

    if (menu === 'institutions' && 'schoolName' in item) {
      const row = item as ApplicantSchoolRow
      if (row.approvalStatus !== 'approved' && row.approvalStatus !== 'rejected') return
      setNotificationResendTarget({
        id: row.id,
        name: row.schoolName,
        subjectKind: 'institution',
        approvalStatus: row.approvalStatus,
      })
      return
    }

    if (menu === 'individual-applications' && 'applicantName' in item) {
      const row = item as GeneralIndividualApplicantRow
      if (row.approvalStatus !== 'approved' && row.approvalStatus !== 'rejected') return
      setNotificationResendTarget({
        id: row.id,
        name: row.applicantName,
        subjectKind: 'individual',
        approvalStatus: row.approvalStatus,
      })
    }
  }

  return (
    <div
      className={`applicant-details${isGeneralInstructorCalendar || isGeneralInstitutionCalendar ? ' applicant-details--instructor-calendar' : ''}`}
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
          onResendNotification={handleOpenNotificationResend}
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
          onResendNotification={handleOpenNotificationResend}
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
              if (useOrganizationInstructorAssignFlow) {
                setInstructorApprovalTarget({ id, name: row.instructorName, step: 'assign' })
              } else {
                setInstructorApprovalTarget({
                  id,
                  name: row.instructorName,
                  step: 'fee',
                  assignments: [],
                })
              }
            }
          }}
          onReject={id => {
            const row = selectedItem
            if (
              row &&
              'instructorName' in row &&
              row.id === id &&
              useGeneralInstructorBulkActionModal
            ) {
              setInstructorRejectTarget({ id, name: row.instructorName })
              return
            }
            setInstructorList(prev =>
              prev.map(r =>
                r.id === id ? patchApplicantInstructorForApprovalStatus(r, 'rejected') : r
              )
            )
            updateApplicantInstructorApprovalStatus(id, 'rejected')
          }}
          onCancelApproval={id => {
            const row = selectedItem
            if (
              row &&
              'instructorName' in row &&
              row.id === id &&
              useGeneralInstructorBulkActionModal
            ) {
              setInstructorCancelApprovalTarget({ id, name: row.instructorName })
              return
            }
            handleCancelApprovalInstructor(id)
          }}
          onCancelReject={id => {
            const row = selectedItem
            if (
              row &&
              'instructorName' in row &&
              row.id === id &&
              useGeneralInstructorBulkActionModal
            ) {
              setInstructorCancelRejectTarget({ id, name: row.instructorName })
              return
            }
            handleCancelRejectInstructor(id)
          }}
          onResendNotification={handleOpenNotificationResend}
          onInstructorDetailSaved={row => {
            setInstructorList(prev => prev.map(item => (item.id === row.id ? row : item)))
            const current = selectedItem as ApplicantInstructorRow
            if (current.id === row.id) {
              setSelectedItem(row)
            }
          }}
        />
      ) : null}
      <InstructorBulkRejectModal
        open={instructorBulkRejectOpen}
        selectionCount={selectedRowKeys.length}
        onCancel={() => setInstructorBulkRejectOpen(false)}
        onConfirm={payload => {
          const rejectedCount = selectedRowKeys.length
          confirmBulkInstructorReject(payload)
          setInstructorBulkRejectOpen(false)
          setInstructorBulkRejectCompleteCount(rejectedCount)
        }}
      />
      <InstructorBulkRejectCompleteModal
        open={instructorBulkRejectCompleteCount != null}
        selectionCount={instructorBulkRejectCompleteCount ?? 0}
        onClose={() => setInstructorBulkRejectCompleteCount(null)}
      />
      <InstructorRejectModal
        open={instructorRejectTarget != null}
        instructorName={instructorRejectTarget?.name ?? ''}
        onCancel={() => setInstructorRejectTarget(null)}
        onConfirm={payload => {
          if (!instructorRejectTarget) return
          const { id, name } = instructorRejectTarget
          const notifyOptions = {
            notifyTiming: payload.notifyTiming,
            manualNotifyAt: payload.manualNotifyAt,
            rejectionReason: payload.reason,
          }
          setInstructorRejectTarget(null)
          setInstructorList(prev => {
            const next = prev.map(row =>
              row.id === id
                ? patchApplicantInstructorForApprovalStatus(row, 'rejected', notifyOptions)
                : row
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
          updateApplicantInstructorApprovalStatus(id, 'rejected', notifyOptions)
          setInstructorRejectComplete({
            instructorName: name,
            rejectionReason: payload.reason,
          })
        }}
      />
      <InstructorRejectCompleteModal
        open={instructorRejectComplete != null}
        instructorName={instructorRejectComplete?.instructorName ?? ''}
        rejectionReason={instructorRejectComplete?.rejectionReason ?? ''}
        onClose={() => setInstructorRejectComplete(null)}
      />
      <InstructorCancelApprovalModal
        open={instructorCancelApprovalTarget != null}
        instructor={instructorCancelApprovalInstructor}
        onCancel={() => setInstructorCancelApprovalTarget(null)}
        onConfirm={payload => {
          if (!instructorCancelApprovalTarget) return
          const { id, name } = instructorCancelApprovalTarget
          const notifyOptions = {
            notifyTiming: payload.notifyTiming,
            manualNotifyAt: payload.manualNotifyAt,
            rejectionReason: payload.reason,
          }
          setInstructorCancelApprovalTarget(null)
          setInstructorList(prev => {
            const next = prev.map(row =>
              row.id === id ? patchInstructorForCancelApproval(row, notifyOptions) : row
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
          updateApplicantInstructorCancelApproval(id, notifyOptions)
          setInstructorCancelApprovalComplete({
            instructorName: name,
            cancellationReason: payload.reason,
          })
        }}
      />
      <InstructorCancelApprovalCompleteModal
        open={instructorCancelApprovalComplete != null}
        instructorName={instructorCancelApprovalComplete?.instructorName ?? ''}
        cancellationReason={instructorCancelApprovalComplete?.cancellationReason ?? ''}
        onClose={() => setInstructorCancelApprovalComplete(null)}
      />
      <InstructorCancelRejectModal
        open={instructorCancelRejectTarget != null}
        instructor={instructorCancelRejectInstructor}
        onCancel={() => setInstructorCancelRejectTarget(null)}
        onConfirm={(payload: InstructorCancelRejectionConfirmPayload) => {
          if (!instructorCancelRejectTarget) return
          const { id, name } = instructorCancelRejectTarget
          const notifyOptions =
            payload.variant === 'alreadySent'
              ? toInstructorCancelRejectionNotifyOptions(payload)
              : undefined
          setInstructorCancelRejectTarget(null)
          setInstructorList(prev => {
            const next = prev.map(row =>
              row.id === id ? patchInstructorForCancelRejection(row, notifyOptions) : row
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
          updateApplicantInstructorCancelRejection(id, notifyOptions)
          setInstructorCancelRejectComplete({ instructorName: name })
        }}
      />
      <InstructorCancelRejectCompleteModal
        open={instructorCancelRejectComplete != null}
        instructorName={instructorCancelRejectComplete?.instructorName ?? ''}
        onClose={() => setInstructorCancelRejectComplete(null)}
      />
      <ApplicantNotificationResendModal
        open={notificationResendTarget != null}
        subjectKind={notificationResendTarget?.subjectKind ?? 'instructor'}
        subjectName={notificationResendTarget?.name ?? ''}
        approvalStatus={notificationResendTarget?.approvalStatus ?? 'approved'}
        onCancel={() => setNotificationResendTarget(null)}
        onConfirm={payload => {
          if (!notificationResendTarget) return
          const { id, subjectKind } = notificationResendTarget
          const notifyOptions = toApplicantNotificationResendNotifyOptions(payload)
          const sentAt = resolveApplicantNotificationResendSentAt(notifyOptions)
          setNotificationResendTarget(null)

          if (subjectKind === 'instructor') {
            setInstructorList(prev => {
              const next = prev.map(row =>
                row.id === id
                  ? patchApplicantInstructorForNotificationResend(row, notifyOptions)
                  : row
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
            updateApplicantInstructorNotificationResend(id, notifyOptions)
            return
          }

          if (subjectKind === 'institution') {
            setInstitutionList(prev => {
              const next = prev.map(row =>
                row.id === id ? patchApplicantSchoolForNotificationResend(row, sentAt) : row
              )
              const updated = next.find(row => row.id === id)
              const current = selectedItem
              if (updated && current && 'schoolName' in current && current.id === id) {
                setSelectedItem(updated)
              }
              return next
            })
            updateApplicantSchoolNotificationResend(id, sentAt)
            return
          }

          setIndividualList(prev => {
            const next = prev.map(row =>
              row.id === id ? patchGeneralIndividualApplicantForNotificationResend(row, sentAt) : row
            )
            const updated = next.find(row => row.id === id)
            const current = selectedItem
            if (updated && current && 'applicantName' in current && current.id === id) {
              setSelectedItem(updated)
            }
            return next
          })
          updateGeneralIndividualApplicantNotificationResend(id, sentAt)
        }}
      />
      <InstructorBulkApproveModal
        open={instructorBulkApproveOpen}
        selectionCount={selectedRowKeys.length}
        onCancel={() => setInstructorBulkApproveOpen(false)}
        onConfirm={payload => {
          const approvedCount = selectedRowKeys.length
          confirmBulkInstructorApprove(payload)
          setInstructorBulkApproveOpen(false)
          setInstructorBulkApproveCompleteCount(approvedCount)
        }}
      />
      <InstructorBulkApproveCompleteModal
        open={instructorBulkApproveCompleteCount != null}
        selectionCount={instructorBulkApproveCompleteCount ?? 0}
        onClose={() => setInstructorBulkApproveCompleteCount(null)}
      />
      {instructorApprovalTarget?.step === 'assign' &&
      instructorApprovalInstructor &&
      program?.id ? (
        <InstructorLectureAssignModal
          open
          programId={program.id}
          instructor={instructorApprovalInstructor}
          allInstructors={instructorList}
          onCancel={() => setInstructorApprovalTarget(null)}
          onConfirm={({ assignments }) => {
            if (!instructorApprovalTarget) return
            setInstructorApprovalTarget({
              id: instructorApprovalTarget.id,
              name: instructorApprovalTarget.name,
              step: 'fee',
              assignments,
            })
          }}
        />
      ) : null}
      <InstructorFeeApprovalModal
        open={instructorApprovalTarget?.step === 'fee' && menu === 'instructors'}
        instructorName={instructorApprovalTarget?.name ?? ''}
        instructorFeeGradeLabel={instructorApprovalInstructor?.instructorFeeGradeLabel}
        onCancel={() => setInstructorApprovalTarget(null)}
        onConfirm={detail => {
          if (!instructorApprovalTarget || instructorApprovalTarget.step !== 'fee') return
          const { id, assignments } = instructorApprovalTarget
          const notifyOptions = {
            notifyTiming: detail.notifyTiming,
            manualNotifyAt: detail.manualNotifyAt,
          }
          setInstructorApprovalTarget(null)
          setInstructorList(prev => {
            const next = prev.map(row => {
              if (row.id !== id) return row
              const approved = patchApplicantInstructorForApprovalStatus(row, 'approved', notifyOptions)
              const withFee = {
                ...approved,
                lectureFeeBasisType: detail.lectureFeeBasisType,
                lectureFeeMeasure: detail.lectureFeeMeasure ?? undefined,
                lectureFeeAmount: detail.lectureFeeAmount ?? undefined,
                lectureFeeBasisDisplay: detail.lectureFeeBasisDisplay,
                ...(detail.instructorFeeGradeLabel
                  ? { instructorFeeGradeLabel: detail.instructorFeeGradeLabel }
                  : {}),
                approvalNotifyTiming: detail.notifyTiming,
              }
              if (assignments.length === 0) return withFee
              const primary = assignments[0]
              return {
                ...withFee,
                assignedLectures: assignments.map(item => ({
                  slotKey: item.slotKey,
                  dateKey: item.dateKey,
                  schoolId: item.schoolId,
                  schoolName: item.schoolName,
                  sessionLabel: item.sessionLabel,
                  timeRange: item.timeRange,
                })),
                assignedSchoolId: primary?.schoolId,
                assignedSchoolName: primary?.schoolName,
              }
            })
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
          updateApplicantInstructorApprovalStatus(id, 'approved', notifyOptions)
          setInstructorApprovalComplete({
            instructorName: instructorApprovalTarget.name,
            assignedInstitutionCount: countAssignedInstitutions(assignments),
          })
        }}
      />
      <InstructorApprovalCompleteModal
        open={instructorApprovalComplete != null}
        instructorName={instructorApprovalComplete?.instructorName ?? ''}
        assignedInstitutionCount={instructorApprovalComplete?.assignedInstitutionCount ?? 0}
        onClose={() => setInstructorApprovalComplete(null)}
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
              <CmsButton variant="delete" size="large" width={160} onClick={handleBulkRejectClick}>
                선택 반려
              </CmsButton>
              <CmsButton variant="secondary" size="large" width={160} onClick={handleBulkApproveClick}>
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
                  instructorColumnPreset === 'general-detail' && menu === 'instructors'
                    ? 'general-instructor'
                    : institutionColumnPreset === 'general-detail' && menu === 'institutions'
                      ? 'general-institution'
                      : 'default'
                }
              />
            </div>
          )}
        </FilterTableLayout>
      ) : null}
    </div>
  )
}
