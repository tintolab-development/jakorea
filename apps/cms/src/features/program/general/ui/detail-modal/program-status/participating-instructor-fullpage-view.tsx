/**
 * 참여 강사 상세 풀페이지 인라인 뷰
 * 프로그램 진행 현황 > 참여 강사 — instructorId 쿼리 시 목록 대신 표시
 */

import { useState, useEffect, useMemo, useCallback, type Key } from 'react'
import { Table } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { Program } from '@/types/domain'
import type {
  ParticipatingInstructorRow,
  ParticipatingInstructorCareerDetail,
  ParticipatingInstructorEducationItem,
  ParticipatingInstructorQualification,
} from '@/data/mock/participating-instructors'
import { MOCK_PARTICIPATING_INSTRUCTORS } from '@/data/mock/participating-instructors'
import type { ParticipatingSchoolRow } from '@/data/mock/participating-schools'
import { MOCK_PARTICIPATING_SCHOOLS } from '@/data/mock/participating-schools'
import {
  INSTRUCTOR_ASSIGN_SELECT_SCHOOL_ALERT_MESSAGE,
  INSTRUCTOR_ASSIGN_UNASSIGN_SELECT_SCHOOL_ALERT_MESSAGE,
  PARTICIPATING_INSTRUCTOR_ALREADY_ACTIVITY_WITHDRAWN_ALERT_MESSAGE,
} from '@/shared/constants/messages'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { CmsButton, ExcelButton, useCmsAlert } from '@/shared/ui'
import {
  PROGRAM_EDIT_INFO_BUTTON_LABEL,
  PROGRAM_EDIT_INFO_BUTTON_PROPS,
  resolveProgramEditInfoClick,
} from '@/features/program/shared/lib/program-edit-info-button'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { usePersonalInfoReveal } from '@/features/user/detail/lib/use-personal-info-reveal'
import { PersonalInfoRevealButton } from '@/features/user/detail/ui/personal-info-reveal-button'
import { MemberAdminCommentModal } from '@/features/user/detail/ui/modal/member-admin-comment-modal'
import { ProgramDetailTdDivider } from '@/features/program/shared/ui/program-detail-td-divider'
import {
  INSTRUCTOR_ROLE_LABELS,
  type InstructorRoleKey,
} from '@/features/program/general/model/school-detail-types'
import {
  EditableStatusBadge,
  StatusDropdownCell,
  STATUS_DROPDOWN_CELL_CLASSNAME,
  STATUS_DROPDOWN_CELL_TAG_100_CLASSNAME,
  STATUS_DROPDOWN_CELL_TAG_100_HEADER_CLASSNAME,
} from '@/shared/components'
import { getInstructorRoleBadgeTone } from '@/shared/constants/editable-status-badge-tones'
import {
  buildInitialAssignedSchoolRows,
  buildWaitingSchoolRows,
  buildWaitingSchoolScheduleRows,
  createWaitingRowForSchool,
  schoolRowToAssignedRow,
  renumberAssignedRows,
  renumberWaitingRows,
  type InstructorAssignedSchoolRow,
  type InstructorWaitingSchoolRow,
  type InstructorWaitingAssignmentStatus,
} from '@/features/program/general/lib/instructor-institution-assignment-mock'
import {
  mapParticipatingSessionsToInstructorAssignOptions,
} from '@/features/program/general/lib/instructor-assign-session-options'
import { PARTICIPATING_INSTITUTIONS_SESSIONS_COLUMN_WIDTH } from '@/features/program/general/lib/participating-institutions-table'
import { SchoolDetailUnassignCompleteModal } from './school-detail-unassign-complete-modal'
import { SchoolDetailUnassignConfirmModal } from './school-detail-unassign-confirm-modal'
import { AssignGuideModal } from './assign-guide-modal'
import { ParticipatingInstructorApplicationInfo } from './participating-instructor-application-info'
import { useParticipatingInstructorDetailEdit } from '@/features/program/general/hooks/use-participating-instructor-detail-edit'
import {
  applyParticipatingInstructorActivityWithdraw,
  getParticipatingInstructorActivityWithdrawScheduleOptions,
} from '@/features/program/general/lib/participating-instructor-activity-withdraw'
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
import type { PermissionModalPayload } from '@/shared/components/permission-modal'
import './participating-institutions-section.css'
import './instructor-assignment-status-text.css'
import './school-detail-fullpage-view.css'
import './participating-instructor-fullpage-view.css'

