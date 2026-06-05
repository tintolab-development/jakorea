/**
 * 일반 프로그램 > 진행 현황 > 참여 기관 상세 (풀페이지 인라인)
 * UJAT 참여 기관 상세는 `features/program/ujat/ui/detail-modal/progress/institutions/detail/` — 별도 구현.
 * 탭: 신청 정보 | 학생 명단 | 강사 배정 현황 | 출석 관리(비활성) | 게시글
 * 신청 정보 액션: 활동 포기 | 정보 수정 | 개인정보 상세보기
 */

import type { ReactNode } from 'react'
import { useState, useMemo, useCallback, useEffect } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { CmsButton, CmsRadio, useCmsAlert } from '@/shared/ui'
import { CmsSelect } from '@/shared/ui/cms-select'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import type { Program } from '@/types/domain'
import type {
  SchoolDetailForModal,
  SchoolDetailInstructorRow,
  InstructorRoleKey,
} from '../../../model/school-detail-types'
import { INSTRUCTOR_ROLE_LABELS } from '../../../model/school-detail-types'
import type {
  ParticipatingSchoolRow,
  TextbookStatusKey,
} from '@/data/mock/participating-schools'
import type {
  ParticipatingInstructorRow,
  SettlementStatusKey,
} from '@/data/mock/participating-instructors'
import { SETTLEMENT_STATUS_LABELS } from '@/data/mock/participating-instructors'
import type { InstructorListFormInstructor } from '../../../model/school-detail-types'
import {
  getInstructorRowsForSchool,
  getAssignedInstructorDisplayRows,
  getWaitingInstructorRows,
} from '../../../lib/school-detail-mock'
import {
  MOCK_INSTRUCTOR_ASSIGN_SESSION_OPTIONS,
  mapParticipatingSessionsToInstructorAssignOptions,
} from '../../../lib/instructor-assign-session-options'
import {
  maskEmailLocalAfterTwoChars,
  maskMobilePhoneMiddleStars,
} from '../../../lib/teacher-contact-display-mask'
import { MASKING_POLICY } from '@/shared/constants/download-policy'
import {
  INSTRUCTOR_ASSIGN_SELECT_INSTRUCTOR_ALERT_MESSAGE,
  INSTRUCTOR_ASSIGN_UNASSIGN_SELECT_INSTRUCTOR_ALERT_MESSAGE,
} from '@/shared/constants/messages'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { TextbookStatusBadge } from '@/shared/components/textbook-status-badge'
import {
  StatusDropdownCell,
  STATUS_DROPDOWN_CELL_CLASSNAME,
  STATUS_DROPDOWN_CELL_TAG_132_CLASSNAME,
  STATUS_DROPDOWN_CELL_TAG_132_HEADER_CLASSNAME,
} from '@/shared/components/status-dropdown-cell'
import { SchoolDetailStudentListSection } from './school-detail-student-list-section'
import {
  SchoolDetailAddInstructorAssignModal,
  type AddInstructorAssignOption,
} from './school-detail-add-instructor-assign-modal'
import { SchoolDetailSelectAssignConfirmModal } from './school-detail-select-assign-confirm-modal'
import { SchoolDetailUnassignCompleteModal } from './school-detail-unassign-complete-modal'
import { SchoolDetailUnassignConfirmModal } from './school-detail-unassign-confirm-modal'
import type { PermissionModalPayload } from '@/shared/components/permission-modal'
import { SchoolDetailAssignOverflowModal } from './school-detail-assign-overflow-modal'
import { SchoolDetailAssignCompleteModal } from './school-detail-assign-complete-modal'
import { SchoolDetailLeadInstructorConfirmModal } from './school-detail-lead-instructor-confirm-modal'
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
import {
  formatParticipatingCombinedClassDisplay,
  type ParticipatingInstitutionEditDraft,
} from '@/features/program/general/lib/participating-institution-detail-edit'
import {
  withProgramDetailTdDivider,
  ProgramDetailTdSegmentWrap,
} from '@/features/program/shared/ui/program-detail-td-divider'
import { isCmsAdminUser } from '@/features/user/shared/lib/admin-provisioned-member-policy'
import { useAuthStore } from '@/features/auth/model/auth-store'
import './participating-institutions-section.css'
import './instructor-assignment-role-tag.css'
import './instructor-assignment-status-text.css'
import { ParticipatingInstitutionApplicationInfo } from './participating-institution-application-info'
import './school-detail-fullpage-view.css'
import '@/features/program/general/ui/detail-modal/applications/applicant-detail/institution-basic-info.css'

