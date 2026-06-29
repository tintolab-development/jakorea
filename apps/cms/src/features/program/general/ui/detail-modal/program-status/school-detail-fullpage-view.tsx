/**
 * 일반 프로그램 > 진행 현황 > 참여 기관 상세 (풀페이지 인라인)
 * UJAT 참여 기관 상세는 `features/program/ujat/ui/detail-modal/progress/institutions/detail/` — 별도 구현.
 * 탭: 신청 정보 | 학생 명단 | 강사 배정 현황 | 출석 관리 | 게시글
 * 신청 정보 액션: 활동 포기 | 정보 수정 | 코멘트 작성 | 개인정보 상세보기
 */

import type { ReactNode } from 'react'
import { useState, useMemo, useCallback, useEffect } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { CmsButton, ExcelButton, useCmsAlert } from '@/shared/ui'
import {
  PROGRAM_EDIT_INFO_BUTTON_LABEL,
  resolveProgramEditInfoClick,
} from '@/features/program/shared/lib/program-edit-info-button'
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
import type { ParticipatingSchoolRow, TextbookStatusKey } from '@/data/mock/participating-schools'
import { TEXTBOOK_STATUS_OPTION_KEYS } from '@/data/mock/participating-schools'
import type {
  ParticipatingInstructorRow,
  SettlementStatusKey,
} from '@/data/mock/participating-instructors'
import { InstructorSettlementStatusText } from '@/shared/ui/instructor-settlement-status-text'
import type { InstructorSettlementUiStatus } from '@/shared/constants/instructor-settlement-status'
import type { InstructorListFormInstructor } from '../../../model/school-detail-types'
import {
  getInstructorRowsForSchool,
  getAssignedInstructorDisplayRows,
  getWaitingInstructorRows,
  getCompanySchoolWaitingInstructorScheduleRows,
  type WaitingInstructorRowMock,
} from '../../../lib/school-detail-mock'
import { WAITING_INSTRUCTOR_ASSIGNMENT_STATUS_LABELS } from '../../../lib/waiting-instructor-assignment'
import {
  isWaitingInstructorProgramApproved,
  buildSchoolAddInstructorSessionSlotKey,
  resolveWaitingInstructorFeeGradeLabel,
} from '../../../lib/school-add-instructor-assign'
import {
  maskEmailLocalAfterTwoChars,
  maskMobilePhoneMiddleStars,
} from '../../../lib/teacher-contact-display-mask'
import { MASKING_POLICY } from '@/shared/constants/download-policy'
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
} from '@/shared/components'
import { getInstructorRoleBadgeTone } from '@/shared/constants/editable-status-badge-tones'
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
import { usePersonalInfoReveal } from '@/features/user/detail/lib/use-personal-info-reveal'
import { PersonalInfoRevealButton } from '@/features/user/detail/ui/personal-info-reveal-button'
import {
  InstitutionAddressDetailEdit,
  InstitutionComputerInRoomEdit,
  InstitutionEducationFormatRadios,
  InstitutionMealEdit,
  InstitutionMultilineEdit,
  InstitutionTeacherEdit,
  InstitutionWaitingRoomEdit,
} from '@/features/program/general/ui/detail-modal/applications/applicant-detail/institution-application-edit-fields'
import { useParticipatingInstitutionDetailEdit } from '@/features/program/general/hooks/use-participating-institution-detail-edit'
import { isCombinedClassProgramEligible } from '@/features/program/general/lib/combined-class-edit-policy'
import { formatParticipatingCombinedClassDisplay } from '@/features/program/general/lib/participating-institution-detail-edit'
import { InstitutionCombinedClassEditCell } from '@/features/program/general/ui/detail-modal/applications/applicant-detail/institution-combined-class-edit-cell'
import {
  withProgramDetailTdDivider,
  ProgramDetailTdSegmentWrap,
} from '@/features/program/shared/ui/program-detail-td-divider'
import { isCmsAdminUser } from '@/features/user/shared/lib/admin-provisioned-member-policy'
import { useAuthStore } from '@/features/auth/model/auth-store'
import './participating-institutions-section.css'
import './instructor-assignment-status-text.css'
import { ParticipatingInstitutionApplicationInfo } from './participating-institution-application-info'
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
  normalizeGeneralParticipatingInstitutionDetailTab,
  type GeneralParticipatingInstitutionDetailTabKey,
} from '../../../lib/participating-institution-detail-tabs'

