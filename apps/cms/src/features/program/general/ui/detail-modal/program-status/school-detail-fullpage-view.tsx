/**
 * 일반 프로그램 > 진행 현황 > 참여 기관 상세 (풀페이지 인라인)
 * UJAT 참여 기관 상세는 `features/program/ujat/ui/detail-modal/progress/institutions/detail/` — 별도 구현.
 * 탭: 신청 정보 | 학생 명단 | 강사 배정 현황 | 출석 관리 | 게시글
 * 신청 정보 액션: 활동 포기 | 정보 수정 | 코멘트 작성 | 개인정보 상세보기
 */

import type { ReactNode } from 'react'
import { useState, useMemo, useCallback, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { CmsButton, ExcelButton, useCmsAlert } from '@/shared/ui'
import { ProgramEditInfoActions } from '@/features/program/shared/ui/program-edit-info-actions'
import { giveUpGeneralParticipatingInstitution } from '@/features/program/general/api/admin-program-progress-service'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { useProgramProgressRemoteEnabledForSurface } from '@/features/program/1c-1s/lib/use-company-school-surface-remote'
import { CmsSelect } from '@/shared/ui/cms-select'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import type { Program } from '@/types/domain'
import { normalizeGeneralSurveyMenuKeys } from '@/features/program/general/lib/general-survey-menu-keys'
import type {
  SchoolDetailForModal,
  SchoolDetailInstructorRow,
  InstructorRoleKey,
} from '../../../model/school-detail-types'
import { INSTRUCTOR_ROLE_LABELS } from '../../../model/school-detail-types'
import type { ParticipatingSchoolRow, TextbookStatusKey } from '@/features/program/general/model/participating-schools'
import { TEXTBOOK_STATUS_OPTION_KEYS } from '@/features/program/general/model/participating-schools'
import type {
  ParticipatingInstructorRow,
  SettlementStatusKey,
} from '@/features/program/general/model/participating-instructors'
import { InstructorSettlementStatusText } from '@/shared/ui/instructor-settlement-status-text'
import type { InstructorSettlementUiStatus } from '@/shared/constants/instructor-settlement-status'
import type { InstructorListFormInstructor } from '../../../model/school-detail-types'
import {
  getInstructorRowsForSchool,
  getAssignedInstructorDisplayRows,
  getWaitingInstructorRows,
  type WaitingInstructorRowMock,
} from '../../../lib/school-detail'
import { WAITING_INSTRUCTOR_ASSIGNMENT_STATUS_LABELS } from '../../../lib/waiting-instructor-assignment'
import {
  isWaitingInstructorProgramApproved,
  buildSchoolAddInstructorSessionSlotKey,
  resolveWaitingInstructorFeeGradeLabel,
} from '../../../lib/school-add-instructor-assign'
import {
  displayServerPiiAsIs,
  PrivacyHomeAddressDisplay,
} from '@/features/program/shared/lib/program-pii-display'
import {
  INSTRUCTOR_ASSIGN_SELECT_INSTRUCTOR_ALERT_MESSAGE,
  INSTRUCTOR_ASSIGN_SELECT_UNAPPROVED_SINGLE_ONLY_ALERT_MESSAGE,
  INSTRUCTOR_ASSIGN_UNASSIGN_SELECT_INSTRUCTOR_ALERT_MESSAGE,
  PARTICIPATING_INSTITUTION_ALREADY_ACTIVITY_WITHDRAWN_ALERT_MESSAGE,
} from '@/shared/constants/messages'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { getInstructorSettlementStatusLabel } from '@/shared/constants/instructor-settlement-status'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import { TextbookStatusBadge } from '@/shared/components/textbook-status-badge'
import {
  EditableStatusBadge,
  StatusDropdownCell,
  STATUS_DROPDOWN_CELL_CLASSNAME,
  STATUS_DROPDOWN_CELL_TAG_100_CLASSNAME,
  STATUS_DROPDOWN_CELL_TAG_100_HEADER_CLASSNAME,
  STATUS_DROPDOWN_CELL_INLINE_TAG100_CLASSNAME,
} from '@/shared/components'
import { getInstructorRoleBadgeTone } from '@/shared/constants/editable-status-badge-tones'
import { isCompanySchoolProgram } from '@/features/program/1c-1s/lib/is-company-school-program'
import { shouldUseCompanySchoolProgramProgressRemoteApi } from '@/features/program/1c-1s/api/capabilities'
import { companySchoolQueryKeys } from '@/features/program/1c-1s/api/query-keys'
import {
  fetchCompanySchoolAssignmentBoard,
  findScheduleIdForLectureDate,
} from '@/features/program/1c-1s/api/instructor-assignment-conflict-service'
import {
  buildCompanySchoolWaitingInstructorRows,
  buildCompanySchoolAssignedInstructorRows,
} from '@/features/program/1c-1s/lib/build-company-school-assignment-rows'
import {
  cancelInstructorAssignmentRemote,
  createInstructorAssignmentRemote,
  putRepresentativeInstructorRemote,
} from '@/features/program/general/api/instructor-assignments-api-client'
import {
  isOneSchoolPerDayConflictErrorCode,
  ONE_SCHOOL_PER_DAY_CONFLICT_ALERT_MESSAGE,
} from '@/features/program/1c-1s/lib/one-school-per-day-conflict'
import { SchoolDetailStudentListSection } from './school-detail-student-list-section'
import { SchoolDetailAttendanceSection } from './school-detail-attendance-section'
import {
  SchoolDetailAddInstructorAssignModal,
} from './school-detail-add-instructor-assign-modal'
import { SchoolDetailSelectAssignConfirmModal } from './school-detail-select-assign-confirm-modal'
import { SchoolDetailUnassignCompleteModal } from './school-detail-unassign-complete-modal'
import { SchoolDetailUnassignConfirmModal } from './school-detail-unassign-confirm-modal'
import type { PermissionModalPayload } from '@/shared/components/permission-modal'
import { SchoolDetailAssignOverflowModal } from './school-detail-assign-overflow-modal'
import { SchoolDetailAssignCompleteModal } from './school-detail-assign-complete-modal'
import { SchoolDetailNewAssignGuideModal } from './school-detail-new-assign-guide-modal'
import { SchoolDetailLeadInstructorConfirmModal } from './school-detail-lead-instructor-confirm-modal'
import { InstructorFeeApprovalModal } from '@/features/program/shared/ui/detail-modal/components/instructor-fee-approval-modal'
import { ProgramEnrollmentStatusText } from '@/shared/components/program-enrollment-status-text'
import {
  getProgramProgressDisplayStatus,
  resolveProgramEnrollmentDisplayStatusFromLabel,
} from '@/shared/constants/status'
import { EnrollmentProgramDetailPostsTab } from '@/features/user/detail/ui/enrollment-program-detail-posts-tab'
import { useGeneralProgramPosts } from '@/features/program/general/hooks/use-general-program-posts-surveys'
import { usePersonalInfoReveal } from '@/features/user/detail/lib/use-personal-info-reveal'
import { PersonalInfoRevealButton } from '@/features/user/detail/ui/personal-info-reveal-button'
import { MemberAdminCommentModal } from '@/features/user/detail/ui/modal/member-admin-comment-modal'
import {
  InstitutionAddressDetailEdit,
  InstitutionClassAndStudentCountEdit,
  InstitutionComputerInRoomEdit,
  InstitutionEducationFormatRadios,
  InstitutionGradeSelectEdit,
  InstitutionMealEdit,
  InstitutionMultilineEdit,
  InstitutionReadonlyInput,
  InstitutionTeacherEdit,
  InstitutionWaitingRoomEdit,
} from '@/features/program/general/ui/detail-modal/applications/applicant-detail/institution-application-edit-fields'
import {
  buildInstitutionClassCountOptions,
  resolveProgramParticipantMaxClassCount,
} from '@/features/template/lib/participant-recruitment-institution-limits'
import { useParticipatingInstitutionDetailEdit } from '@/features/program/general/hooks/use-participating-institution-detail-edit'
import {
  hasCompletedCombinedClassEducationSessions,
  isCombinedClassProgramEligible,
} from '@/features/program/general/lib/combined-class-edit-policy'
import {
  type CombinedClassLeadTeacherCandidate,
} from '@/features/program/general/lib/combined-class-lead-teacher'
import { InstitutionCombinedClassLeadTeacherModal } from '@/features/program/shared/ui/detail-modal/components/institution-combined-class-lead-teacher-modal'
import { InstitutionCombinedClassCompleteModal } from '@/features/program/shared/ui/detail-modal/components/institution-combined-class-complete-modal'
import {
  buildProgramApiUnavailableSaveContent,
  notifyProgramApiUnavailable,
  PROGRAM_API_UNAVAILABLE_TITLE,
} from '@/features/program/shared/lib/program-api-unavailable'
import { shouldUseGeneralApplicationsRemoteApi } from '@/features/program/general/api/applications-remote-capabilities'
import {
  listAdminCommentsByTargetRemote,
  resolveLatestAdminCommentText,
  upsertAdminCommentByTargetRemote,
} from '@/features/program/general/api/admin-comments-api-client'
import { generalApplicationsQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { fetchMemberRolePrivacyUnmask } from '@/features/user/api/member-privacy-unmask'
import { MESSAGES } from '@/shared/constants/messages'
import { formatParticipatingCombinedClassDisplay } from '@/features/program/general/lib/participating-institution-detail-edit'
import { InstitutionCombinedClassEditCell } from '@/features/program/general/ui/detail-modal/applications/applicant-detail/institution-combined-class-edit-cell'
import {
  withProgramDetailTdDivider,
  ProgramDetailTdSegmentWrap,
  renderProgramDetailPipeSeparated,
  renderDetailInfoPipeSeparated,
} from '@/features/program/shared/ui/program-detail-td-divider'
import { isCmsAdminUser } from '@/features/user/shared/lib/admin-provisioned-member-policy'
import { useAuthStore } from '@/features/auth/model/auth-store'
import './participating-institutions-section.css'
import './instructor-assignment-status-text.css'
import { ParticipatingInstitutionApplicationInfo } from './participating-institution-application-info'
import { ParticipatingInstitutionScheduleChangeModal } from './participating-institution-schedule-change-modal'
import {
  getParticipatingInstitutionActivityWithdrawScheduleOptions,
  resolveParticipatingInstitutionActivityWithdrawPatch,
} from '@/features/program/general/lib/participating-institution-activity-withdraw'
import { buildParticipatingSchoolPreferredScheduleLines } from '@/features/program/general/lib/participating-school-session-display'
import {
  ActivityWithdrawScheduleModal,
  type ActivityWithdrawScheduleModalPayload,
} from '@/features/program/shared/ui/activity-withdraw-schedule-modal'
import './school-detail-fullpage-view.css'
import '@/features/program/general/ui/detail-modal/applications/applicant-detail/institution-basic-info.css'

import {
  GENERAL_PARTICIPATING_INSTITUTION_DETAIL_TAB_KEYS,
  getGeneralParticipatingInstitutionDetailTabKeys,
  normalizeParticipatingInstitutionDetailTab,
  type GeneralParticipatingInstitutionDetailTabKey,
  type ParticipatingInstitutionDetailTabKey,
} from '../../../lib/participating-institution-detail-tabs'
import type { GeneralProgramNavigationCapabilities } from '../../../hooks/use-general-program-navigation'
import { isTrainedTeachersDetailProgram } from '@/features/program/trained-teachers/lib/is-trained-teachers-detail-program'
import { TrainedTeachersParticipatingInstitutionDetailView } from '@/features/program/trained-teachers/ui/institution-detail/participating-institution-detail-view'

export {
  GENERAL_PARTICIPATING_INSTITUTION_DETAIL_TAB_KEYS,
  normalizeParticipatingInstitutionDetailTab as normalizeGeneralParticipatingInstitutionDetailTab,
  normalizeParticipatingInstitutionDetailTab,
  type GeneralParticipatingInstitutionDetailTabKey,
  type ParticipatingInstitutionDetailTabKey,
}

/** @deprecated 일반 참여 기관 상세와 동일 — URL 파라미터 호환용 */
export const SCHOOL_DETAIL_TAB_KEYS = GENERAL_PARTICIPATING_INSTITUTION_DETAIL_TAB_KEYS
export type SchoolDetailTabKey = ParticipatingInstitutionDetailTabKey

export const SCHOOL_DETAIL_DISABLED_TAB_KEYS: readonly SchoolDetailTabKey[] = []

export function normalizeSchoolDetailTab(
  tab: SchoolDetailTabKey,
  program?: Program | null
): SchoolDetailTabKey {
  return normalizeParticipatingInstitutionDetailTab(tab, program)
}

function isSchoolDetailTabDisabled(key: SchoolDetailTabKey): boolean {
  return SCHOOL_DETAIL_DISABLED_TAB_KEYS.includes(key)
}

const SCHOOL_DETAIL_TAB_LABELS: Record<GeneralParticipatingInstitutionDetailTabKey, string> = {
  application: '신청 정보',
  students: '학생 명단',
  instructors: '강사 배정 현황',
  attendance: '출석 관리',
  posts: '게시글',
}

export type GeneralParticipatingInstitutionDetailViewProps = SchoolDetailFullpageViewProps

/** 배정된 강사 테이블용 행 (표시용 확장 필드 포함) */
interface AssignedInstructorDisplayRow extends SchoolDetailInstructorRow {
  no: number
  homeAddress?: string
  distanceToSchool?: string
  assignedDate?: string
  assignedTime?: string
  assignedSession?: string
  assignedScheduleLine?: string
  assignmentId?: string
  instructorMemberId?: string
  scheduleId?: string
}

type WaitingInstructorRow = WaitingInstructorRowMock

/** 필요 배정 인원(분모) — program detail participantRecruitmentInfo.maxAssignableInstructors SSOT */
function resolveRequiredInstructorCount(program: Program): number {
  const fromRecruitment =
    program.generalCommonInfo?.participantRecruitmentInfo?.maxAssignableInstructors
  if (typeof fromRecruitment === 'number' && fromRecruitment > 0) return fromRecruitment
  return 2
}
function getWaitingInstructorRowInstructorId(row: WaitingInstructorRow): string {
  return row.instructorId ?? row.id
}

function renderWaitingInstructorTableEmpty() {
  return (
    <div className="school-detail-fullpage-view__waiting-table-empty" role="status">
      배정 대기 중인 강사가 없습니다.
    </div>
  )
}

/** td 내 세로 디바이더 — 1×13px, default-BK @ 50%, 양옆 gap 12px */
function TdDivider() {
  return <span className="school-detail-fullpage-view__td-divider" aria-hidden />
}

/** 세그먼트 배열을 디바이더로 이어서 반환 */
function withTdDivider(segments: ReactNode[]) {
  return (
    <>
      {segments.reduce<ReactNode[]>((acc, seg, i) => {
        if (i > 0) acc.push(<TdDivider key={`d-${i}`} />)
        acc.push(<span key={i}>{seg}</span>)
        return acc
      }, [])}
    </>
  )
}

function buildCombinedClassViewValue(
  detail: SchoolDetailForModal,
  programEligible = true
): ReactNode {
  if (!programEligible) return '해당 없음'
  const display = formatParticipatingCombinedClassDisplay(detail)
  if (display === '미신청') return display
  const parts = display.split(' | ').map(part => part.trim()).filter(Boolean)
  if (parts.length <= 1) return parts[0] ?? display
  return (
    <ProgramDetailTdSegmentWrap>
      {withProgramDetailTdDivider(parts)}
    </ProgramDetailTdSegmentWrap>
  )
}

function formatAssignedInstructorScheduleExport(row: AssignedInstructorDisplayRow): string {
  if (row.assignedScheduleLine) return row.assignedScheduleLine
  const date = row.assignedDate ?? '-'
  const time = row.assignedTime ?? '-'
  if (date === '-' && time === '-') return '-'
  const dateTime =
    date !== '-' && time !== '-'
      ? `${date} ${time}`
      : date !== '-'
        ? date
        : time
  if (row.assignedSession) return `${dateTime} | ${row.assignedSession}`
  return dateTime
}

function buildAssignedScheduleLineFromSessionIds(
  schoolId: string,
  sessions: ParticipatingSchoolRow['sessions'],
  sessionIds: string[] | undefined
): string | undefined {
  if (!sessions?.length || !sessionIds?.length) return undefined
  const selectedSessionIds = new Set(sessionIds)
  const selectedSessions = sessions.filter(session =>
    selectedSessionIds.has(buildSchoolAddInstructorSessionSlotKey(schoolId, session))
  )
  return buildParticipatingSchoolPreferredScheduleLines(selectedSessions)[0]
}

function renderAssignedInstructorTableEmpty() {
  return (
    <div className="school-detail-fullpage-view__waiting-table-empty" role="status">
      배정된 강사가 없습니다.
    </div>
  )
}

function formatWaitingInstructorHopeScheduleExport(row: WaitingInstructorRow): string {
  if (row.hopeScheduleLine) return row.hopeScheduleLine
  const date = row.hopeDate ?? '-'
  const time = row.hopeTime ?? '-'
  const session = row.hopeSession
  if (date === '-' && time === '-') return '-'
  const dateTime =
    date !== '-' && time !== '-'
      ? `${date} ${time}`
      : date !== '-'
        ? date
        : time
  if (!session) return dateTime
  return `${dateTime} | ${session}`
}

export interface SchoolDetailFullpageViewProps {
  program: Program
  detail: SchoolDetailForModal
  row: ParticipatingSchoolRow
  navigationCapabilities?: GeneralProgramNavigationCapabilities
  /** 합반 대상 lookup — 동일 프로그램 참여 기관 전체 목록 */
  participatingSchoolList?: ParticipatingSchoolRow[]
  /** URL 쿼리 파라미터와 연동 시 활성 탭 (제공 시 controlled) */
  activeTab?: SchoolDetailTabKey
  /** 탭 변경 시 호출 (쿼리 파라미터 갱신용) */
  onTabChange?: (key: SchoolDetailTabKey) => void
  onClearSchoolId: () => void
  onSaveBasicInfo?: (patch: Partial<SchoolDetailForModal> & { id: string }) => void
  onSaveCombinedClass?: (params: {
    combinedClassApplication: '신청' | '미신청'
    combinedClassPartnerSchoolIds: string[]
  }) => Promise<void>
  combinedClassReadOnly?: boolean
  onSaveInstructorInfo?: (schoolId: string, instructors: InstructorListFormInstructor[]) => void
  savedBasicPatches?: Record<string, Partial<SchoolDetailForModal>>
  savedInstructorPatches?: Record<string, InstructorListFormInstructor[]>
  instructorList: ParticipatingInstructorRow[]
  /** 승인 취소 버튼 클릭 후 컨펌 시 호출 (프로그램 승인 현황 → 승인 취소) */
  onCancelApproval?: (schoolId: string) => void
  /** 신청 정보 탭 교재 현황 태그 클릭 시 상태 변경 (참여 기관 목록·mock과 동기화) */
  onTextbookStatusChange?: (schoolId: string, status: TextbookStatusKey) => void
  // TODO(api): 학교 중첩 상세 mutation 잔여 —
  // application 편집·students·instructors 배정은 BE PATCH/assignment 계약 후.
  // attendance: progress 탭은 dashboard schedules hybrid. 기관 상세 attendance는 세션 mock+schedule GET 재사용 예정.
  // posts: EnrollmentProgramDetailPostsTab + createGeneralProgramPost (invalidate는 부모에서 연결).
}

export function GeneralParticipatingInstitutionDetailView(
  props: SchoolDetailFullpageViewProps
) {
  if (isTrainedTeachersDetailProgram(props.program)) {
    return <TrainedTeachersParticipatingInstitutionDetailView {...props} />
  }

  const {
    program,
    detail,
    row,
    navigationCapabilities,
    participatingSchoolList = [],
    activeTab: activeTabFromUrl,
    onTabChange,
    onClearSchoolId: _onClearSchoolId,
    onSaveBasicInfo,
    onSaveCombinedClass,
    combinedClassReadOnly = false,
    onSaveInstructorInfo,
    savedBasicPatches = {},
    savedInstructorPatches = {},
    instructorList,
    onCancelApproval: _onCancelApproval,
    onTextbookStatusChange,
  } = props

  const currentUser = useAuthStore(state => state.user)
  const showAdminCommentSection = isCmsAdminUser(currentUser)
  const { showAlert } = useCmsAlert()
  const [internalTab, setInternalTab] = useState<SchoolDetailTabKey>('application')
  const visibleDetailTabs = useMemo(
    () =>
      getGeneralParticipatingInstitutionDetailTabKeys(
        program,
        navigationCapabilities?.studentRosterEnabled
      ),
    [navigationCapabilities?.studentRosterEnabled, program]
  )
  const normalizedActiveTab = normalizeSchoolDetailTab(
    activeTabFromUrl !== undefined && activeTabFromUrl !== null ? activeTabFromUrl : internalTab,
    program
  )
  const activeTab = visibleDetailTabs.includes(
    normalizedActiveTab as GeneralParticipatingInstitutionDetailTabKey
  )
    ? normalizedActiveTab
    : 'application'
  const setActiveTab = (key: SchoolDetailTabKey) => {
    if (onTabChange) onTabChange(key)
    else setInternalTab(key)
  }
  const [selectedAssignedKeys, setSelectedAssignedKeys] = useState<React.Key[]>([])
  const [selectedWaitingKeys, setSelectedWaitingKeys] = useState<React.Key[]>([])
  const [completedWaitingRowKeys, setCompletedWaitingRowKeys] = useState<Set<string>>(() => new Set())
  const [disabledWaitingInstructorIds, setDisabledWaitingInstructorIds] = useState<Set<string>>(
    () => new Set()
  )
  const [assignedScheduleLinesByInstructorId, setAssignedScheduleLinesByInstructorId] = useState<
    Record<string, string>
  >({})
  const [addAssignModalOpen, setAddAssignModalOpen] = useState(false)
  const [addAssignOverflowOpen, setAddAssignOverflowOpen] = useState(false)
  const [addModalOpenedFromOverflow, setAddModalOpenedFromOverflow] = useState(false)
  const [selectAssignConfirmOpen, setSelectAssignConfirmOpen] = useState(false)
  const [unassignConfirmOpen, setUnassignConfirmOpen] = useState(false)
  const [unassignCompleteModal, setUnassignCompleteModal] = useState<{
    instructorNames: string[]
    targetNames: string[]
    reason: string
  } | null>(null)
  const [selectAssignOverflowOpen, setSelectAssignOverflowOpen] = useState(false)
  const [selectAssignNewGuideOpen, setSelectAssignNewGuideOpen] = useState(false)
  const [selectAssignFeeApprovalOpen, setSelectAssignFeeApprovalOpen] = useState(false)
  const [selectAssignPendingInstructor, setSelectAssignPendingInstructor] = useState<{
    id: string
    name: string
    instructorFeeGradeLabel?: string
  } | null>(null)
  const [assignCompleteModal, setAssignCompleteModal] = useState<{
    instructorName: string
    schoolName: string
    currentCount: number
    showApprovalAlarmSection: boolean
  } | null>(null)
  const [openRoleDropdownId, setOpenRoleDropdownId] = useState<string | null>(null)
  const [leadRoleChangeConfirm, setLeadRoleChangeConfirm] = useState<{
    instructorId: string
    newLeadInstructorName: string
  } | null>(null)
  const [textbookStatusDropdownOpen, setTextbookStatusDropdownOpen] = useState(false)
  const [postWriteModalOpen, setPostWriteModalOpen] = useState(false)
  const { posts: remotePosts, files: remotePostFiles, isRemoteDataSource: postsRemote, invalidatePosts } =
    useGeneralProgramPosts(program.id)
  const [activityWithdrawModalOpen, setActivityWithdrawModalOpen] = useState(false)
  const [scheduleChangeModalOpen, setScheduleChangeModalOpen] = useState(false)
  const [activityWithdrawSubmitting, setActivityWithdrawSubmitting] = useState(false)
  const [adminCommentModalOpen, setAdminCommentModalOpen] = useState(false)
  const [adminCommentDraft, setAdminCommentDraft] = useState('')
  const [adminCommentError, setAdminCommentError] = useState<string | undefined>()

  useEffect(() => {
    setTextbookStatusDropdownOpen(false)
    setSelectedAssignedKeys([])
    setSelectedWaitingKeys([])
    setCompletedWaitingRowKeys(new Set())
    setDisabledWaitingInstructorIds(new Set())
    setAssignedScheduleLinesByInstructorId({})
  }, [detail.id])

  useEffect(() => {
    setAdminCommentModalOpen(false)
    setAdminCommentDraft('')
    setAdminCommentError(undefined)
    setActivityWithdrawModalOpen(false)
    setScheduleChangeModalOpen(false)
  }, [detail.id, detail.adminComment, savedBasicPatches[detail.id]?.adminComment])

  const organizationApplicationId = Number(row.organizationApplicationId)
  const hasOrganizationApplicationId = Number.isFinite(organizationApplicationId)
  const adminCommentQuery = useQuery({
    queryKey: generalApplicationsQueryKeys.commentsByTarget(
      'ORGANIZATION_APPLICATION',
      hasOrganizationApplicationId ? String(organizationApplicationId) : ''
    ),
    queryFn: () =>
      listAdminCommentsByTargetRemote({
        targetType: 'ORGANIZATION_APPLICATION',
        targetId: organizationApplicationId,
        screenCode: 'ORGANIZATION_APPLICATION',
      }),
    enabled:
      showAdminCommentSection &&
      shouldUseGeneralApplicationsRemoteApi() &&
      hasOrganizationApplicationId,
    staleTime: 30_000,
  })
  const remoteAdminComment = resolveLatestAdminCommentText(adminCommentQuery.data)
  const mergedDetail = {
    ...detail,
    ...(adminCommentQuery.data ? { adminComment: remoteAdminComment } : {}),
    ...savedBasicPatches[detail.id],
  }
  const sessions = row.sessions ?? []
  const isActivityWithdrawn = mergedDetail.activityWithdrawn === true
  const availableActions = mergedDetail.availableActions ?? row.availableActions
  const canRequestActivityWithdraw =
    !isActivityWithdrawn &&
    (availableActions == null || availableActions.includes('GIVE_UP'))
  const showActivityWithdrawButton =
    isActivityWithdrawn || availableActions == null || availableActions.includes('GIVE_UP')
  const isCompanySchool = isCompanySchoolProgram(program)
  const requiredInstructorCount = resolveRequiredInstructorCount(program)
  const programId = String(program.id)
  const progressRemoteEnabled = useProgramProgressRemoteEnabledForSurface(programId)
  const companySchoolAssignmentConflictsEnabled =
    isCompanySchool && shouldUseCompanySchoolProgramProgressRemoteApi()

  const occupiedLectureDatesQuery = useQuery({
    queryKey: companySchoolQueryKeys.instructorAssignmentConflicts(programId),
    queryFn: () => fetchCompanySchoolAssignmentBoard(programId),
    enabled: companySchoolAssignmentConflictsEnabled,
    staleTime: 30_000,
  })
  const assignmentBoard = occupiedLectureDatesQuery.data
  const occupiedLectureDatesByInstructorId = assignmentBoard?.occupiedLectureDatesByInstructorId
  const queryClient = useQueryClient()

  const activityWithdrawScheduleOptions = useMemo(
    () => getParticipatingInstitutionActivityWithdrawScheduleOptions(program, sessions),
    [program, sessions]
  )

  const [combinedClassLeadTeacherModal, setCombinedClassLeadTeacherModal] = useState<{
    memberRowIds: string[]
    candidates: CombinedClassLeadTeacherCandidate[]
  } | null>(null)
  const [combinedClassCompleteLabel, setCombinedClassCompleteLabel] = useState<string | null>(null)

  const applicationInfoEdit = useParticipatingInstitutionDetailEdit({
    detail: mergedDetail,
    row,
    program,
    participatingSchoolList,
    onSaveBasicInfo,
    onSaveCombinedClass,
    combinedClassReadOnly,
    onCombinedClassApplied: params => {
      setCombinedClassLeadTeacherModal(params)
    },
  })

  const {
    isEditing: isApplicationInfoEditing,
    draft: applicationInfoDraft,
    textbookOptions,
    textbookDisplay,
    usesTextbook,
    canEditTextbook,
    sameSchoolGradeOptions,
    isCombinedClassProgramEligible: isCombinedClassProgramEligibleFlag,
    isCombinedClassApplyRadioDisabled,
    enterEdit: enterApplicationInfoEdit,
    cancelEdit: cancelApplicationInfoEdit,
    saveEdit: saveApplicationInfoEdit,
    updateDraft: updateApplicationInfoDraft,
  } = applicationInfoEdit

  const programProgressStatus =
    mergedDetail.programProgressStatus ??
    resolveProgramEnrollmentDisplayStatusFromLabel(mergedDetail.programProgressLabel) ??
    getProgramProgressDisplayStatus(program)

  const resolvePersonalInfoAccessItem = useCallback(
    () => mergedDetail.schoolName ?? row.schoolName ?? '학교 상세 정보',
    [mergedDetail.schoolName, row.schoolName]
  )
  const revealInstitutionTeacherPersonalInfo = useCallback(
    async (reason: string) => {
      if (row.teacherMemberId == null) {
        throw new Error('담당 교사 회원 ID가 없습니다.')
      }
      return fetchMemberRolePrivacyUnmask(row.teacherMemberId, reason, 'SCHOOL')
    },
    [row.teacherMemberId]
  )
  const applyInstitutionTeacherPersonalInfo = useCallback(
    (payload: unknown) => {
      if (payload == null || typeof payload !== 'object') return
      const privacy = payload as { name?: unknown; phone?: unknown; email?: unknown }
      onSaveBasicInfo?.({
        id: detail.id,
        ...(typeof privacy.name === 'string' ? { teacherName: privacy.name } : {}),
        ...(typeof privacy.phone === 'string' ? { teacherMobile: privacy.phone } : {}),
        ...(typeof privacy.email === 'string' ? { teacherEmail: privacy.email } : {}),
      })
    },
    [detail.id, onSaveBasicInfo]
  )

  const {
    personalInfoRevealed,
    onPrivacyControlClick: handlePrivacyToggleClick,
    confirmModal: personalInfoRevealModal,
  } = usePersonalInfoReveal({
    resolveAccessItem: resolvePersonalInfoAccessItem,
    revealPersonalInfo: revealInstitutionTeacherPersonalInfo,
    onPrivacyUnmasked: applyInstitutionTeacherPersonalInfo,
    resetDeps: [detail.id],
    controlMode: 'toggleRemask',
  })

  const privacyMasked = !personalInfoRevealed

  const handleAdminCommentEditEnter = useCallback(() => {
    if (isApplicationInfoEditing) return
    setAdminCommentDraft(mergedDetail.adminComment ?? '')
    setAdminCommentError(undefined)
    setAdminCommentModalOpen(true)
  }, [isApplicationInfoEditing, mergedDetail.adminComment])

  const handleAdminCommentSave = useCallback(async () => {
    const trimmed = adminCommentDraft.trim()
    if (shouldUseGeneralApplicationsRemoteApi()) {
      if (!hasOrganizationApplicationId) {
        void showAlert({
          title: '안내',
          content: MESSAGES.error.save,
        })
        return
      }
      try {
        const result = await upsertAdminCommentByTargetRemote({
          targetType: 'ORGANIZATION_APPLICATION',
          targetId: organizationApplicationId,
          screenCode: 'ORGANIZATION_APPLICATION',
          comment: trimmed,
        })
        onSaveBasicInfo?.({
          id: detail.id,
          adminComment: result.commentText,
        })
        void queryClient.invalidateQueries({
          queryKey: generalApplicationsQueryKeys.commentsByTarget(
            'ORGANIZATION_APPLICATION',
            String(organizationApplicationId)
          ),
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
      content: buildProgramApiUnavailableSaveContent('참여 기관 관리자 코멘트'),
    })
  }, [
    adminCommentDraft,
    detail.id,
    hasOrganizationApplicationId,
    onSaveBasicInfo,
    organizationApplicationId,
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

  const handleRequestActivityWithdraw = useCallback(() => {
    if (isActivityWithdrawn) {
      showAlert({
        title: '활동 포기 안내',
        content: PARTICIPATING_INSTITUTION_ALREADY_ACTIVITY_WITHDRAWN_ALERT_MESSAGE,
      })
      return
    }
    if (!canRequestActivityWithdraw || isApplicationInfoEditing) return
    setActivityWithdrawModalOpen(true)
  }, [
    canRequestActivityWithdraw,
    isActivityWithdrawn,
    isApplicationInfoEditing,
    showAlert,
  ])

  const handleCancelActivityWithdraw = useCallback(() => {
    if (activityWithdrawSubmitting) return
    setActivityWithdrawModalOpen(false)
  }, [activityWithdrawSubmitting])

  const handleConfirmActivityWithdraw = useCallback(
    async (payload: ActivityWithdrawScheduleModalPayload) => {
      const patch = resolveParticipatingInstitutionActivityWithdrawPatch(
        program,
        sessions,
        payload.stopSessionKey
      )
      if (!patch) return

      const reason =
        [mergedDetail.schoolName, payload.stopScheduleLabel].filter(Boolean).join(' · ') ||
        payload.stopScheduleLabel ||
        '활동 포기'

      if (progressRemoteEnabled) {
        setActivityWithdrawSubmitting(true)
        try {
          await giveUpGeneralParticipatingInstitution(programId, detail.id, reason)
          onSaveBasicInfo?.({ id: detail.id, ...patch })
          await queryClient.invalidateQueries({
            queryKey: generalProgramProgressQueryKeys.institutions(programId),
          })
          setActivityWithdrawModalOpen(false)
          showAlert({
            title: '활동 포기',
            content: `${mergedDetail.schoolName} 기관이 활동 포기 처리되었습니다.`,
          })
        } catch (error) {
          const message =
            error instanceof Error && error.message.trim()
              ? error.message
              : '활동 포기 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.'
          showAlert({
            title: '활동 포기 실패',
            content: message,
          })
        } finally {
          setActivityWithdrawSubmitting(false)
        }
        return
      }

      notifyProgramApiUnavailable(
        'general-participating-institution-give-up',
        '일반 프로그램 · 참여 기관 활동 포기'
      )
    },
    [
      detail.id,
      mergedDetail.schoolName,
      onSaveBasicInfo,
      program,
      programId,
      progressRemoteEnabled,
      queryClient,
      sessions,
      showAlert,
    ]
  )

  const instructors =
    savedInstructorPatches[detail.id] !== undefined
      ? savedInstructorPatches[detail.id].map(inv => ({
          ...inv,
          settlementStatus: 'awaiting_confirmation' as SettlementStatusKey,
        }))
      : getInstructorRowsForSchool(row.schoolName, instructorList)

  const assignedInstructorIdSet = useMemo(
    () => new Set(instructors.map(instructor => instructor.id)),
    [instructors]
  )

  /** 담당 교사 정보: 담당 교사 : 이름 | Tel : … | M : … | E-mail : … */
  const teacherDisplaySegments = [
    mergedDetail.teacherName && `담당 교사 : ${mergedDetail.teacherName}`,
    mergedDetail.teacherPhone && `Tel : ${displayServerPiiAsIs(mergedDetail.teacherPhone, mergedDetail.teacherPhone)}`,
    mergedDetail.teacherMobile && `M : ${displayServerPiiAsIs(mergedDetail.teacherMobile, mergedDetail.teacherMobile)}`,
    mergedDetail.teacherEmail && `E-mail : ${displayServerPiiAsIs(mergedDetail.teacherEmail, mergedDetail.teacherEmail)}`,
  ].filter((v): v is string => Boolean(v))
  const mealDisplay =
    mergedDetail.mealNotice === '가능'
      ? '가능'
      : mergedDetail.mealProvided
        ? renderDetailInfoPipeSeparated(`제공 | ${mergedDetail.mealNotice ?? ''}`)
        : '미제공'

  /** ` | ` 구분 값 → td 디바이더 (안내 사항·성범죄 경력 조회서 등) */
  const formatGuidanceSegmentValue = (raw?: string): ReactNode => {
    const text = raw?.trim()
    if (!text) return '-'
    const parts = text
      .split(' | ')
      .map(s => s.trim())
      .filter(Boolean)
    if (parts.length <= 1) return parts[0] ?? '-'
    return withTdDivider(parts)
  }
  /** 배정된 강사 테이블용 행 — 1사1교는 assignment API */
  const assignedRows: AssignedInstructorDisplayRow[] = useMemo(
    () => {
      if (isCompanySchool && assignmentBoard) {
        const orgAppId = row.organizationApplicationId ?? ''
        if (!orgAppId) return []
        const apiRows = buildCompanySchoolAssignedInstructorRows({
          assignments: assignmentBoard.assignments,
          organizationApplicationId: orgAppId,
          instructorNameByMemberId: assignmentBoard.instructorNameByMemberId,
          scheduleLabelById: assignmentBoard.scheduleLabelById,
        })
        return apiRows.map(r => ({
          id: r.id,
          no: r.no,
          role: r.role,
          instructorName: r.instructorName,
          contact: '',
          email: '',
          settlementStatus: 'none' as SettlementStatusKey,
          homeAddress: r.homeAddress,
          distanceToSchool: r.distanceToSchool,
          assignedDate: r.assignedDate,
          assignedTime: r.assignedTime,
          assignedSession: r.assignedSession,
          assignedScheduleLine: [r.assignedDate, r.assignedTime, r.assignedSession]
            .filter(Boolean)
            .join(' '),
          assignmentId: r.assignmentId,
          instructorMemberId: r.instructorMemberId,
          scheduleId: r.scheduleId,
        }))
      }
      const rows = getAssignedInstructorDisplayRows(instructors)
      if (!isCompanySchool) return rows
      const defaultScheduleLine = buildParticipatingSchoolPreferredScheduleLines(row.sessions)[0]
      return rows.map(assignedRow => ({
        ...assignedRow,
        assignedScheduleLine:
          assignedScheduleLinesByInstructorId[assignedRow.id] ?? defaultScheduleLine,
      }))
    },
    [
      instructors,
      isCompanySchool,
      row.sessions,
      row.organizationApplicationId,
      assignedScheduleLinesByInstructorId,
      assignmentBoard,
    ]
  )

  /** 배정 대기 — 1사1교는 승인 강사신청 + 희망일정 API (가짜 일정 금지) */
  const waitingRows: WaitingInstructorRow[] = useMemo(
    () => {
      if (isCompanySchool) {
        if (!assignmentBoard) return []
        const assignedMemberIds = new Set<string>()
        for (const a of assignmentBoard.assignments) {
          if (a.organizationApplicationId == null) continue
          if (
            row.organizationApplicationId &&
            String(a.organizationApplicationId) === row.organizationApplicationId
          ) {
            if (a.instructorMemberId != null) assignedMemberIds.add(String(a.instructorMemberId))
          }
        }
        return buildCompanySchoolWaitingInstructorRows({
          schoolName: row.schoolName,
          sessions: row.sessions,
          approvedInstructors: assignmentBoard.approvedInstructorApplications,
          assignedInstructorMemberIds: assignedMemberIds,
          occupiedLectureDatesByInstructorId,
        })
          .filter(waitingRow => !completedWaitingRowKeys.has(waitingRow.id))
          .map(waitingRow => {
            const instructorId = getWaitingInstructorRowInstructorId(waitingRow)
            if (
              disabledWaitingInstructorIds.has(instructorId) &&
              waitingRow.assignmentStatus === 'waiting'
            ) {
              return { ...waitingRow, assignmentStatus: 'unavailable' as const }
            }
            return waitingRow
          })
      }

      return getWaitingInstructorRows(row.schoolName, instructorList, participatingSchoolList).filter(
        waitingRow => !assignedInstructorIdSet.has(getWaitingInstructorRowInstructorId(waitingRow))
      )
    },
    [
      row.schoolName,
      row.sessions,
      row.organizationApplicationId,
      instructorList,
      participatingSchoolList,
      isCompanySchool,
      occupiedLectureDatesByInstructorId,
      completedWaitingRowKeys,
      disabledWaitingInstructorIds,
      assignedInstructorIdSet,
      assignmentBoard,
    ]
  )

  const assignedInstructorNames = useMemo(
    () => instructors.map(i => i.instructorName),
    [instructors]
  )

  /** 1사1교는 assignment API 행 수, 그 외는 로컬 instructors */
  const currentAssignedCount = isCompanySchool ? assignedRows.length : instructors.length

  const currentLeadName =
    (isCompanySchool
      ? assignedRows.find(i => i.role === 'lead')?.instructorName
      : instructors.find((i: { role: InstructorRoleKey }) => i.role === 'lead')?.instructorName) ??
    null

  const selectedWaitingRows = useMemo(
    () =>
      waitingRows.filter(
        r => selectedWaitingKeys.includes(r.id) && r.assignmentStatus === 'waiting'
      ),
    [waitingRows, selectedWaitingKeys]
  )

  /** 선택 배정 — 1사1교는 API create, 그 외는 기존 로컬 반영 */
  const finalizeSelectAssign = useCallback(
    async (rows: WaitingInstructorRow[], showApprovalAlarmSection: boolean) => {
      if (rows.length === 0) return

      if (isCompanySchool && companySchoolAssignmentConflictsEnabled) {
        const orgAppId = row.organizationApplicationId
        if (!orgAppId) {
          showAlert({
            title: '안내',
            content:
              '기관 신청 ID가 없어 배정할 수 없습니다. 참여 기관 API에 organizationApplicationId(sourceApplicationId) 매핑이 필요합니다.',
          })
          return
        }
        if (!assignmentBoard) {
          showAlert({ title: '안내', content: '배정 데이터를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.' })
          return
        }

        try {
          let leadAssigned = currentAssignedCount > 0 && assignedRows.some(i => i.role === 'lead')
          for (const waitingRow of rows) {
            const memberIdRaw =
              (waitingRow as { instructorMemberId?: string }).instructorMemberId ??
              getWaitingInstructorRowInstructorId(waitingRow)
            const memberId = Number(memberIdRaw)
            if (!Number.isFinite(memberId) || memberId <= 0) {
              showAlert({
                title: '안내',
                content: `강사 memberId가 없어 배정할 수 없습니다. (${waitingRow.instructorName})`,
              })
              return
            }
            const scheduleUnresolved = Boolean(
              (waitingRow as { scheduleUnresolved?: boolean }).scheduleUnresolved
            )
            const requestedScheduleId = (waitingRow as { requestedScheduleId?: number })
              .requestedScheduleId
            const resolvedScheduleId = (waitingRow as { resolvedScheduleId?: number | null })
              .resolvedScheduleId
            if (scheduleUnresolved) {
              showAlert({
                title: '안내',
                content: `희망일에 대응하는 program schedule이 없습니다. (일정 미생성) — ${waitingRow.instructorName}`,
              })
              return
            }

            let scheduleId: number | undefined =
              typeof resolvedScheduleId === 'number' && resolvedScheduleId > 0
                ? resolvedScheduleId
                : undefined
            if (scheduleId == null && requestedScheduleId == null) {
              scheduleId =
                findScheduleIdForLectureDate(
                  assignmentBoard.schedules,
                  waitingRow.hopeDate ?? waitingRow.hopeScheduleLine
                ) ?? undefined
            }
            if (scheduleId == null && requestedScheduleId == null) {
              showAlert({
                title: '안내',
                content:
                  '희망일에 대응하는 program schedule이 없습니다. requestedScheduleId 또는 schedule 매핑이 필요합니다.',
              })
              return
            }
            const applicationIdRaw = (waitingRow as { instructorApplicationId?: string })
              .instructorApplicationId
            await createInstructorAssignmentRemote(programId, {
              instructorMemberId: memberId,
              ...(scheduleId != null ? { scheduleId } : {}),
              ...(requestedScheduleId != null ? { requestedScheduleId } : {}),
              organizationApplicationId: Number(orgAppId),
              instructorApplicationId: applicationIdRaw ? Number(applicationIdRaw) : undefined,
              scheduleLead: !leadAssigned,
            })
            leadAssigned = true
          }
          await queryClient.invalidateQueries({
            queryKey: companySchoolQueryKeys.instructorAssignmentConflicts(programId),
          })
          setSelectAssignConfirmOpen(false)
          setSelectAssignNewGuideOpen(false)
          setSelectAssignFeeApprovalOpen(false)
          setSelectAssignPendingInstructor(null)
          setSelectAssignOverflowOpen(false)
          setSelectedWaitingKeys([])
          const instructorNameLabel =
            rows.length === 1
              ? (rows[0]?.instructorName ?? '')
              : Array.from(new Set(rows.map(r => r.instructorName))).join(', ')
          setAssignCompleteModal({
            instructorName: instructorNameLabel,
            schoolName: row.schoolName,
            currentCount: (assignmentBoard.assignments.length ?? 0) + rows.length,
            showApprovalAlarmSection,
          })
        } catch (error) {
          const code =
            error && typeof error === 'object' && 'response' in error
              ? String(
                  (error as { response?: { data?: { error?: { code?: string }; code?: string } } })
                    .response?.data?.error?.code ??
                    (error as { response?: { data?: { code?: string } } }).response?.data?.code ??
                    ''
                )
              : ''
          showAlert({
            title: '배정 실패',
            content: isOneSchoolPerDayConflictErrorCode(code)
              ? ONE_SCHOOL_PER_DAY_CONFLICT_ALERT_MESSAGE
              : '강사 배정에 실패했습니다. 목록을 새로고침한 뒤 다시 시도해 주세요.',
          })
        }
        return
      }

      const existingFormList: InstructorListFormInstructor[] = instructors.map(
        ({ id, role, instructorName, contact, email }) => ({
          id,
          role,
          instructorName,
          contact,
          email,
        })
      )
      const newFormList: InstructorListFormInstructor[] = rows
        .reduce<InstructorListFormInstructor[]>((acc, w) => {
          const instructorId = getWaitingInstructorRowInstructorId(w)
          if (acc.some(item => item.id === instructorId)) return acc
          const fromList = instructorList.find(r => r.id === instructorId)
          if (!fromList) return acc
          acc.push({
            id: fromList.id,
            role:
              instructors.length === 0 && acc.length === 0
                ? ('lead' as InstructorRoleKey)
                : ('assistant' as InstructorRoleKey),
            instructorName: fromList.instructorName,
            contact: fromList.contact ?? '',
            email: fromList.email ?? '',
          })
          return acc
        }, [])

      if (newFormList.length === 0) return

      onSaveInstructorInfo?.(detail.id, [...existingFormList, ...newFormList])
      setSelectAssignConfirmOpen(false)
      setSelectAssignNewGuideOpen(false)
      setSelectAssignFeeApprovalOpen(false)
      setSelectAssignPendingInstructor(null)
      setSelectAssignOverflowOpen(false)
      setCompletedWaitingRowKeys(prev => {
        const next = new Set(prev)
        rows.forEach(waitingRow => next.add(waitingRow.id))
        return next
      })
      setDisabledWaitingInstructorIds(prev => {
        const next = new Set(prev)
        rows.forEach(waitingRow => next.add(getWaitingInstructorRowInstructorId(waitingRow)))
        return next
      })
      setAssignedScheduleLinesByInstructorId(prev => {
        const next = { ...prev }
        rows.forEach(waitingRow => {
          const scheduleLine = waitingRow.hopeScheduleLine ?? formatWaitingInstructorHopeScheduleExport(waitingRow)
          if (scheduleLine && scheduleLine !== '-') {
            next[getWaitingInstructorRowInstructorId(waitingRow)] = scheduleLine
          }
        })
        return next
      })
      setSelectedWaitingKeys([])

      const instructorNameLabel =
        rows.length === 1
          ? (rows[0]?.instructorName ?? '')
          : Array.from(new Set(rows.map(r => r.instructorName))).join(', ')

      setAssignCompleteModal({
        instructorName: instructorNameLabel,
        schoolName: row.schoolName,
        currentCount: instructors.length + newFormList.length,
        showApprovalAlarmSection,
      })
    },
    [
      instructors,
      instructorList,
      detail.id,
      onSaveInstructorInfo,
      row.schoolName,
      row.organizationApplicationId,
      isCompanySchool,
      companySchoolAssignmentConflictsEnabled,
      assignmentBoard,
      assignedRows,
      currentAssignedCount,
      programId,
      queryClient,
      showAlert,
    ]
  )

  /** 선택 배정 확인 모달에서 "강사 배정" 클릭 시 (이미 승인된 강사) */
  const handleSelectAssignConfirm = useCallback(() => {
    finalizeSelectAssign(selectedWaitingRows, false)
  }, [finalizeSelectAssign, selectedWaitingRows])

  const handleUnassignClick = useCallback(() => {
    if (selectedAssignedKeys.length === 0) {
      showAlert({ title: '안내', content: INSTRUCTOR_ASSIGN_UNASSIGN_SELECT_INSTRUCTOR_ALERT_MESSAGE })
      return
    }
    setUnassignConfirmOpen(true)
  }, [selectedAssignedKeys.length, showAlert])

  const handleSelectAssignClick = useCallback(() => {
    if (selectedWaitingRows.length === 0) {
      showAlert({ title: '안내', content: INSTRUCTOR_ASSIGN_SELECT_INSTRUCTOR_ALERT_MESSAGE })
      return
    }

    const unapprovedRows = selectedWaitingRows.filter(w => {
      const participating = instructorList.find(r => r.id === getWaitingInstructorRowInstructorId(w))
      return !isWaitingInstructorProgramApproved(w.instructorName, participating, programId)
    })

    if (unapprovedRows.length > 0) {
      if (selectedWaitingRows.length > 1) {
        showAlert({
          title: '안내',
          content: INSTRUCTOR_ASSIGN_SELECT_UNAPPROVED_SINGLE_ONLY_ALERT_MESSAGE,
        })
        return
      }
      const target = unapprovedRows[0]!
      const participating = instructorList.find(
        r => r.id === getWaitingInstructorRowInstructorId(target)
      )
      setSelectAssignPendingInstructor({
        id: target.id,
        name: target.instructorName,
        instructorFeeGradeLabel: resolveWaitingInstructorFeeGradeLabel(
          target.instructorName,
          participating,
          programId
        ),
      })
      setSelectAssignNewGuideOpen(true)
      return
    }

    setSelectAssignConfirmOpen(true)
  }, [selectedWaitingRows, instructorList, programId, showAlert])

  /** 배정 취소 확인 모달에서 "배정 취소" 클릭 시 */
  const handleUnassignConfirm = useCallback(
    async (payload: PermissionModalPayload) => {
      if (selectedAssignedKeys.length === 0) return
      const removedRows = assignedRows.filter(r => selectedAssignedKeys.includes(r.id))
      const removedInstructorNames = removedRows.map(r => r.instructorName)

      if (isCompanySchool && companySchoolAssignmentConflictsEnabled) {
        try {
          for (const removed of removedRows) {
            const assignmentId = removed.assignmentId ?? removed.id
            if (!assignmentId) continue
            await cancelInstructorAssignmentRemote(String(assignmentId))
          }
          await queryClient.invalidateQueries({
            queryKey: companySchoolQueryKeys.instructorAssignmentConflicts(programId),
          })
        } catch {
          showAlert({
            title: '배정 취소 실패',
            content: '강사 배정 취소에 실패했습니다. 목록을 새로고침한 뒤 다시 시도해 주세요.',
          })
          return
        }
      } else {
        const newFormList: InstructorListFormInstructor[] = instructors
          .filter(inv => !selectedAssignedKeys.includes(inv.id))
          .map(({ id, role, instructorName, contact, email }) => ({
            id,
            role,
            instructorName,
            contact,
            email,
          }))
        onSaveInstructorInfo?.(detail.id, newFormList)
      }

      setAssignedScheduleLinesByInstructorId(prev => {
        const next = { ...prev }
        selectedAssignedKeys.forEach(key => {
          delete next[String(key)]
        })
        return next
      })
      setUnassignConfirmOpen(false)
      setSelectedAssignedKeys([])
      setUnassignCompleteModal({
        instructorNames: removedInstructorNames,
        targetNames: [row.schoolName],
        reason: payload.reason,
      })
    },
    [
      selectedAssignedKeys,
      assignedRows,
      instructors,
      detail.id,
      onSaveInstructorInfo,
      row.schoolName,
      isCompanySchool,
      companySchoolAssignmentConflictsEnabled,
      programId,
      queryClient,
      showAlert,
    ]
  )

  const applyRoleChange = useCallback(
    async (instructorId: string, newRole: InstructorRoleKey) => {
      if (
        isCompanySchool &&
        companySchoolAssignmentConflictsEnabled &&
        newRole === 'lead'
      ) {
        const target = assignedRows.find(r => r.id === instructorId)
        const memberId = Number(target?.instructorMemberId)
        const orgAppId = Number(row.organizationApplicationId)
        const scheduleId = Number(target?.scheduleId)
        if (!Number.isFinite(memberId) || memberId <= 0 || !Number.isFinite(orgAppId) || orgAppId <= 0) {
          showAlert({
            title: '안내',
            content: '대표 강사 변경에 필요한 instructorMemberId / organizationApplicationId가 없습니다.',
          })
          return
        }
        try {
          await putRepresentativeInstructorRemote(programId, {
            instructorMemberId: memberId,
            organizationApplicationId: orgAppId,
            ...(Number.isFinite(scheduleId) && scheduleId > 0 ? { scheduleId } : {}),
          })
          await queryClient.invalidateQueries({
            queryKey: companySchoolQueryKeys.instructorAssignmentConflicts(programId),
          })
          setOpenRoleDropdownId(null)
          return
        } catch {
          showAlert({
            title: '대표 강사 변경 실패',
            content: '대표 강사 지정에 실패했습니다. 잠시 후 다시 시도해 주세요.',
          })
          return
        }
      }

      const updated = instructors.map(inv => ({
        ...inv,
        role: inv.id === instructorId ? newRole : newRole === 'lead' ? 'assistant' : inv.role,
      }))
      const formList: InstructorListFormInstructor[] = updated.map(
        ({ id, role, instructorName, contact, email }) => ({
          id,
          role,
          instructorName,
          contact,
          email,
        })
      )
      onSaveInstructorInfo?.(detail.id, formList)
      setOpenRoleDropdownId(null)
    },
    [
      instructors,
      detail.id,
      onSaveInstructorInfo,
      isCompanySchool,
      companySchoolAssignmentConflictsEnabled,
      assignedRows,
      row.organizationApplicationId,
      programId,
      queryClient,
      showAlert,
    ]
  )
  const handleRoleChange = useCallback(
    (instructorId: string, newRole: InstructorRoleKey) => {
      const roleSource = isCompanySchool ? assignedRows : instructors
      if (newRole === 'lead') {
        const currentLead = roleSource.find(inv => inv.role === 'lead')
        const target = roleSource.find(inv => inv.id === instructorId)
        if (currentLead && currentLead.id !== instructorId && target) {
          setLeadRoleChangeConfirm({
            instructorId,
            newLeadInstructorName: target.instructorName,
          })
          setOpenRoleDropdownId(null)
          return
        }
      }
      void applyRoleChange(instructorId, newRole)
    },
    [instructors, assignedRows, isCompanySchool, applyRoleChange]
  )

  const assignedInstructorColumns: ColumnsType<AssignedInstructorDisplayRow> = useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: 80, align: 'center' },
      {
        title: '역할',
        dataIndex: 'role',
        key: 'role',
        width: 116,
        align: 'center',
        onHeaderCell: () => ({ className: STATUS_DROPDOWN_CELL_TAG_100_HEADER_CLASSNAME }),
        onCell: () => ({
          className: `${STATUS_DROPDOWN_CELL_CLASSNAME} ${STATUS_DROPDOWN_CELL_TAG_100_CLASSNAME}`,
        }),
        render: (role: InstructorRoleKey, record: AssignedInstructorDisplayRow) => (
          <StatusDropdownCell<InstructorRoleKey>
            status={role}
            statusOptions={['lead', 'assistant']}
            renderBadge={r => (
              <EditableStatusBadge
                label={INSTRUCTOR_ROLE_LABELS[r]}
                tone={getInstructorRoleBadgeTone(r)}
              />
            )}
            isItemDisabled={(cur, opt) => cur === opt}
            onChange={key => handleRoleChange(record.id, key as InstructorRoleKey)}
            isOpen={openRoleDropdownId === record.id}
            onOpenChange={open => setOpenRoleDropdownId(open ? record.id : null)}
            emptyPlaceholder="-"
            tagLayout="tag100"
          />
        ),
      },
      {
        title: '강사명',
        dataIndex: 'instructorName',
        key: 'instructorName',
        width: 100,
        render: (v: string | undefined) => (v ? v : '-'),
      },
      {
        title: '자택 주소지',
        dataIndex: 'homeAddress',
        key: 'homeAddress',
        width: 160,
        render: (v: string | undefined) => (
          <PrivacyHomeAddressDisplay address={v} revealed={!privacyMasked} />
        ),
      },
      {
        title: '기관과의 거리',
        dataIndex: 'distanceToSchool',
        key: 'distanceToSchool',
        width: 100,
        align: 'center',
        render: (v: string | undefined) => v ?? '-',
      },
      {
        title: '담당 교육 진행 일정',
        dataIndex: 'assignedDate',
        key: 'assignedDate',
        width: 280,
        align: 'center',
        render: (v: string | undefined, record: AssignedInstructorDisplayRow) => {
          if (record.assignedScheduleLine) {
            return renderProgramDetailPipeSeparated(record.assignedScheduleLine)
          }
          const date = v ?? '-'
          const time = record.assignedTime ?? '-'
          if (!date && !time) return '-'
          return (
            <span className="school-detail-fullpage-view__assigned-datetime-cell">
              <span>{date}</span>
              <TdDivider />
              <span>{time}</span>
            </span>
          )
        },
      },
      {
        title: '정산 현황',
        dataIndex: 'settlementStatus',
        key: 'settlementStatus',
        width: 120,
        align: 'center',
        render: (status: InstructorSettlementUiStatus) => (
          <InstructorSettlementStatusText status={status} />
        ),
      },
    ],
    [openRoleDropdownId, handleRoleChange, privacyMasked]
  )

  const waitingInstructorColumns: ColumnsType<WaitingInstructorRow> = useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: 80, align: 'center' },
      {
        title: '강사명',
        dataIndex: 'instructorName',
        key: 'instructorName',
        width: 100,
        render: (v: string | undefined) => (v ? v : '-'),
      },
      {
        title: '자택 주소지',
        dataIndex: 'homeAddress',
        key: 'homeAddress',
        width: 160,
        render: (v: string | undefined) => (
          <PrivacyHomeAddressDisplay address={v} revealed={!privacyMasked} />
        ),
      },
      {
        title: '기관과의 거리',
        dataIndex: 'distanceToSchool',
        key: 'distanceToSchool',
        width: 100,
        align: 'center',
        render: (v: string | undefined) => v ?? '-',
      },
      {
        title: '교육 진행 희망 일정',
        dataIndex: 'hopeDate',
        key: 'hopeDate',
        width: 300,
        align: 'center',
        render: (v: string | undefined, record: WaitingInstructorRow) => {
          if (record.hopeScheduleLine) {
            return renderProgramDetailPipeSeparated(record.hopeScheduleLine)
          }
          const date = v ?? '-'
          const time = record.hopeTime ?? '-'
          const session = record.hopeSession
          if (date === '-' && time === '-') return '-'
          const dateTime =
            date !== '-' && time !== '-'
              ? `${date} ${time}`
              : date !== '-'
                ? date
                : time
          if (!session) return dateTime
          return (
            <span className="school-detail-fullpage-view__assigned-datetime-cell">
              <span>{dateTime}</span>
              <TdDivider />
              <span>{session}</span>
            </span>
          )
        },
      },
      {
        title: '배정 현황',
        dataIndex: 'assignmentStatus',
        key: 'assignmentStatus',
        width: 100,
        align: 'center',
        render: (status: WaitingInstructorRow['assignmentStatus']) => (
          <span
            className={`school-detail-fullpage-view__assignment-status school-detail-fullpage-view__assignment-status--${status}`}
          >
            {WAITING_INSTRUCTOR_ASSIGNMENT_STATUS_LABELS[status]}
          </span>
        ),
      },
    ],
    [privacyMasked]
  )

  const assignedInstructorExportColumns: ColumnsType<{
    no: number
    role: string
    instructorName: string
    homeAddress: string
    distanceToSchool: string
    assignedSchedule: string
    settlementStatus: string
  }> = useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no' },
      { title: '역할', dataIndex: 'role', key: 'role' },
      { title: '강사명', dataIndex: 'instructorName', key: 'instructorName' },
      { title: '자택 주소지', dataIndex: 'homeAddress', key: 'homeAddress' },
      { title: '기관과의 거리', dataIndex: 'distanceToSchool', key: 'distanceToSchool' },
      { title: '담당 교육 진행 일정', dataIndex: 'assignedSchedule', key: 'assignedSchedule' },
      { title: '정산 현황', dataIndex: 'settlementStatus', key: 'settlementStatus' },
    ],
    []
  )

  const waitingInstructorExportColumns: ColumnsType<{
    no: number
    instructorName: string
    homeAddress: string
    distanceToSchool: string
    hopeSchedule: string
    assignmentStatus: string
  }> = useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no' },
      { title: '강사명', dataIndex: 'instructorName', key: 'instructorName' },
      { title: '자택 주소지', dataIndex: 'homeAddress', key: 'homeAddress' },
      { title: '기관과의 거리', dataIndex: 'distanceToSchool', key: 'distanceToSchool' },
      { title: '교육 진행 희망 일정', dataIndex: 'hopeSchedule', key: 'hopeSchedule' },
      { title: '배정 현황', dataIndex: 'assignmentStatus', key: 'assignmentStatus' },
    ],
    []
  )

  const assignedInstructorExportRows = useMemo(
    () =>
      assignedRows.map(row => ({
        no: row.no,
        role: INSTRUCTOR_ROLE_LABELS[row.role],
        instructorName: row.instructorName,
        homeAddress: displayServerPiiAsIs(row.homeAddress),
        distanceToSchool: row.distanceToSchool ?? '-',
        assignedSchedule: formatAssignedInstructorScheduleExport(row),
        settlementStatus: getInstructorSettlementStatusLabel(row.settlementStatus),
      })),
    [assignedRows]
  )

  const waitingInstructorExportRows = useMemo(
    () =>
      waitingRows.map(row => ({
        no: row.no,
        instructorName: row.instructorName,
        homeAddress: displayServerPiiAsIs(row.homeAddress),
        distanceToSchool: row.distanceToSchool ?? '-',
        hopeSchedule: formatWaitingInstructorHopeScheduleExport(row),
        assignmentStatus: WAITING_INSTRUCTOR_ASSIGNMENT_STATUS_LABELS[row.assignmentStatus],
      })),
    [waitingRows]
  )

  const {
    exportExcel: exportAssignedInstructorsExcel,
    isExporting: isAssignedInstructorsExcelExporting,
  } = useTableExcelExport({
    columns: assignedInstructorExportColumns,
    data: assignedInstructorExportRows,
    filename: '배정된 강사 목록',
  })

  const {
    exportExcel: exportWaitingInstructorsExcel,
    isExporting: isWaitingInstructorsExcelExporting,
  } = useTableExcelExport({
    columns: waitingInstructorExportColumns,
    data: waitingInstructorExportRows,
    filename: '배정 대기 강사 목록',
  })

  /** 기본 정보 — 상단(진행·교재) / 하단(기관·신청) 테이블 분리 (시안) */
  const textbookStatusCell =
    onTextbookStatusChange != null ? (
      <span className={STATUS_DROPDOWN_CELL_INLINE_TAG100_CLASSNAME}>
        <StatusDropdownCell<TextbookStatusKey>
          status={mergedDetail.textbookStatus}
          statusOptions={TEXTBOOK_STATUS_OPTION_KEYS}
          renderBadge={s => <TextbookStatusBadge status={s} />}
          isItemDisabled={(cur, opt) => cur === opt}
          onChange={newStatus => onTextbookStatusChange(detail.id, newStatus)}
          isOpen={textbookStatusDropdownOpen}
          onOpenChange={setTextbookStatusDropdownOpen}
          tagLayout="tag100"
        />
      </span>
    ) : (
      <TextbookStatusBadge status={mergedDetail.textbookStatus} />
    )

  const hasSelectedTextbook =
    (mergedDetail.textbookId?.trim() ?? '') !== '' || (mergedDetail.textbookName?.trim() ?? '') !== ''
  const textbookNameView = isCompanySchool && !hasSelectedTextbook ? '미정' : textbookDisplay.textbookName
  const kitsAndQty =
    hasSelectedTextbook && textbookDisplay.textbookKits > 0
      ? `${textbookDisplay.textbookKits}키트 (${textbookDisplay.textbookQuantity}권)`
      : '-'

  const textbookSelectEditCell =
    isApplicationInfoEditing && applicationInfoDraft && canEditTextbook ? (
      <div className="institution-basic-info__field-stack school-detail-fullpage-view__textbook-select-only">
        <CmsSelect
          className="institution-basic-info__full-width-control"
          inputSize="large"
          placeholder="교재명 선택"
          value={applicationInfoDraft.textbookId || undefined}
          options={textbookOptions.map(option => ({
            label: option.label,
            value: option.value,
          }))}
          onChange={value => {
            const selected = textbookOptions.find(option => option.value === value)
            updateApplicationInfoDraft({
              textbookId: selected?.value ?? String(value ?? ''),
              textbookName: selected?.textbookName ?? '',
            })
          }}
        />
      </div>
    ) : null

  const textbookCell =
    isApplicationInfoEditing && canEditTextbook ? (
      textbookSelectEditCell
    ) : (
      <div className="participating-institution-application-info__textbook-value">
        <ProgramDetailTdSegmentWrap>
          {withProgramDetailTdDivider([textbookNameView, kitsAndQty, textbookStatusCell])}
        </ProgramDetailTdSegmentWrap>
      </div>
    )

  const combinedClassProgramEligible =
    isCombinedClassProgramEligibleFlag ?? isCombinedClassProgramEligible(program)

  const combinedClassCell =
    isApplicationInfoEditing && applicationInfoDraft ? (
      <InstitutionCombinedClassEditCell
        combinedClassApplication={applicationInfoDraft.combinedClassApplication}
        partnerIds={applicationInfoDraft.combinedClassPartnerSchoolIds}
        onCombinedClassApplicationChange={next =>
          updateApplicationInfoDraft({
            combinedClassApplication: next,
            combinedClassPartnerSchoolIds:
              next === '신청' ? applicationInfoDraft.combinedClassPartnerSchoolIds : [],
          })
        }
        onPartnerIdsChange={partnerIds =>
          updateApplicationInfoDraft({ combinedClassPartnerSchoolIds: partnerIds })
        }
        sameSchoolGradeOptions={sameSchoolGradeOptions}
        isProgramEligible={combinedClassProgramEligible}
        isApplyRadioDisabled={isCombinedClassApplyRadioDisabled}
        readOnly={combinedClassReadOnly}
        showEffectiveFromNextScheduleNotice={hasCompletedCombinedClassEducationSessions(
          row.sessions
        )}
      />
    ) : (
      buildCombinedClassViewValue(mergedDetail, combinedClassProgramEligible)
    )

  const isApplicationDetailEditing =
    isApplicationInfoEditing && applicationInfoDraft != null

  const classCountOptions = useMemo(
    () => buildInstitutionClassCountOptions(resolveProgramParticipantMaxClassCount(program)),
    [program]
  )
  const classAndCountDisplay =
    isApplicationDetailEditing ? (
      <InstitutionClassAndStudentCountEdit
        classCount={applicationInfoDraft.classCount}
        studentCount={applicationInfoDraft.studentCount}
        classCountOptions={classCountOptions}
        onChange={patch => updateApplicationInfoDraft(patch)}
      />
    ) : (
      withProgramDetailTdDivider([
        `${mergedDetail.classCount}개 학급`,
        `총 ${mergedDetail.studentCount}명`,
      ])
    )

  return (
    <div className="school-detail-fullpage-view">
      <CmsTextTabs
        className="school-detail-fullpage-view__tabs-row"
        activeKey={activeTab}
        onChange={key => setActiveTab(key as SchoolDetailTabKey)}
        items={visibleDetailTabs.map(key => ({
          key,
          label: SCHOOL_DETAIL_TAB_LABELS[key as GeneralParticipatingInstitutionDetailTabKey],
          disabled: isSchoolDetailTabDisabled(key),
          title: isSchoolDetailTabDisabled(key) ? '해당 화면은 준비 중입니다.' : undefined,
        }))}
        trailing={
          activeTab === 'application' ? (
            <>
              {showActivityWithdrawButton ? (
                <CmsButton
                  variant="delete"
                  size="large"
                  width={140}
                  disabled={
                    !canRequestActivityWithdraw ||
                    isApplicationInfoEditing ||
                    activityWithdrawSubmitting
                  }
                  onClick={handleRequestActivityWithdraw}
                >
                  활동 포기
                </CmsButton>
              ) : null}
              <ProgramEditInfoActions
                isEditing={isApplicationInfoEditing}
                idleVariant="secondary"
                onEdit={enterApplicationInfoEdit}
                onCancel={cancelApplicationInfoEdit}
                onSave={() => {
                  void saveApplicationInfoEdit()
                }}
              />
              {showAdminCommentSection ? (
                <CmsButton
                  variant="primary"
                  size="large"
                  width={140}
                  disabled={isApplicationInfoEditing}
                  onClick={handleAdminCommentEditEnter}
                >
                  코멘트 작성
                </CmsButton>
              ) : null}
              <PersonalInfoRevealButton
                labelMode="toggle"
                revealed={personalInfoRevealed}
                style={{ minWidth: 180 }}
                onClick={handlePrivacyToggleClick}
              />
            </>
          ) : activeTab === 'posts' ? (
            <CmsButton variant="primary" size="large" width={160} onClick={() => setPostWriteModalOpen(true)}>
              게시글 등록
            </CmsButton>
          ) : null
        }
      />

      <div className="program-detail-fullpage-modal__content school-detail-fullpage-view__content">
        {activeTab === 'application' && (
          <div className="program-detail-fullpage-modal__info-tab school-detail-fullpage-view__application-tab">
            <ParticipatingInstitutionApplicationInfo
              isBasicInfoEditing={isApplicationInfoEditing}
              showAdminComment={showAdminCommentSection}
              adminComment={mergedDetail.adminComment}
              isAdminCommentEditing={false}
              adminCommentError={adminCommentError}
              programProgressCell={
                <ProgramEnrollmentStatusText status={programProgressStatus} />
              }
              textbookCell={textbookCell}
              combinedClassCell={combinedClassCell}
              usesTextbook={isCompanySchool || usesTextbook}
              hideCombinedClass={isCompanySchool}
              schoolName={
                isApplicationDetailEditing ? (
                  <InstitutionReadonlyInput value={mergedDetail.schoolName ?? ''} />
                ) : (
                  mergedDetail.schoolName
                )
              }
              educationGrade={
                isApplicationDetailEditing ? (
                  <InstitutionGradeSelectEdit
                    value={applicationInfoDraft.educationGrade}
                    onChange={value => updateApplicationInfoDraft({ educationGrade: value })}
                  />
                ) : (
                  mergedDetail.educationGrade
                )
              }
              region={
                isApplicationDetailEditing ? (
                  <InstitutionReadonlyInput value={mergedDetail.region ?? ''} />
                ) : (
                  mergedDetail.region
                )
              }
              addressDetail={
                isApplicationDetailEditing ? (
                  <InstitutionAddressDetailEdit
                    value={applicationInfoDraft.addressDetail}
                    onChange={value => updateApplicationInfoDraft({ addressDetail: value })}
                  />
                ) : (
                  mergedDetail.addressDetail ?? '-'
                )
              }
              classAndCount={classAndCountDisplay}
              educationFormat={
                isApplicationDetailEditing ? (
                  <InstitutionEducationFormatRadios
                    value={applicationInfoDraft.educationFormat}
                    onChange={value => updateApplicationInfoDraft({ educationFormat: value })}
                  />
                ) : (
                  mergedDetail.educationFormat ?? '-'
                )
              }
              teacherInfo={
                isApplicationDetailEditing ? (
                  <InstitutionTeacherEdit
                    name={applicationInfoDraft.teacherName}
                    phone={applicationInfoDraft.teacherPhone}
                    mobile={applicationInfoDraft.teacherMobile}
                    email={applicationInfoDraft.teacherEmail}
                    onChange={patch => updateApplicationInfoDraft(patch)}
                  />
                ) : teacherDisplaySegments.length > 0 ? (
                  withProgramDetailTdDivider(teacherDisplaySegments)
                ) : (
                  '-'
                )
              }
              applicationReason={
                isApplicationDetailEditing ? (
                  <InstitutionMultilineEdit
                    value={applicationInfoDraft.applicationReason}
                    onChange={value => updateApplicationInfoDraft({ applicationReason: value })}
                    placeholder="신청 사유를 입력해 주세요."
                  />
                ) : (
                  mergedDetail.applicationReason ?? '-'
                )
              }
              otherRequests={
                isApplicationDetailEditing ? (
                  <InstitutionMultilineEdit
                    value={applicationInfoDraft.otherRequests}
                    onChange={value => updateApplicationInfoDraft({ otherRequests: value })}
                    placeholder="기타 요청사항을 입력해 주세요."
                  />
                ) : (
                  mergedDetail.otherRequests ?? '-'
                )
              }
              computerInRoom={
                isApplicationDetailEditing ? (
                  <InstitutionComputerInRoomEdit
                    value={applicationInfoDraft.computerInRoom}
                    onChange={value => updateApplicationInfoDraft({ computerInRoom: value })}
                  />
                ) : (
                  mergedDetail.computerInRoom ?? '-'
                )
              }
              waitingPlace={
                isApplicationDetailEditing ? (
                  <InstitutionWaitingRoomEdit
                    available={applicationInfoDraft.waitingRoomAvailable}
                    location={applicationInfoDraft.waitingRoomLocation}
                    onChange={patch => updateApplicationInfoDraft(patch)}
                  />
                ) : (
                  mergedDetail.waitingRoomLocation ?? '-'
                )
              }
              mealInfo={
                isApplicationDetailEditing ? (
                  <InstitutionMealEdit
                    provided={applicationInfoDraft.mealProvided}
                    notice={applicationInfoDraft.mealNotice}
                    onChange={patch => updateApplicationInfoDraft(patch)}
                  />
                ) : (
                  mealDisplay
                )
              }
              otherNotes={
                isApplicationDetailEditing ? (
                  <InstitutionMultilineEdit
                    value={applicationInfoDraft.parkingInfo}
                    onChange={value => updateApplicationInfoDraft({ parkingInfo: value })}
                    placeholder="주차, 전달사항 등을 입력해 주세요."
                  />
                ) : (
                  mergedDetail.parkingInfo ?? '-'
                )
              }
              criminalCheck={formatGuidanceSegmentValue(mergedDetail.criminalCheckRequest)}
              program={program}
              sessions={sessions}
              useCompanySchoolScheduleFormat={isCompanySchool}
              onScheduleChangeClick={() => setScheduleChangeModalOpen(true)}
            />
          </div>
        )}

        {activeTab === 'students' && (
          <div className="program-detail-fullpage-modal__info-tab">
            <SchoolDetailStudentListSection
              schoolId={detail.id}
              studentCount={detail.studentCount}
              classCount={mergedDetail.classCount}
              schoolName={mergedDetail.schoolName ?? row.schoolName ?? ''}
              educationGrade={mergedDetail.educationGrade ?? ''}
              programId={program.id}
              programTitle={program.mainTitle ?? program.title ?? ''}
              programStartDate={program.startDate}
              programEndDate={program.endDate}
              participationAppliedAt={mergedDetail.participationAppliedAt}
              hasStudentSatisfactionSurvey={
                normalizeGeneralSurveyMenuKeys(program.generalSurveyMenuKeys ?? []).includes(
                  'satisfaction'
                )
              }
              readOnly={false}
              onViewDetail={() => {}}
              onSaveEdit={() => {}}
            />
          </div>
        )}

        {activeTab === 'instructors' && (
          <div className="program-detail-fullpage-modal__info-tab school-detail-fullpage-view__instructor-tab">
            {/* 섹션 1: 배정된 강사 목록 */}
            <div className="school-detail-fullpage-view__instructor-section">
              <div className="table-header-actions">
                <div className="table-header-title--wrapper">
                  <span className="table-title">
                    배정된 강사 목록
                  </span>
                  <span className="table-description">
                    {currentAssignedCount} / {requiredInstructorCount}명
                  </span>
                </div>
                <div className="info-section-buttons--wrapper">
                  <CmsButton
                    variant="delete"
                    size="large"
                    onClick={handleUnassignClick}
                  >
                    배정 취소
                  </CmsButton>
                  <CmsButton
                    variant="primary"
                    size="large"
                    className="school-detail-fullpage-view__btn-assign participating-institutions-section__btn-approve"
                    onClick={() => {
                      if (currentAssignedCount >= requiredInstructorCount) {
                        setAddAssignOverflowOpen(true)
                      } else {
                        setAddAssignModalOpen(true)
                      }
                    }}
                  >
                    추가 배정
                  </CmsButton>
                  <ExcelButton
                    onClick={exportAssignedInstructorsExcel}
                    loading={isAssignedInstructorsExcelExporting}
                  />
                </div>
              </div>
              <div className="participating-institutions-section__table-wrap school-detail-fullpage-view__assignment-table-scroll">
                <Table<AssignedInstructorDisplayRow>
                  className="participating-institutions-section__table cms-data-table"
                  rowKey="id"
                  size="middle"
                  pagination={false}
                  scroll={{ x: 1100 }}
                  rowSelection={{
                    columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
                    selectedRowKeys: selectedAssignedKeys,
                    onChange: keys => setSelectedAssignedKeys(keys),
                  }}
                  columns={assignedInstructorColumns}
                  dataSource={assignedRows}
                  locale={{ emptyText: renderAssignedInstructorTableEmpty() }}
                />
              </div>
            </div>

            {/* 섹션 2: 배정 대기 강사 목록 */}
            <div className="school-detail-fullpage-view__instructor-section school-detail-fullpage-view__instructor-section--waiting">
              <div className="table-header-actions">
                <div className="table-header-title--wrapper">
                  <span className="table-title">
                    배정 대기 강사 목록
                  </span>
                  <span className="table-description">
                    {waitingRows.length}건
                  </span>
                </div>
                <div className="info-section-buttons--wrapper">
                  <CmsButton
                    variant="primary"
                    size="large"
                    className="school-detail-fullpage-view__btn-assign participating-institutions-section__btn-approve"
                    onClick={handleSelectAssignClick}
                  >
                    선택 배정
                  </CmsButton>
                  <ExcelButton
                    onClick={exportWaitingInstructorsExcel}
                    loading={isWaitingInstructorsExcelExporting}
                  />
                </div>
              </div>
              <div className="participating-institutions-section__table-wrap school-detail-fullpage-view__waiting-table-scroll">
                <Table<WaitingInstructorRow>
                  className="participating-institutions-section__table cms-data-table"
                  rowKey="id"
                  size="middle"
                  pagination={false}
                  scroll={{ x: 1000 }}
                  rowSelection={{
                    columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
                    selectedRowKeys: selectedWaitingKeys,
                    onChange: keys => setSelectedWaitingKeys(keys),
                    getCheckboxProps: record => ({
                      disabled: record.assignmentStatus === 'unavailable',
                    }),
                  }}
                  columns={waitingInstructorColumns}
                  dataSource={waitingRows}
                  locale={{ emptyText: renderWaitingInstructorTableEmpty() }}
                  rowClassName={record =>
                    record.assignmentStatus === 'unavailable'
                      ? 'school-detail-fullpage-view__waiting-row--unavailable'
                      : ''
                  }
                />
              </div>
            </div>

            <SchoolDetailAssignOverflowModal
              open={addAssignOverflowOpen}
              onCancel={() => setAddAssignOverflowOpen(false)}
              requiredCount={requiredInstructorCount}
              variant="add"
              onConfirm={() => {
                setAddAssignOverflowOpen(false)
                setAddModalOpenedFromOverflow(true)
                setAddAssignModalOpen(true)
              }}
            />
            <SchoolDetailAddInstructorAssignModal
              open={addAssignModalOpen}
              onCancel={() => {
                setAddAssignModalOpen(false)
                setAddModalOpenedFromOverflow(false)
              }}
              programId={String(program.id)}
              schoolId={row.id}
              schoolName={row.schoolName}
              schoolSessions={row.sessions}
              participatingInstructorList={instructorList}
              participatingSchoolList={participatingSchoolList}
              assignedInstructorNames={assignedInstructorNames}
              currentLeadInstructorName={currentLeadName}
              currentAssignedCount={currentAssignedCount}
              requiredInstructorCount={requiredInstructorCount}
              overflowAlreadyConfirmed={addModalOpenedFromOverflow}
              onAdd={(_instructorId, role, option, _meta) => {
                const nextRole: InstructorRoleKey = instructors.length === 0 ? 'lead' : role
                const existingFormList: InstructorListFormInstructor[] = instructors.map(
                  ({ id, role: r, instructorName, contact, email }) => ({
                    id,
                    role: nextRole === 'lead' ? 'assistant' : r,
                    instructorName,
                    contact,
                    email,
                  })
                )
                const newInstructor: InstructorListFormInstructor = {
                  id: option.value,
                  role: nextRole,
                  instructorName: option.label,
                  contact: option.contact ?? '',
                  email: option.email ?? '',
                }
                onSaveInstructorInfo?.(detail.id, [...existingFormList, newInstructor])
                const scheduleLine = buildAssignedScheduleLineFromSessionIds(
                  row.id,
                  row.sessions,
                  _meta?.sessionIds
                )
                if (scheduleLine) {
                  setAssignedScheduleLinesByInstructorId(prev => ({
                    ...prev,
                    [option.value]: scheduleLine,
                  }))
                }
                setAddAssignModalOpen(false)
                setAddModalOpenedFromOverflow(false)
                setAssignCompleteModal({
                  instructorName: option.label,
                  schoolName: row.schoolName,
                  currentCount: instructors.length + 1,
                  showApprovalAlarmSection: _meta?.isNewApproval ?? false,
                })
              }}
            />
            <SchoolDetailSelectAssignConfirmModal
              open={selectAssignConfirmOpen}
              onCancel={() => {
                setSelectAssignConfirmOpen(false)
              }}
              schoolName={row.schoolName}
              instructorNames={selectedWaitingRows.map(r => r.instructorName)}
              currentCount={currentAssignedCount}
              requiredCount={requiredInstructorCount}
              onConfirm={() => {
                if (currentAssignedCount + selectedWaitingRows.length > requiredInstructorCount) {
                  setSelectAssignConfirmOpen(false)
                  setSelectAssignOverflowOpen(true)
                } else {
                  handleSelectAssignConfirm()
                }
              }}
            />
            <SchoolDetailNewAssignGuideModal
              open={selectAssignNewGuideOpen}
              variant="guide-only"
              onCancel={() => {
                setSelectAssignNewGuideOpen(false)
                setSelectAssignPendingInstructor(null)
              }}
              instructorName={selectAssignPendingInstructor?.name ?? ''}
              schoolName={row.schoolName}
              currentCount={currentAssignedCount}
              requiredCount={requiredInstructorCount}
              onConfirm={() => {
                setSelectAssignNewGuideOpen(false)
                setSelectAssignFeeApprovalOpen(true)
              }}
            />
            <InstructorFeeApprovalModal
              open={selectAssignFeeApprovalOpen && selectAssignPendingInstructor != null}
              instructorName={selectAssignPendingInstructor?.name ?? ''}
              instructorFeeGradeLabel={selectAssignPendingInstructor?.instructorFeeGradeLabel}
              onCancel={() => {
                setSelectAssignFeeApprovalOpen(false)
                setSelectAssignPendingInstructor(null)
              }}
              onConfirm={() => {
                if (!selectAssignPendingInstructor) return
                const rowToAssign = waitingRows.find(
                  r => r.id === selectAssignPendingInstructor.id
                )
                if (!rowToAssign) {
                  setSelectAssignFeeApprovalOpen(false)
                  setSelectAssignPendingInstructor(null)
                  return
                }
                if (currentAssignedCount >= requiredInstructorCount) {
                  setSelectAssignFeeApprovalOpen(false)
                  setSelectAssignOverflowOpen(true)
                  return
                }
                finalizeSelectAssign([rowToAssign], true)
              }}
            />
            <SchoolDetailAssignOverflowModal
              open={selectAssignOverflowOpen}
              onCancel={() => setSelectAssignOverflowOpen(false)}
              requiredCount={requiredInstructorCount}
              variant="select"
              onConfirm={() => {
                if (selectAssignPendingInstructor) {
                  const rowToAssign = waitingRows.find(
                    r => r.id === selectAssignPendingInstructor.id
                  )
                  if (rowToAssign) {
                    finalizeSelectAssign([rowToAssign], true)
                  }
                } else {
                  handleSelectAssignConfirm()
                }
                setSelectAssignOverflowOpen(false)
              }}
            />
            <SchoolDetailAssignCompleteModal
              open={assignCompleteModal != null}
              onClose={() => setAssignCompleteModal(null)}
              instructorName={assignCompleteModal?.instructorName ?? ''}
              schoolName={assignCompleteModal?.schoolName ?? ''}
              currentCount={assignCompleteModal?.currentCount ?? 0}
              requiredCount={requiredInstructorCount}
              showApprovalAlarmSection={assignCompleteModal?.showApprovalAlarmSection ?? false}
            />
            <SchoolDetailUnassignConfirmModal
              open={unassignConfirmOpen}
              onCancel={() => setUnassignConfirmOpen(false)}
              instructorNames={assignedRows
                .filter(r => selectedAssignedKeys.includes(r.id))
                .map(r => r.instructorName)}
              targetNames={[row.schoolName]}
              onConfirm={handleUnassignConfirm}
            />
            <SchoolDetailUnassignCompleteModal
              open={unassignCompleteModal != null}
              onClose={() => setUnassignCompleteModal(null)}
              instructorNames={unassignCompleteModal?.instructorNames ?? []}
              targetNames={unassignCompleteModal?.targetNames ?? []}
              reason={unassignCompleteModal?.reason ?? ''}
            />
            <SchoolDetailLeadInstructorConfirmModal
              open={leadRoleChangeConfirm != null}
              onCancel={() => setLeadRoleChangeConfirm(null)}
              onConfirm={() => {
                if (leadRoleChangeConfirm) {
                  applyRoleChange(leadRoleChangeConfirm.instructorId, 'lead')
                  setLeadRoleChangeConfirm(null)
                }
              }}
              currentLeadInstructorName={currentLeadName ?? ''}
              newLeadInstructorName={leadRoleChangeConfirm?.newLeadInstructorName ?? ''}
            />
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="program-detail-fullpage-modal__info-tab school-detail-fullpage-view__attendance-tab">
            <SchoolDetailAttendanceSection row={row} program={program} />
          </div>
        )}

        {activeTab === 'posts' && (
          <div className="program-detail-fullpage-modal__info-tab school-detail-fullpage-view__posts-tab-wrap">
            <EnrollmentProgramDetailPostsTab
              program={program}
              schoolId={detail.id}
              showWriteButtonInSection={false}
              writeModalOpen={postWriteModalOpen}
              onWriteModalOpenChange={setPostWriteModalOpen}
              postsOverride={postsRemote ? remotePosts : null}
              filesOverride={postsRemote ? remotePostFiles : null}
              onPostWriteSuccess={() => {
                void invalidatePosts()
              }}
            />
          </div>
        )}
      </div>

      <div className="school-detail-fullpage-view__page-bottom-spacer" aria-hidden />

      {personalInfoRevealModal}

      <ActivityWithdrawScheduleModal
        open={activityWithdrawModalOpen}
        scheduleOptions={activityWithdrawScheduleOptions}
        confirming={activityWithdrawSubmitting}
        onCancel={handleCancelActivityWithdraw}
        onConfirm={handleConfirmActivityWithdraw}
      />
      <ParticipatingInstitutionScheduleChangeModal
        open={scheduleChangeModalOpen}
        program={program}
        sessions={sessions}
        onCancel={() => setScheduleChangeModalOpen(false)}
        onConfirm={() => {
          setScheduleChangeModalOpen(false)
          notifyProgramApiUnavailable(
            'general-participating-institution-schedule-change',
            '일반 프로그램 · 참여 기관 교육 진행 일정 변경'
          )
        }}
      />
      <MemberAdminCommentModal
        open={adminCommentModalOpen}
        value={adminCommentDraft}
        onChange={handleAdminCommentDraftChange}
        onCancel={handleAdminCommentModalCancel}
        onConfirm={handleAdminCommentSave}
      />
      <InstitutionCombinedClassLeadTeacherModal
        open={combinedClassLeadTeacherModal != null}
        candidates={combinedClassLeadTeacherModal?.candidates ?? []}
        onCancel={() => setCombinedClassLeadTeacherModal(null)}
        onConfirm={() => {
          notifyProgramApiUnavailable(
            'general-org-merge-lead-teacher-progress',
            '일반 프로그램 · 합반 담당 교사 지정'
          )
          setCombinedClassLeadTeacherModal(null)
        }}
      />
      <InstitutionCombinedClassCompleteModal
        open={combinedClassCompleteLabel != null}
        teacherLabel={combinedClassCompleteLabel ?? ''}
        onClose={() => setCombinedClassCompleteLabel(null)}
      />
    </div>
  )
}

/** @deprecated `GeneralParticipatingInstitutionDetailView` 사용 */
export const SchoolDetailFullpageView = GeneralParticipatingInstitutionDetailView