/** 일반 프로그램 참여 기관 상세 탭 (UJAT 상세 탭과 별도) */
export const GENERAL_PARTICIPATING_INSTITUTION_DETAIL_TAB_KEYS = [
  'application',
  'students',
  'instructors',
  'attendance',
  'posts',
] as const
export type GeneralParticipatingInstitutionDetailTabKey =
  (typeof GENERAL_PARTICIPATING_INSTITUTION_DETAIL_TAB_KEYS)[number]

/** @deprecated 일반 참여 기관 상세와 동일 — URL 파라미터 호환용 */
export const SCHOOL_DETAIL_TAB_KEYS = GENERAL_PARTICIPATING_INSTITUTION_DETAIL_TAB_KEYS
export type SchoolDetailTabKey = GeneralParticipatingInstitutionDetailTabKey

export const SCHOOL_DETAIL_DISABLED_TAB_KEYS: readonly SchoolDetailTabKey[] = ['attendance']

export function normalizeGeneralParticipatingInstitutionDetailTab(
  tab: GeneralParticipatingInstitutionDetailTabKey
): GeneralParticipatingInstitutionDetailTabKey {
  return SCHOOL_DETAIL_DISABLED_TAB_KEYS.includes(tab) ? 'application' : tab
}

export function normalizeSchoolDetailTab(tab: SchoolDetailTabKey): SchoolDetailTabKey {
  return normalizeGeneralParticipatingInstitutionDetailTab(tab)
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
}

/** 배정 대기 강사 테이블용 행 */
export type AssignmentStatusKey = 'waiting' | 'cancelled' | 'assigned'

interface WaitingInstructorRow {
  id: string
  no: number
  instructorName: string
  homeAddress?: string
  distanceToSchool?: string
  assignmentStatus: AssignmentStatusKey
  hopeDate?: string
  hopeTime?: string
  hopeSession?: string
}

const ASSIGNMENT_STATUS_LABELS: Record<AssignmentStatusKey, string> = {
  waiting: '배정 대기',
  cancelled: '배정 취소',
  assigned: '배정 완료',
}

/** 필요 배정 인원(분모) — 상세에 필드 없으면 mock */
const MOCK_REQUIRED_INSTRUCTORS = 4

const TEXTBOOK_STATUS_OPTIONS: TextbookStatusKey[] = ['preparing', 'shipping', 'delivered']

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