const ASSIGNMENT_STATUS_LABELS: Record<InstructorWaitingAssignmentStatus, string> = {
  waiting: '배정 대기',
  cancelled: '배정 불가',
  assigned: '배정 완료',
}

function renderEducationScheduleLines(lines: string[]) {
  if (lines.length === 0) return <>-</>
  const total = lines.length
  const showCount = total <= 3 ? total : 2
  const displayLines = lines.slice(0, showCount)
  const restCount = total - showCount
  return (
    <div className="participating-institutions-section__sessions-cell">
      {displayLines.map((line, index) => (
        <div key={`${line}-${index}`} className="participating-institutions-section__session-line">
          {line}
        </div>
      ))}
      {restCount > 0 ? (
        <div className="participating-institutions-section__session-more">
          외 {restCount}개의 교육 일정
        </div>
      ) : null}
    </div>
  )
}

function renderWaitingTableEmpty() {
  return (
    <div className="participating-instructor-fullpage-view__waiting-table-empty" role="status">
      배정 대기 중인 기관이 없습니다.
    </div>
  )
}

/** TODO(api): 강사 중첩 탭 mutation 잔여 — institutionAssignment·settlement.
 * lectureReports: GET list hybrid (`useProgramLectureReports`).
 * 1사1교 정산은 100km·교통·숙박·wagePolicies/paymentItems 구조화 계약 후. */
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

const NO_DATA = '데이터 없음'

