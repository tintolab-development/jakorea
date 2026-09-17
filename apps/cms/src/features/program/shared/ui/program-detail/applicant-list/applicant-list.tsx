import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import { CmsButton, CMS_ACTION_BUTTON_WIDTH, useCmsAlert } from '@/shared/ui'
import {
  patchApplicantSchoolForApprovalStatus,
  type ApplicantSchoolRow,
} from '@/features/program/shared/model/applicant-institution'
import {
  patchApplicantInstructorForApprovalStatus,
  patchApplicantInstructorForNotificationResend,
  updateApplicantInstructorApprovalStatus,
  updateApplicantInstructorCancelApproval,
  updateApplicantInstructorCancelRejection,
  updateApplicantInstructorNotificationResend,
  type ApplicantInstructorRow,
} from '@/features/program/shared/model/applicant-instructor'
import {
  updateGeneralIndividualApplicantApprovalStatus,
  updateGeneralIndividualApplicantCancelApproval,
  updateGeneralIndividualApplicantCancelRejection,
  patchGeneralIndividualApplicantForApprovalStatus,
  patchGeneralIndividualApplicantForNotificationResend,
  updateGeneralIndividualApplicantNotificationResend,
  type GeneralIndividualApplicantRow,
} from '@/features/program/general/model/individual-applicant'
import { patchParticipantForCancelApproval } from '@/features/program/general/lib/participant-cancel-approval'
import {
  patchParticipantForCancelRejection,
  toParticipantCancelRejectionNotifyOptions,
  type ParticipantCancelRejectionConfirmPayload,
} from '@/features/program/general/lib/participant-cancel-rejection'
import {
  ParticipantApproveModal,
  ParticipantApprovalCompleteModal,
  ParticipantRejectModal,
  ParticipantRejectCompleteModal,
  ParticipantBulkApproveModal,
  ParticipantBulkApproveCompleteModal,
  ParticipantBulkRejectModal,
  ParticipantBulkRejectCompleteModal,
  ParticipantCancelApprovalModal,
  ParticipantCancelApprovalCompleteModal,
  ParticipantCancelRejectModal,
  ParticipantCancelRejectCompleteModal,
} from '@/features/program/shared/ui/detail-modal/components/participant-application-flow-modals'
import type { Program } from '@/types/domain'
import { buildGeneralParticipantDoc1FilterRows } from '@/features/program/general/lib/participant-doc-screening-filter-fields'
import { ApplicantCalendarView } from './applicant-calendar-view'
import { mapApplicantDataToCalendarEvents } from './applicant-calendar-events'
import { ApplicantsDetailContents, type ApplicantType } from './applicants-detail-contents'
import { GeneralParticipantApplicantDetailView } from '@/features/program/general/ui/detail-modal/applications/participant-screening/participant-applicant-detail-view'
import type { ApplicantDetailMeta } from './use-applicants-detail'
import { InstructorFeeApprovalModal } from '@/features/program/shared/ui/detail-modal/components/instructor-fee-approval-modal'
import {
  countAssignedInstitutions,
  InstructorApprovalCompleteModal,
} from '@/features/program/shared/ui/detail-modal/components/instructor-approval-complete-modal'
import { InstructorLectureAssignModal } from '@/features/program/shared/ui/detail-modal/components/instructor-lecture-assign-modal'
import { getGeneralParticipantInterviewEnabled } from '@/features/program/general/lib/detail-meta'
import { buildApplicationProcessedSelectionAlert } from '@/features/program/general/lib/application-processed-selection-alert'
import { isGeneralIndividualProgram } from '@/features/program/general/lib/survey-audience'
import {
  resolveApplicantNotificationResendSentAt,
  toApplicantNotificationResendNotifyOptions,
  type ApplicantNotificationResendApprovalStatus,
  type ApplicantNotificationResendSubjectKind,
} from '@/features/program/general/lib/applicant-notification-resend'
import { ApplicantNotificationResendModal } from '@/features/program/shared/ui/detail-modal/components/applicant-notification-resend-modal'
import { notifyProgramApiUnavailable } from '@/features/program/shared/lib/program-api-unavailable'
import { patchInstructorForCancelApproval } from '@/features/program/general/lib/instructor-cancel-approval'
import {
  patchInstructorForCancelRejection,
  toInstructorCancelRejectionNotifyOptions,
} from '@/features/program/general/lib/instructor-cancel-rejection'
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
import { countAssignedInstructors } from '@/features/program/general/lib/institution-assigned-instructor-count'
import { InstitutionBulkApproveModal } from '@/features/program/shared/ui/detail-modal/components/institution-bulk-approve-modal'
import { InstitutionBulkApproveCompleteModal } from '@/features/program/shared/ui/detail-modal/components/institution-bulk-approve-complete-modal'
import { InstitutionBulkRejectModal } from '@/features/program/shared/ui/detail-modal/components/institution-bulk-reject-modal'
import { InstitutionBulkRejectCompleteModal } from '@/features/program/shared/ui/detail-modal/components/institution-bulk-reject-complete-modal'
import { InstitutionApproveModal } from '@/features/program/shared/ui/detail-modal/components/institution-approve-modal'
import { InstitutionApprovalCompleteModal } from '@/features/program/shared/ui/detail-modal/components/institution-approval-complete-modal'
import { InstitutionRejectModal } from '@/features/program/shared/ui/detail-modal/components/institution-reject-modal'
import { InstitutionRejectCompleteModal } from '@/features/program/shared/ui/detail-modal/components/institution-reject-complete-modal'
import { InstitutionCancelApprovalModal } from '@/features/program/shared/ui/detail-modal/components/institution-cancel-approval-modal'
import { InstitutionCancelApprovalCompleteModal } from '@/features/program/shared/ui/detail-modal/components/institution-cancel-approval-complete-modal'
import {
  InstitutionCancelRejectModal,
  type InstitutionCancelRejectionConfirmPayload,
} from '@/features/program/shared/ui/detail-modal/components/institution-cancel-reject-modal'
import { InstitutionCancelRejectCompleteModal } from '@/features/program/shared/ui/detail-modal/components/institution-cancel-reject-complete-modal'
import { useApplicantsDetail } from './use-applicants-detail'
import { useGatedInfiniteScroll } from '@/shared/hooks/use-gated-infinite-scroll'
import { resolveApplicantListTableMinScrollX } from './applicant-list-table-scroll'
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
  /** 개인 참여자 면접 1차 서류 심사 탭 */
  individualScreeningStage?: 'doc1'
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
  individualScreeningStage,
}: ApplicantListProps) {
  const { showAlert } = useCmsAlert()
  const {
    applicantsCalendarGranularity,
    setApplicantsCalendarGranularity,
    pendingFilters,
    fields,
    institutionList,
    instructorList,
    individualList,
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
    confirmBulkInstitutionReject,
    confirmBulkInstitutionApprove,
    confirmBulkParticipantReject,
    confirmBulkParticipantApprove,
    applyRemoteIndividualDecision,
    applyRemoteInstructorDecision,
    applyRemoteInstitutionDecision,
    applyRemoteInstitutionCancelApproval,
    applyRemoteInstitutionCancelRejection,
    individualRemoteEnabled,
    instructorRemoteEnabled,
    handleCancelApproval,
    handleCancelApprovalInstructor,
    handleCancelRejectInstructor,
    resendInstructorNotification,
    handleCancelRejectInstitution,
    handleCancelApprovalIndividual,
    handleCancelRejectIndividual,
    handleViewCalendar,
    title,
    tableData,
    columns,
    tableScrollX,
    applicationsLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    infiniteScrollResetKey,
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
    program,
    individualScreeningStage,
  })
  const { sentinelRef: loadMoreRef } = useGatedInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    resetKey: infiniteScrollResetKey,
  })

  const institutionTableWrapRef = useRef<HTMLDivElement>(null)
  const [institutionTableScrollX, setInstitutionTableScrollX] = useState<number | undefined>(
    undefined
  )
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
  const [institutionBulkApproveOpen, setInstitutionBulkApproveOpen] = useState(false)
  const [institutionBulkApproveCompleteCount, setInstitutionBulkApproveCompleteCount] = useState<
    number | null
  >(null)
  const [institutionBulkRejectOpen, setInstitutionBulkRejectOpen] = useState(false)
  const [institutionBulkRejectCompleteCount, setInstitutionBulkRejectCompleteCount] = useState<
    number | null
  >(null)
  const [institutionApproveTarget, setInstitutionApproveTarget] = useState<{
    id: string
    name: string
  } | null>(null)
  const [institutionApprovalComplete, setInstitutionApprovalComplete] = useState<{
    schoolName: string
    assignedInstructorCount: number
  } | null>(null)
  const [institutionRejectTarget, setInstitutionRejectTarget] = useState<{
    id: string
    name: string
  } | null>(null)
  const [institutionRejectComplete, setInstitutionRejectComplete] = useState<{
    schoolName: string
    rejectionReason: string
  } | null>(null)
  const [institutionCancelApprovalTarget, setInstitutionCancelApprovalTarget] = useState<{
    id: string
    name: string
  } | null>(null)
  const [institutionCancelApprovalComplete, setInstitutionCancelApprovalComplete] = useState<{
    schoolName: string
    cancellationReason: string
  } | null>(null)
  const [institutionCancelRejectTarget, setInstitutionCancelRejectTarget] = useState<{
    id: string
    name: string
  } | null>(null)
  const [institutionCancelRejectComplete, setInstitutionCancelRejectComplete] = useState<{
    schoolName: string
  } | null>(null)
  const [participantBulkApproveOpen, setParticipantBulkApproveOpen] = useState(false)
  const [participantBulkApproveCompleteCount, setParticipantBulkApproveCompleteCount] = useState<
    number | null
  >(null)
  const [participantBulkRejectOpen, setParticipantBulkRejectOpen] = useState(false)
  const [participantBulkRejectCompleteCount, setParticipantBulkRejectCompleteCount] = useState<
    number | null
  >(null)
  const [participantApproveTarget, setParticipantApproveTarget] = useState<{
    id: string
    name: string
  } | null>(null)
  const [participantApprovalComplete, setParticipantApprovalComplete] = useState<{
    participantName: string
  } | null>(null)
  const [participantRejectTarget, setParticipantRejectTarget] = useState<{
    id: string
    name: string
  } | null>(null)
  const [participantRejectComplete, setParticipantRejectComplete] = useState<{
    participantName: string
    rejectionReason: string
  } | null>(null)
  const [participantCancelApprovalTarget, setParticipantCancelApprovalTarget] = useState<{
    id: string
    name: string
  } | null>(null)
  const [participantCancelApprovalComplete, setParticipantCancelApprovalComplete] = useState<{
    participantName: string
    cancellationReason: string
  } | null>(null)
  const [participantCancelRejectTarget, setParticipantCancelRejectTarget] = useState<{
    id: string
    name: string
  } | null>(null)
  const [participantCancelRejectComplete, setParticipantCancelRejectComplete] = useState<{
    participantName: string
  } | null>(null)

  const useGeneralInstructorBulkActionModal =
    menu === 'instructors' && instructorColumnPreset === 'general-detail'

  const useGeneralInstitutionActionModal =
    menu === 'institutions' &&
    (institutionColumnPreset === 'general-detail' || institutionColumnPreset === 'company-school')
  const useGeneralInstitutionCalendarVariant = useGeneralInstitutionActionModal

  const useGeneralParticipantActionModal =
    menu === 'individual-applications' && detailVariant === 'general'

  /** 개인 참여자 — 면접 불필요 시 캘린더 우측 목록 상단 multi select 미노출 */
  const showCalendarEntityFilter =
    menu !== 'individual-applications' || !program || getGeneralParticipantInterviewEnabled(program)

  /** 1차 서류 심사 탭 — 리스트뷰만 (봉사자 doc1과 동일) */
  const isIndividualDoc1Screening =
    menu === 'individual-applications' && individualScreeningStage === 'doc1'
  const individualDoc1FilterRows = useMemo(
    () => (isIndividualDoc1Screening ? buildGeneralParticipantDoc1FilterRows() : undefined),
    [isIndividualDoc1Screening]
  )
  const displayViewMode = isIndividualDoc1Screening ? 'table' : viewMode
  const showIndividualCalendarToggle = !isIndividualDoc1Screening

  const useOrganizationInstructorAssignFlow =
    menu === 'instructors' &&
    instructorColumnPreset === 'general-detail' &&
    detailVariant === 'general' &&
    program != null &&
    !isGeneralIndividualProgram(program)

  const useIndividualInstructorAssignFlow =
    menu === 'instructors' &&
    instructorColumnPreset === 'general-detail' &&
    detailVariant === 'general' &&
    program != null &&
    isGeneralIndividualProgram(program)

  const useInstructorAssignFlow =
    useOrganizationInstructorAssignFlow || useIndividualInstructorAssignFlow

  const instructorApprovalInstructor = useMemo(() => {
    if (!instructorApprovalTarget) return null
    return (
      instructorList.find(row => row.id === instructorApprovalTarget.id) ??
      (selectedItem &&
      'instructorName' in selectedItem &&
      selectedItem.id === instructorApprovalTarget.id
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

  const institutionCancelApprovalInstitution = useMemo(() => {
    if (!institutionCancelApprovalTarget) return null
    return (
      institutionList.find(row => row.id === institutionCancelApprovalTarget.id) ??
      (selectedItem &&
      'schoolName' in selectedItem &&
      selectedItem.id === institutionCancelApprovalTarget.id
        ? (selectedItem as ApplicantSchoolRow)
        : null)
    )
  }, [institutionCancelApprovalTarget, institutionList, selectedItem])

  const institutionCancelRejectInstitution = useMemo(() => {
    if (!institutionCancelRejectTarget) return null
    return (
      institutionList.find(row => row.id === institutionCancelRejectTarget.id) ??
      (selectedItem &&
      'schoolName' in selectedItem &&
      selectedItem.id === institutionCancelRejectTarget.id
        ? (selectedItem as ApplicantSchoolRow)
        : null)
    )
  }, [institutionCancelRejectTarget, institutionList, selectedItem])

  const participantCancelApprovalParticipant = useMemo(() => {
    if (!participantCancelApprovalTarget) return null
    return (
      individualList.find(row => row.id === participantCancelApprovalTarget.id) ??
      (selectedItem &&
      'applicantName' in selectedItem &&
      selectedItem.id === participantCancelApprovalTarget.id
        ? (selectedItem as GeneralIndividualApplicantRow)
        : null)
    )
  }, [participantCancelApprovalTarget, individualList, selectedItem])

  const participantCancelRejectParticipant = useMemo(() => {
    if (!participantCancelRejectTarget) return null
    return (
      individualList.find(row => row.id === participantCancelRejectTarget.id) ??
      (selectedItem &&
      'applicantName' in selectedItem &&
      selectedItem.id === participantCancelRejectTarget.id
        ? (selectedItem as GeneralIndividualApplicantRow)
        : null)
    )
  }, [participantCancelRejectTarget, individualList, selectedItem])

  const showNoSelectionAlert = useCallback(() => {
    showAlert({
      title: '항목 선택 안내',
      content: '선택된 항목이 없습니다.\n항목 선택 후 다시 시도해 주세요.',
    })
  }, [showAlert])

  const blockProcessedBulkSelection = useCallback((): boolean => {
    const selectedIds = new Set(selectedRowKeys.map(String))

    if (useGeneralInstitutionActionModal) {
      const hasProcessed = institutionList.some(
        row => selectedIds.has(row.id) && row.approvalStatus !== 'pending'
      )
      if (!hasProcessed) return false
      showAlert(buildApplicationProcessedSelectionAlert('institution'))
      return true
    }

    if (useGeneralInstructorBulkActionModal) {
      const hasProcessed = instructorList.some(
        row => selectedIds.has(row.id) && row.approvalStatus !== 'pending'
      )
      if (!hasProcessed) return false
      showAlert(buildApplicationProcessedSelectionAlert('instructor'))
      return true
    }

    if (useGeneralParticipantActionModal) {
      const hasProcessed = individualList.some(
        row => selectedIds.has(row.id) && row.approvalStatus !== 'pending'
      )
      if (!hasProcessed) return false
      showAlert(buildApplicationProcessedSelectionAlert('participant'))
      return true
    }

    return false
  }, [
    individualList,
    institutionList,
    instructorList,
    selectedRowKeys,
    showAlert,
    useGeneralInstitutionActionModal,
    useGeneralInstructorBulkActionModal,
    useGeneralParticipantActionModal,
  ])

  const resolveSingleSelectedIndividual = useCallback((): GeneralIndividualApplicantRow | null => {
    if (selectedRowKeys.length !== 1) return null
    const id = String(selectedRowKeys[0])
    return individualList.find(row => row.id === id) ?? null
  }, [selectedRowKeys, individualList])

  const resolveSingleSelectedInstitution = useCallback((): ApplicantSchoolRow | null => {
    if (selectedRowKeys.length !== 1) return null
    const id = String(selectedRowKeys[0])
    return institutionList.find(row => row.id === id) ?? null
  }, [selectedRowKeys, institutionList])

  const handleBulkRejectClick = () => {
    if (selectedRowKeys.length === 0) {
      showNoSelectionAlert()
      return
    }
    if (blockProcessedBulkSelection()) return
    if (useGeneralInstitutionActionModal) {
      const single = resolveSingleSelectedInstitution()
      if (single) {
        setInstitutionRejectTarget({ id: single.id, name: single.schoolName })
        return
      }
      setInstitutionBulkRejectOpen(true)
      return
    }
    if (useGeneralParticipantActionModal) {
      const single = resolveSingleSelectedIndividual()
      if (single) {
        setParticipantRejectTarget({ id: single.id, name: single.applicantName })
        return
      }
      setParticipantBulkRejectOpen(true)
      return
    }
    if (useGeneralInstructorBulkActionModal) {
      setInstructorBulkRejectOpen(true)
      return
    }
    void handleBulkReject()
  }

  const handleBulkApproveClick = () => {
    if (selectedRowKeys.length === 0) {
      showNoSelectionAlert()
      return
    }
    if (blockProcessedBulkSelection()) return
    if (useGeneralInstitutionActionModal) {
      const single = resolveSingleSelectedInstitution()
      if (single) {
        setInstitutionApproveTarget({ id: single.id, name: single.schoolName })
        return
      }
      setInstitutionBulkApproveOpen(true)
      return
    }
    if (useGeneralParticipantActionModal) {
      const single = resolveSingleSelectedIndividual()
      if (single) {
        setParticipantApproveTarget({ id: single.id, name: single.applicantName })
        return
      }
      setParticipantBulkApproveOpen(true)
      return
    }
    if (useGeneralInstructorBulkActionModal) {
      setInstructorBulkApproveOpen(true)
      return
    }
    void handleBulkApprove()
  }

  const usesInstitutionTableScroll =
    menu === 'institutions' ||
    menu === 'individual-applications' ||
    (menu === 'instructors' && instructorColumnPreset === 'general-detail')

  useLayoutEffect(() => {
    if (!usesInstitutionTableScroll || displayViewMode !== 'table' || selectedItem) return
    const el = institutionTableWrapRef.current
    if (!el) return
    // 열 합 기반 최소폭 — 하드코딩 1280/1600은 세션 열 숨김 시에도 가로스크롤을 강제함
    const minW = resolveApplicantListTableMinScrollX(columns as ColumnsType<unknown> | undefined)
    const update = () => {
      const w = Math.floor(el.getBoundingClientRect().width)
      if (w <= 0) return
      setInstitutionTableScrollX(minW > w ? minW : undefined)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [usesInstitutionTableScroll, displayViewMode, selectedItem, columns])

  const tableHorizontalScrollX = usesInstitutionTableScroll ? institutionTableScrollX : tableScrollX

  const isGeneralProgramCalendarView =
    detailVariant === 'general' && displayViewMode === 'calendar' && !selectedItem

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
      notifyProgramApiUnavailable(
        'general-org-application-notification-resend',
        '일반 프로그램 · 기관 신청 알림 재발송'
      )
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
      className={`applicant-details${
        isGeneralProgramCalendarView ? ' general-program-detail--calendar-view' : ''
      }`}
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
            setInstitutionList(prev => prev.map(row => updatedById.get(row.id) ?? row))
            const current = selectedItem as ApplicantSchoolRow
            const nextSelected = updatedById.get(current.id)
            if (nextSelected) {
              setSelectedItem(nextSelected)
            }
          }}
          onBack={() => setSelectedItem(null)}
          onApprove={id => {
            const row = selectedItem
            if (row && 'schoolName' in row && row.id === id && useGeneralInstitutionActionModal) {
              setInstitutionApproveTarget({ id, name: row.schoolName })
              return
            }
            void (async () => {
              const remote = await applyRemoteInstitutionDecision([id], 'approve')
              if (remote === 'error') return
              if (remote === 'skipped') {
                notifyProgramApiUnavailable(
                  'general-org-application-decision',
                  '일반 프로그램 · 기관 신청 승인·반려'
                )
                return
              }
              if (detailVariant !== 'general') {
                setSelectedItem(null)
              }
            })()
          }}
          onReject={id => {
            const row = selectedItem
            if (row && 'schoolName' in row && row.id === id && useGeneralInstitutionActionModal) {
              setInstitutionRejectTarget({ id, name: row.schoolName })
              return
            }
            void (async () => {
              const remote = await applyRemoteInstitutionDecision([id], 'reject')
              if (remote === 'error') return
              if (remote === 'skipped') {
                notifyProgramApiUnavailable(
                  'general-org-application-decision',
                  '일반 프로그램 · 기관 신청 승인·반려'
                )
                return
              }
              if (detailVariant !== 'general') {
                setSelectedItem(null)
              }
            })()
          }}
          onCancelApproval={id => {
            const row = selectedItem
            if (row && 'schoolName' in row && row.id === id && useGeneralInstitutionActionModal) {
              setInstitutionCancelApprovalTarget({ id, name: row.schoolName })
              return
            }
            resolveCancelApproval()(id)
          }}
          onCancelReject={id => {
            const row = selectedItem
            if (row && 'schoolName' in row && row.id === id && useGeneralInstitutionActionModal) {
              setInstitutionCancelRejectTarget({ id, name: row.schoolName })
              return
            }
            resolveCancelReject()(id)
          }}
          onResendNotification={handleOpenNotificationResend}
        />
      ) : showIndividualDetail && individualScreeningStage === 'doc1' && program ? (
        <GeneralParticipantApplicantDetailView
          program={program}
          applicantId={(selectedItem as GeneralIndividualApplicantRow).id}
          applicant={selectedItem as GeneralIndividualApplicantRow}
          screeningStage="doc1"
          onRegisterApplicantCloseHandler={onRegisterApplicantCloseHandler}
          onApplicantDetailMetaChange={onApplicantDetailMetaChange}
          onApplicantUpdated={row => {
            setIndividualList(prev => prev.map(item => (item.id === row.id ? row : item)))
            const current = selectedItem as GeneralIndividualApplicantRow
            if (current.id === row.id) {
              setSelectedItem(row)
            }
          }}
        />
      ) : showIndividualDetail ? (
        <ApplicantsDetailContents
          type="individual-applications"
          detailVariant={detailVariant}
          data={selectedItem as GeneralIndividualApplicantRow}
          program={program}
          onBack={() => setSelectedItem(null)}
          onApprove={id => {
            const row = selectedItem
            if (
              row &&
              'applicantName' in row &&
              row.id === id &&
              useGeneralParticipantActionModal
            ) {
              setParticipantApproveTarget({ id, name: row.applicantName })
              return
            }
            setIndividualList(prev =>
              prev.map(r =>
                r.id === id ? patchGeneralIndividualApplicantForApprovalStatus(r, 'approved') : r
              )
            )
            updateGeneralIndividualApplicantApprovalStatus(id, 'approved')
          }}
          onReject={id => {
            const row = selectedItem
            if (
              row &&
              'applicantName' in row &&
              row.id === id &&
              useGeneralParticipantActionModal
            ) {
              setParticipantRejectTarget({ id, name: row.applicantName })
              return
            }
            setIndividualList(prev =>
              prev.map(r =>
                r.id === id ? patchGeneralIndividualApplicantForApprovalStatus(r, 'rejected') : r
              )
            )
            updateGeneralIndividualApplicantApprovalStatus(id, 'rejected')
          }}
          onCancelApproval={id => {
            const row = selectedItem
            if (
              row &&
              'applicantName' in row &&
              row.id === id &&
              useGeneralParticipantActionModal
            ) {
              setParticipantCancelApprovalTarget({ id, name: row.applicantName })
              return
            }
            handleCancelApprovalIndividual(id)
          }}
          onCancelReject={id => {
            const row = selectedItem
            if (
              row &&
              'applicantName' in row &&
              row.id === id &&
              useGeneralParticipantActionModal
            ) {
              setParticipantCancelRejectTarget({ id, name: row.applicantName })
              return
            }
            handleCancelRejectIndividual(id)
          }}
          onResendNotification={handleOpenNotificationResend}
          onIndividualDetailSaved={row => {
            setIndividualList(prev => prev.map(item => (item.id === row.id ? row : item)))
            const current = selectedItem as GeneralIndividualApplicantRow
            if (current.id === row.id) {
              setSelectedItem(row)
            }
          }}
          individualScreeningStage={individualScreeningStage === 'doc1' ? 'doc1' : 'main'}
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
              if (useInstructorAssignFlow) {
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
      <InstitutionBulkRejectModal
        open={institutionBulkRejectOpen}
        selectionCount={selectedRowKeys.length}
        onCancel={() => setInstitutionBulkRejectOpen(false)}
        onConfirm={payload => {
          const rejectedCount = selectedRowKeys.length
          confirmBulkInstitutionReject(payload)
          setInstitutionBulkRejectOpen(false)
          setInstitutionBulkRejectCompleteCount(rejectedCount)
        }}
      />
      <InstitutionBulkRejectCompleteModal
        open={institutionBulkRejectCompleteCount != null}
        selectionCount={institutionBulkRejectCompleteCount ?? 0}
        onClose={() => setInstitutionBulkRejectCompleteCount(null)}
      />
      <InstitutionBulkApproveModal
        open={institutionBulkApproveOpen}
        selectionCount={selectedRowKeys.length}
        onCancel={() => setInstitutionBulkApproveOpen(false)}
        onConfirm={payload => {
          const approvedCount = selectedRowKeys.length
          confirmBulkInstitutionApprove(payload)
          setInstitutionBulkApproveOpen(false)
          setInstitutionBulkApproveCompleteCount(approvedCount)
        }}
      />
      <InstitutionBulkApproveCompleteModal
        open={institutionBulkApproveCompleteCount != null}
        selectionCount={institutionBulkApproveCompleteCount ?? 0}
        onClose={() => setInstitutionBulkApproveCompleteCount(null)}
      />
      <InstitutionApproveModal
        open={institutionApproveTarget != null}
        schoolName={institutionApproveTarget?.name ?? ''}
        onCancel={() => setInstitutionApproveTarget(null)}
        onConfirm={payload => {
          if (!institutionApproveTarget) return
          const { id, name } = institutionApproveTarget
          const notifyOptions = {
            notifyTiming: payload.notifyTiming,
            manualNotifyAt: payload.manualNotifyAt,
          }
          const run = async () => {
            const remote = await applyRemoteInstitutionDecision([id], 'approve')
            if (remote === 'error') return
            if (remote === 'skipped') {
              notifyProgramApiUnavailable(
                'general-org-application-decision',
                '일반 프로그램 · 기관 신청 승인·반려'
              )
              return
            }
            setInstitutionApproveTarget(null)
            const sourceRow =
              institutionList.find(row => row.id === id) ??
              (selectedItem && 'schoolName' in selectedItem && selectedItem.id === id
                ? (selectedItem as ApplicantSchoolRow)
                : null)
            const patchedRow = sourceRow
              ? patchApplicantSchoolForApprovalStatus(sourceRow, 'approved', notifyOptions)
              : null
            if (patchedRow) {
              setInstitutionList(prev => prev.map(row => (row.id === id ? patchedRow : row)))
              if (selectedItem && 'schoolName' in selectedItem && selectedItem.id === id) {
                setSelectedItem(patchedRow)
              }
            }
            setInstitutionApprovalComplete({
              schoolName: name,
              assignedInstructorCount: countAssignedInstructors(
                patchedRow?.assignedInstructorNames
              ),
            })
          }
          void run()
        }}
      />
      <InstitutionApprovalCompleteModal
        open={institutionApprovalComplete != null}
        schoolName={institutionApprovalComplete?.schoolName ?? ''}
        assignedInstructorCount={institutionApprovalComplete?.assignedInstructorCount ?? 0}
        onClose={() => setInstitutionApprovalComplete(null)}
      />
      <InstitutionRejectModal
        open={institutionRejectTarget != null}
        schoolName={institutionRejectTarget?.name ?? ''}
        onCancel={() => setInstitutionRejectTarget(null)}
        onConfirm={payload => {
          if (!institutionRejectTarget) return
          const { id, name } = institutionRejectTarget
          const notifyOptions = {
            notifyTiming: payload.notifyTiming,
            manualNotifyAt: payload.manualNotifyAt,
            rejectionReason: payload.reason,
          }
          const run = async () => {
            const remote = await applyRemoteInstitutionDecision([id], 'reject', payload.reason)
            if (remote === 'error') return
            if (remote === 'skipped') {
              notifyProgramApiUnavailable(
                'general-org-application-decision',
                '일반 프로그램 · 기관 신청 승인·반려'
              )
              return
            }
            setInstitutionRejectTarget(null)
            setInstitutionList(prev => {
              const next = prev.map(row =>
                row.id === id
                  ? patchApplicantSchoolForApprovalStatus(row, 'rejected', notifyOptions)
                  : row
              )
              const updated = next.find(row => row.id === id)
              const current = selectedItem
              if (updated && current && 'schoolName' in current && current.id === id) {
                setSelectedItem(updated)
              }
              return next
            })
            setInstitutionRejectComplete({
              schoolName: name,
              rejectionReason: payload.reason,
            })
          }
          void run()
        }}
      />
      <InstitutionRejectCompleteModal
        open={institutionRejectComplete != null}
        schoolName={institutionRejectComplete?.schoolName ?? ''}
        rejectionReason={institutionRejectComplete?.rejectionReason ?? ''}
        onClose={() => setInstitutionRejectComplete(null)}
      />
      <InstitutionCancelApprovalModal
        open={institutionCancelApprovalTarget != null}
        institution={institutionCancelApprovalInstitution}
        onCancel={() => setInstitutionCancelApprovalTarget(null)}
        onConfirm={payload => {
          if (!institutionCancelApprovalTarget) return
          const { id, name } = institutionCancelApprovalTarget
          const reason = payload.reason?.trim() || '승인 취소'
          setInstitutionCancelApprovalTarget(null)
          void (async () => {
            const remote = await applyRemoteInstitutionCancelApproval(id, reason)
            if (remote === 'error' || remote === 'unavailable') return
            setInstitutionCancelApprovalComplete({
              schoolName: name,
              cancellationReason: reason,
            })
          })()
        }}
      />
      <InstitutionCancelApprovalCompleteModal
        open={institutionCancelApprovalComplete != null}
        schoolName={institutionCancelApprovalComplete?.schoolName ?? ''}
        cancellationReason={institutionCancelApprovalComplete?.cancellationReason ?? ''}
        onClose={() => setInstitutionCancelApprovalComplete(null)}
      />
      <InstitutionCancelRejectModal
        open={institutionCancelRejectTarget != null}
        institution={institutionCancelRejectInstitution}
        onCancel={() => setInstitutionCancelRejectTarget(null)}
        onConfirm={(payload: InstitutionCancelRejectionConfirmPayload) => {
          if (!institutionCancelRejectTarget) return
          const { id, name } = institutionCancelRejectTarget
          const reason =
            payload.variant === 'alreadySent' ? payload.reason?.trim() || '반려 취소' : '반려 취소'
          setInstitutionCancelRejectTarget(null)
          void (async () => {
            const remote = await applyRemoteInstitutionCancelRejection(id, reason)
            if (remote === 'error' || remote === 'unavailable') return
            setInstitutionCancelRejectComplete({ schoolName: name })
          })()
        }}
      />
      <InstitutionCancelRejectCompleteModal
        open={institutionCancelRejectComplete != null}
        schoolName={institutionCancelRejectComplete?.schoolName ?? ''}
        onClose={() => setInstitutionCancelRejectComplete(null)}
      />
      <ParticipantBulkRejectModal
        open={participantBulkRejectOpen}
        selectionCount={selectedRowKeys.length}
        onCancel={() => setParticipantBulkRejectOpen(false)}
        onConfirm={payload => {
          const rejectedCount = selectedRowKeys.length
          confirmBulkParticipantReject(payload)
          setParticipantBulkRejectOpen(false)
          setParticipantBulkRejectCompleteCount(rejectedCount)
        }}
      />
      <ParticipantBulkRejectCompleteModal
        open={participantBulkRejectCompleteCount != null}
        selectionCount={participantBulkRejectCompleteCount ?? 0}
        onClose={() => setParticipantBulkRejectCompleteCount(null)}
      />
      <ParticipantBulkApproveModal
        open={participantBulkApproveOpen}
        selectionCount={selectedRowKeys.length}
        onCancel={() => setParticipantBulkApproveOpen(false)}
        onConfirm={payload => {
          const approvedCount = selectedRowKeys.length
          confirmBulkParticipantApprove(payload)
          setParticipantBulkApproveOpen(false)
          setParticipantBulkApproveCompleteCount(approvedCount)
        }}
      />
      <ParticipantBulkApproveCompleteModal
        open={participantBulkApproveCompleteCount != null}
        selectionCount={participantBulkApproveCompleteCount ?? 0}
        onClose={() => setParticipantBulkApproveCompleteCount(null)}
      />
      <ParticipantApproveModal
        open={participantApproveTarget != null}
        participantName={participantApproveTarget?.name ?? ''}
        onCancel={() => setParticipantApproveTarget(null)}
        onConfirm={payload => {
          if (!participantApproveTarget) return
          const { id, name } = participantApproveTarget
          const notifyOptions = {
            notifyTiming: payload.notifyTiming,
            manualNotifyAt: payload.manualNotifyAt,
          }
          const run = async () => {
            if (individualRemoteEnabled) {
              const remote = await applyRemoteIndividualDecision([id], 'approve')
              if (remote === 'error') return
              if (remote === 'ok') {
                setParticipantApproveTarget(null)
                const sourceRow =
                  individualList.find(row => row.id === id) ??
                  (selectedItem && 'applicantName' in selectedItem && selectedItem.id === id
                    ? (selectedItem as GeneralIndividualApplicantRow)
                    : null)
                const patchedRow = sourceRow
                  ? patchGeneralIndividualApplicantForApprovalStatus(
                      sourceRow,
                      'approved',
                      notifyOptions
                    )
                  : null
                if (patchedRow) {
                  setIndividualList(prev => prev.map(row => (row.id === id ? patchedRow : row)))
                  if (selectedItem && 'applicantName' in selectedItem && selectedItem.id === id) {
                    setSelectedItem(patchedRow)
                  }
                }
                setParticipantApprovalComplete({ participantName: name })
                return
              }
            }
            setParticipantApproveTarget(null)
            const sourceRow =
              individualList.find(row => row.id === id) ??
              (selectedItem && 'applicantName' in selectedItem && selectedItem.id === id
                ? (selectedItem as GeneralIndividualApplicantRow)
                : null)
            const patchedRow = sourceRow
              ? patchGeneralIndividualApplicantForApprovalStatus(
                  sourceRow,
                  'approved',
                  notifyOptions
                )
              : null
            setIndividualList(prev => {
              const next = prev.map(row => (row.id === id && patchedRow ? patchedRow : row))
              const updated = next.find(row => row.id === id)
              const current = selectedItem
              if (updated && current && 'applicantName' in current && current.id === id) {
                setSelectedItem(updated)
              }
              return next
            })
            updateGeneralIndividualApplicantApprovalStatus(id, 'approved', notifyOptions)
            setParticipantApprovalComplete({ participantName: name })
          }
          void run()
        }}
      />
      <ParticipantApprovalCompleteModal
        open={participantApprovalComplete != null}
        participantName={participantApprovalComplete?.participantName ?? ''}
        onClose={() => setParticipantApprovalComplete(null)}
      />
      <ParticipantRejectModal
        open={participantRejectTarget != null}
        participantName={participantRejectTarget?.name ?? ''}
        onCancel={() => setParticipantRejectTarget(null)}
        onConfirm={payload => {
          if (!participantRejectTarget) return
          const { id, name } = participantRejectTarget
          const notifyOptions = {
            notifyTiming: payload.notifyTiming,
            manualNotifyAt: payload.manualNotifyAt,
            rejectionReason: payload.reason,
          }
          const run = async () => {
            if (individualRemoteEnabled) {
              const remote = await applyRemoteIndividualDecision([id], 'reject', payload.reason)
              if (remote === 'error') return
              if (remote === 'ok') {
                setParticipantRejectTarget(null)
                const sourceRow =
                  individualList.find(row => row.id === id) ??
                  (selectedItem && 'applicantName' in selectedItem && selectedItem.id === id
                    ? (selectedItem as GeneralIndividualApplicantRow)
                    : null)
                const patchedRow = sourceRow
                  ? patchGeneralIndividualApplicantForApprovalStatus(
                      sourceRow,
                      'rejected',
                      notifyOptions
                    )
                  : null
                if (patchedRow) {
                  setIndividualList(prev => prev.map(row => (row.id === id ? patchedRow : row)))
                  if (selectedItem && 'applicantName' in selectedItem && selectedItem.id === id) {
                    setSelectedItem(patchedRow)
                  }
                }
                setParticipantRejectComplete({
                  participantName: name,
                  rejectionReason: payload.reason,
                })
                return
              }
            }
            setParticipantRejectTarget(null)
            setIndividualList(prev => {
              const next = prev.map(row =>
                row.id === id
                  ? patchGeneralIndividualApplicantForApprovalStatus(row, 'rejected', notifyOptions)
                  : row
              )
              const updated = next.find(row => row.id === id)
              const current = selectedItem
              if (updated && current && 'applicantName' in current && current.id === id) {
                setSelectedItem(updated)
              }
              return next
            })
            updateGeneralIndividualApplicantApprovalStatus(id, 'rejected', notifyOptions)
            setParticipantRejectComplete({
              participantName: name,
              rejectionReason: payload.reason,
            })
          }
          void run()
        }}
      />
      <ParticipantRejectCompleteModal
        open={participantRejectComplete != null}
        participantName={participantRejectComplete?.participantName ?? ''}
        rejectionReason={participantRejectComplete?.rejectionReason ?? ''}
        onClose={() => setParticipantRejectComplete(null)}
      />
      <ParticipantCancelApprovalModal
        open={participantCancelApprovalTarget != null}
        participant={participantCancelApprovalParticipant}
        onCancel={() => setParticipantCancelApprovalTarget(null)}
        onConfirm={payload => {
          if (!participantCancelApprovalTarget) return
          const { id, name } = participantCancelApprovalTarget
          const notifyOptions = {
            notifyTiming: payload.notifyTiming,
            manualNotifyAt: payload.manualNotifyAt,
            rejectionReason: payload.reason,
          }
          setParticipantCancelApprovalTarget(null)
          setIndividualList(prev => {
            const next = prev.map(row =>
              row.id === id ? patchParticipantForCancelApproval(row, notifyOptions) : row
            )
            const updated = next.find(row => row.id === id)
            const current = selectedItem
            if (updated && current && 'applicantName' in current && current.id === id) {
              setSelectedItem(updated)
            }
            return next
          })
          updateGeneralIndividualApplicantCancelApproval(id, notifyOptions)
          setParticipantCancelApprovalComplete({
            participantName: name,
            cancellationReason: payload.reason,
          })
        }}
      />
      <ParticipantCancelApprovalCompleteModal
        open={participantCancelApprovalComplete != null}
        participantName={participantCancelApprovalComplete?.participantName ?? ''}
        cancellationReason={participantCancelApprovalComplete?.cancellationReason ?? ''}
        onClose={() => setParticipantCancelApprovalComplete(null)}
      />
      <ParticipantCancelRejectModal
        open={participantCancelRejectTarget != null}
        participant={participantCancelRejectParticipant}
        onCancel={() => setParticipantCancelRejectTarget(null)}
        onConfirm={(payload: ParticipantCancelRejectionConfirmPayload) => {
          if (!participantCancelRejectTarget) return
          const { id, name } = participantCancelRejectTarget
          const notifyOptions =
            payload.variant === 'alreadySent'
              ? toParticipantCancelRejectionNotifyOptions(payload)
              : undefined
          setParticipantCancelRejectTarget(null)
          setIndividualList(prev => {
            const next = prev.map(row =>
              row.id === id ? patchParticipantForCancelRejection(row, notifyOptions) : row
            )
            const updated = next.find(row => row.id === id)
            const current = selectedItem
            if (updated && current && 'applicantName' in current && current.id === id) {
              setSelectedItem(updated)
            }
            return next
          })
          updateGeneralIndividualApplicantCancelRejection(id, notifyOptions)
          setParticipantCancelRejectComplete({ participantName: name })
        }}
      />
      <ParticipantCancelRejectCompleteModal
        open={participantCancelRejectComplete != null}
        participantName={participantCancelRejectComplete?.participantName ?? ''}
        onClose={() => setParticipantCancelRejectComplete(null)}
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
          const run = async () => {
            if (instructorRemoteEnabled) {
              const remote = await applyRemoteInstructorDecision([id], 'reject', payload.reason)
              if (remote === 'error') return
              if (remote === 'ok') {
                setInstructorRejectTarget(null)
                setInstructorList(prev => {
                  const next = prev.map(row =>
                    row.id === id
                      ? patchApplicantInstructorForApprovalStatus(row, 'rejected', notifyOptions)
                      : row
                  )
                  const updated = next.find(row => row.id === id)
                  const current = selectedItem
                  if (updated && current && 'instructorName' in current && current.id === id) {
                    setSelectedItem(updated)
                  }
                  return next
                })
                setInstructorRejectComplete({
                  instructorName: name,
                  rejectionReason: payload.reason,
                })
                return
              }
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
              if (updated && current && 'instructorName' in current && current.id === id) {
                setSelectedItem(updated)
              }
              return next
            })
            updateApplicantInstructorApprovalStatus(id, 'rejected', notifyOptions)
            setInstructorRejectComplete({
              instructorName: name,
              rejectionReason: payload.reason,
            })
          }
          void run()
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
          if (detailVariant === 'general') {
            void (async () => {
              const success = await handleCancelApprovalInstructor(id, payload.reason)
              if (!success) return
              setInstructorCancelApprovalTarget(null)
              setInstructorCancelApprovalComplete({
                instructorName: name,
                cancellationReason: payload.reason,
              })
            })()
            return
          }
          setInstructorCancelApprovalTarget(null)
          setInstructorList(prev => {
            const next = prev.map(row =>
              row.id === id ? patchInstructorForCancelApproval(row, notifyOptions) : row
            )
            const updated = next.find(row => row.id === id)
            const current = selectedItem
            if (updated && current && 'instructorName' in current && current.id === id) {
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
          if (detailVariant === 'general') {
            void (async () => {
              const reason =
                payload.variant === 'alreadySent' ? payload.reason : '반려 취소'
              const success = await handleCancelRejectInstructor(id, reason)
              if (!success) return
              setInstructorCancelRejectTarget(null)
              setInstructorCancelRejectComplete({ instructorName: name })
            })()
            return
          }
          setInstructorCancelRejectTarget(null)
          setInstructorList(prev => {
            const next = prev.map(row =>
              row.id === id ? patchInstructorForCancelRejection(row, notifyOptions) : row
            )
            const updated = next.find(row => row.id === id)
            const current = selectedItem
            if (updated && current && 'instructorName' in current && current.id === id) {
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
            if (detailVariant === 'general') {
              void resendInstructorNotification(id, {
                timing: notifyOptions.notifyTiming === 'manual' ? 'SCHEDULED' : 'IMMEDIATE',
                scheduledAt:
                  notifyOptions.notifyTiming === 'manual'
                    ? notifyOptions.manualNotifyAt?.toISOString() ?? null
                    : null,
              })
              return
            }
            setInstructorList(prev => {
              const next = prev.map(row =>
                row.id === id
                  ? patchApplicantInstructorForNotificationResend(row, notifyOptions)
                  : row
              )
              const updated = next.find(row => row.id === id)
              const current = selectedItem
              if (updated && current && 'instructorName' in current && current.id === id) {
                setSelectedItem(updated)
              }
              return next
            })
            updateApplicantInstructorNotificationResend(id, notifyOptions)
            return
          }

          if (subjectKind === 'institution') {
            notifyProgramApiUnavailable(
              'general-org-application-notification-resend',
              '일반 프로그램 · 기관 신청 알림 재발송'
            )
            return
          }

          setIndividualList(prev => {
            const next = prev.map(row =>
              row.id === id
                ? patchGeneralIndividualApplicantForNotificationResend(row, sentAt, {
                    rejectionReason: notifyOptions.rejectionReason,
                  })
                : row
            )
            const updated = next.find(row => row.id === id)
            const current = selectedItem
            if (updated && current && 'applicantName' in current && current.id === id) {
              setSelectedItem(updated)
            }
            return next
          })
          updateGeneralIndividualApplicantNotificationResend(id, sentAt, {
            rejectionReason: notifyOptions.rejectionReason,
          })
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
          variant={useIndividualInstructorAssignFlow ? 'individual' : 'organization'}
          programId={program.id}
          program={program}
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
          const instructorName = instructorApprovalTarget.name
          const notifyOptions = {
            notifyTiming: detail.notifyTiming,
            manualNotifyAt: detail.manualNotifyAt,
          }
          const applyLocalApproval = () => {
            setInstructorList(prev => {
              const next = prev.map(row => {
                if (row.id !== id) return row
                const approved = patchApplicantInstructorForApprovalStatus(
                  row,
                  'approved',
                  notifyOptions
                )
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
              if (updated && current && 'instructorName' in current && current.id === id) {
                setSelectedItem(updated)
              }
              return next
            })
          }
          const run = async () => {
            if (instructorRemoteEnabled) {
              const remoteAssignments = assignments.flatMap((assignment, index) => {
                const scheduleId = Number(assignment.slotKey)
                const organizationApplicationId = Number(assignment.schoolId)
                if (!Number.isFinite(scheduleId) || scheduleId < 1) return []
                return [
                  {
                    scheduleId,
                    ...(Number.isFinite(organizationApplicationId) &&
                    organizationApplicationId > 0
                      ? { organizationApplicationId }
                      : {}),
                    scheduleLead: index === 0,
                  },
                ]
              })
              const remote = await applyRemoteInstructorDecision(
                [id],
                'approve',
                undefined,
                {
                  assignments: remoteAssignments,
                  feePolicy: {
                    basisType: detail.lectureFeeBasisType,
                    measure: detail.lectureFeeMeasure?.trim() || 'SESSION',
                    amount: Number(detail.lectureFeeAmount?.replaceAll(',', '') ?? 0),
                    instructorFeeGrade:
                      detail.instructorFeeGradeLabel?.trim() ||
                      instructorApprovalInstructor?.instructorFeeGradeLabel?.trim() ||
                      '미지정',
                  },
                  notification: {
                    timing: detail.notifyTiming === 'manual' ? 'SCHEDULED' : 'IMMEDIATE',
                    scheduledAt:
                      detail.notifyTiming === 'manual'
                        ? detail.manualNotifyAt?.toISOString() ?? null
                        : null,
                  },
                }
              )
              if (remote === 'error') return
              if (remote === 'ok') {
                setInstructorApprovalTarget(null)
                applyLocalApproval()
                setInstructorApprovalComplete({
                  instructorName,
                  assignedInstitutionCount: countAssignedInstitutions(assignments),
                })
                return
              }
            }
            setInstructorApprovalTarget(null)
            applyLocalApproval()
            updateApplicantInstructorApprovalStatus(id, 'approved', notifyOptions)
            setInstructorApprovalComplete({
              instructorName,
              assignedInstitutionCount: countAssignedInstitutions(assignments),
            })
          }
          void run()
        }}
      />
      <InstructorApprovalCompleteModal
        open={instructorApprovalComplete != null}
        instructorName={instructorApprovalComplete?.instructorName ?? ''}
        assignedInstitutionCount={instructorApprovalComplete?.assignedInstitutionCount ?? 0}
        onClose={() => setInstructorApprovalComplete(null)}
      />
      {!selectedItem && menu ? (
        <>
          <FilterTableLayout
            key={
              menu === 'instructors' && instructorColumnPreset === 'general-detail'
                ? `applicant-filter-${viewMode}`
                : 'applicant-filter'
            }
            className={
              isIndividualDoc1Screening
                ? 'applicant-details__filter-table-layout general-participant-doc1-screening__filter-layout'
                : 'applicant-details__filter-table-layout'
            }
            bordered={false}
            contentVariant={displayViewMode === 'calendar' ? 'calendar' : 'table'}
            fields={isIndividualDoc1Screening ? undefined : fields}
            rows={individualDoc1FilterRows}
            filterResponsiveWrap={isIndividualDoc1Screening ? false : undefined}
            filters={pendingFilters}
            onFilterChange={handleFilterChange}
            onSearch={handleSearch}
            title={title}
            description={`${tableData.length}건`}
            actions={
              <div style={{ display: 'flex', gap: '8px' }}>
                <CmsButton
                  variant="delete"
                  size="large"
                  className="cms-button--action"
                  width={CMS_ACTION_BUTTON_WIDTH}
                  onClick={handleBulkRejectClick}
                >
                  선택 반려
                </CmsButton>
                <CmsButton
                  variant="secondary"
                  size="large"
                  className="cms-button--action"
                  width={CMS_ACTION_BUTTON_WIDTH}
                  onClick={handleBulkApproveClick}
                >
                  선택 승인
                </CmsButton>
                {showIndividualCalendarToggle && displayViewMode === 'table' && (
                  <CmsButton
                    icon={<CalendarOutlined />}
                    variant="secondary"
                    size="large"
                    onClick={handleViewCalendar}
                  >
                    캘린더 뷰로 보기
                  </CmsButton>
                )}
                {showIndividualCalendarToggle && displayViewMode === 'calendar' && (
                  <CmsButton
                    variant="secondary"
                    icon={<UnorderedListOutlined />}
                    size="large"
                    onClick={() => setViewMode('table')}
                  >
                    리스트 뷰로 보기
                  </CmsButton>
                )}
              </div>
            }
            excelExport={{
              columns,
              data: tableData,
            }}
          >
            {displayViewMode === 'table' ? (
              <div
                ref={usesInstitutionTableScroll ? institutionTableWrapRef : undefined}
                className="applicant-details__table-wrap"
              >
                <Table<ApplicantSchoolRow | ApplicantInstructorRow | GeneralIndividualApplicantRow>
                  rowKey="id"
                  columns={
                    columns as ColumnsType<
                      ApplicantSchoolRow | ApplicantInstructorRow | GeneralIndividualApplicantRow
                    >
                  }
                  dataSource={tableData}
                  loading={applicationsLoading}
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
                  scroll={
                    tableHorizontalScrollX != null ? { x: tableHorizontalScrollX } : undefined
                  }
                  pagination={false}
                  rowSelection={{
                    selectedRowKeys,
                    onChange: keys => setSelectedRowKeys(keys),
                  }}
                />
              </div>
            ) : (
              <div className="applicant-details__calendar-wrap">
                <ApplicantCalendarView
                  useSplitCardPageScroll={detailVariant === 'general'}
                  events={mapApplicantDataToCalendarEvents(
                    tableData as
                      | ApplicantSchoolRow[]
                      | ApplicantInstructorRow[]
                      | GeneralIndividualApplicantRow[],
                    menu
                  )}
                  loading={applicationsLoading}
                  selectedRowKeys={selectedRowKeys}
                  onSelectionChange={setSelectedRowKeys}
                  onItemClick={item => {
                    setSelectedItem(item)
                  }}
                  menu={menu}
                  showEntityFilter={showCalendarEntityFilter}
                  calendarGranularity={applicantsCalendarGranularity}
                  onCalendarGranularityChange={setApplicantsCalendarGranularity}
                  calendarVariant={
                    instructorColumnPreset === 'general-detail' && menu === 'instructors'
                      ? 'general-instructor'
                      : useGeneralInstitutionCalendarVariant
                        ? 'general-institution'
                        : menu === 'individual-applications' && !showCalendarEntityFilter
                          ? 'general-individual'
                          : 'default'
                  }
                />
              </div>
            )}
            <div
              ref={loadMoreRef}
              aria-hidden
              data-fetching={isFetchingNextPage || undefined}
              style={{ height: 1 }}
            />
          </FilterTableLayout>
          {isGeneralProgramCalendarView ? (
            <div className="applicant-details__calendar-page-bottom-spacer" aria-hidden />
          ) : null}
        </>
      ) : null}
    </div>
  )
}