function buildCombinedClassViewValue(detail: SchoolDetailForModal): ReactNode {
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

function ParticipatingCombinedClassEditCell({
  draft,
  onDraftChange,
  sameSchoolGradeOptions,
  canApplyCombinedClass,
  validationErrors,
}: {
  draft: ParticipatingInstitutionEditDraft
  onDraftChange: (partial: Partial<ParticipatingInstitutionEditDraft>) => void
  sameSchoolGradeOptions: Array<{ value: string; label: string }>
  canApplyCombinedClass: boolean
  validationErrors?: Record<string, string>
}) {
  const combinedClassValue = canApplyCombinedClass ? draft.combinedClassApplication : '미신청'
  const isApplied = combinedClassValue === '신청'

  return (
    <div className="institution-basic-info__combined-class-edit">
      <CmsRadio.Group
        className="institution-basic-info__combined-class-radios"
        value={combinedClassValue}
        disabled={!canApplyCombinedClass}
        onChange={event => {
          const next = event.target.value as ParticipatingInstitutionEditDraft['combinedClassApplication']
          onDraftChange({
            combinedClassApplication: next,
            combinedClassPartnerSchoolIds:
              next === '신청' ? draft.combinedClassPartnerSchoolIds : [],
          })
        }}
      >
        <CmsRadio value="미신청">미신청</CmsRadio>
        <CmsRadio value="신청">신청</CmsRadio>
      </CmsRadio.Group>
      {isApplied ? (
        <CmsSelect
          className="institution-basic-info__combined-class-select"
          inputSize="large"
          mode="multiple"
          placeholder="타 학년 선택"
          value={draft.combinedClassPartnerSchoolIds}
          options={sameSchoolGradeOptions.map(option => ({
            label: option.label,
            value: option.value,
          }))}
          onChange={value => {
            onDraftChange({
              combinedClassPartnerSchoolIds: Array.isArray(value) ? value.map(String) : [],
            })
          }}
        />
      ) : null}
      {validationErrors?.combinedClassPartnerSchoolIds ? (
        <span className="institution-basic-info__field-error">
          {validationErrors.combinedClassPartnerSchoolIds}
        </span>
      ) : null}
    </div>
  )
}

/** 자택 주소 컬럼 표시: 개인정보 마스킹 대신 앞 두 단위(공백 기준)까지만 노출 */
function formatHomeAddressToSecondUnit(address?: string): string {
  if (!address) return '-'
  const parts = address.trim().split(/\s+/).filter(Boolean)
  if (parts.length <= 2) return parts.join(' ')
  return `${parts[0]} ${parts[1]}`
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
  const activeTab = normalizeSchoolDetailTab(
    activeTabFromUrl !== undefined && activeTabFromUrl !== null ? activeTabFromUrl : internalTab
  )
  const setActiveTab = (key: SchoolDetailTabKey) => {
    if (onTabChange) onTabChange(key)
    else setInternalTab(key)
  }
  const [selectedAssignedKeys, setSelectedAssignedKeys] = useState<React.Key[]>([])
  const [selectedWaitingKeys, setSelectedWaitingKeys] = useState<React.Key[]>([])
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

  useEffect(() => {
    setTextbookStatusDropdownOpen(false)
  }, [detail.id])

  const mergedDetail = { ...detail, ...savedBasicPatches[detail.id] }

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
    canApplyCombinedClass,
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
  const instructors =
    savedInstructorPatches[detail.id] !== undefined
      ? savedInstructorPatches[detail.id].map(inv => ({
          ...inv,
          settlementStatus: 'pending' as SettlementStatusKey,
        }))
      : getInstructorRowsForSchool(row.schoolName, instructorList)

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
    () => getAssignedInstructorDisplayRows(instructors),
    [instructors]
  )

  /** 배정 대기 강사 목록 (목 데이터 연동: 해당 학교 미배정 참여 강사 + 배정 현황/희망 일정) */
  const waitingRows: WaitingInstructorRow[] = useMemo(
    () => getWaitingInstructorRows(row.schoolName, instructorList),
    [row.schoolName, instructorList]
  )

  /** 추가 배정 모달용 옵션: 배정 대기 중인 강사 또는 미배정 참여 강사 */
  const addAssignInstructorOptions: AddInstructorAssignOption[] = useMemo(() => {
    const assignedIds = new Set(instructors.map(i => i.id))
    return instructorList
      .filter(r => !assignedIds.has(r.id))
      .slice(0, 20)
      .map(r => ({
        value: r.id,
        label: r.instructorName,
        contact: r.contact,
        email: r.email,
        initialApproval: r.initialApproval ?? true,
      }))
  }, [instructorList, instructors])

  const addAssignSessionOptions = useMemo(() => {
    const fromSessions = mapParticipatingSessionsToInstructorAssignOptions(row.sessions)
    return fromSessions.length > 0 ? fromSessions : MOCK_INSTRUCTOR_ASSIGN_SESSION_OPTIONS
  }, [row.sessions])

  const currentLeadName =
    instructors.find((i: { role: InstructorRoleKey }) => i.role === 'lead')?.instructorName ?? null

  /** 선택 배정 확인 모달에서 "강사 배정" 클릭 시: 선택한 배정 대기 강사를 배정된 목록에 추가 */
  const handleSelectAssignConfirm = useCallback(() => {
    if (selectedWaitingKeys.length === 0) return
    const selectedRows = waitingRows.filter(r => selectedWaitingKeys.includes(r.id))
    const existingFormList: InstructorListFormInstructor[] = instructors.map(
      ({ id, role, instructorName, contact, email }) => ({
        id,
        role,
        instructorName,
        contact,
        email,
      })
    )
    const newFormList: InstructorListFormInstructor[] = selectedRows
      .map(w => {
        const fromList = instructorList.find(r => r.id === w.id)
        return fromList
          ? {
              id: fromList.id,
              role: 'assistant' as InstructorRoleKey,
              instructorName: fromList.instructorName,
              contact: fromList.contact ?? '',
              email: fromList.email ?? '',
            }
          : null
      })
      .filter((x): x is InstructorListFormInstructor => x != null)
    if (newFormList.length === 0) {
      return
    }
    onSaveInstructorInfo?.(detail.id, [...existingFormList, ...newFormList])
    setSelectAssignConfirmOpen(false)
    setSelectedWaitingKeys([])
    }, [
    selectedWaitingKeys,
    waitingRows,
    instructorList,
    instructors,
    detail.id,
    onSaveInstructorInfo,
  ])

  const handleUnassignClick = useCallback(() => {
    if (selectedAssignedKeys.length === 0) {
      showAlert({ title: '안내', content: INSTRUCTOR_ASSIGN_UNASSIGN_SELECT_INSTRUCTOR_ALERT_MESSAGE })
      return
    }
    setUnassignConfirmOpen(true)
  }, [selectedAssignedKeys.length, showAlert])

  const handleSelectAssignClick = useCallback(() => {
    if (selectedWaitingKeys.length === 0) {
      showAlert({ title: '안내', content: INSTRUCTOR_ASSIGN_SELECT_INSTRUCTOR_ALERT_MESSAGE })
      return
    }
    setSelectAssignConfirmOpen(true)
  }, [selectedWaitingKeys.length, showAlert])

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
        width: 150,
        align: 'center',
        onHeaderCell: () => ({ className: STATUS_DROPDOWN_CELL_TAG_132_HEADER_CLASSNAME }),
        onCell: () => ({
          className: `${STATUS_DROPDOWN_CELL_CLASSNAME} ${STATUS_DROPDOWN_CELL_TAG_132_CLASSNAME}`,
        }),
        render: (role: InstructorRoleKey, record: AssignedInstructorDisplayRow) => (
          <StatusDropdownCell<InstructorRoleKey>
            status={role}
            statusOptions={['lead', 'assistant']}
            renderBadge={r => (
              <span
                className={
                  r === 'lead'
                    ? 'school-detail-fullpage-view__role-tag school-detail-fullpage-view__role-tag--lead'
                    : 'school-detail-fullpage-view__role-tag school-detail-fullpage-view__role-tag--assistant'
                }
              >
                {INSTRUCTOR_ROLE_LABELS[r]}
              </span>
            )}
            isItemDisabled={(cur, opt) => cur === opt}
            onChange={key => handleRoleChange(record.id, key as InstructorRoleKey)}
            isOpen={openRoleDropdownId === record.id}
            onOpenChange={open => setOpenRoleDropdownId(open ? record.id : null)}
            emptyPlaceholder="-"
            tagLayout="tag132"
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
        title: '자택 주소',
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
        title: '교육 담당 날짜 및 수업 시간',
        dataIndex: 'assignedDate',
        key: 'assignedDate',
        width: 280,
        align: 'center',
        render: (v: string | undefined, record: AssignedInstructorDisplayRow) => {
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
        title: '교육 담당 차시',
        dataIndex: 'assignedSession',
        key: 'assignedSession',
        width: 100,
        align: 'center',
        render: (v: string | undefined) => v ?? '-',
      },
      {
        title: '정산 현황',
        dataIndex: 'settlementStatus',
        key: 'settlementStatus',
        width: 120,
        align: 'center',
        render: (status: SettlementStatusKey) => (
          <span
            className={`school-detail-fullpage-view__settlement-text school-detail-fullpage-view__settlement-text--${status}`}
          >
            {SETTLEMENT_STATUS_LABELS[status]}
          </span>
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
        title: '자택 주소',
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
        title: '배정 현황',
        dataIndex: 'assignmentStatus',
        key: 'assignmentStatus',
        width: 100,
        align: 'center',
        render: (status: AssignmentStatusKey) => (
          <span
            className={`school-detail-fullpage-view__assignment-status school-detail-fullpage-view__assignment-status--${status}`}
          >
            {ASSIGNMENT_STATUS_LABELS[status]}
          </span>
        ),
      },
      {
        title: '교육 희망 날짜 및 수업 시간',
        dataIndex: 'hopeDate',
        key: 'hopeDate',
        width: 280,
        align: 'center',
        render: (v: string | undefined, record: WaitingInstructorRow) => {
          const date = v ?? '-'
          const time = record.hopeTime ?? '-'
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
        title: '교육 희망 차시',
        dataIndex: 'hopeSession',
        key: 'hopeSession',
        width: 110,
        align: 'center',
        render: (v: string | undefined) => v ?? '-',
      },
    ],
    [privacyMasked]
  )

  /** 기본 정보 — 상단(진행·교재) / 하단(기관·신청) 테이블 분리 (시안) */
  const textbookStatusCell =
    onTextbookStatusChange != null ? (
      <StatusDropdownCell<TextbookStatusKey>
        status={mergedDetail.textbookStatus}
        statusOptions={TEXTBOOK_STATUS_OPTIONS}
        renderBadge={s => <TextbookStatusBadge status={s} />}
        isItemDisabled={(cur, opt) => cur === opt}
        onChange={newStatus => onTextbookStatusChange(detail.id, newStatus)}
        isOpen={textbookStatusDropdownOpen}
        onOpenChange={setTextbookStatusDropdownOpen}
      />
    ) : (
      <TextbookStatusBadge status={mergedDetail.textbookStatus} />
    )

  const textbookNameView = textbookDisplay.textbookName
  const kitsAndQty =
    textbookDisplay.textbookKits > 0
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

  const combinedClassCell =
    isApplicationInfoEditing && applicationInfoDraft ? (
      <ParticipatingCombinedClassEditCell
        draft={applicationInfoDraft}
        onDraftChange={updateApplicationInfoDraft}
        sameSchoolGradeOptions={sameSchoolGradeOptions}
        canApplyCombinedClass={canApplyCombinedClass}
        validationErrors={applicationInfoValidationErrors}
      />
    ) : (
      buildCombinedClassViewValue(mergedDetail)
    )

  const isApplicationDetailEditing =
    isApplicationInfoEditing && applicationInfoDraft != null

  const classAndCountDisplay = withProgramDetailTdDivider([
    `${mergedDetail.classCount}개 학급`,
    `총 ${mergedDetail.studentCount}명`,
  ])

  const sessions = row.sessions ?? []

  return (
    <div className="school-detail-fullpage-view">
      <CmsTextTabs
        className="school-detail-fullpage-view__tabs-row"
        activeKey={activeTab}
        onChange={key => setActiveTab(key as SchoolDetailTabKey)}
        items={GENERAL_PARTICIPATING_INSTITUTION_DETAIL_TAB_KEYS.map(key => ({
          key,
          label: SCHOOL_DETAIL_TAB_LABELS[key],
          disabled: isSchoolDetailTabDisabled(key),
          title: isSchoolDetailTabDisabled(key) ? '해당 화면은 준비 중입니다.' : undefined,
        }))}
        trailing={
          activeTab === 'application' ? (
            <>
              <CmsButton variant="delete" size="large" width={140} onClick={() => {}}>
                활동 포기
              </CmsButton>
              <CmsButton
                variant="primary"
                size="large"
                width={140}
                onClick={
                  isApplicationInfoEditing
                    ? () => saveApplicationInfoEdit()
                    : enterApplicationInfoEdit
                }
              >
                {isApplicationInfoEditing ? '정보 저장' : '정보 수정'}
              </CmsButton>
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
              isEditing={isApplicationInfoEditing}
              adminCommentDraft={applicationInfoDraft?.adminComment ?? ''}
              onAdminCommentDraftChange={
                isApplicationInfoEditing
                  ? value => updateApplicationInfoDraft({ adminComment: value })
                  : undefined
              }
              adminCommentError={applicationInfoValidationErrors?.adminComment}
              programProgressCell={
                <ProgramEnrollmentStatusText status={programProgressStatus} />
              }
              textbookCell={textbookCell}
              combinedClassCell={combinedClassCell}
              usesTextbook={usesTextbook}
              textbookEditFullWidth={isApplicationInfoEditing && canEditTextbook}
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
              sessions={sessions}
            />
          </div>
        )}

        {activeTab === 'students' && (
          <div className="program-detail-fullpage-modal__info-tab">
            <SchoolDetailStudentListSection
              schoolId={detail.id}
              studentCount={detail.studentCount}
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
                </div>
              </div>
              <div className="participating-institutions-section__table-wrap">
                {assignedRows.length === 0 ? (
                  <div
                    className="school-detail-fullpage-view__instructor-list-empty"
                    role="status"
                    aria-label="배정된 강사 없음"
                  >
                    배정된 강사가 없습니다.
                  </div>
                ) : (
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
                  />
                )}
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
                </div>
              </div>
              <div className="participating-institutions-section__table-wrap">
                {waitingRows.length === 0 ? (
                  <div
                    className="school-detail-fullpage-view__instructor-list-empty"
                    role="status"
                    aria-label="배정 대기 강사 없음"
                  >
                    배정 대기 중인 강사가 없습니다.
                  </div>
                ) : (
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
                        disabled: record.assignmentStatus === 'assigned',
                      }),
                    }}
                    columns={waitingInstructorColumns}
                    dataSource={waitingRows}
                    rowClassName={record =>
                      record.assignmentStatus === 'assigned'
                        ? 'school-detail-fullpage-view__waiting-row--assigned'
                        : ''
                    }
                  />
                )}
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
              schoolName={row.schoolName}
              instructorOptions={addAssignInstructorOptions}
              assignmentSessionOptions={addAssignSessionOptions}
              currentLeadInstructorName={currentLeadName}
              currentAssignedCount={instructors.length}
              requiredInstructorCount={MOCK_REQUIRED_INSTRUCTORS}
              overflowAlreadyConfirmed={addModalOpenedFromOverflow}
              onAdd={(_instructorId, role, option, _meta) => {
                const existingFormList: InstructorListFormInstructor[] = instructors.map(
                  ({ id, role: r, instructorName, contact, email }) => ({
                    id,
                    role: r,
                    instructorName,
                    contact,
                    email,
                  })
                )
                const newInstructor: InstructorListFormInstructor = {
                  id: option.value,
                  role,
                  instructorName: option.label,
                  contact: option.contact ?? '',
                  email: option.email ?? '',
                }
                onSaveInstructorInfo?.(detail.id, [...existingFormList, newInstructor])
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
              instructorNames={waitingRows
                .filter(r => selectedWaitingKeys.includes(r.id))
                .map(r => r.instructorName)}
              currentCount={instructors.length}
              requiredCount={MOCK_REQUIRED_INSTRUCTORS}
              onConfirm={() => {
                if (instructors.length >= MOCK_REQUIRED_INSTRUCTORS) {
                  setSelectAssignConfirmOpen(false)
                  setSelectAssignOverflowOpen(true)
                } else {
                  handleSelectAssignConfirm()
                }
              }}
            />
            <SchoolDetailAssignOverflowModal
              open={selectAssignOverflowOpen}
              onCancel={() => setSelectAssignOverflowOpen(false)}
              requiredCount={MOCK_REQUIRED_INSTRUCTORS}
              onConfirm={() => {
                handleSelectAssignConfirm()
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
    </div>
  )
}

/** @deprecated `GeneralParticipatingInstitutionDetailView` 사용 */
export const SchoolDetailFullpageView = GeneralParticipatingInstitutionDetailView
