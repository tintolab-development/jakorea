import { INSTRUCTOR_ASSIGNMENT_STATUS_LABELS as ASSIGNMENT_STATUS_LABELS } from '@/features/program/general/lib/assignment-status-presentation'
import { ProgramAssignmentStatusText } from '@/features/program/shared/ui/program-assignment-status-text'
/**
 * 참여 강사 상세 풀페이지 인라인 뷰
 * 프로그램 진행 현황 > 참여 강사 — instructorId 쿼리 시 목록 대신 표시
 */

import { useState, useEffect, useMemo, useCallback, useRef, type Key } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { cacheProjectedProgramPrivacy } from '@/features/program/shared/lib/program-my-assignment'
import type { InstructorApplicationDetailResponse } from '@/shared/api/generated/dashboard/schemas/instructorApplicationDetailResponse'
import { retainMaskedInstructorApplicationSettlement } from '@/features/program/general/lib/instructor-application-basic-info-supplement'
import type { ColumnsType } from 'antd/es/table'
import type { Program } from '@/types/domain'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import type {
  ParticipatingInstructorRow,
  ParticipatingInstructorCareerDetail,
  ParticipatingInstructorEducationItem,
  ParticipatingInstructorQualification,
} from '@/features/program/general/model/participating-instructors'
import type { ParticipatingSchoolRow } from '@/features/program/general/model/participating-schools'
import {
  PARTICIPATING_INSTRUCTOR_ALREADY_ACTIVITY_WITHDRAWN_ALERT_MESSAGE,
  MESSAGES,
} from '@/shared/constants/messages'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { CmsButton, ExcelButton, useCmsAlert } from '@/shared/ui'
import { ProgramEditInfoActions } from '@/features/program/shared/ui/program-edit-info-actions'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { usePersonalInfoReveal } from '@/features/user/detail/lib/use-personal-info-reveal'
import { resolveSessionProgramRole } from '@/entities/program/lib/program-privacy-access'
import { PersonalInfoRevealButton } from '@/features/user/detail/ui/personal-info-reveal-button'
import { MemberAdminCommentModal } from '@/features/user/detail/ui/modal/member-admin-comment-modal'
import { formatCmsScheduleDisplayLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'
import { ScheduleLinesCell } from '@/features/program/shared/ui/schedule-lines-cell'
import { ProgramDetailTdDivider } from '@/features/program/shared/ui/program-detail-td-divider'
import { shouldUseOrganizationApplicationRemoteApi } from '@/features/program/general/api/applications-remote-capabilities'
import {
  unmaskInstructorApplicationPrivacyRemote,
  updateInstructorApplicationManagerCommentRemote,
} from '@/features/program/general/api/applications-api-client'
import { fetchMemberRolePrivacyUnmask } from '@/features/user/api/member-privacy-unmask'
import { mapInstructorApplicationDetailToParticipatingRow } from '@/features/program/general/lib/participating-instructor-application-detail'
import { giveUpGeneralParticipatingInstitution } from '@/features/program/general/api/admin-program-progress-service'
import { getGeneralProgramApiErrorMessage } from '@/features/program/general/api/get-general-program-api-error'
import {
  GENERAL_INSTRUCTOR_ASSIGNMENT_REQUIRES_RECRUITMENT_MESSAGE,
  programHasActiveInstructorRecruitment,
} from '@/features/program/general/lib/general-instructor-recruitment-required'
import {
  generalApplicationsQueryKeys,
  generalProgramProgressQueryKeys,
} from '@/features/program/general/api/general-applications-query-keys'
import {
  useIsCompanySchoolProgramsSurface,
  useProgramProgressRemoteEnabledForSurface,
} from '@/features/program/1c-1s/lib/use-company-school-surface-remote'
import { isCompanySchoolProgram } from '@/features/program/1c-1s/lib/is-company-school-program'
import { resolveCompanySchoolAssignSessionRoundLabel } from '@/features/program/1c-1s/lib/assigned-schedule-line'
import { useParticipatingInstructorApplicationDetailEnrichment } from '@/features/program/general/hooks/use-application-form-detail-enrichment'
import {
  buildProgramApiUnavailableSaveContent,
  notifyProgramApiUnavailable,
  PROGRAM_API_UNAVAILABLE_TITLE,
} from '@/features/program/shared/lib/program-api-unavailable'
import {
  INSTRUCTOR_ROLE_LABELS,
  type InstructorRoleKey,
} from '@/features/program/general/model/school-detail-types'
import { StatusDropdownCell, STATUS_DROPDOWN_CELL_CLASSNAME } from '@/shared/components'
import { getInstructorRoleTag } from '@/shared/lib/status-tag-specs'
import {
  type InstructorAssignedSchoolRow,
  type InstructorWaitingSchoolRow,
  type InstructorWaitingAssignmentStatus,
} from '@/features/program/general/lib/instructor-institution-assignment'
import { useParticipatingInstructorInstitutionAssignment } from '@/features/program/general/hooks/use-participating-instructor-institution-assignment'
import { mergeInstitutionWaitingRowsBySchool } from '@/features/program/general/lib/build-participating-instructor-assignment-rows'
import { waitingAssignmentStatusLabel } from '@/features/program/general/lib/instructor-assignment-availability'
import {
  cancelInstructorAssignmentRemote,
  createInstructorAssignmentRemote,
  putRepresentativeInstructorRemote,
} from '@/features/program/general/api/instructor-assignments-api-client'
import { toInstructorAssignmentCancelRequest } from '@/features/program/general/lib/instructor-cancel-fault-party'
import {
  INSTRUCTOR_ASSIGNMENT_CANCEL_CONFLICT_MESSAGE,
  INSTRUCTOR_UNASSIGN_NOTIFICATION_ALREADY_SENT_MESSAGE,
  isInstructorAssignmentConflictError,
  isInstructorAssignmentNotificationSent,
  isInstructorUnassignReasonRequiredError,
  resolveInstructorUnassignNotificationSent,
  toInstructorUnassignCancelBody,
} from '@/features/program/general/lib/instructor-assignment-notification'
import { formatInstructorOrganizationScheduleScopeMessage } from '@/features/program/shared/lib/instructor-organization-schedule-scope'
import { mapParticipatingSessionsToInstructorAssignOptions } from '@/features/program/general/lib/instructor-assign-session-options'
import {
  hasAssignableOrganizationInstructorSchedule,
  resolveAssignableSchedulePayloadFromSession,
} from '@/features/program/general/lib/organization-instructor-assignable-schedule'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import {
  PARTICIPATING_INSTITUTIONS_SESSIONS_COLUMN_WIDTH,
  participatingScheduleTableColumnLayout,
} from '@/features/program/general/lib/participating-institutions-table'
import { SchoolDetailUnassignCompleteModal } from './school-detail-unassign-complete-modal'
import { SchoolDetailUnassignConfirmModal } from './school-detail-unassign-confirm-modal'
import { InstitutionUnassignConfirmModal } from './institution-unassign-confirm-modal'
import {
  ASSIGNED_INSTITUTIONS_EMPTY_COPY,
  AssignmentListEmpty,
  WAITING_INSTITUTIONS_EMPTY_COPY,
} from './assignment-list-empty'
import { AssignGuideModal } from './assign-guide-modal'
import type { PermissionModalPayload } from '@/shared/components/permission-modal'
import { toScheduledOnlyNotifyTiming } from '@/features/program/general/lib/application-decision-notify-timing'
import {
  INSTITUTION_SELECT_ASSIGN_DEFAULT_NOTIFY_PAYLOAD,
  countAssignedInstructorsForOrganization,
  formatAssignedInstructorCountLine,
  resolveRequiredAssignableInstructorCount,
} from '@/features/program/general/lib/institution-select-assign'
import { InstitutionSelectAssignConfirmModal } from './institution-select-assign-confirm-modal'
import { InstitutionAssignCompleteModal } from './institution-assign-complete-modal'
import {
  CertificateBulkIssueReasonModal,
  type CertificateIssueReasonValue,
} from '@/features/user/detail/ui/modal/certificate-bulk-issue-reason-modal'
import { ACTIVITY_CERTIFICATE_DOCUMENT_TITLE } from '@/features/program/general/lib/build-activity-certificate-issuance-preview'
import { ParticipatingInstructorApplicationInfo } from './participating-instructor-application-info'
import { useParticipatingInstructorDetailEdit } from '@/features/program/general/hooks/use-participating-instructor-detail-edit'
import { getParticipatingInstructorActivityWithdrawScheduleOptions } from '@/features/program/general/lib/participating-instructor-activity-withdraw'
import {
  ParticipatingInstructorActivityWithdrawModal,
  type ParticipatingInstructorActivityWithdrawModalPayload,
} from './participating-instructor-activity-withdraw-modal'
import { ParticipatingInstructorLectureReportsSection } from './participating-instructor-lecture-reports-section'
import { ParticipatingIndividualInstructorLectureReportsSection } from './participating-individual-instructor-lecture-reports-section'
import { ParticipatingInstructorSettlementSection } from './participating-instructor-settlement-section'
import { ParticipatingIndividualInstructorSettlementSection } from './participating-individual-instructor-settlement-section'
import { ParticipatingIndividualInstructorAssignmentSection } from './participating-individual-instructor-assignment-section'
import { isGeneralIndividualProgram } from '@/features/program/general/lib/survey-audience'
import { ActivityCertificateIssuancePreviewModal } from './activity-certificate-issuance-preview-modal'
import { ButtonDownloadIcon } from '@/shared/ui/icons/ButtonIcons'
import './participating-institutions-section.css'
import './school-detail-fullpage-view.css'
import './participating-instructor-fullpage-view.css'
import { NO_SELECTION_ALERT } from '@/shared/constants/no-selection-alert'

function sessionOptionId(session: ParticipatingSchoolSession): string {
  return `session-${session.round}-${session.date}-${session.timeRange}`
}

function listAssignableSessionsForWaitingRow(
  waitingRow: InstructorWaitingSchoolRow,
  selectedSessionKeys: ReadonlySet<string>,
  isSessionBlocked: (session: ParticipatingSchoolSession) => boolean = () => false
): ParticipatingSchoolSession[] {
  const sessions = waitingRow.sessions ?? []
  const assignable = sessions.filter(
    session =>
      resolveAssignableSchedulePayloadFromSession(session) != null && !isSessionBlocked(session)
  )
  if (assignable.length === 0) return []
  if (selectedSessionKeys.size > 0) {
    return assignable.filter(session => selectedSessionKeys.has(sessionOptionId(session)))
  }
  if (assignable.length === 1) return assignable
  return []
}

function renderEducationScheduleLines(lines: string[]) {
  return <ScheduleLinesCell lines={lines.map(line => formatCmsScheduleDisplayLabel(line))} />
}

function renderWaitingTableEmpty() {
  return (
    <div className="participating-instructor-fullpage-view__waiting-table-empty" role="status">
      배정 대기 중인 기관이 없습니다.
    </div>
  )
}

/** 진행 현황 잔여 mutation — `docs/api/general-program-progress-remaining-backend-request-2026-10-02.md`
 * institutionAssignment: list/create/cancel/representative 연동. 대표→일반은 BE H.
 * lectureReports: GET + file download.
 * 신청 정보 저장·강사 등록은 BE F·G. */
export const INSTRUCTOR_DETAIL_TAB_KEYS = [
  'application',
  'institutionAssignment',
  'lectureReports',
  'settlement',
] as const
export type InstructorDetailTabKey = (typeof INSTRUCTOR_DETAIL_TAB_KEYS)[number]

/** 이전 URL 호환 — 게시글 탭 → 강의보고서 관리 */
export function normalizeInstructorDetailTab(
  tab: string | null | undefined
): InstructorDetailTabKey {
  if (tab === 'posts') return 'lectureReports'
  if (tab && (INSTRUCTOR_DETAIL_TAB_KEYS as readonly string[]).includes(tab)) {
    return tab as InstructorDetailTabKey
  }
  return 'application'
}

const TAB_LABELS: Record<InstructorDetailTabKey, string> = {
  application: '신청 정보',
  institutionAssignment: '교육 배정 현황',
  lectureReports: '강의보고서 관리',
  settlement: '정산 현황',
}

const NO_DATA = '-'

function getEducationLevelBadge(educationLevel?: string, schoolType?: string): string {
  const raw = schoolType ?? educationLevel ?? ''
  const map: Record<string, string> = {
    '4년제 졸업': '대학교 4년제',
    '2년제 졸업': '대학교 2년제',
    '고등학교 졸업': '고등학교',
    '4년제 휴학': '대학교 4년제',
    '4년제 중퇴': '대학교 4년제',
    대학원: '대학원',
    '대학 4년제': '대학교 4년제',
    '대학 2・3년제': '대학교 2·3년제',
    고등학교: '고등학교',
    중학교: '중학교',
  }
  return map[raw] || raw || '-'
}

function formatEducationPeriod(item: ParticipatingInstructorEducationItem): string {
  const start = item.enrollmentYear
  const end = item.graduationYear
  if (!start) return '-'
  if (!end) return start
  return `${start} - ${end}`
}

function formatCareerPeriod(item: ParticipatingInstructorCareerDetail): string {
  const start = item.startDate
  if (!start) return '-'
  if (item.isCurrent) return `${start} ~ 재직중`
  const end = item.endDate
  if (!end) return start
  return `${start} ~ ${end}`
}

function getTotalCareerYears(items: ParticipatingInstructorCareerDetail[] | undefined): number {
  if (!items?.length) return 0
  const today = new Date()
  let totalMonths = 0
  for (const item of items) {
    const start = item.startDate
    if (!start) continue
    const [y1, m1] = start.split('.').map(Number)
    const end = item.isCurrent
      ? { year: today.getFullYear(), month: today.getMonth() + 1 }
      : item.endDate
        ? (() => {
            const [y2, m2] = item.endDate!.split('.').map(Number)
            return { year: y2, month: m2 }
          })()
        : null
    if (!end) continue
    totalMonths += (end.year - y1) * 12 + (end.month - m1)
  }
  return Math.floor(totalMonths / 12)
}

export interface ParticipatingInstructorFullpageViewProps {
  program: Program
  instructor: ParticipatingInstructorRow
  activeTab?: InstructorDetailTabKey
  onTabChange?: (key: InstructorDetailTabKey) => void
  onClearInstructorId: () => void
  /** 기관 배정 탭 — 참여 학교 목록 (기본: 목 데이터) */
  schoolRows?: ParticipatingSchoolRow[]
  /** 기관 배정 탭 — 강사 배정 인원 n/m 계산용 (기본: 목 데이터) */
  instructorList?: ParticipatingInstructorRow[]
}

export function ParticipatingInstructorFullpageView({
  program,
  instructor: d,
  activeTab: activeTabFromUrl,
  onTabChange,
  onClearInstructorId: _onClearInstructorId,
  schoolRows = [],
  instructorList = [],
}: ParticipatingInstructorFullpageViewProps) {
  /**
   * URL(`instructorTab`)이 source of truth이지만, setSearchParams 반영 전·props 지연 시
   * 탭 UI/본문이 안 바뀌는 문제가 있어 로컬 탭을 먼저 갱신한 뒤 URL과 동기화한다.
   */
  const [uiTab, setUiTab] = useState<InstructorDetailTabKey>(
    () => activeTabFromUrl ?? 'application'
  )
  const [assignedSchools, setAssignedSchools] = useState<InstructorAssignedSchoolRow[]>([])
  const [waitingSchools, setWaitingSchools] = useState<InstructorWaitingSchoolRow[]>([])
  const [selectedAssignedSchoolKeys, setSelectedAssignedSchoolKeys] = useState<Key[]>([])
  const [selectedWaitingSchoolKeys, setSelectedWaitingSchoolKeys] = useState<Key[]>([])
  const [openRoleDropdownId, setOpenRoleDropdownId] = useState<string | null>(null)
  const [unassignConfirmOpen, setUnassignConfirmOpen] = useState(false)
  const [unassignCompleteModal, setUnassignCompleteModal] = useState<{
    instructorNames: string[]
    targetNames: string[]
    reason: string
  } | null>(null)
  const [assignGuideMode, setAssignGuideMode] = useState<'select' | 'add' | null>(null)
  const [assignGuideSchoolId, setAssignGuideSchoolId] = useState<string | null>(null)
  const [assignGuideRole, setAssignGuideRole] = useState<InstructorRoleKey>('assistant')
  const [assignGuideSessionIds, setAssignGuideSessionIds] = useState<string[]>([])
  const [assignGuideSubmitting, setAssignGuideSubmitting] = useState(false)
  const assignGuideInFlightRef = useRef(false)
  const [activityCertPreviewOpen, setActivityCertPreviewOpen] = useState(false)
  /** 기관형 — 활동인증서 발급 사유(Figma 06-1/02) */
  const [activityCertReasonOpen, setActivityCertReasonOpen] = useState(false)
  const [activityCertReasonLabel, setActivityCertReasonLabel] = useState<string | undefined>()
  /**
   * 기관형 [선택 배정] — Figma 04-1/05-1 확인 → 선택 기관 전부 배정 → 04-2/05-2 완료.
   * 1사1교는 기존 `AssignGuideModal(select)` 흐름 유지.
   */
  const [bulkSelectAssign, setBulkSelectAssign] = useState<{
    step: 'confirm' | 'submitting' | 'complete'
    institutionName: string
    extraTargetCount: number
    currentCount: number | null
    waitingRowIds: string[]
  } | null>(null)
  const [savedAdminComment, setSavedAdminComment] = useState('')
  const [adminCommentModalOpen, setAdminCommentModalOpen] = useState(false)
  const [adminCommentDraft, setAdminCommentDraft] = useState('')
  const [adminCommentError, setAdminCommentError] = useState<string | undefined>()
  const [instructorPatches, setInstructorPatches] = useState<Partial<ParticipatingInstructorRow>>(
    {}
  )
  const [activityWithdrawModalOpen, setActivityWithdrawModalOpen] = useState(false)
  const [activityWithdrawSubmitting, setActivityWithdrawSubmitting] = useState(false)
  const { showAlert } = useCmsAlert()
  const queryClient = useQueryClient()
  const isCompanySchoolSurface = useIsCompanySchoolProgramsSurface()
  const progressRemoteEnabled = useProgramProgressRemoteEnabledForSurface(program.id)

  const enrichedInstructor = useParticipatingInstructorApplicationDetailEnrichment(d, program.id)
  const baseInstructor = enrichedInstructor ?? d
  const instructorApplicationId = baseInstructor.instructorApplicationId
  const hasInstructorApplicationId =
    instructorApplicationId != null && instructorApplicationId.trim() !== ''

  const mergedInstructor = useMemo(
    () => ({ ...baseInstructor, ...instructorPatches }),
    [baseInstructor, instructorPatches]
  )

  const isIndividualProgram = isGeneralIndividualProgram(program)
  const isCompanySchool = isCompanySchoolSurface || isCompanySchoolProgram(program)
  /** 일반 프로그램 기관형(개인형·1사1교 제외) — Figma 기관형 전용 흐름 분기 */
  const isInstitutionProgram = !isIndividualProgram && !isCompanySchool

  const isActivityWithdrawn = mergedInstructor.activityWithdrawn === true

  const activityWithdrawScheduleOptions = useMemo(
    () =>
      getParticipatingInstructorActivityWithdrawScheduleOptions(
        mergedInstructor.educationSchedules ?? []
      ),
    [mergedInstructor.educationSchedules]
  )

  const applicationInfoEdit = useParticipatingInstructorDetailEdit({
    instructor: mergedInstructor,
    programId: program.id,
    onSaved: updatedRow => {
      setInstructorPatches(prev => ({
        ...prev,
        lectureFeeBasisType: updatedRow.lectureFeeBasisType,
        lectureFeeMeasure: updatedRow.lectureFeeMeasure,
        lectureFeeAmount: updatedRow.lectureFeeAmount,
        lectureFeeBasisDisplay: updatedRow.lectureFeeBasisDisplay,
        lectureFeeCategory: updatedRow.lectureFeeCategory,
        instructorFeeGradeLabel: updatedRow.instructorFeeGradeLabel,
        businessIncomeEarnerStatus: updatedRow.businessIncomeEarnerStatus,
      }))
    },
  })

  const resolveParticipatingInstructorFullpageAccessItem = useCallback(
    () => d.instructorName ?? '참여 강사 상세 정보',
    [d.instructorName]
  )

  const revealParticipatingInstructorPersonalInfo = useCallback(
    async (reason: string) => {
      const applicationId = instructorApplicationId?.trim()
      if (applicationId) {
        const programIdNumber = Number(program.id)
        const dto = await unmaskInstructorApplicationPrivacyRemote(
          applicationId,
          reason,
          Number.isFinite(programIdNumber) ? programIdNumber : undefined
        )
        const detailKey = generalApplicationsQueryKeys.instructorDetail(applicationId)
        const previousDetail =
          queryClient.getQueryData<InstructorApplicationDetailResponse>(detailKey)
        const safeDto = retainMaskedInstructorApplicationSettlement(
          cacheProjectedProgramPrivacy(queryClient, detailKey, program.id, dto),
          previousDetail
        )
        queryClient.setQueryData(detailKey, safeDto)
        const mapped = mapInstructorApplicationDetailToParticipatingRow(
          safeDto,
          mergedInstructor,
          program.id
        )
        setInstructorPatches(prev => ({
          ...prev,
          instructorName: mapped.instructorName,
          contact: mapped.contact,
          email: mapped.email,
          address: mapped.address,
          nameHanja: mapped.nameHanja,
          nameEnglish: mapped.nameEnglish,
          birthDate: mapped.birthDate,
          gender: mapped.gender,
          bankName: mapped.bankName,
          accountNumber: mapped.accountNumber,
          accountHolder: mapped.accountHolder,
        }))
        return {
          name: safeDto.instructorName?.trim() || undefined,
          phone: safeDto.contact?.trim() || undefined,
          email: safeDto.email?.trim() || undefined,
          address:
            [safeDto.homeAddress, safeDto.homeAddressDetail]
              .map(part => part?.trim())
              .filter(Boolean)
              .join(' ') || undefined,
        }
      }

      const memberId = Number(mergedInstructor.memberId)
      if (!Number.isFinite(memberId) || memberId <= 0) {
        throw new Error('강사 신청 ID 또는 회원 ID가 없습니다.')
      }
      return fetchMemberRolePrivacyUnmask(memberId, reason, 'INSTRUCTOR')
    },
    [instructorApplicationId, mergedInstructor, program.id, queryClient]
  )

  const applyParticipatingInstructorPersonalInfo = useCallback((payload: unknown) => {
    if (payload == null || typeof payload !== 'object') return
    const privacy = payload as {
      name?: unknown
      phone?: unknown
      email?: unknown
      address?: unknown
    }
    setInstructorPatches(prev => ({
      ...prev,
      ...(typeof privacy.name === 'string' ? { instructorName: privacy.name } : {}),
      ...(typeof privacy.phone === 'string' ? { contact: privacy.phone } : {}),
      ...(typeof privacy.email === 'string' ? { email: privacy.email } : {}),
      ...(typeof privacy.address === 'string' ? { address: privacy.address } : {}),
    }))
  }, [])

  const {
    personalInfoRevealed,
    onPrivacyControlClick: handlePrivacyToggleClick,
    confirmModal: personalInfoRevealModal,
  programPrivacyPending,
  } = usePersonalInfoReveal({
    privacyScope: 'program',
    programId: program.id,
    resolveProgramRole: () => resolveSessionProgramRole(program.id),
    resolveAccessItem: resolveParticipatingInstructorFullpageAccessItem,
    revealPersonalInfo: revealParticipatingInstructorPersonalInfo,
    onPrivacyUnmasked: applyParticipatingInstructorPersonalInfo,
    resetDeps: [d.id, instructorApplicationId, mergedInstructor.memberId],
    controlMode: 'toggleRemask',
  })

  useEffect(() => {
    setUiTab(activeTabFromUrl ?? 'application')
  }, [d.id, activeTabFromUrl])

  const effectiveTab = uiTab
  const setActiveTab = useCallback(
    (key: InstructorDetailTabKey) => {
      setUiTab(key)
      onTabChange?.(key)
    },
    [onTabChange]
  )

  const institutionAssignment = useParticipatingInstructorInstitutionAssignment({
    programId: program.id,
    instructor: mergedInstructor,
    schoolRows,
    instructorList,
    isCompanySchool,
    enabled: uiTab === 'institutionAssignment',

    maxAssignableInstructors: resolveRequiredAssignableInstructorCount(program),
  })

  /**
   * 400 VALIDATION_FAILED(발송 전으로 보고 `{}` 취소했으나 서버는 발송 후) 배정 id — 화면에서 「발송 후」로 고정.
   */
  const [forcedSentAssignmentIds, setForcedSentAssignmentIds] = useState<ReadonlySet<string>>(
    () => new Set()
  )
  /**
   * 기관형 배정 알림 발송 여부(BE 항목 1-A) — 배정 목록 `assignmentNotificationStatus`.
   * SENT → 「발송 후」(06-2: 사유·알림), NONE·SCHEDULED·CANCELLED → 「발송 전」(06-1: 안내만).
   * 필드 없는 구버전 응답·1사1교·개인형은 undefined(기존 동작).
   */
  const assignmentNotificationSentById = useMemo(() => {
    const map = new Map<string, boolean | undefined>()
    if (!isInstitutionProgram) return map
    for (const item of institutionAssignment.assignments) {
      if (item.assignmentId == null) continue
      const id = String(item.assignmentId)
      map.set(
        id,
        forcedSentAssignmentIds.has(id)
          ? true
          : isInstructorAssignmentNotificationSent(item.assignmentNotificationStatus)
      )
    }
    return map
  }, [forcedSentAssignmentIds, institutionAssignment.assignments, isInstitutionProgram])

  useEffect(() => {
    setAssignedSchools(institutionAssignment.assignedSchools)
    setWaitingSchools(institutionAssignment.waitingSchools)
    setSelectedAssignedSchoolKeys([])
    setSelectedWaitingSchoolKeys([])
    setOpenRoleDropdownId(null)
    setAssignGuideMode(null)
    setAssignGuideSchoolId(null)
    setAssignGuideRole('assistant')
    setAssignGuideSessionIds([])
  }, [d.id, institutionAssignment.assignedSchools, institutionAssignment.waitingSchools])

  useEffect(() => {
    setSavedAdminComment(baseInstructor.adminComment ?? '')
    setAdminCommentModalOpen(false)
    setAdminCommentDraft('')
    setAdminCommentError(undefined)
    setInstructorPatches({})
    setActivityWithdrawModalOpen(false)
  }, [d.id, baseInstructor.adminComment])

  const handleRoleChange = useCallback(
    async (schoolId: string, newRole: InstructorRoleKey) => {
      setOpenRoleDropdownId(null)
      if (newRole !== 'lead') {
        if (!institutionAssignment.remoteEnabled) {
          notifyProgramApiUnavailable(
            'general-participating-instructor-role-demote',
            '참여 강사 · 일반 강사 변경'
          )
          return
        }
      } else if (!institutionAssignment.remoteEnabled) {
        notifyProgramApiUnavailable(
          'general-participating-instructor-role-change',
          '참여 강사 · 대표 강사 변경'
        )
        return
      }
      const target = assignedSchools.find(row => row.id === schoolId)
      const memberId = Number(target?.instructorMemberId ?? mergedInstructor.memberId)
      const orgAppId = Number(target?.organizationApplicationId)
      const scheduleId = Number(target?.scheduleId)
      if (
        !Number.isFinite(memberId) ||
        memberId <= 0 ||
        !Number.isFinite(orgAppId) ||
        orgAppId <= 0
      ) {
        showAlert({
          title: '안내',
          content:
            '대표 강사 변경에 필요한 instructorMemberId / organizationApplicationId가 없습니다.',
        })
        return
      }
      const isDemote = newRole !== 'lead'
      try {
        await putRepresentativeInstructorRemote(program.id, {
          instructorMemberId: memberId,
          organizationApplicationId: orgAppId,
          ...(Number.isFinite(scheduleId) && scheduleId > 0 ? { scheduleId } : {}),
          ...(isDemote ? { scheduleLead: false } : {}),
        })
        await institutionAssignment.invalidate()
      } catch (error) {
        showAlert({
          title: isDemote ? '일반 강사 변경 실패' : '대표 강사 변경 실패',
          content: getGeneralProgramApiErrorMessage(
            error,
            isDemote
              ? '일반 강사 변경에 실패했습니다. 잠시 후 다시 시도해 주세요.'
              : '대표 강사 지정에 실패했습니다. 잠시 후 다시 시도해 주세요.'
          ),
        })
      }
    },
    [assignedSchools, institutionAssignment, mergedInstructor.memberId, program.id, showAlert]
  )

  const assignedSchoolColumns: ColumnsType<InstructorAssignedSchoolRow> = useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: 80, align: 'center' },
      {
        title: '역할',
        dataIndex: 'role',
        key: 'role',
        width: 116,
        align: 'center',
        onCell: () => ({ className: STATUS_DROPDOWN_CELL_CLASSNAME }),
        render: (role: InstructorRoleKey, record: InstructorAssignedSchoolRow) => (
          <StatusDropdownCell<InstructorRoleKey>
            status={role}
            statusOptions={['lead', 'assistant']}
            getTag={getInstructorRoleTag}
            isItemDisabled={(cur, opt) => cur === opt}
            onChange={key => handleRoleChange(record.id, key as InstructorRoleKey)}
            isOpen={openRoleDropdownId === record.id}
            onOpenChange={open => setOpenRoleDropdownId(open ? record.id : null)}
            emptyPlaceholder="-"
          />
        ),
      },
      { title: '기관명', dataIndex: 'schoolName', key: 'schoolName', width: 140 },
      {
        title: '교육 학년',
        dataIndex: 'educationGrade',
        key: 'educationGrade',
        width: 96,
        align: 'center',
      },
      { title: '기관 소재지', dataIndex: 'region', key: 'region', width: 200 },
      {
        title: '자택과의 거리',
        dataIndex: 'distanceFromHome',
        key: 'distanceFromHome',
        width: 110,
        align: 'center',
      },
      {
        title: '담당 교육 진행 일정',
        key: 'educationScheduleLines',
        width: PARTICIPATING_INSTITUTIONS_SESSIONS_COLUMN_WIDTH,
        minWidth: PARTICIPATING_INSTITUTIONS_SESSIONS_COLUMN_WIDTH,
        ...participatingScheduleTableColumnLayout(),
        render: (_: unknown, record: InstructorAssignedSchoolRow) =>
          renderEducationScheduleLines(record.educationScheduleLines),
      },
    ],
    [openRoleDropdownId, handleRoleChange]
  )

  const assignedSchoolExportColumns: ColumnsType<{
    no: number
    role: string
    schoolName: string
    educationGrade: string
    region: string
    distanceFromHome: string
    educationSchedule: string
  }> = useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no' },
      { title: '역할', dataIndex: 'role', key: 'role' },
      { title: '기관명', dataIndex: 'schoolName', key: 'schoolName' },
      { title: '교육 학년', dataIndex: 'educationGrade', key: 'educationGrade' },
      { title: '기관 소재지', dataIndex: 'region', key: 'region' },
      { title: '자택과의 거리', dataIndex: 'distanceFromHome', key: 'distanceFromHome' },
      { title: '담당 교육 진행 일정', dataIndex: 'educationSchedule', key: 'educationSchedule' },
    ],
    []
  )

  const waitingSchoolExportColumns: ColumnsType<{
    no: number
    schoolName: string
    desiredGrade: string
    region: string
    distanceFromHome: string
    educationSchedule: string
    assignmentStatus: string
    assignedInstructorCountLabel: string
  }> = useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no' },
      { title: '기관명', dataIndex: 'schoolName', key: 'schoolName' },
      { title: '희망 학년', dataIndex: 'desiredGrade', key: 'desiredGrade' },
      { title: '기관 소재지', dataIndex: 'region', key: 'region' },
      { title: '자택과의 거리', dataIndex: 'distanceFromHome', key: 'distanceFromHome' },
      { title: '교육 진행 희망 일정', dataIndex: 'educationSchedule', key: 'educationSchedule' },
      { title: '배정 현황', dataIndex: 'assignmentStatus', key: 'assignmentStatus' },
      {
        title: '배정 강사 수',
        dataIndex: 'assignedInstructorCountLabel',
        key: 'assignedInstructorCountLabel',
      },
    ],
    []
  )

  const assignedSchoolExportRows = useMemo(
    () =>
      assignedSchools.map(row => ({
        id: row.id,
        no: row.no,
        role: INSTRUCTOR_ROLE_LABELS[row.role],
        schoolName: row.schoolName,
        educationGrade: row.educationGrade,
        region: row.region,
        distanceFromHome: row.distanceFromHome,
        educationSchedule: row.educationScheduleLines.join('\n'),
      })),
    [assignedSchools]
  )

  const waitingSchoolExportRows = useMemo(
    () =>
      waitingSchools.map(row => ({
        id: row.id,
        no: row.no,
        schoolName: row.schoolName,
        desiredGrade: row.desiredGrade,
        region: row.region,
        distanceFromHome: row.distanceFromHome,
        educationSchedule: row.educationScheduleLines.join('\n'),
        assignmentStatus: waitingAssignmentStatusLabel(
          row.assignmentStatus,
          ASSIGNMENT_STATUS_LABELS,
          row.assignmentStatusLabel
        ),
        assignedInstructorCountLabel: row.assignedInstructorCountLabel,
      })),
    [waitingSchools]
  )

  const { exportExcel: exportAssignedSchoolsExcel, isExporting: isAssignedSchoolsExcelExporting } =
    useTableExcelExport({
      accessLog: { downloadKind: 'PROGRAM_PERSON_ASSIGNMENT_EXPORT', containedPiiTypes: [] },
      columns: assignedSchoolExportColumns,
      data: assignedSchoolExportRows,
      filename: '배정된 기관 목록',
      selectedRowKeys: selectedAssignedSchoolKeys,
    })

  const { exportExcel: exportWaitingSchoolsExcel, isExporting: isWaitingSchoolsExcelExporting } =
    useTableExcelExport({
      accessLog: { downloadKind: 'PROGRAM_PERSON_ASSIGNMENT_EXPORT', containedPiiTypes: [] },
      columns: waitingSchoolExportColumns,
      data: waitingSchoolExportRows,
      filename: '배정 대기 기관 목록',
      selectedRowKeys: selectedWaitingSchoolKeys,
    })

  const waitingSchoolColumns: ColumnsType<InstructorWaitingSchoolRow> = useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: 80, align: 'center' },
      { title: '기관명', dataIndex: 'schoolName', key: 'schoolName', width: 140 },
      {
        title: '희망 학년',
        dataIndex: 'desiredGrade',
        key: 'desiredGrade',
        width: 96,
        align: 'center',
      },
      { title: '기관 소재지', dataIndex: 'region', key: 'region', width: 200 },
      {
        title: '자택과의 거리',
        dataIndex: 'distanceFromHome',
        key: 'distanceFromHome',
        width: 110,
        align: 'center',
      },
      {
        title: '교육 진행 희망 일정',
        key: 'educationScheduleLines',
        width: PARTICIPATING_INSTITUTIONS_SESSIONS_COLUMN_WIDTH,
        minWidth: PARTICIPATING_INSTITUTIONS_SESSIONS_COLUMN_WIDTH,
        ...participatingScheduleTableColumnLayout(),
        render: (_: unknown, record: InstructorWaitingSchoolRow) =>
          renderEducationScheduleLines(record.educationScheduleLines),
      },
      {
        title: '배정 현황',
        dataIndex: 'assignmentStatus',
        key: 'assignmentStatus',
        width: 120,
        align: 'center',
        render: (_status: InstructorWaitingAssignmentStatus, record: InstructorWaitingSchoolRow) => (
          <ProgramAssignmentStatusText status={record.assignmentStatus} context="instructor-institution" assignmentStatusLabel={record.assignmentStatusLabel} />
        ),
      },
      {
        title: '배정 강사 수',
        dataIndex: 'assignedInstructorCountLabel',
        key: 'assignedInstructorCountLabel',
        width: 100,
        align: 'center',
      },
    ],
    []
  )

  const handleUnassignClick = useCallback(() => {
    if (selectedAssignedSchoolKeys.length === 0) {
      showAlert(NO_SELECTION_ALERT)
      return
    }
    setUnassignConfirmOpen(true)
  }, [selectedAssignedSchoolKeys.length, showAlert])

  const handleSelectAssignClick = useCallback(() => {
    if (selectedWaitingSchoolKeys.length === 0) {
      showAlert(NO_SELECTION_ALERT)
      return
    }
    const movable = waitingSchools.some(
      w => selectedWaitingSchoolKeys.includes(w.id) && w.assignmentStatus === 'waiting'
    )
    if (!movable) {
      return
    }
    if (isInstitutionProgram) {
      const targetRows = waitingSchools.filter(
        w => selectedWaitingSchoolKeys.includes(w.id) && w.assignmentStatus === 'waiting'
      )
      const targetSchools = mergeInstitutionWaitingRowsBySchool(targetRows)
      const first = targetSchools[0]
      if (!first) return
      setBulkSelectAssign({
        step: 'confirm',
        institutionName: first.schoolName,
        extraTargetCount: Math.max(0, targetSchools.length - 1),
        currentCount: countAssignedInstructorsForOrganization({
          assignments: institutionAssignment.assignments,
          boardLoaded: institutionAssignment.boardLoaded,
          organizationApplicationId: first.organizationApplicationId,
          organizationName: first.schoolName,
        }),
        waitingRowIds: targetRows.map(row => row.id),
      })
      return
    }
    const firstSelected = waitingSchools.find(
      w => selectedWaitingSchoolKeys.includes(w.id) && w.assignmentStatus === 'waiting'
    )
    setAssignGuideMode('select')
    setAssignGuideSchoolId(firstSelected?.schoolId ?? firstSelected?.id ?? null)
    setAssignGuideRole(assignedSchools.some(row => row.role === 'lead') ? 'assistant' : 'lead')
    setAssignGuideSessionIds([])
  }, [
    selectedWaitingSchoolKeys,
    waitingSchools,
    assignedSchools,
    showAlert,
    isInstitutionProgram,
    institutionAssignment.assignments,
    institutionAssignment.boardLoaded,
  ])

  const handleUnassignConfirm = useCallback(
    async (payload: PermissionModalPayload) => {
      if (selectedAssignedSchoolKeys.length === 0) return
      // 기관형(Figma 06-1·06-2)은 취소 귀책을 받지 않는다(API 선택값 — 생략 시 서버 ADMIN)
      if (
        !isInstitutionProgram &&
        payload.faultParty !== 'USER' &&
        payload.faultParty !== 'ADMIN'
      ) {
        return
      }
      const selectedRows = assignedSchools.filter(r => selectedAssignedSchoolKeys.includes(r.id))
      const removedSchoolNames = selectedRows.map(r => r.schoolName)
      // 기관형: 배정마다 발송 전이면 `{}`, 발송 후(·미상)면 사유·알림 시점(BE 항목 1-A)
      const cancelBody = isInstitutionProgram
        ? undefined
        : toInstructorAssignmentCancelRequest({
            reason: payload.reason,
            notifyTiming: payload.notifyTiming,
            manualNotifyAt: payload.manualNotifyAt,
            faultParty: payload.faultParty as 'USER' | 'ADMIN',
          })

      if (institutionAssignment.remoteEnabled) {
        let cancelledCount = 0
        let pendingAssignmentId: string | null = null
        let pendingBodyWasEmpty = false
        try {
          for (const row of selectedRows) {
            const ids =
              row.assignmentIds && row.assignmentIds.length > 0
                ? row.assignmentIds
                : row.assignmentId
                  ? [row.assignmentId]
                  : []
            for (const assignmentId of ids) {
              const rowBody =
                cancelBody ??
                toInstructorUnassignCancelBody(
                  payload,
                  assignmentNotificationSentById.get(String(assignmentId))
                )
              pendingAssignmentId = String(assignmentId)
              pendingBodyWasEmpty = Object.keys(rowBody).length === 0
              await cancelInstructorAssignmentRemote(assignmentId, rowBody)
              cancelledCount += 1
            }
          }
          await institutionAssignment.invalidate()
          setUnassignConfirmOpen(false)
          setSelectedAssignedSchoolKeys([])
          if (isInstitutionProgram) {
            showAlert({ title: '취소 완료', content: '취소되었습니다.' })
          } else {
            setUnassignCompleteModal({
              instructorNames: [mergedInstructor.instructorName],
              targetNames: removedSchoolNames,
              reason: payload.reason,
            })
          }
        } catch (error) {
          // 기관형 「발송 전」 취소 중 서버가 발송 후로 판단 → 해당 배정을 발송 후로 보고 「발송 후」 팝업으로 다시 연다
          if (
            isInstitutionProgram &&
            pendingBodyWasEmpty &&
            pendingAssignmentId != null &&
            isInstructorUnassignReasonRequiredError(error)
          ) {
            const sentId = pendingAssignmentId
            setForcedSentAssignmentIds(prev => new Set(prev).add(sentId))
            if (cancelledCount > 0) {
              // 일부 취소됨 — 목록을 다시 불러오면 선택이 초기화되므로 팝업을 닫고 다시 선택하게 한다
              await institutionAssignment.invalidate()
              setUnassignConfirmOpen(false)
            } else {
              setUnassignConfirmOpen(true)
            }
            showAlert({
              title: '안내',
              content: INSTRUCTOR_UNASSIGN_NOTIFICATION_ALREADY_SENT_MESSAGE,
            })
            return
          }
          if (isInstitutionProgram && isInstructorAssignmentConflictError(error)) {
            await institutionAssignment.invalidate()
            setUnassignConfirmOpen(false)
            setSelectedAssignedSchoolKeys([])
            showAlert({
              title: '배정 취소 실패',
              content: INSTRUCTOR_ASSIGNMENT_CANCEL_CONFLICT_MESSAGE,
            })
            return
          }
          if (cancelledCount > 0) await institutionAssignment.invalidate()
          const message =
            error instanceof Error && error.message.trim()
              ? error.message
              : '배정 취소에 실패했습니다. 잠시 후 다시 시도해 주세요.'
          showAlert({ title: '배정 취소 실패', content: message })
        }
        return
      }

      notifyProgramApiUnavailable(
        'general-participating-instructor-unassign',
        '일반 프로그램 · 참여 강사 배정 취소'
      )
    },
    [
      assignedSchools,
      assignmentNotificationSentById,
      institutionAssignment,
      instructorList,
      isInstitutionProgram,
      mergedInstructor,
      mergedInstructor.instructorName,
      schoolRows,
      selectedAssignedSchoolKeys,
      showAlert,
      waitingSchools,
    ]
  )

  /** 기관형 [선택 배정] 확인 — 선택한 배정 대기 기관(일정 행) 전부를 기관 단위로 배정 */
  const handleBulkSelectAssignConfirm = useCallback(async () => {
    const current = bulkSelectAssign
    if (!current || current.step !== 'confirm') return
    if (assignGuideInFlightRef.current) return

    if (!programHasActiveInstructorRecruitment(program)) {
      showAlert({
        title: '배정 실패',
        content: GENERAL_INSTRUCTOR_ASSIGNMENT_REQUIRES_RECRUITMENT_MESSAGE,
      })
      return
    }

    const memberId = Number(mergedInstructor.memberId)
    if (!Number.isFinite(memberId) || memberId <= 0) {
      showAlert({ title: '안내', content: '강사 memberId가 없어 배정할 수 없습니다.' })
      return
    }

    if (!institutionAssignment.remoteEnabled) {
      notifyProgramApiUnavailable(
        'general-participating-instructor-assign',
        '일반 프로그램 · 참여 강사 기관 배정'
      )
      return
    }

    const rowsToProcess = mergeInstitutionWaitingRowsBySchool(
      waitingSchools.filter(
        w => current.waitingRowIds.includes(w.id) && w.assignmentStatus === 'waiting'
      )
    )
    if (rowsToProcess.length === 0) {
      setBulkSelectAssign(null)
      return
    }

    const noScheduleMessage = (schoolName: string) =>
      `${schoolName} — 배정 가능한 교육 일정이 없습니다. 기관의 교육 일정 확정 후 다시 시도해 주세요.`

    assignGuideInFlightRef.current = true
    setBulkSelectAssign({ ...current, step: 'submitting' })
    try {
      const assignmentNotify = toScheduledOnlyNotifyTiming(
        INSTITUTION_SELECT_ASSIGN_DEFAULT_NOTIFY_PAYLOAD.notifyTiming,
        INSTITUTION_SELECT_ASSIGN_DEFAULT_NOTIFY_PAYLOAD.manualNotifyAt
      )
      let leadAssigned = assignedSchools.some(row => row.role === 'lead')

      for (const waitingRow of rowsToProcess) {
        const orgAppId = Number(waitingRow.organizationApplicationId)
        if (!Number.isFinite(orgAppId) || orgAppId <= 0) {
          showAlert({
            title: '안내',
            content: `${waitingRow.schoolName} 기관의 organizationApplicationId가 없어 배정할 수 없습니다.`,
          })
          setBulkSelectAssign({ ...current, step: 'confirm' })
          return
        }
        if (!hasAssignableOrganizationInstructorSchedule(waitingRow.sessions)) {
          showAlert({ title: '안내', content: noScheduleMessage(waitingRow.schoolName) })
          setBulkSelectAssign({ ...current, step: 'confirm' })
          return
        }
        // 선택한 일정 행의 회차 전부 — 기관 단위로 합친 행의 모든 회차를 배정한다.
        const allSessionKeys = new Set((waitingRow.sessions ?? []).map(sessionOptionId))
        const targetSessions = listAssignableSessionsForWaitingRow(waitingRow, allSessionKeys)
        if (targetSessions.length === 0) {
          showAlert({ title: '안내', content: noScheduleMessage(waitingRow.schoolName) })
          setBulkSelectAssign({ ...current, step: 'confirm' })
          return
        }

        for (const session of targetSessions) {
          const schedulePayload = resolveAssignableSchedulePayloadFromSession(session)
          if (!schedulePayload) {
            showAlert({ title: '안내', content: noScheduleMessage(waitingRow.schoolName) })
            setBulkSelectAssign({ ...current, step: 'confirm' })
            return
          }
          await createInstructorAssignmentRemote(program.id, {
            instructorMemberId: memberId,
            ...schedulePayload,
            organizationApplicationId: orgAppId,
            instructorApplicationId: waitingRow.instructorApplicationId
              ? Number(waitingRow.instructorApplicationId)
              : mergedInstructor.instructorApplicationId
                ? Number(mergedInstructor.instructorApplicationId)
                : undefined,
            // 기존 선택 배정과 동일: 대표 강사가 없으면 첫 회차만 대표로 지정
            scheduleLead: !leadAssigned,
            ...assignmentNotify,
          })
          leadAssigned = true
        }
      }

      await institutionAssignment.invalidate()
      await queryClient.invalidateQueries({
        queryKey: generalProgramProgressQueryKeys.instructors(program.id),
      })
      await queryClient.invalidateQueries({
        queryKey: generalApplicationsQueryKeys.instructorList(program.id),
      })
      if (hasInstructorApplicationId && instructorApplicationId) {
        await queryClient.invalidateQueries({
          queryKey: generalApplicationsQueryKeys.instructorDetail(instructorApplicationId),
        })
      }
      setSelectedWaitingSchoolKeys([])
      setBulkSelectAssign({ ...current, step: 'complete' })
    } catch (error) {
      const scopeMessage = formatInstructorOrganizationScheduleScopeMessage(error)
      if (scopeMessage) {
        await institutionAssignment.invalidate()
        showAlert({ title: '배정 실패', content: scopeMessage })
      } else {
        showAlert({
          title: '배정 실패',
          content: getGeneralProgramApiErrorMessage(
            error,
            '배정에 실패했습니다. 잠시 후 다시 시도해 주세요.'
          ),
        })
      }
      setBulkSelectAssign({ ...current, step: 'confirm' })
    } finally {
      assignGuideInFlightRef.current = false
    }
  }, [
    assignedSchools,
    bulkSelectAssign,
    hasInstructorApplicationId,
    institutionAssignment,
    instructorApplicationId,
    mergedInstructor.instructorApplicationId,
    mergedInstructor.memberId,
    program,
    queryClient,
    showAlert,
    waitingSchools,
  ])

  const closeAssignGuideModal = useCallback(() => {
    setAssignGuideMode(null)
    setAssignGuideSchoolId(null)
    setAssignGuideRole('assistant')
    setAssignGuideSessionIds([])
  }, [])

  const handleAssignGuideConfirm = useCallback(async (payload: PermissionModalPayload) => {
    if (!assignGuideMode || !assignGuideSchoolId) return false
    if (assignGuideInFlightRef.current) return false

    if (!programHasActiveInstructorRecruitment(program)) {
      showAlert({
        title: '배정 실패',
        content: GENERAL_INSTRUCTOR_ASSIGNMENT_REQUIRES_RECRUITMENT_MESSAGE,
      })
      return false
    }

    const memberId = Number(mergedInstructor.memberId)
    if (!Number.isFinite(memberId) || memberId <= 0) {
      showAlert({
        title: '안내',
        content: '강사 memberId가 없어 배정할 수 없습니다.',
      })
      return false
    }

    const rowsToAssign = waitingSchools.filter(w => {
      if (w.assignmentStatus !== 'waiting') return false
      const matchesInstitution =
        w.schoolId === assignGuideSchoolId || w.id === assignGuideSchoolId
      if (assignGuideMode === 'select') {
        return selectedWaitingSchoolKeys.includes(w.id) && matchesInstitution
      }
      return matchesInstitution
    })
    if (rowsToAssign.length === 0) return false

    if (!institutionAssignment.remoteEnabled) {
      notifyProgramApiUnavailable(
        'general-participating-instructor-assign',
        '일반 프로그램 · 참여 강사 기관 배정'
      )
      return false
    }

    assignGuideInFlightRef.current = true
    setAssignGuideSubmitting(true)
    try {
      const assignmentNotify = toScheduledOnlyNotifyTiming(
        payload.notifyTiming,
        payload.manualNotifyAt
      )
      let leadAssigned = assignedSchools.some(row => row.role === 'lead')
      const selectedSessionKeys = new Set(assignGuideSessionIds)

      // 기관형은 일정별 행 — 기관 단위로 회차를 합쳐 기존처럼 기관 1건으로 배정(1사1교는 기존 그대로)
      const rowsToProcess = isCompanySchool
        ? rowsToAssign
        : mergeInstitutionWaitingRowsBySchool(rowsToAssign)
      for (const waitingRow of rowsToProcess) {
        if (waitingRow.assignmentStatus !== 'waiting') {
          showAlert({
            title: '안내',
            content: `${waitingRow.schoolName} — 배정 가능한 교육 일정이 없습니다. 기관의 교육 일정 확정 후 다시 시도해 주세요.`,
          })
          return false
        }

        const orgAppId = Number(waitingRow.organizationApplicationId)
        if (!Number.isFinite(orgAppId) || orgAppId <= 0) {
          showAlert({
            title: '안내',
            content: `${waitingRow.schoolName} 기관의 organizationApplicationId가 없어 배정할 수 없습니다.`,
          })
          return false
        }

        if (!hasAssignableOrganizationInstructorSchedule(waitingRow.sessions)) {
          showAlert({
            title: '안내',
            content: `${waitingRow.schoolName} — 배정 가능한 교육 일정이 없습니다. 기관의 교육 일정 확정 후 다시 시도해 주세요.`,
          })
          return false
        }

        const targetSessions = listAssignableSessionsForWaitingRow(
          waitingRow,
          selectedSessionKeys
        )

        if (targetSessions.length === 0) {
          showAlert(NO_SELECTION_ALERT)
          return false
        }

        for (const session of targetSessions) {
          const schedulePayload = resolveAssignableSchedulePayloadFromSession(session)
          if (!schedulePayload) {
            showAlert({
              title: '안내',
              content: `${waitingRow.schoolName} — 배정 가능한 교육 일정이 없습니다. 기관의 교육 일정 확정 후 다시 시도해 주세요.`,
            })
            return false
          }

          await createInstructorAssignmentRemote(program.id, {
            instructorMemberId: memberId,
            ...schedulePayload,
            organizationApplicationId: orgAppId,
            instructorApplicationId: waitingRow.instructorApplicationId
              ? Number(waitingRow.instructorApplicationId)
              : mergedInstructor.instructorApplicationId
                ? Number(mergedInstructor.instructorApplicationId)
                : undefined,
            scheduleLead: !leadAssigned && assignGuideRole === 'lead',
            ...assignmentNotify,
          })
          if (assignGuideRole === 'lead') leadAssigned = true
        }
      }

      await institutionAssignment.invalidate()
      await queryClient.invalidateQueries({
        queryKey: generalProgramProgressQueryKeys.instructors(program.id),
      })
      await queryClient.invalidateQueries({
        queryKey: generalApplicationsQueryKeys.instructorList(program.id),
      })
      if (hasInstructorApplicationId && instructorApplicationId) {
        await queryClient.invalidateQueries({
          queryKey: generalApplicationsQueryKeys.instructorDetail(instructorApplicationId),
        })
      }
      setSelectedWaitingSchoolKeys([])
      return true
    } catch (error) {
      const scopeMessage = formatInstructorOrganizationScheduleScopeMessage(error)
      if (scopeMessage) {
        await institutionAssignment.invalidate()
        showAlert({ title: '배정 실패', content: scopeMessage })
        return false
      }
      const message = getGeneralProgramApiErrorMessage(
        error,
        '배정에 실패했습니다. 잠시 후 다시 시도해 주세요.'
      )
      showAlert({ title: '배정 실패', content: message })
      return false
    } finally {
      assignGuideInFlightRef.current = false
      setAssignGuideSubmitting(false)
    }
  }, [
    assignGuideMode,
    assignGuideRole,
    assignGuideSchoolId,
    assignGuideSessionIds,
    assignedSchools,
    hasInstructorApplicationId,
    institutionAssignment,
    isCompanySchool,
    instructorApplicationId,
    instructorList,
    mergedInstructor,
    mergedInstructor.instructorApplicationId,
    mergedInstructor.memberId,
    program,
    queryClient,
    schoolRows,
    selectedWaitingSchoolKeys,
    showAlert,
    waitingSchools,
  ])

  const addAssignOptions = useMemo(
    () =>
      waitingSchools
        .filter(w => w.assignmentStatus === 'waiting')
        .reduce<Array<{ value: string; label: string }>>((acc, w) => {
          const value = w.schoolId ?? w.id
          if (acc.some(option => option.value === value)) return acc
          acc.push({ value, label: w.schoolName })
          return acc
        }, []),
    [waitingSchools]
  )

  const selectAssignOptions = useMemo(
    () =>
      waitingSchools
        .filter(w => selectedWaitingSchoolKeys.includes(w.id) && w.assignmentStatus === 'waiting')
        .reduce<Array<{ value: string; label: string }>>((acc, w) => {
          const value = w.schoolId ?? w.id
          if (acc.some(option => option.value === value)) return acc
          acc.push({ value, label: w.schoolName })
          return acc
        }, []),
    [selectedWaitingSchoolKeys, waitingSchools]
  )

  const assignGuideInstitutionOptions =
    assignGuideMode === 'select' ? selectAssignOptions : addAssignOptions

  const assignGuideSchool = useMemo(
    () => schoolRows.find(school => school.id === assignGuideSchoolId) ?? null,
    [assignGuideSchoolId, schoolRows]
  )

  /** 기관형 — 배정 대기(waiting) 일정 행에 속한 회차만 선택 가능(배정 불가·배정 취소 일정 회차는 비활성) */
  const waitingSessionOptionIdsBySchool = useMemo(() => {
    const map = new Map<string, Set<string>>()
    for (const row of waitingSchools) {
      if (row.assignmentStatus !== 'waiting') continue
      const key = row.schoolId ?? row.id
      const ids = map.get(key) ?? new Set<string>()
      for (const session of row.sessions ?? []) ids.add(sessionOptionId(session))
      map.set(key, ids)
    }
    return map
  }, [waitingSchools])

  const assignGuideSessionOptions = useMemo(
    () =>
      mapParticipatingSessionsToInstructorAssignOptions(assignGuideSchool?.sessions, {
        isSessionDisabled: session =>
          assignGuideSchool != null &&
          !isCompanySchool &&
          waitingSessionOptionIdsBySchool.get(assignGuideSchool.id)?.has(sessionOptionId(session)) !==
            true,
        // 1사1교는 회차가 없다 — 배정일 칩에 「N회차」 대신 지망 순위(없으면 생략)
        ...(isCompanySchool
          ? { resolveSessionRoundLabel: resolveCompanySchoolAssignSessionRoundLabel }
          : {}),
      }),
    [assignGuideSchool, isCompanySchool, waitingSessionOptionIdsBySchool]
  )

  const assignGuideInstitutionName =
    assignGuideInstitutionOptions.find(option => option.value === assignGuideSchoolId)?.label ?? ''

  const assignGuideWaitingRow = useMemo(
    () =>
      waitingSchools.find(row => (row.schoolId ?? row.id) === assignGuideSchoolId) ??
      waitingSchools.find(row => row.id === assignGuideSchoolId) ??
      null,
    [assignGuideSchoolId, waitingSchools]
  )

  const assignGuideCurrentCount = countAssignedInstructorsForOrganization({
    assignments: institutionAssignment.assignments,
    boardLoaded: institutionAssignment.boardLoaded,
    organizationApplicationId: assignGuideWaitingRow?.organizationApplicationId,
    organizationName: assignGuideInstitutionName || assignGuideWaitingRow?.schoolName,
  })
  const assignGuideRequiredCount = resolveRequiredAssignableInstructorCount(program)

  useEffect(() => {
    setAssignGuideSessionIds([])
  }, [assignGuideSchoolId])

  const unassignSchoolNames = useMemo(
    () =>
      assignedSchools.filter(r => selectedAssignedSchoolKeys.includes(r.id)).map(r => r.schoolName),
    [assignedSchools, selectedAssignedSchoolKeys]
  )

  /** 선택한 배정 중 하나라도 발송 후면 「발송 후」, 모두 발송 전이면 「발송 전」, 미상이면 undefined(발송 후) */
  const unassignNotificationSent = useMemo(() => {
    if (!isInstitutionProgram) return undefined
    const flags = assignedSchools
      .filter(r => selectedAssignedSchoolKeys.includes(r.id))
      .flatMap(r =>
        r.assignmentIds && r.assignmentIds.length > 0
          ? r.assignmentIds
          : r.assignmentId
            ? [r.assignmentId]
            : []
      )
      .map(id => assignmentNotificationSentById.get(String(id)))
    return resolveInstructorUnassignNotificationSent(flags)
  }, [assignedSchools, assignmentNotificationSentById, isInstitutionProgram, selectedAssignedSchoolKeys])

  const privacyMasked = !personalInfoRevealed

  const educationSummary =
    mergedInstructor.educations?.[0]?.schoolType != null
      ? getEducationLevelBadge(undefined, mergedInstructor.educations[0].schoolType)
      : getEducationLevelBadge(mergedInstructor.educationLevel)
  const careerYearsFromDetails = getTotalCareerYears(mergedInstructor.careerDetails)
  const careerSummaryYears =
    careerYearsFromDetails > 0
      ? careerYearsFromDetails
      : (mergedInstructor.lectureExperienceYears ?? 0)
  const qualificationCount = mergedInstructor.qualifications?.length ?? 0

  const handleActivityCertificateIssueClick = useCallback(() => {
    if (isInstitutionProgram) {
      setActivityCertReasonLabel(undefined)
      setActivityCertReasonOpen(true)
      return
    }
    setActivityCertPreviewOpen(true)
  }, [isInstitutionProgram])

  const handleActivityCertReasonIssue = useCallback(
    (_reason: CertificateIssueReasonValue, reasonLabel: string) => {
      setActivityCertReasonLabel(reasonLabel)
      setActivityCertPreviewOpen(true)
    },
    []
  )

  const handleRequestActivityWithdraw = useCallback(() => {
    if (isActivityWithdrawn) {
      showAlert({
        title: '활동 포기 안내',
        content: PARTICIPATING_INSTRUCTOR_ALREADY_ACTIVITY_WITHDRAWN_ALERT_MESSAGE,
      })
      return
    }
    if (applicationInfoEdit.isEditing) return
    setActivityWithdrawModalOpen(true)
  }, [applicationInfoEdit.isEditing, isActivityWithdrawn, showAlert])

  const handleCancelActivityWithdraw = useCallback(() => {
    setActivityWithdrawModalOpen(false)
  }, [])

  const handleConfirmActivityWithdraw = useCallback(
    async (payload: ParticipatingInstructorActivityWithdrawModalPayload) => {
      const stopScheduleLabel = payload.stopScheduleId
        ? activityWithdrawScheduleOptions.find(option => option.value === payload.stopScheduleId)
            ?.label
        : undefined
      const reason =
        [mergedInstructor.instructorName, stopScheduleLabel].filter(Boolean).join(' · ') ||
        stopScheduleLabel ||
        '활동 포기'

      if (progressRemoteEnabled) {
        setActivityWithdrawSubmitting(true)
        try {
          const stopScheduleIdNum = payload.stopScheduleId
            ? Number(payload.stopScheduleId)
            : undefined
          await giveUpGeneralParticipatingInstitution(program.id, mergedInstructor.id, {
            reason,
            faultParty: payload.faultParty,
            stopScheduleId:
              stopScheduleIdNum != null && Number.isFinite(stopScheduleIdNum)
                ? stopScheduleIdNum
                : undefined,
          })
          await queryClient.invalidateQueries({
            queryKey: generalProgramProgressQueryKeys.instructors(program.id),
          })
          setInstructorPatches(prev => ({
            ...prev,
            activityWithdrawn: true,
            activityWithdrawReason: 'institution',
            activityWithdrawStopScheduleId: payload.stopScheduleId,
            activityWithdrawStopScheduleLabel: stopScheduleLabel,
          }))
          setActivityWithdrawModalOpen(false)
          showAlert({
            title: '활동 포기',
            content: `${mergedInstructor.instructorName} 강사가 활동 포기 처리되었습니다.`,
          })
        } catch (error) {
          showAlert({
            title: '활동 포기 실패',
            content: getGeneralProgramApiErrorMessage(
              error,
              '활동 포기 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.'
            ),
          })
        } finally {
          setActivityWithdrawSubmitting(false)
        }
        return
      }

      notifyProgramApiUnavailable(
        'general-participating-instructor-give-up',
        '일반 프로그램 · 참여 강사 활동 포기'
      )
    },
    [
      activityWithdrawScheduleOptions,
      mergedInstructor.id,
      mergedInstructor.instructorName,
      program.id,
      progressRemoteEnabled,
      queryClient,
      showAlert,
    ]
  )

  const handleAdminCommentEditEnter = useCallback(() => {
    if (applicationInfoEdit.isEditing) return
    setAdminCommentDraft(savedAdminComment)
    setAdminCommentError(undefined)
    setAdminCommentModalOpen(true)
  }, [applicationInfoEdit.isEditing, savedAdminComment])

  const handleAdminCommentSave = useCallback(async () => {
    const trimmed = adminCommentDraft.trim()
    if (shouldUseOrganizationApplicationRemoteApi()) {
      if (!hasInstructorApplicationId) {
        void showAlert({
          title: '안내',
          content:
            '강사 신청 ID가 없어 코멘트를 저장할 수 없습니다. participants API에 sourceApplicationId 매핑이 필요합니다.',
        })
        return
      }
      try {
        const response = await updateInstructorApplicationManagerCommentRemote(
          instructorApplicationId!,
          { managerComment: trimmed || null }
        )
        const next = response.managerComment ?? trimmed
        setSavedAdminComment(next)
        setInstructorPatches(prev => ({
          ...prev,
          adminComment: next || undefined,
        }))
        await queryClient.invalidateQueries({
          queryKey: generalApplicationsQueryKeys.instructorDetail(instructorApplicationId!),
        })
        setAdminCommentModalOpen(false)
        setAdminCommentError(undefined)
        return
      } catch {
        void showAlert({
          title: '안내',
          content: MESSAGES.error.save,
        })
        return
      }
    }
    void showAlert({
      title: PROGRAM_API_UNAVAILABLE_TITLE,
      content: buildProgramApiUnavailableSaveContent('참여 강사 관리자 코멘트'),
    })
  }, [
    adminCommentDraft,
    hasInstructorApplicationId,
    instructorApplicationId,
    queryClient,
    showAlert,
  ])

  const handleAdminCommentModalCancel = useCallback(() => {
    setAdminCommentModalOpen(false)
    setAdminCommentError(undefined)
  }, [])

  const handleAdminCommentDraftChange = useCallback((value: string) => {
    setAdminCommentDraft(value)
    setAdminCommentError(undefined)
  }, [])

  const applicationTab = (
    <>
      <div className="program-detail-fullpage-modal__info-tab-block participating-instructor-fullpage-view__section-block">
        <ParticipatingInstructorApplicationInfo
          instructor={mergedInstructor}
          program={program}
          privacyMasked={privacyMasked}
          adminComment={savedAdminComment}
          isAdminCommentEditing={false}
          adminCommentError={adminCommentError}
          mode={applicationInfoEdit.isEditing ? 'edit' : 'view'}
          draft={applicationInfoEdit.draft ?? undefined}
          onDraftChange={applicationInfoEdit.updateDraft}
          validationErrors={applicationInfoEdit.validationErrors}
        />
      </div>

      <div className="program-detail-fullpage-modal__info-tab-block participating-instructor-fullpage-view__section-block instructor-resume-section">
        <DetailInfoForm
          title="학력사항"
          description={<span className="instructor-resume-section-count">{educationSummary}</span>}
          mode="view"
          className="participating-instructor-fullpage-view__resume-form"
        >
          <div className="instructor-resume-card">
            {(mergedInstructor.educations?.length ?? 0) > 0 ? (
              mergedInstructor.educations!.map((item, idx) => {
                const period = formatEducationPeriod(item)
                const schoolLabel = item.schoolName
                  ? [
                      item.schoolName,
                      item.schoolType
                        ? `(${getEducationLevelBadge(undefined, item.schoolType)})`
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' ')
                  : NO_DATA
                return (
                  <div key={idx} className="instructor-resume-row instructor-resume-row--timeline">
                    <span className="instructor-resume-row-left">{period || NO_DATA}</span>
                    <span className="instructor-resume-row-right instructor-resume-row-right--with-divider">
                      <span className="instructor-resume-emphasis">{schoolLabel}</span>
                      {item.major ? (
                        <>
                          <ProgramDetailTdDivider />
                          <span className="instructor-resume-role">{item.major}</span>
                        </>
                      ) : null}
                    </span>
                  </div>
                )
              })
            ) : (
              <p className="instructor-resume-empty">{NO_DATA}</p>
            )}
          </div>
        </DetailInfoForm>
      </div>

      <div className="program-detail-fullpage-modal__info-tab-block participating-instructor-fullpage-view__section-block instructor-resume-section">
        <DetailInfoForm
          title="경력사항"
          description={
            <span className="instructor-resume-section-count">{careerSummaryYears}년</span>
          }
          mode="view"
          className="participating-instructor-fullpage-view__resume-form"
        >
          <div className="instructor-resume-card">
            {(mergedInstructor.careerDetails?.length ?? 0) > 0 ? (
              mergedInstructor.careerDetails!.map((item, idx) => (
                <div key={idx} className="instructor-resume-row instructor-resume-row--timeline">
                  <span className="instructor-resume-row-left">{formatCareerPeriod(item)}</span>
                  <span className="instructor-resume-row-right instructor-resume-row-right--with-divider">
                    {item.companyName || item.role ? (
                      <>
                        {item.companyName ? (
                          <span className="instructor-resume-emphasis">{item.companyName}</span>
                        ) : null}
                        {item.companyName && item.role ? <ProgramDetailTdDivider /> : null}
                        {item.role ? (
                          <span className="instructor-resume-role">{item.role}</span>
                        ) : null}
                      </>
                    ) : (
                      <span className="instructor-resume-emphasis">{NO_DATA}</span>
                    )}
                  </span>
                </div>
              ))
            ) : (
              <p className="instructor-resume-empty">{NO_DATA}</p>
            )}
          </div>
        </DetailInfoForm>
      </div>

      <div className="program-detail-fullpage-modal__info-tab-block participating-instructor-fullpage-view__section-block instructor-resume-section">
        <DetailInfoForm
          title="자격 및 면허"
          description={
            <span className="instructor-resume-section-count">{qualificationCount}개</span>
          }
          mode="view"
          className="participating-instructor-fullpage-view__resume-form"
        >
          <div className="instructor-resume-card">
            {(mergedInstructor.qualifications?.length ?? 0) > 0 ? (
              mergedInstructor.qualifications!.map(
                (q: ParticipatingInstructorQualification, idx: number) => (
                  <div key={idx} className="instructor-resume-row">
                    <span className="instructor-resume-row-left instructor-resume-row-left--single-year">
                      {q.year ?? '-'}
                    </span>
                    <span className="instructor-resume-row-right instructor-resume-row-right--with-divider">
                      <span className="instructor-resume-emphasis">{q.name ?? '-'}</span>
                    </span>
                  </div>
                )
              )
            ) : (
              <p className="instructor-resume-empty">{NO_DATA}</p>
            )}
          </div>
        </DetailInfoForm>
      </div>
    </>
  )

  return (
    <div className="participating-instructor-fullpage-view school-detail-fullpage-view">
      <CmsTextTabs
        className="school-detail-fullpage-view__tabs-row"
        activeKey={effectiveTab}
        onChange={setActiveTab}
        items={INSTRUCTOR_DETAIL_TAB_KEYS.map(key => ({
          key,
          label: TAB_LABELS[key],
        }))}
        trailing={
          effectiveTab === 'application' ? (
            <>
              {!applicationInfoEdit.isEditing ? (
                <>
                  <CmsButton
                    variant="delete"
                    size="h40"
                    disabled={isActivityWithdrawn || activityWithdrawSubmitting}
                    onClick={handleRequestActivityWithdraw} >
                    활동 포기
                  </CmsButton>
                  <CmsButton
                    variant="secondary"
                    size="h40"
                    icon={<ButtonDownloadIcon />}
                    onClick={handleActivityCertificateIssueClick} >
                    활동인증서 발급
                  </CmsButton>
                </>
              ) : null}
              <ProgramEditInfoActions
                size="h40"
                isEditing={applicationInfoEdit.isEditing}
                saving={applicationInfoEdit.isSaving}
                idleVariant="secondary"
                onEdit={applicationInfoEdit.enterEdit}
                onCancel={applicationInfoEdit.cancelEdit}
                onSave={() => {
                  void applicationInfoEdit.saveEdit()
                }} />
              {!applicationInfoEdit.isEditing ? (
                <>
                  <CmsButton
                    variant="primary"
                    size="h40"
                    onClick={handleAdminCommentEditEnter} >
                    코멘트 작성
                  </CmsButton>
                  <PersonalInfoRevealButton disabled={programPrivacyPending}
                    labelMode="stickyReveal"
                    revealed={personalInfoRevealed}
                    cmsSize="h40"
                    onClick={handlePrivacyToggleClick} />
                </>
              ) : null}
            </>
          ) : null
        }
      />

      <div className="program-detail-fullpage-modal__content school-detail-fullpage-view__content">
        {effectiveTab === 'application' && (
          <div className="program-detail-fullpage-modal__info-tab">{applicationTab}</div>
        )}
        {effectiveTab === 'institutionAssignment' &&
          (isIndividualProgram ? (
            <div className="program-detail-fullpage-modal__info-tab school-detail-fullpage-view__instructor-tab">
              <ParticipatingIndividualInstructorAssignmentSection
                program={program}
                instructor={mergedInstructor}
                schoolRows={schoolRows}
                instructorList={instructorList}
              />
            </div>
          ) : (
            <div className="program-detail-fullpage-modal__info-tab school-detail-fullpage-view__instructor-tab">
              {institutionAssignment.error ? (
                <div
                  role="alert"
                  className="school-detail-fullpage-view__assignment-error"
                >
                  {getGeneralProgramApiErrorMessage(
                    institutionAssignment.error,
                    '강사 배정 조회에 실패했습니다. 잠시 후 다시 시도해 주세요.'
                  )}
                </div>
              ) : null}
              <div className="school-detail-fullpage-view__instructor-section">
                <div className="table-header-actions">
                  <div className="table-header-title--wrapper">
                    <span className="table-title">배정된 기관 목록</span>
                    <span className="table-description">
                      총{' '}
                      {assignedSchools.length}건
                    </span>
                  </div>
                  <div className="info-section-buttons--wrapper">
                    <CmsButton
                      variant="delete"
                      size="h40"
                      disabled={isInstitutionProgram && assignedSchools.length === 0}
                      onClick={handleUnassignClick}
                    >
                      배정 취소
                    </CmsButton>
                    <CmsButton
                      variant="secondary"
                      size="h40"
                      onClick={() => {
                        if (addAssignOptions.length === 0) {
                          showAlert({
                            title: '추가 배정 안내',
                            content: '배정 대기 기관이 없습니다.',
                          })
                          return
                        }
                        setAssignGuideMode('add')
                        setAssignGuideSchoolId(addAssignOptions[0]?.value ?? null)
                        setAssignGuideRole(
                          assignedSchools.some(row => row.role === 'lead') ? 'assistant' : 'lead'
                        )
                        setAssignGuideSessionIds([])
                      }} >
                      추가 배정
                    </CmsButton>
                    <ExcelButton
                      onClick={exportAssignedSchoolsExcel}
                      loading={isAssignedSchoolsExcelExporting} />
                  </div>
                </div>
                <div className="participating-institutions-section__table-wrap school-detail-fullpage-view__assignment-table-scroll">
                  {assignedSchools.length === 0 && isInstitutionProgram ? (
                    <AssignmentListEmpty {...ASSIGNED_INSTITUTIONS_EMPTY_COPY} />
                  ) : assignedSchools.length === 0 ? (
                    <div
                      className="school-detail-fullpage-view__instructor-list-empty"
                      role="status"
                      aria-label="배정된 학교 없음"
                    >
                      배정된 학교가 없습니다.
                    </div>
                  ) : (
                    <CmsDataTable<InstructorAssignedSchoolRow>
                      className="participating-institutions-section__table cms-data-table"
                      rowKey="id"
                      size="middle"
                      pagination={false}
                      scroll={{ x: 1200 }}
                      rowSelection={{
                        columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
                        selectedRowKeys: selectedAssignedSchoolKeys,
                        onChange: keys => setSelectedAssignedSchoolKeys(keys),
                      }}
                      columns={assignedSchoolColumns}
                      dataSource={assignedSchools}
                    />
                  )}
                </div>
              </div>

              <div className="school-detail-fullpage-view__instructor-section school-detail-fullpage-view__instructor-section--waiting">
                <div className="table-header-actions">
                  <div className="table-header-title--wrapper">
                    <span className="table-title">배정 대기 기관 목록</span>
                    <span className="table-description">
                      총{' '}
                      {waitingSchools.length}건
                    </span>
                  </div>
                  <div className="info-section-buttons--wrapper">
                    <CmsButton
                      variant="secondary"
                      size="h40"
                      disabled={isInstitutionProgram && waitingSchools.length === 0}
                      onClick={handleSelectAssignClick}
                    >
                      선택 배정
                    </CmsButton>
                    <ExcelButton
                      onClick={exportWaitingSchoolsExcel}
                      loading={isWaitingSchoolsExcelExporting} />
                  </div>
                </div>
                <div className="participating-institutions-section__table-wrap participating-instructor-fullpage-view__waiting-table-scroll">
                  {waitingSchools.length === 0 && isInstitutionProgram ? (
                    <AssignmentListEmpty {...WAITING_INSTITUTIONS_EMPTY_COPY} />
                  ) : (
                  <CmsDataTable<InstructorWaitingSchoolRow>
                    className="participating-institutions-section__table cms-data-table"
                    rowKey="id"
                    size="middle"
                    pagination={false}
                    scroll={{ x: 1300 }}
                    rowSelection={{
                      columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
                      selectedRowKeys: selectedWaitingSchoolKeys,
                      onChange: keys => setSelectedWaitingSchoolKeys(keys),
                      getCheckboxProps: record => ({
                        disabled: record.assignmentStatus !== 'waiting',
                      }),
                    }}
                    columns={waitingSchoolColumns}
                    dataSource={waitingSchools}
                    locale={{ emptyText: renderWaitingTableEmpty() }}
                    rowClassName={record =>
                      record.assignmentStatus === 'assigned' ||
                      record.assignmentStatus === 'no_assignable_schedule' ||
                      record.assignmentStatus === 'cancelled' ||
                      record.assignmentStatus === 'unavailable' ||
                      record.assignmentStatus === 'assignment_cancelled'
                        ? 'school-detail-fullpage-view__waiting-row--assigned'
                        : ''
                    }
                  />
                  )}
                </div>
              </div>

              {isInstitutionProgram ? (
                <InstitutionUnassignConfirmModal
                  open={unassignConfirmOpen}
                  onCancel={() => setUnassignConfirmOpen(false)}
                  targetNames={unassignSchoolNames}
                  audience="instructor"
                  notificationSent={unassignNotificationSent}
                  onConfirm={handleUnassignConfirm}
                />
              ) : (
                <SchoolDetailUnassignConfirmModal
                  open={unassignConfirmOpen}
                  onCancel={() => setUnassignConfirmOpen(false)}
                  instructorNames={[d.instructorName]}
                  targetNames={unassignSchoolNames}
                  onConfirm={handleUnassignConfirm}
                />
              )}
              <SchoolDetailUnassignCompleteModal
                open={unassignCompleteModal != null}
                onClose={() => setUnassignCompleteModal(null)}
                instructorNames={unassignCompleteModal?.instructorNames ?? []}
                targetNames={unassignCompleteModal?.targetNames ?? []}
                reason={unassignCompleteModal?.reason ?? ''}
              />

              <AssignGuideModal
                open={assignGuideMode != null}
                instructorName={d.instructorName}
                institutionOptions={assignGuideInstitutionOptions}
                selectedInstitutionId={assignGuideSchoolId}
                role={assignGuideRole}
                sessionOptions={assignGuideSessionOptions}
                selectedSessionIds={assignGuideSessionIds}
                currentCount={assignGuideCurrentCount}
                requiredCount={assignGuideRequiredCount}
                onInstitutionChange={setAssignGuideSchoolId}
                onRoleChange={setAssignGuideRole}
                onSessionIdsChange={setAssignGuideSessionIds}
                onCancel={closeAssignGuideModal}
                onConfirm={handleAssignGuideConfirm}
                onComplete={closeAssignGuideModal}
                confirmLoading={assignGuideSubmitting}
                completeVariant={isInstitutionProgram ? 'result' : 'default'}
              />
              {isInstitutionProgram ? (
                <>
                  <InstitutionSelectAssignConfirmModal
                    open={
                      bulkSelectAssign != null &&
                      (bulkSelectAssign.step === 'confirm' || bulkSelectAssign.step === 'submitting')
                    }
                    onCancel={() => {
                      if (bulkSelectAssign?.step === 'submitting') return
                      setBulkSelectAssign(null)
                    }}
                    onConfirm={() => {
                      void handleBulkSelectAssignConfirm()
                    }}
                    targetNoun="기관"
                    institutionName={bulkSelectAssign?.institutionName ?? ''}
                    extraTargetCount={bulkSelectAssign?.extraTargetCount ?? 0}
                    instructorName={d.instructorName}
                    currentCount={bulkSelectAssign?.currentCount ?? null}
                    requiredCount={assignGuideRequiredCount}
                    confirmLoading={bulkSelectAssign?.step === 'submitting'}
                  />
                  <InstitutionAssignCompleteModal
                    open={bulkSelectAssign?.step === 'complete'}
                    onClose={() => setBulkSelectAssign(null)}
                    variant="result"
                    institutionName={bulkSelectAssign?.institutionName ?? ''}
                    instructorName={d.instructorName}
                    extraTargetCount={bulkSelectAssign?.extraTargetCount ?? 0}
                    countLine={formatAssignedInstructorCountLine(
                      bulkSelectAssign?.currentCount != null
                        ? bulkSelectAssign.currentCount + 1
                        : null,
                      assignGuideRequiredCount
                    )}
                  />
                </>
              ) : null}
            </div>
          ))}
        {effectiveTab === 'lectureReports' && (
          <div className="program-detail-fullpage-modal__info-tab school-detail-fullpage-view__instructor-tab">
            {isIndividualProgram ? (
              <ParticipatingIndividualInstructorLectureReportsSection
                instructor={mergedInstructor}
                program={program}
              />
            ) : (
              <ParticipatingInstructorLectureReportsSection
                instructor={mergedInstructor}
                program={program}
              />
            )}
          </div>
        )}
        {effectiveTab === 'settlement' && (
          <div className="program-detail-fullpage-modal__info-tab school-detail-fullpage-view__instructor-tab">
            {isIndividualProgram ? (
              <ParticipatingIndividualInstructorSettlementSection
                instructor={mergedInstructor}
                program={program}
              />
            ) : (
              <ParticipatingInstructorSettlementSection
                instructor={mergedInstructor}
                program={program}
              />
            )}
          </div>
        )}
      </div>

      <div className="school-detail-fullpage-view__page-bottom-spacer" aria-hidden />

      {personalInfoRevealModal}
      <ActivityCertificateIssuancePreviewModal
        open={activityCertPreviewOpen}
        onClose={() => setActivityCertPreviewOpen(false)}
        instructor={mergedInstructor}
        program={program}
        issuanceReasonLabel={isInstitutionProgram ? activityCertReasonLabel : undefined}
      />
      {isInstitutionProgram ? (
        <CertificateBulkIssueReasonModal
          open={activityCertReasonOpen}
          onCancel={() => setActivityCertReasonOpen(false)}
          applicationIds={[mergedInstructor.id]}
          certificateDocumentLabel={ACTIVITY_CERTIFICATE_DOCUMENT_TITLE}
          onIssue={handleActivityCertReasonIssue}
        />
      ) : null}
      <ParticipatingInstructorActivityWithdrawModal
        open={activityWithdrawModalOpen}
        instructorName={mergedInstructor.instructorName}
        scheduleOptions={activityWithdrawScheduleOptions}
        onCancel={handleCancelActivityWithdraw}
        onConfirm={handleConfirmActivityWithdraw}
      />
      <MemberAdminCommentModal
        open={adminCommentModalOpen}
        value={adminCommentDraft}
        onChange={handleAdminCommentDraftChange}
        onCancel={handleAdminCommentModalCancel}
        onConfirm={handleAdminCommentSave}
      />
    </div>
  )
}
