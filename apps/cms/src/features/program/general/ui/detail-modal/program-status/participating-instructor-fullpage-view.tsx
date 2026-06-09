/**
 * 참여 강사 상세 풀페이지 인라인 뷰
 * 프로그램 진행 현황 > 참여 강사 — instructorId 쿼리 시 목록 대신 표시
 */

import { useState, useEffect, useMemo, useCallback, type Key } from 'react'
import { Table, Select } from 'antd'
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
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import { ContentModal } from '@/shared/ui/content-modal'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { usePersonalInfoReveal } from '@/features/user/detail/lib/use-personal-info-reveal'
import { PersonalInfoRevealButton } from '@/features/user/detail/ui/personal-info-reveal-button'
import { ProgramDetailTdDivider } from '@/features/program/shared/ui/program-detail-td-divider'
import {
  INSTRUCTOR_ROLE_LABELS,
  type InstructorRoleKey,
} from '@/features/program/general/model/school-detail-types'
import {
  StatusDropdownCell,
  STATUS_DROPDOWN_CELL_CLASSNAME,
  STATUS_DROPDOWN_CELL_TAG_132_CLASSNAME,
  STATUS_DROPDOWN_CELL_TAG_132_HEADER_CLASSNAME,
} from '@/shared/components/status-dropdown-cell'
import {
  buildInitialAssignedSchoolRows,
  buildWaitingSchoolRows,
  createWaitingRowForSchool,
  schoolRowToAssignedRow,
  renumberAssignedRows,
  renumberWaitingRows,
  type InstructorAssignedSchoolRow,
  type InstructorWaitingSchoolRow,
  type InstructorWaitingAssignmentStatus,
} from '@/features/program/general/lib/instructor-institution-assignment-mock'
import { PARTICIPATING_INSTITUTIONS_SESSIONS_COLUMN_WIDTH } from '@/features/program/general/lib/participating-institutions-table'
import { SchoolDetailUnassignCompleteModal } from './school-detail-unassign-complete-modal'
import { SchoolDetailUnassignConfirmModal } from './school-detail-unassign-confirm-modal'
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
import { ParticipatingInstructorSettlementSection } from './participating-instructor-settlement-section'
import { ActivityCertificateIssuancePreviewModal } from './activity-certificate-issuance-preview-modal'
import type { PermissionModalPayload } from '@/shared/components/permission-modal'
import './participating-institutions-section.css'
import './instructor-assignment-role-tag.css'
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
  const [internalTab, setInternalTab] = useState<InstructorDetailTabKey>('application')
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
  const [selectAssignConfirmOpen, setSelectAssignConfirmOpen] = useState(false)
  const [addAssignModalOpen, setAddAssignModalOpen] = useState(false)
  const [addAssignSchoolId, setAddAssignSchoolId] = useState<string | null>(null)
  const [activityCertPreviewOpen, setActivityCertPreviewOpen] = useState(false)
  const [savedAdminComment, setSavedAdminComment] = useState('')
  const [isAdminCommentEditing, setIsAdminCommentEditing] = useState(false)
  const [adminCommentDraft, setAdminCommentDraft] = useState('')
  const [adminCommentError, setAdminCommentError] = useState<string | undefined>()
  const [instructorPatches, setInstructorPatches] = useState<Partial<ParticipatingInstructorRow>>(
    {}
  )
  const [activityWithdrawModalOpen, setActivityWithdrawModalOpen] = useState(false)
  const { showAlert } = useCmsAlert()

  const mergedInstructor = useMemo(() => ({ ...d, ...instructorPatches }), [d, instructorPatches])

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

  const activeTab =
    activeTabFromUrl !== undefined && activeTabFromUrl !== null ? activeTabFromUrl : internalTab
  const effectiveTab = activeTab
  const setActiveTab = (key: InstructorDetailTabKey) => {
    if (onTabChange) onTabChange(key)
    else setInternalTab(key)
  }

  useEffect(() => {
    const assigned = buildInitialAssignedSchoolRows(d, schoolRows, instructorList)
    setAssignedSchools(assigned)
    setWaitingSchools(
      buildWaitingSchoolRows(d, schoolRows, instructorList, new Set(assigned.map(r => r.id)))
    )
    setSelectedAssignedSchoolKeys([])
    setSelectedWaitingSchoolKeys([])
    setOpenRoleDropdownId(null)
  }, [d.id, schoolRows, instructorList])

  useEffect(() => {
    setSavedAdminComment(d.adminComment ?? '')
    setIsAdminCommentEditing(false)
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
        width: 150,
        align: 'center',
        onHeaderCell: () => ({ className: STATUS_DROPDOWN_CELL_TAG_132_HEADER_CLASSNAME }),
        onCell: () => ({
          className: `${STATUS_DROPDOWN_CELL_CLASSNAME} ${STATUS_DROPDOWN_CELL_TAG_132_CLASSNAME}`,
        }),
        render: (role: InstructorRoleKey, record: InstructorAssignedSchoolRow) => (
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
    setSelectAssignConfirmOpen(true)
  }, [selectedWaitingSchoolKeys, waitingSchools, showAlert])

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
              added.push(createWaitingRowForSchool(school, d, instructorList, 0, 'waiting'))
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
    [selectedAssignedSchoolKeys, assignedSchools, schoolRows, d, instructorList]
  )

  const handleSelectAssignConfirm = useCallback(() => {
    const selectedRows = waitingSchools.filter(
      w => selectedWaitingSchoolKeys.includes(w.id) && w.assignmentStatus === 'waiting'
    )
    if (selectedRows.length === 0) {
      return
    }
    const ids = new Set(selectedRows.map(r => r.id))
    setWaitingSchools(prev => renumberWaitingRows(prev.filter(w => !ids.has(w.id))))
    setAssignedSchools(prev => {
      const next = [...prev]
      let idx = next.length
      let hasLead = next.some(r => r.role === 'lead')
      for (const w of selectedRows) {
        const school = schoolRows.find(s => s.id === w.id)
        if (!school) continue
        const role: InstructorRoleKey = hasLead ? 'assistant' : 'lead'
        next.push(schoolRowToAssignedRow(school, d, instructorList, 0, role, idx))
        if (role === 'lead') hasLead = true
        idx += 1
      }
      return renumberAssignedRows(next)
    })
    setSelectAssignConfirmOpen(false)
    setSelectedWaitingSchoolKeys([])
  }, [selectedWaitingSchoolKeys, waitingSchools, schoolRows, d, instructorList])

  const handleAddAssignConfirm = useCallback(() => {
    if (!addAssignSchoolId) {
      return
    }
    const school = schoolRows.find(s => s.id === addAssignSchoolId)
    if (!school) {
      return
    }
    setWaitingSchools(prev => renumberWaitingRows(prev.filter(w => w.id !== addAssignSchoolId)))
    setAssignedSchools(prev => {
      const hasLead = prev.some(r => r.role === 'lead')
      const role: InstructorRoleKey = hasLead ? 'assistant' : 'lead'
      const next = [
        ...prev,
        schoolRowToAssignedRow(school, d, instructorList, 0, role, prev.length),
      ]
      return renumberAssignedRows(next)
    })
    setAddAssignModalOpen(false)
    setAddAssignSchoolId(null)
  }, [addAssignSchoolId, schoolRows, d, instructorList])

  const addAssignOptions = useMemo(
    () =>
      waitingSchools
        .filter(w => w.assignmentStatus === 'waiting')
        .map(w => ({ value: w.id, label: w.schoolName })),
    [waitingSchools]
  )

  const unassignSchoolNames = useMemo(
    () =>
      assignedSchools.filter(r => selectedAssignedSchoolKeys.includes(r.id)).map(r => r.schoolName),
    [assignedSchools, selectedAssignedSchoolKeys]
  )

  const selectAssignSchoolNames = useMemo(
    () =>
      waitingSchools
        .filter(w => selectedWaitingSchoolKeys.includes(w.id) && w.assignmentStatus === 'waiting')
        .map(w => w.schoolName),
    [waitingSchools, selectedWaitingSchoolKeys]
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
    if (applicationInfoEdit.isEditing || isAdminCommentEditing) return
    setActivityWithdrawModalOpen(true)
  }, [applicationInfoEdit.isEditing, isActivityWithdrawn, isAdminCommentEditing, showAlert])

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
    setIsAdminCommentEditing(true)
  }, [applicationInfoEdit.isEditing, savedAdminComment])

  const handleAdminCommentSave = useCallback(() => {
    setSavedAdminComment(adminCommentDraft.trim())
    setIsAdminCommentEditing(false)
    setAdminCommentError(undefined)
  }, [adminCommentDraft])

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
          isAdminCommentEditing={isAdminCommentEditing}
          adminCommentDraft={adminCommentDraft}
          onAdminCommentDraftChange={handleAdminCommentDraftChange}
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
                  <div key={idx} className="instructor-resume-row instructor-resume-row--career">
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
                <div key={idx} className="instructor-resume-row instructor-resume-row--career">
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
                  <span className="instructor-resume-row-right instructor-resume-row-right--black">
                    {q.name ?? '-'}
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
                disabled={
                  isActivityWithdrawn || applicationInfoEdit.isEditing || isAdminCommentEditing
                }
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
                variant="secondary"
                size="large"
                width={140}
                disabled={isAdminCommentEditing}
                onClick={
                  applicationInfoEdit.isEditing
                    ? () => applicationInfoEdit.saveEdit()
                    : applicationInfoEdit.enterEdit
                }
              >
                {applicationInfoEdit.isEditing ? '정보 저장' : '정보 수정'}
              </CmsButton>
              <CmsButton
                variant="primary"
                size="large"
                width={140}
                disabled={applicationInfoEdit.isEditing}
                onClick={
                  isAdminCommentEditing ? handleAdminCommentSave : handleAdminCommentEditEnter
                }
              >
                {isAdminCommentEditing ? '코멘트 저장' : '코멘트 작성'}
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
        {effectiveTab === 'institutionAssignment' && (
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
                      setAddAssignSchoolId(addAssignOptions[0]?.value ?? null)
                      setAddAssignModalOpen(true)
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
              <div className="participating-institutions-section__table-wrap">
                {waitingSchools.length === 0 ? (
                  <div
                    className="school-detail-fullpage-view__instructor-list-empty"
                    role="status"
                    aria-label="배정 대기 학교 없음"
                  >
                    배정 대기 중인 기관이 없습니다.
                  </div>
                ) : (
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
                    rowClassName={record =>
                      record.assignmentStatus !== 'waiting'
                        ? 'school-detail-fullpage-view__waiting-row--assigned'
                        : ''
                    }
                  />
                )}
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

            <ContentModal
              open={selectAssignConfirmOpen}
              onCancel={() => setSelectAssignConfirmOpen(false)}
              title="기관 배정 안내"
              width={560}
              footer={
                <>
                  <CmsButton
                    variant="secondary"
                    size="large"
                    onClick={() => setSelectAssignConfirmOpen(false)}
                  >
                    취소
                  </CmsButton>
                  <CmsButton variant="primary" size="large" onClick={handleSelectAssignConfirm}>
                    배정
                  </CmsButton>
                </>
              }
            >
              <p>
                [<strong>{d.instructorName}</strong>] 강사님을 다음 기관에 배정하시겠습니까?{' '}
                {selectAssignSchoolNames.map((name, i) => (
                  <span key={`${name}-${i}`}>
                    [<strong>{name}</strong>]{i < selectAssignSchoolNames.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </p>
            </ContentModal>

            <ContentModal
              open={addAssignModalOpen}
              onCancel={() => {
                setAddAssignModalOpen(false)
                setAddAssignSchoolId(null)
              }}
              title="추가 배정"
              width={480}
              footer={
                <>
                  <CmsButton
                    variant="secondary"
                    size="large"
                    onClick={() => {
                      setAddAssignModalOpen(false)
                      setAddAssignSchoolId(null)
                    }}
                  >
                    취소
                  </CmsButton>
                  <CmsButton variant="primary" size="large" onClick={handleAddAssignConfirm}>
                    배정
                  </CmsButton>
                </>
              }
            >
              <div style={{ marginBottom: 16 }}>
                <span style={{ display: 'block', marginBottom: 8 }}>기관 선택</span>
                <Select
                  style={{ width: '100%' }}
                  placeholder="기관을 선택하세요"
                  options={addAssignOptions}
                  value={addAssignSchoolId ?? undefined}
                  onChange={v => setAddAssignSchoolId(v)}
                  allowClear
                  getPopupContainer={() => document.body}
                />
              </div>
            </ContentModal>
          </div>
        )}
        {effectiveTab === 'lectureReports' && (
          <div className="program-detail-fullpage-modal__info-tab school-detail-fullpage-view__instructor-tab">
            <ParticipatingInstructorLectureReportsSection
              instructor={mergedInstructor}
              program={program}
            />
          </div>
        )}
        {effectiveTab === 'settlement' && (
          <div className="program-detail-fullpage-modal__info-tab school-detail-fullpage-view__instructor-tab">
            <ParticipatingInstructorSettlementSection
              instructor={mergedInstructor}
              program={program}
            />
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
    </div>
  )
}