export {
  GENERAL_PARTICIPATING_INSTITUTION_DETAIL_TAB_KEYS,
  normalizeGeneralParticipatingInstitutionDetailTab,
  type GeneralParticipatingInstitutionDetailTabKey,
}

/** @deprecated 일반 참여 기관 상세와 동일 — URL 파라미터 호환용 */
export const SCHOOL_DETAIL_TAB_KEYS = GENERAL_PARTICIPATING_INSTITUTION_DETAIL_TAB_KEYS
export type SchoolDetailTabKey = GeneralParticipatingInstitutionDetailTabKey

export const SCHOOL_DETAIL_DISABLED_TAB_KEYS: readonly SchoolDetailTabKey[] = []

export function normalizeSchoolDetailTab(
  tab: SchoolDetailTabKey,
  program?: Pick<Program, 'studentListRequired'> | null
): SchoolDetailTabKey {
  return normalizeGeneralParticipatingInstitutionDetailTab(tab, program)
}

function isSchoolDetailTabDisabled(key: SchoolDetailTabKey): boolean {
  return SCHOOL_DETAIL_DISABLED_TAB_KEYS.includes(key)
}

const SCHOOL_DETAIL_TAB_LABELS: Record<SchoolDetailTabKey, string> = {
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
}

type WaitingInstructorRow = WaitingInstructorRowMock

/** 필요 배정 인원(분모) — 상세에 필드 없으면 mock */
const MOCK_REQUIRED_INSTRUCTORS = 4