function isCompanySchoolProgram(program: Program): boolean {
  return (
    program.id.startsWith('economy-prog-') ||
    program.id.startsWith('company-school-prog-') ||
    program.id.startsWith('company-school-local-') ||
    program.mainTitle?.includes('1사1교') === true ||
    program.title?.includes('1사1교') === true
  )
}

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
  schoolRows = MOCK_PARTICIPATING_SCHOOLS,
  instructorList = MOCK_PARTICIPATING_INSTRUCTORS,
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
  const [activityCertPreviewOpen, setActivityCertPreviewOpen] = useState(false)
  const [savedAdminComment, setSavedAdminComment] = useState('')
  const [adminCommentModalOpen, setAdminCommentModalOpen] = useState(false)
  const [adminCommentDraft, setAdminCommentDraft] = useState('')
  const [adminCommentError, setAdminCommentError] = useState<string | undefined>()
  const [instructorPatches, setInstructorPatches] = useState<Partial<ParticipatingInstructorRow>>(
    {}
  )
  const [activityWithdrawModalOpen, setActivityWithdrawModalOpen] = useState(false)
  const { showAlert } = useCmsAlert()

  const mergedInstructor = useMemo(() => ({ ...d, ...instructorPatches }), [d, instructorPatches])

  const isIndividualProgram = isGeneralIndividualProgram(program)
  const isCompanySchool = isCompanySchoolProgram(program)

  const isActivityWithdrawn = mergedInstructor.activityWithdrawn === true

  const activityWithdrawScheduleOptions = useMemo(
    () => getParticipatingInstructorActivityWithdrawScheduleOptions(mergedInstructor.id),
    [mergedInstructor.id]
  )

  const applicationInfoEdit = useParticipatingInstructorDetailEdit({
    instructor: mergedInstructor,
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

  const {
    personalInfoRevealed,
    onPrivacyControlClick: handlePrivacyToggleClick,
    confirmModal: personalInfoRevealModal,
  } = usePersonalInfoReveal({
    resolveAccessItem: resolveParticipatingInstructorFullpageAccessItem,
    resetDeps: [d.id, schoolRows, instructorList],
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

  useEffect(() => {
    const assigned = buildInitialAssignedSchoolRows(d, schoolRows, instructorList)
    const assignedSchoolIds = new Set(assigned.map(r => r.id))
    setAssignedSchools(assigned)
    setWaitingSchools(
      isCompanySchool
        ? buildWaitingSchoolScheduleRows(d, schoolRows, instructorList, assignedSchoolIds)
        : buildWaitingSchoolRows(d, schoolRows, instructorList, assignedSchoolIds)
    )
    setSelectedAssignedSchoolKeys([])
    setSelectedWaitingSchoolKeys([])
    setOpenRoleDropdownId(null)
    setAssignGuideMode(null)
    setAssignGuideSchoolId(null)
    setAssignGuideRole('assistant')
    setAssignGuideSessionIds([])
  }, [d, isCompanySchool, schoolRows, instructorList])

  useEffect(() => {
    setSavedAdminComment(d.adminComment ?? '')
    setAdminCommentModalOpen(false)
    setAdminCommentDraft('')
    setAdminCommentError(undefined)
    setInstructorPatches({})
    setActivityWithdrawModalOpen(false)
  }, [d.id, d.adminComment])

  const handleRoleChange = useCallback((schoolId: string, newRole: InstructorRoleKey) => {
    setAssignedSchools(prev => {
      const updated = prev.map(row => ({
        ...row,
        role:
          row.id === schoolId
            ? newRole
            : newRole === 'lead'
              ? ('assistant' satisfies InstructorRoleKey)
              : row.role,
      }))
      return renumberAssignedRows(updated)
    })
    setOpenRoleDropdownId(null)
  }, [])

  const assignedSchoolColumns: ColumnsType<InstructorAssignedSchoolRow> = useMemo(
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
        render: (role: InstructorRoleKey, record: InstructorAssignedSchoolRow) => (
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
        className: 'participating-institutions-section__th-sessions',
        onHeaderCell: () => ({
          className: 'participating-institutions-section__th-sessions',
        }),
        onCell: () => ({ className: 'participating-institutions-section__td-sessions' }),
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
        no: row.no,
        schoolName: row.schoolName,
        desiredGrade: row.desiredGrade,
        region: row.region,
        distanceFromHome: row.distanceFromHome,
        educationSchedule: row.educationScheduleLines.join('\n'),
        assignmentStatus: ASSIGNMENT_STATUS_LABELS[row.assignmentStatus],
        assignedInstructorCountLabel: row.assignedInstructorCountLabel,
      })),
    [waitingSchools]
  )

  const { exportExcel: exportAssignedSchoolsExcel, isExporting: isAssignedSchoolsExcelExporting } =
    useTableExcelExport({
      columns: assignedSchoolExportColumns,
      data: assignedSchoolExportRows,
      filename: '배정된 기관 목록',
    })

  const { exportExcel: exportWaitingSchoolsExcel, isExporting: isWaitingSchoolsExcelExporting } =
    useTableExcelExport({
      columns: waitingSchoolExportColumns,
      data: waitingSchoolExportRows,
      filename: '배정 대기 기관 목록',
    })

  const waitingSchoolColumns: ColumnsType<InstructorWaitingSchoolRow> = useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: 64, align: 'center' },
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
        className: 'participating-institutions-section__th-sessions',
        onHeaderCell: () => ({
          className: 'participating-institutions-section__th-sessions',
        }),
        onCell: () => ({ className: 'participating-institutions-section__td-sessions' }),
        render: (_: unknown, record: InstructorWaitingSchoolRow) =>
          renderEducationScheduleLines(record.educationScheduleLines),
      },
      {
        title: '배정 현황',
        dataIndex: 'assignmentStatus',
        key: 'assignmentStatus',
        width: 100,
        align: 'center',
        render: (status: InstructorWaitingAssignmentStatus) => (
          <span
            className={`school-detail-fullpage-view__assignment-status school-detail-fullpage-view__assignment-status--${status}`}
          >
            {ASSIGNMENT_STATUS_LABELS[status]}
          </span>
        ),
      },
      {
        title: '배정 강사 수',
        dataIndex: 'assignedInstructorCountLabel',
        key: 'assignedInstructorCountLabel',
        width: 110,
        align: 'center',
      },
    ],
    []
  )

  const handleUnassignClick = useCallback(() => {
    if (selectedAssignedSchoolKeys.length === 0) {
      showAlert({ title: '안내', content: INSTRUCTOR_ASSIGN_UNASSIGN_SELECT_SCHOOL_ALERT_MESSAGE })
      return
    }
    setUnassignConfirmOpen(true)
  }, [selectedAssignedSchoolKeys.length, showAlert])

  const handleSelectAssignClick = useCallback(() => {
    if (selectedWaitingSchoolKeys.length === 0) {
      showAlert({ title: '안내', content: INSTRUCTOR_ASSIGN_SELECT_SCHOOL_ALERT_MESSAGE })
      return
    }
    const movable = waitingSchools.some(
      w => selectedWaitingSchoolKeys.includes(w.id) && w.assignmentStatus === 'waiting'
    )
    if (!movable) {
      return
    }
    const firstSelected = waitingSchools.find(
      w => selectedWaitingSchoolKeys.includes(w.id) && w.assignmentStatus === 'waiting'
    )
    setAssignGuideMode('select')
    setAssignGuideSchoolId(firstSelected?.schoolId ?? firstSelected?.id ?? null)
    setAssignGuideRole(assignedSchools.some(row => row.role === 'lead') ? 'assistant' : 'lead')
    setAssignGuideSessionIds([])
  }, [selectedWaitingSchoolKeys, waitingSchools, assignedSchools, showAlert])

  const handleUnassignConfirm = useCallback(
    (payload: PermissionModalPayload) => {
      if (selectedAssignedSchoolKeys.length === 0) return
      const removedSchoolNames = assignedSchools
        .filter(r => selectedAssignedSchoolKeys.includes(r.id))
        .map(r => r.schoolName)
      const toRemove = new Set(selectedAssignedSchoolKeys.map(String))
      setAssignedSchools(prev => {
        const removedRows = prev.filter(r => toRemove.has(r.id))
        const next = renumberAssignedRows(prev.filter(r => !toRemove.has(r.id)))
        setWaitingSchools(wPrev => {
          const added: InstructorWaitingSchoolRow[] = []
          for (const row of removedRows) {
            const school = schoolRows.find(s => s.id === row.id)
            if (school) {
              if (isCompanySchool) {
                added.push(...buildWaitingSchoolScheduleRows(d, [school], instructorList, new Set()))
              } else {
                added.push(createWaitingRowForSchool(school, d, instructorList, 0, 'waiting'))
              }
            }
          }
          return renumberWaitingRows([...wPrev, ...added])
        })
        return next
      })
      setUnassignConfirmOpen(false)
      setSelectedAssignedSchoolKeys([])
      setUnassignCompleteModal({
        instructorNames: [d.instructorName],
        targetNames: removedSchoolNames,
        reason: payload.reason,
      })
    },
    [selectedAssignedSchoolKeys, assignedSchools, schoolRows, d, instructorList, isCompanySchool]
  )

  const closeAssignGuideModal = useCallback(() => {
    setAssignGuideMode(null)
    setAssignGuideSchoolId(null)
    setAssignGuideRole('assistant')
    setAssignGuideSessionIds([])
  }, [])

  const handleAssignGuideConfirm = useCallback(() => {
    if (!assignGuideMode || !assignGuideSchoolId) {
      return
    }
    const school = schoolRows.find(s => s.id === assignGuideSchoolId)
    if (!school) return

    const selectedWaitingRowKeys = new Set(selectedWaitingSchoolKeys.map(String))
    const selectedAssignSessionIds = new Set(assignGuideSessionIds)
    const hasSelectedSession = (row: InstructorWaitingSchoolRow): boolean =>
      row.sessions?.some(session =>
        selectedAssignSessionIds.has(`session-${session.round}-${session.date}-${session.timeRange}`)
      ) === true
    const selectedScheduleKeys = new Set<string>()
    waitingSchools.forEach(row => {
      if ((selectedWaitingRowKeys.has(row.id) || hasSelectedSession(row)) && row.scheduleKey) {
        selectedScheduleKeys.add(row.scheduleKey)
      }
    })
    school.sessions?.forEach(session => {
      if (selectedAssignSessionIds.has(`session-${session.round}-${session.date}-${session.timeRange}`)) {
        selectedScheduleKeys.add(`${session.date}|${session.dayOfWeek}`)
      }
    })

    setWaitingSchools(prev =>
      renumberWaitingRows(
        prev
          .filter(w => {
            if (!isCompanySchool) return w.id !== assignGuideSchoolId
            const rowSchoolId = w.schoolId ?? w.id
            if (rowSchoolId !== assignGuideSchoolId) return true
            if (selectedWaitingRowKeys.has(w.id) || hasSelectedSession(w)) return false
            return true
          })
          .map(w => {
            if (!isCompanySchool) return w
            const rowSchoolId = w.schoolId ?? w.id
            const isSameAssignedSchool = rowSchoolId === assignGuideSchoolId
            const isSameAssignedSchedule =
              w.scheduleKey != null && selectedScheduleKeys.has(w.scheduleKey)
            if (
              (!isSameAssignedSchool && !isSameAssignedSchedule) ||
              w.assignmentStatus !== 'waiting'
            ) {
              return w
            }
            return { ...w, assignmentStatus: 'cancelled' satisfies InstructorWaitingAssignmentStatus }
          })
      )
    )
    setAssignedSchools(prev => {
      const next = [
        ...prev,
        schoolRowToAssignedRow(school, d, instructorList, 0, assignGuideRole, prev.length),
      ]
      return renumberAssignedRows(next)
    })
    setSelectedWaitingSchoolKeys(prev =>
      prev.filter(key => {
        if (!isCompanySchool) return String(key) !== assignGuideSchoolId
        return !selectedWaitingSchoolKeys.includes(key)
      })
    )
    closeAssignGuideModal()
  }, [
    assignGuideMode,
    assignGuideSchoolId,
    assignGuideRole,
    selectedWaitingSchoolKeys,
    assignGuideSessionIds,
    waitingSchools,
    isCompanySchool,
    schoolRows,
    d,
    instructorList,
    closeAssignGuideModal,
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

  const assignGuideSessionOptions = useMemo(
    () => mapParticipatingSessionsToInstructorAssignOptions(assignGuideSchool?.sessions),
    [assignGuideSchool]
  )

  useEffect(() => {
    setAssignGuideSessionIds([])
  }, [assignGuideSchoolId])

  const unassignSchoolNames = useMemo(
    () =>
      assignedSchools.filter(r => selectedAssignedSchoolKeys.includes(r.id)).map(r => r.schoolName),
    [assignedSchools, selectedAssignedSchoolKeys]
  )

  const privacyMasked = !personalInfoRevealed

  const educationSummary =
    d.educations?.[0]?.schoolType != null
      ? getEducationLevelBadge(undefined, d.educations[0].schoolType)
      : getEducationLevelBadge(d.educationLevel)
  const careerYearsFromDetails = getTotalCareerYears(d.careerDetails)
  const careerSummaryYears =
    careerYearsFromDetails > 0 ? careerYearsFromDetails : (d.lectureExperienceYears ?? 0)
  const qualificationCount = d.qualifications?.length ?? 0

  const handleActivityCertificateIssueClick = useCallback(() => {
    setActivityCertPreviewOpen(true)
  }, [])

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
    (payload: ParticipatingInstructorActivityWithdrawModalPayload) => {
      const updated = applyParticipatingInstructorActivityWithdraw(mergedInstructor.id, {
        reason: 'institution',
        stopScheduleId: payload.stopScheduleId,
      })
      if (!updated) return

      setInstructorPatches(prev => ({
        ...prev,
        activityWithdrawn: updated.activityWithdrawn,
        activityWithdrawReason: updated.activityWithdrawReason,
        activityWithdrawStopScheduleId: updated.activityWithdrawStopScheduleId,
        activityWithdrawStopScheduleLabel: updated.activityWithdrawStopScheduleLabel,
        performanceIncludedScheduleIds: updated.performanceIncludedScheduleIds,
      }))
      setActivityWithdrawModalOpen(false)
    },
    [mergedInstructor.id]
  )

  const handleAdminCommentEditEnter = useCallback(() => {
    if (applicationInfoEdit.isEditing) return
    setAdminCommentDraft(savedAdminComment)
    setAdminCommentError(undefined)
    setAdminCommentModalOpen(true)
  }, [applicationInfoEdit.isEditing, savedAdminComment])

  const handleAdminCommentSave = useCallback(() => {
    setSavedAdminComment(adminCommentDraft.trim())
    setAdminCommentModalOpen(false)
    setAdminCommentError(undefined)
  }, [adminCommentDraft])

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
            {(d.educations?.length ?? 0) > 0 ? (
              d.educations!.map((item, idx) => {
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
            {(d.careerDetails?.length ?? 0) > 0 ? (
              d.careerDetails!.map((item, idx) => (
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
            {(d.qualifications?.length ?? 0) > 0 ? (
              d.qualifications!.map((q: ParticipatingInstructorQualification, idx: number) => (
                <div key={idx} className="instructor-resume-row">
                  <span className="instructor-resume-row-left instructor-resume-row-left--single-year">
                    {q.year ?? '-'}
                  </span>
                  <span className="instructor-resume-row-right instructor-resume-row-right--with-divider">
                    <span className="instructor-resume-emphasis">{q.name ?? '-'}</span>
                  </span>
                </div>
              ))
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
              <CmsButton
                variant="delete"
                size="large"
                width={140}
                disabled={isActivityWithdrawn || applicationInfoEdit.isEditing}
                onClick={handleRequestActivityWithdraw}
              >
                활동 포기
              </CmsButton>
              <CmsButton
                variant="secondary"
                size="large"
                width={180}
                icon={<DownloadOutlined />}
                onClick={handleActivityCertificateIssueClick}
              >
                활동인증서 발급
              </CmsButton>
              <CmsButton
                {...PROGRAM_EDIT_INFO_BUTTON_PROPS}
                onClick={resolveProgramEditInfoClick(applicationInfoEdit.isEditing, {
                  onEnterEdit: applicationInfoEdit.enterEdit,
                  onSaveEdit: () => applicationInfoEdit.saveEdit(),
                })}
              >
                {PROGRAM_EDIT_INFO_BUTTON_LABEL}
              </CmsButton>
              <CmsButton
                variant="primary"
                size="large"
                width={140}
                disabled={applicationInfoEdit.isEditing}
                onClick={handleAdminCommentEditEnter}
              >
                코멘트 작성
              </CmsButton>
              <PersonalInfoRevealButton
                labelMode="stickyReveal"
                revealed={personalInfoRevealed}
                width={180}
                onClick={handlePrivacyToggleClick}
              />
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
            <div className="school-detail-fullpage-view__instructor-section">
              <div className="table-header-actions">
                <div className="table-header-title--wrapper">
                  <span className="table-title">배정된 기관 목록</span>
                  <span className="table-description">{assignedSchools.length}건</span>
                </div>
                <div className="info-section-buttons--wrapper">
                  <CmsButton variant="delete" size="large" onClick={handleUnassignClick}>
                    배정 취소
                  </CmsButton>
                  <CmsButton
                    variant="secondary"
                    size="large"
                    onClick={() => {
                      if (addAssignOptions.length === 0) {
                        return
                      }
                      setAssignGuideMode('add')
                      setAssignGuideSchoolId(addAssignOptions[0]?.value ?? null)
                      setAssignGuideRole(
                        assignedSchools.some(row => row.role === 'lead') ? 'assistant' : 'lead'
                      )
                      setAssignGuideSessionIds([])
                    }}
                  >
                    추가 배정
                  </CmsButton>
                  <ExcelButton
                    onClick={exportAssignedSchoolsExcel}
                    loading={isAssignedSchoolsExcelExporting}
                  />
                </div>
              </div>
              <div className="participating-institutions-section__table-wrap">
                {assignedSchools.length === 0 ? (
                  <div
                    className="school-detail-fullpage-view__instructor-list-empty"
                    role="status"
                    aria-label="배정된 학교 없음"
                  >
                    배정된 학교가 없습니다.
                  </div>
                ) : (
                  <Table<InstructorAssignedSchoolRow>
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
                  <span className="table-description">{waitingSchools.length}건</span>
                </div>
                <div className="info-section-buttons--wrapper">
                  <CmsButton variant="secondary" size="large" onClick={handleSelectAssignClick}>
                    선택 배정
                  </CmsButton>
                  <ExcelButton
                    onClick={exportWaitingSchoolsExcel}
                    loading={isWaitingSchoolsExcelExporting}
                  />
                </div>
              </div>
              <div className="participating-institutions-section__table-wrap participating-instructor-fullpage-view__waiting-table-scroll">
                <Table<InstructorWaitingSchoolRow>
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
                    record.assignmentStatus !== 'waiting'
                      ? 'school-detail-fullpage-view__waiting-row--assigned'
                      : ''
                  }
                />
              </div>
            </div>

            <SchoolDetailUnassignConfirmModal
              open={unassignConfirmOpen}
              onCancel={() => setUnassignConfirmOpen(false)}
              instructorNames={[d.instructorName]}
              targetNames={unassignSchoolNames}
              onConfirm={handleUnassignConfirm}
            />
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
              onInstitutionChange={setAssignGuideSchoolId}
              onRoleChange={setAssignGuideRole}
              onSessionIdsChange={setAssignGuideSessionIds}
              onCancel={closeAssignGuideModal}
              onConfirm={handleAssignGuideConfirm}
            />
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
      {personalInfoRevealModal}
      <ActivityCertificateIssuancePreviewModal
        open={activityCertPreviewOpen}
        onClose={() => setActivityCertPreviewOpen(false)}
        instructor={mergedInstructor}
        program={program}
      />
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