function isCompanySchoolProgram(program: Program): boolean {
  return (
    program.id.startsWith('economy-prog-') ||
    program.id.startsWith('company-school-prog-') ||
    program.id.startsWith('company-school-local-') ||
    program.mainTitle?.includes('1사1교') === true ||
    program.title.includes('1사1교')
  )
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

/** 자택 주소 컬럼 표시: 개인정보 마스킹 대신 앞 두 단위(공백 기준)까지만 노출 */
function formatHomeAddressToSecondUnit(address?: string): string {
  if (!address) return '-'
  const parts = address.trim().split(/\s+/).filter(Boolean)
  if (parts.length <= 2) return parts.join(' ')
  return `${parts[0]} ${parts[1]}`
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
  /** 합반 대상 lookup — 동일 프로그램 참여 기관 전체 목록 */
  participatingSchoolList?: ParticipatingSchoolRow[]
  /** URL 쿼리 파라미터와 연동 시 활성 탭 (제공 시 controlled) */
  activeTab?: SchoolDetailTabKey
  /** 탭 변경 시 호출 (쿼리 파라미터 갱신용) */
  onTabChange?: (key: SchoolDetailTabKey) => void
  onClearSchoolId: () => void
  onSaveBasicInfo?: (patch: Partial<SchoolDetailForModal> & { id: string }) => void
  onSaveInstructorInfo?: (schoolId: string, instructors: InstructorListFormInstructor[]) => void
  savedBasicPatches?: Record<string, Partial<SchoolDetailForModal>>
  savedInstructorPatches?: Record<string, InstructorListFormInstructor[]>
  instructorList: ParticipatingInstructorRow[]
  /** 승인 취소 버튼 클릭 후 컨펌 시 호출 (프로그램 승인 현황 → 승인 취소) */
  onCancelApproval?: (schoolId: string) => void
  /** 신청 정보 탭 교재 현황 태그 클릭 시 상태 변경 (참여 기관 목록·mock과 동기화) */
  onTextbookStatusChange?: (schoolId: string, status: TextbookStatusKey) => void
}

export function GeneralParticipatingInstitutionDetailView({
  program,
  detail,
  row,
  participatingSchoolList = [],
  activeTab: activeTabFromUrl,
  onTabChange,
  onClearSchoolId: _onClearSchoolId,
  onSaveBasicInfo,
  onSaveInstructorInfo,
  savedBasicPatches = {},
  savedInstructorPatches = {},
  instructorList,
  onCancelApproval: _onCancelApproval,
  onTextbookStatusChange,
}: SchoolDetailFullpageViewProps) {
  const currentUser = useAuthStore(state => state.user)
  const showAdminCommentSection = isCmsAdminUser(currentUser)
  const { showAlert } = useCmsAlert()
  const [internalTab, setInternalTab] = useState<SchoolDetailTabKey>('application')
  const visibleDetailTabs = useMemo(
    () => getGeneralParticipatingInstitutionDetailTabKeys(program),
    [program]
  )
  const activeTab = normalizeSchoolDetailTab(
    activeTabFromUrl !== undefined && activeTabFromUrl !== null ? activeTabFromUrl : internalTab,
    program
  )
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
  const [activityWithdrawModalOpen, setActivityWithdrawModalOpen] = useState(false)
  const [isAdminCommentEditing, setIsAdminCommentEditing] = useState(false)
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
    setIsAdminCommentEditing(false)
    setAdminCommentDraft('')
    setAdminCommentError(undefined)
    setActivityWithdrawModalOpen(false)
  }, [detail.id, detail.adminComment, savedBasicPatches[detail.id]?.adminComment])

  const mergedDetail = { ...detail, ...savedBasicPatches[detail.id] }
  const sessions = row.sessions ?? []
  const isActivityWithdrawn = mergedDetail.activityWithdrawn === true
  const isCompanySchool = isCompanySchoolProgram(program)

  const activityWithdrawScheduleOptions = useMemo(
    () => getParticipatingInstitutionActivityWithdrawScheduleOptions(program, sessions),
    [program, sessions]
  )

  const applicationInfoEdit = useParticipatingInstitutionDetailEdit({
    detail: mergedDetail,
    row,
    program,
    participatingSchoolList,
    onSaveBasicInfo,
  })

  const {
    isEditing: isApplicationInfoEditing,
    draft: applicationInfoDraft,
    validationErrors: applicationInfoValidationErrors,
    textbookOptions,
    textbookDisplay,
    usesTextbook,
    canEditTextbook,
    sameSchoolGradeOptions,
    isCombinedClassProgramEligible: isCombinedClassProgramEligibleFlag,
    isCombinedClassApplyRadioDisabled,
    enterEdit: enterApplicationInfoEdit,
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

  const {
    personalInfoRevealed,
    onPrivacyControlClick: handlePrivacyToggleClick,
    confirmModal: personalInfoRevealModal,
  } = usePersonalInfoReveal({
    resolveAccessItem: resolvePersonalInfoAccessItem,
    resetDeps: [detail.id],
    controlMode: 'toggleRemask',
  })

  const privacyMasked = !personalInfoRevealed

  const handleAdminCommentEditEnter = useCallback(() => {
    if (isApplicationInfoEditing) return
    setAdminCommentDraft(mergedDetail.adminComment ?? '')
    setAdminCommentError(undefined)
    setIsAdminCommentEditing(true)
  }, [isApplicationInfoEditing, mergedDetail.adminComment])

  const handleAdminCommentSave = useCallback(() => {
    const trimmed = adminCommentDraft.trim()
    onSaveBasicInfo?.({ id: detail.id, adminComment: trimmed || undefined })
    setIsAdminCommentEditing(false)
    setAdminCommentError(undefined)
  }, [adminCommentDraft, detail.id, onSaveBasicInfo])

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
    if (isApplicationInfoEditing || isAdminCommentEditing) return
    setActivityWithdrawModalOpen(true)
  }, [
    isActivityWithdrawn,
    isApplicationInfoEditing,
    isAdminCommentEditing,
    showAlert,
  ])

  const handleCancelActivityWithdraw = useCallback(() => {
    setActivityWithdrawModalOpen(false)
  }, [])

  const handleConfirmActivityWithdraw = useCallback(
    (payload: ActivityWithdrawScheduleModalPayload) => {
      const patch = resolveParticipatingInstitutionActivityWithdrawPatch(
        program,
        sessions,
        payload.stopSessionKey
      )
      if (!patch) return

      onSaveBasicInfo?.({ id: detail.id, ...patch })
      setActivityWithdrawModalOpen(false)
    },
    [detail.id, onSaveBasicInfo, program, sessions]
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
    mergedDetail.teacherName &&
      `담당 교사 : ${
        privacyMasked ? MASKING_POLICY.name(mergedDetail.teacherName) : mergedDetail.teacherName
      }`,
    mergedDetail.teacherPhone &&
      `Tel : ${
        privacyMasked ? MASKING_POLICY.phone(mergedDetail.teacherPhone) : mergedDetail.teacherPhone
      }`,
    mergedDetail.teacherMobile &&
      `M : ${
        privacyMasked
          ? maskMobilePhoneMiddleStars(mergedDetail.teacherMobile)
          : mergedDetail.teacherMobile
      }`,
    mergedDetail.teacherEmail &&
      `E-mail : ${
        privacyMasked
          ? maskEmailLocalAfterTwoChars(mergedDetail.teacherEmail)
          : mergedDetail.teacherEmail
      }`,
  ].filter((v): v is string => Boolean(v))
  const mealDisplay =
    mergedDetail.mealNotice === '가능'
      ? '가능'
      : mergedDetail.mealProvided
        ? `제공 | ${mergedDetail.mealNotice ?? ''}`
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
  /** 배정된 강사 테이블용 행 (목 데이터 연동) */
  const assignedRows: AssignedInstructorDisplayRow[] = useMemo(
    () => {
      const rows = getAssignedInstructorDisplayRows(instructors)
      if (!isCompanySchool) return rows
      const defaultScheduleLine = buildParticipatingSchoolPreferredScheduleLines(row.sessions)[0]
      return rows.map(assignedRow => ({
        ...assignedRow,
        assignedScheduleLine:
          assignedScheduleLinesByInstructorId[assignedRow.id] ?? defaultScheduleLine,
      }))
    },
    [instructors, isCompanySchool, row.sessions, assignedScheduleLinesByInstructorId]
  )

  /** 배정 대기 강사 목록 (목 데이터 연동: 해당 학교 미배정 참여 강사 + 배정 현황/희망 일정) */
  const waitingRows: WaitingInstructorRow[] = useMemo(
    () => {
      if (isCompanySchool) {
        const defaultScheduleLine = buildParticipatingSchoolPreferredScheduleLines(row.sessions)[0]
        return getCompanySchoolWaitingInstructorScheduleRows(
          row.schoolName,
          instructorList,
          participatingSchoolList
        )
          .filter(waitingRow => {
            if (completedWaitingRowKeys.has(waitingRow.id)) return false
            const instructorId = getWaitingInstructorRowInstructorId(waitingRow)
            const assignedScheduleLine =
              assignedScheduleLinesByInstructorId[instructorId] ?? defaultScheduleLine
            if (!assignedInstructorIdSet.has(instructorId)) return true
            return waitingRow.hopeScheduleLine !== assignedScheduleLine
          })
          .map(waitingRow => {
              const instructorId = getWaitingInstructorRowInstructorId(waitingRow)
              if (
                (disabledWaitingInstructorIds.has(instructorId) ||
                  assignedInstructorIdSet.has(instructorId)) &&
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
      instructorList,
      participatingSchoolList,
      isCompanySchool,
      completedWaitingRowKeys,
      disabledWaitingInstructorIds,
      assignedScheduleLinesByInstructorId,
      assignedInstructorIdSet,
    ]
  )

  const assignedInstructorNames = useMemo(
    () => instructors.map(i => i.instructorName),
    [instructors]
  )

  const currentLeadName =
    instructors.find((i: { role: InstructorRoleKey }) => i.role === 'lead')?.instructorName ?? null

  const selectedWaitingRows = useMemo(
    () =>
      waitingRows.filter(
        r => selectedWaitingKeys.includes(r.id) && r.assignmentStatus === 'waiting'
      ),
    [waitingRows, selectedWaitingKeys]
  )

  const programId = String(program.id)

  /** 선택 배정 — 배정 반영 후 완료 안내 */
  const finalizeSelectAssign = useCallback(
    (rows: WaitingInstructorRow[], showApprovalAlarmSection: boolean) => {
      if (rows.length === 0) return

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

  /** 배정 취소 확인 모달에서 "배정 취소" 클릭 시: 선택한 배정된 강사를 목록에서 제거 */
  const handleUnassignConfirm = useCallback(
    (payload: PermissionModalPayload) => {
      if (selectedAssignedKeys.length === 0) return
      const removedInstructorNames = assignedRows
        .filter(r => selectedAssignedKeys.includes(r.id))
        .map(r => r.instructorName)
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
    [selectedAssignedKeys, assignedRows, instructors, detail.id, onSaveInstructorInfo, row.schoolName]
  )

  const applyRoleChange = useCallback(
    (instructorId: string, newRole: InstructorRoleKey) => {
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
    [instructors, detail.id, onSaveInstructorInfo]
  )

  const handleRoleChange = useCallback(
    (instructorId: string, newRole: InstructorRoleKey) => {
      if (newRole === 'lead') {
        const currentLead = instructors.find(inv => inv.role === 'lead')
        const target = instructors.find(inv => inv.id === instructorId)
        if (currentLead && currentLead.id !== instructorId && target) {
          setLeadRoleChangeConfirm({
            instructorId,
            newLeadInstructorName: target.instructorName,
          })
          setOpenRoleDropdownId(null)
          return
        }
      }
      applyRoleChange(instructorId, newRole)
    },
    [instructors, applyRoleChange]
  )

  const assignedInstructorColumns: ColumnsType<AssignedInstructorDisplayRow> = useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: 64, align: 'center' },
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
        render: (v: string | undefined) => (v ? (privacyMasked ? MASKING_POLICY.name(v) : v) : '-'),
      },
      {
        title: '자택 주소지',
        dataIndex: 'homeAddress',
        key: 'homeAddress',
        width: 160,
        render: (v: string | undefined) => formatHomeAddressToSecondUnit(v),
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
          if (record.assignedScheduleLine) return record.assignedScheduleLine
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
      { title: 'No.', dataIndex: 'no', key: 'no', width: 64, align: 'center' },
      {
        title: '강사명',
        dataIndex: 'instructorName',
        key: 'instructorName',
        width: 100,
        render: (v: string | undefined) => (v ? (privacyMasked ? MASKING_POLICY.name(v) : v) : '-'),
      },
      {
        title: '자택 주소지',
        dataIndex: 'homeAddress',
        key: 'homeAddress',
        width: 160,
        render: (v: string | undefined) => formatHomeAddressToSecondUnit(v),
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
          if (record.hopeScheduleLine) return record.hopeScheduleLine
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
        homeAddress: formatHomeAddressToSecondUnit(row.homeAddress),
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
        homeAddress: formatHomeAddressToSecondUnit(row.homeAddress),
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
        {applicationInfoValidationErrors?.textbookId ||
        applicationInfoValidationErrors?.textbookName ? (
          <span className="institution-basic-info__field-error">
            {applicationInfoValidationErrors.textbookId ??
              applicationInfoValidationErrors.textbookName}
          </span>
        ) : null}
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
        validationError={applicationInfoValidationErrors?.combinedClassPartnerSchoolIds}
      />
    ) : (
      buildCombinedClassViewValue(mergedDetail, combinedClassProgramEligible)
    )

  const isApplicationDetailEditing =
    isApplicationInfoEditing && applicationInfoDraft != null

  const classAndCountDisplay = withProgramDetailTdDivider([
    `${mergedDetail.classCount}개 학급`,
    `총 ${mergedDetail.studentCount}명`,
  ])

  return (
    <div className="school-detail-fullpage-view">
      <CmsTextTabs
        className="school-detail-fullpage-view__tabs-row"
        activeKey={activeTab}
        onChange={key => setActiveTab(key as SchoolDetailTabKey)}
        items={visibleDetailTabs.map(key => ({
          key,
          label: SCHOOL_DETAIL_TAB_LABELS[key],
          disabled: isSchoolDetailTabDisabled(key),
          title: isSchoolDetailTabDisabled(key) ? '해당 화면은 준비 중입니다.' : undefined,
        }))}
        trailing={
          activeTab === 'application' ? (
            <>
              <CmsButton
                variant="delete"
                size="large"
                width={140}
                disabled={
                  isActivityWithdrawn || isApplicationInfoEditing || isAdminCommentEditing
                }
                onClick={handleRequestActivityWithdraw}
              >
                활동 포기
              </CmsButton>
              <CmsButton
                variant="secondary"
                size="large"
                width={140}
                disabled={isAdminCommentEditing}
                onClick={resolveProgramEditInfoClick(isApplicationInfoEditing, {
                  onEnterEdit: enterApplicationInfoEdit,
                  onSaveEdit: () => saveApplicationInfoEdit(),
                })}
              >
                {PROGRAM_EDIT_INFO_BUTTON_LABEL}
              </CmsButton>
              {showAdminCommentSection ? (
                <CmsButton
                  variant="primary"
                  size="large"
                  width={140}
                  disabled={isApplicationInfoEditing}
                  onClick={
                    isAdminCommentEditing ? handleAdminCommentSave : handleAdminCommentEditEnter
                  }
                >
                  {isAdminCommentEditing ? '코멘트 저장' : '코멘트 작성'}
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
              formError={applicationInfoValidationErrors?.form}
              showAdminComment={showAdminCommentSection}
              adminComment={mergedDetail.adminComment}
              isAdminCommentEditing={isAdminCommentEditing}
              adminCommentDraft={adminCommentDraft}
              onAdminCommentDraftChange={handleAdminCommentDraftChange}
              adminCommentError={adminCommentError}
              programProgressCell={
                <ProgramEnrollmentStatusText status={programProgressStatus} />
              }
              textbookCell={textbookCell}
              combinedClassCell={combinedClassCell}
              usesTextbook={isCompanySchool || usesTextbook}
              textbookEditFullWidth={isApplicationInfoEditing && canEditTextbook}
              hideCombinedClass={isCompanySchool}
              schoolName={mergedDetail.schoolName}
              educationGrade={mergedDetail.educationGrade}
              region={mergedDetail.region}
              addressDetail={
                isApplicationDetailEditing ? (
                  <InstitutionAddressDetailEdit
                    value={applicationInfoDraft.addressDetail}
                    onChange={value => updateApplicationInfoDraft({ addressDetail: value })}
                    error={applicationInfoValidationErrors?.addressDetail}
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
                    error={applicationInfoValidationErrors?.educationFormat}
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
                    errors={applicationInfoValidationErrors}
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
                    error={applicationInfoValidationErrors?.applicationReason}
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
                    error={applicationInfoValidationErrors?.otherRequests}
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
                    error={applicationInfoValidationErrors?.computerInRoom}
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
                    error={applicationInfoValidationErrors?.waitingRoomLocation}
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
                    error={applicationInfoValidationErrors?.mealNotice}
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
                    error={applicationInfoValidationErrors?.parkingInfo}
                  />
                ) : (
                  mergedDetail.parkingInfo ?? '-'
                )
              }
              criminalCheck={formatGuidanceSegmentValue(mergedDetail.criminalCheckRequest)}
              program={program}
              sessions={sessions}
              useCompanySchoolScheduleFormat={isCompanySchool}
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
                    {instructors.length} / {MOCK_REQUIRED_INSTRUCTORS}명
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
                      if (instructors.length >= MOCK_REQUIRED_INSTRUCTORS) {
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
              requiredCount={MOCK_REQUIRED_INSTRUCTORS}
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
              currentAssignedCount={instructors.length}
              requiredInstructorCount={MOCK_REQUIRED_INSTRUCTORS}
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
              currentCount={instructors.length}
              requiredCount={MOCK_REQUIRED_INSTRUCTORS}
              onConfirm={() => {
                if (instructors.length + selectedWaitingRows.length > MOCK_REQUIRED_INSTRUCTORS) {
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
              currentCount={instructors.length}
              requiredCount={MOCK_REQUIRED_INSTRUCTORS}
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
                if (instructors.length >= MOCK_REQUIRED_INSTRUCTORS) {
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
              requiredCount={MOCK_REQUIRED_INSTRUCTORS}
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
              requiredCount={MOCK_REQUIRED_INSTRUCTORS}
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
            />
          </div>
        )}
      </div>

      {personalInfoRevealModal}

      <ActivityWithdrawScheduleModal
        open={activityWithdrawModalOpen}
        scheduleOptions={activityWithdrawScheduleOptions}
        onCancel={handleCancelActivityWithdraw}
        onConfirm={handleConfirmActivityWithdraw}
      />
    </div>
  )
}

/** @deprecated `GeneralParticipatingInstitutionDetailView` 사용 */
export const SchoolDetailFullpageView = GeneralParticipatingInstitutionDetailView
