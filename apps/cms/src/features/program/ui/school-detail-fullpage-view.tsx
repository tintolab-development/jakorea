/**
 * 교육기관 상세 풀페이지 인라인 뷰
 * LNB 제외 메인 영역에서만 렌더. 탭: 신청 정보 | 학생 명단 | 강사 배정 현황 | 출석 관리 | 과제 관리 | 게시글
 * 액션: 승인 취소 | 정보 수정 | 개인정보 상세보기
 */

import type { ReactNode } from 'react'
import { useState, useMemo, useCallback } from 'react'
import { Table, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { AppButton } from '@/shared/ui/app-button'
import type { Program } from '@/types/domain'
import type {
  SchoolDetailForModal,
  SchoolDetailInstructorRow,
  InstructorRoleKey,
} from '../model/school-detail-types'
import { INSTRUCTOR_ROLE_LABELS } from '../model/school-detail-types'
import type {
  ParticipatingSchoolRow,
  ParticipatingSchoolSession,
} from '@/data/mock/participating-schools'
import type {
  ParticipatingInstructorRow,
  SettlementStatusKey,
} from '@/data/mock/participating-instructors'
import { SETTLEMENT_STATUS_LABELS } from '@/data/mock/participating-instructors'
import type { InstructorListFormInstructor } from '../model/school-detail-types'
import {
  getInstructorRowsForSchool,
  getAssignedInstructorDisplayRows,
  getWaitingInstructorRows,
} from '../lib/school-detail-mock'
import { MOCK_INSTRUCTOR_ASSIGN_SESSION_OPTIONS } from '../lib/instructor-assign-session-options'
import {
  maskEmailLocalAfterTwoChars,
  maskMobilePhoneMiddleStars,
} from '../lib/teacher-contact-display-mask'
import { TextbookStatusBadge } from '@/shared/components/textbook-status-badge'
import {
  StatusDropdownCell,
  STATUS_DROPDOWN_CELL_CLASSNAME,
} from '@/shared/components/status-dropdown-cell'
import { SchoolDetailStudentListSection } from './school-detail-student-list-section'
import {
  SchoolDetailAddInstructorAssignModal,
  type AddInstructorAssignOption,
} from './school-detail-add-instructor-assign-modal'
import { SchoolDetailSelectAssignConfirmModal } from './school-detail-select-assign-confirm-modal'
import { SchoolDetailUnassignConfirmModal } from './school-detail-unassign-confirm-modal'
import { SchoolDetailAssignOverflowModal } from './school-detail-assign-overflow-modal'
import { SchoolDetailAssignCompleteModal } from './school-detail-assign-complete-modal'
import {
  DeleteGuideModal,
  buildSchoolCancelApprovalMessageLines,
} from './manager-delete-guide-modal'
import { EnrollmentProgramDetailPostsTab } from '@/features/user/ui/enrollment-program-detail-posts-tab'
import { SendNotiButton } from '@/features/program/ui/detail-modal/components/send-noti-button'
import './detail-modal/program-status/participating-institutions-section.css'
import './instructor-assignment-role-tag.css'
import './instructor-assignment-status-text.css'
import './school-detail-fullpage-view.css'

export const SCHOOL_DETAIL_TAB_KEYS = [
  'application',
  'students',
  'instructors',
  'attendance',
  'assignments',
  'posts',
] as const
export type SchoolDetailTabKey = (typeof SCHOOL_DETAIL_TAB_KEYS)[number]

const SCHOOL_DETAIL_TAB_LABELS: Record<SchoolDetailTabKey, string> = {
  application: '신청 정보',
  students: '학생 명단',
  instructors: '강사 배정 현황',
  attendance: '출석 관리',
  assignments: '과제 관리',
  posts: '게시글',
}

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

const SESSION_STATUS_LABELS: Record<string, string> = {
  completed: '진행 완료',
  pending: '진행 대기',
  not_planned: '미진행 희망',
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

export interface SchoolDetailFullpageViewProps {
  program: Program
  detail: SchoolDetailForModal
  row: ParticipatingSchoolRow
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
}

export function SchoolDetailFullpageView({
  program: _program,
  detail,
  row,
  activeTab: activeTabFromUrl,
  onTabChange,
  onClearSchoolId: _onClearSchoolId,
  onSaveBasicInfo: _onSaveBasicInfo,
  onSaveInstructorInfo,
  savedBasicPatches = {},
  savedInstructorPatches = {},
  instructorList,
  onCancelApproval,
}: SchoolDetailFullpageViewProps) {
  const [internalTab, setInternalTab] = useState<SchoolDetailTabKey>('application')
  const [cancelApprovalConfirmOpen, setCancelApprovalConfirmOpen] = useState(false)
  const activeTab =
    activeTabFromUrl !== undefined && activeTabFromUrl !== null ? activeTabFromUrl : internalTab
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
  const [selectAssignOverflowOpen, setSelectAssignOverflowOpen] = useState(false)
  const [assignCompleteModal, setAssignCompleteModal] = useState<{
    instructorName: string
    schoolName: string
    currentCount: number
    showApprovalAlarmSection: boolean
  } | null>(null)
  const [openRoleDropdownId, setOpenRoleDropdownId] = useState<string | null>(null)
  const [postWriteModalOpen, setPostWriteModalOpen] = useState(false)

  const mergedDetail = { ...detail, ...savedBasicPatches[detail.id] }
  const instructors =
    savedInstructorPatches[detail.id] !== undefined
      ? savedInstructorPatches[detail.id].map(inv => ({
          ...inv,
          settlementStatus: 'pending' as SettlementStatusKey,
        }))
      : getInstructorRowsForSchool(row.schoolName, instructorList)

  /** 담당 교사 정보: 교사명 | Tel | M | E-mail (스크린샷 형식). M·E-mail은 TD 표시용 마스킹 */
  const teacherDisplay = [
    mergedDetail.teacherName && `교사명: ${mergedDetail.teacherName}`,
    mergedDetail.teacherPhone && `Tel: ${mergedDetail.teacherPhone}`,
    mergedDetail.teacherMobile && `M: ${maskMobilePhoneMiddleStars(mergedDetail.teacherMobile)}`,
    mergedDetail.teacherEmail && `E-mail: ${maskEmailLocalAfterTwoChars(mergedDetail.teacherEmail)}`,
  ]
    .filter(Boolean)
    .join(' | ') || '-'
  const mealDisplay = mergedDetail.mealProvided
    ? `제공 | ${mergedDetail.mealNotice ?? ''}`
    : '미제공'
  const waitingDisplay =
    mergedDetail.waitingRoomAvailable && mergedDetail.waitingRoomLocation
      ? `있음 | ${mergedDetail.waitingRoomLocation}`
      : '없음'
  const educationTimeDisplay =
    mergedDetail.totalEducationHours != null && mergedDetail.totalSessions != null
      ? `${mergedDetail.totalEducationHours}시간 (총 ${mergedDetail.totalSessions}회차)`
      : '-'

  /** 기획: 수업 진행 이후 — 회차 중 [진행 완료]가 하나라도 있으면 승인 취소 불가 */
  const isCancelApprovalDisabledAfterClassStarted = (row.sessions ?? []).some(
    s => s.status === 'completed'
  )
  /** 버튼은 항상 노출, 조건부 비활성화 */
  const cancelApprovalDisabledReason = (() => {
    if (!onCancelApproval) return '현재 승인 취소를 처리할 수 없습니다.'
    if (row.approvalStatus !== 'approved') return '승인 완료 상태에서만 승인 취소할 수 있습니다.'
    if (isCancelApprovalDisabledAfterClassStarted)
      return '진행 완료된 회차가 있어 승인 취소할 수 없습니다.'
    return null
  })()
  const isCancelApprovalDisabled = cancelApprovalDisabledReason !== null

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

  const addAssignSessionOptions = useMemo(
    () => MOCK_INSTRUCTOR_ASSIGN_SESSION_OPTIONS,
    []
  )

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
      message.warning('선택한 강사 정보를 찾을 수 없습니다.')
      return
    }
    onSaveInstructorInfo?.(detail.id, [...existingFormList, ...newFormList])
    setSelectAssignConfirmOpen(false)
    setSelectedWaitingKeys([])
    message.success('강사가 배정되었습니다.')
  }, [
    selectedWaitingKeys,
    waitingRows,
    instructorList,
    instructors,
    detail.id,
    onSaveInstructorInfo,
  ])

  /** 배정 취소 확인 모달에서 "배정 취소" 클릭 시: 선택한 배정된 강사를 목록에서 제거 */
  const handleUnassignConfirm = useCallback(() => {
    if (selectedAssignedKeys.length === 0) return
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
    message.success('배정이 취소되었습니다.')
  }, [selectedAssignedKeys, instructors, detail.id, onSaveInstructorInfo])

  const handleRoleChange = useCallback(
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
      message.success('역할이 변경되었습니다.')
    },
    [instructors, detail.id, onSaveInstructorInfo]
  )

  const assignedInstructorColumns: ColumnsType<AssignedInstructorDisplayRow> = useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: 64, align: 'center' },
      {
        title: '역할',
        dataIndex: 'role',
        key: 'role',
        width: 120,
        align: 'center',
        onCell: () => ({ className: STATUS_DROPDOWN_CELL_CLASSNAME }),
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
          />
        ),
      },
      { title: '강사명', dataIndex: 'instructorName', key: 'instructorName', width: 100 },
      {
        title: '자택 주소',
        dataIndex: 'homeAddress',
        key: 'homeAddress',
        width: 160,
        render: (v: string | undefined) => v ?? '-',
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
        title: '교육 담당 날짜',
        dataIndex: 'assignedDate',
        key: 'assignedDate',
        width: 140,
        align: 'center',
        render: (v: string | undefined) => v ?? '-',
      },
      {
        title: '교육 담당 수업 시간',
        dataIndex: 'assignedTime',
        key: 'assignedTime',
        width: 180,
        render: (v: string | undefined) => v ?? '-',
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
    [openRoleDropdownId, handleRoleChange]
  )

  const waitingInstructorColumns: ColumnsType<WaitingInstructorRow> = useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: 64, align: 'center' },
      { title: '강사명', dataIndex: 'instructorName', key: 'instructorName', width: 100 },
      {
        title: '자택 주소',
        dataIndex: 'homeAddress',
        key: 'homeAddress',
        width: 160,
        render: (v: string | undefined) => v ?? '-',
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
        title: '교육 희망 날짜',
        dataIndex: 'hopeDate',
        key: 'hopeDate',
        width: 140,
        align: 'center',
        render: (v: string | undefined) => v ?? '-',
      },
      {
        title: '교육 희망 수업 시간',
        dataIndex: 'hopeTime',
        key: 'hopeTime',
        width: 180,
        render: (v: string | undefined) => v ?? '-',
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
    []
  )

  /** 기본 정보: 스크린샷 순서. 2열 배치 후 담당 교사/신청 사유/기타 요청사항은 span 2 */
  const basicInfoItems = [
    { key: 'schoolName', label: '신청 기관명', children: mergedDetail.schoolName },
    {
      key: 'approval',
      label: '프로그램 승인 현황',
      children: (
        <div className="school-detail-fullpage-view__approval-cell">
          {withTdDivider([
            '승인 완료',
            <SendNotiButton key="notification" />,
          ])}
        </div>
      ),
    },
    { key: 'region', label: '기관 주소', children: mergedDetail.region },
    {
      key: 'addressDetail',
      label: '상세 주소',
      children: mergedDetail.addressDetail ?? '-',
    },
    { key: 'educationGrade', label: '신청 학년', children: mergedDetail.educationGrade },
    {
      key: 'classCount',
      label: '신청 학급 수 및 총 인원',
      children: withTdDivider([
        `${mergedDetail.classCount}개 학급`,
        `총 ${mergedDetail.studentCount}명`,
      ]),
    },
    { key: 'venue', label: '교육 장소', children: mergedDetail.venue ?? '-' },
    {
      key: 'educationFormat',
      label: '교육 형태',
      children: mergedDetail.educationFormat ?? '-',
    },
    {
      key: 'textbook',
      label: '교재명',
      children: (() => {
        const name = mergedDetail.textbookName ?? '-'
        const kitsAndQty =
          mergedDetail.textbookKits != null && mergedDetail.textbookQuantity != null
            ? `${mergedDetail.textbookKits}키트 (${mergedDetail.textbookQuantity}권)`
            : mergedDetail.textbookQuantity != null
              ? `${mergedDetail.textbookQuantity}권`
              : '-'
        const status = <TextbookStatusBadge status={mergedDetail.textbookStatus} />
        return withTdDivider([name, kitsAndQty, status])
      })(),
    },
    {
      key: 'educationTime',
      label: '신청 총 교육시간 및 회차',
      children: educationTimeDisplay,
    },
    {
      key: 'prevYear',
      label: '전년도 참여 여부',
      children: mergedDetail.previousYearParticipation ?? '-',
    },
    {
      key: 'affiliated',
      label: '결연 금융회사명',
      children: mergedDetail.affiliatedFinancialCompany ?? '미결연',
    },
    {
      key: 'teacher',
      label: '담당 교사 정보',
      children: withTdDivider(teacherDisplay === '-' ? ['-'] : teacherDisplay.split(' | ')),
      span: 2,
    },
    {
      key: 'reason',
      label: '신청 사유',
      children: mergedDetail.applicationReason ?? '-',
      span: 2,
    },
    {
      key: 'other',
      label: '기타 요청사항',
      children: mergedDetail.otherRequests ?? '-',
      span: 2,
    },
  ]

  /** 안내 사항: 2열 배치. 왼쪽 열 3개, 오른쪽 열 2개 후 식사는 span 2 */
  const guidanceItems = [
    {
      key: 'computer',
      label: '강의 공간 내 컴퓨터 여부',
      children: mergedDetail.computerInRoom ?? '-',
    },
    {
      key: 'waitingRoom',
      label: '대기실 여부 및 위치',
      children: withTdDivider(
        waitingDisplay.includes(' | ') ? waitingDisplay.split(' | ') : [waitingDisplay]
      ),
    },
    {
      key: 'parking',
      label: '주차 공간 여부 및 위치',
      children: mergedDetail.parkingInfo ?? '-',
    },
    {
      key: 'meal',
      label: '식사 제공 여부 및 안내',
      children: withTdDivider(
        mealDisplay.includes(' | ') ? mealDisplay.split(' | ') : [mealDisplay]
      ),
    },
    {
      key: 'criminalCheck',
      label: '성범죄 경력 조회서 요청',
      children: mergedDetail.criminalCheckRequest ?? '-',
      span: 2,
    },
  ]

  const sessions = row.sessions ?? []

  /** 기본 정보·안내 사항을 2열 테이블 행으로 변환 (프로그램 정보 탭과 동일한 table 구조) */
  const toTableRows = (
    items: Array<{ key: string; label: string; children: ReactNode; span?: number }>
  ) => {
    const rows: React.ReactNode[] = []
    let i = 0
    while (i < items.length) {
      const item = items[i]
      if (item.span === 2) {
        rows.push(
          <tr key={item.key}>
            <th>{item.label}</th>
            <td colSpan={3}>{item.children}</td>
          </tr>
        )
        i += 1
      } else {
        const next = items[i + 1]
        if (next && 'span' in next && next.span === 2) {
          rows.push(
            <tr key={item.key}>
              <th>{item.label}</th>
              <td>{item.children}</td>
              <th />
              <td />
            </tr>
          )
          i += 1
        } else if (next) {
          rows.push(
            <tr key={`${item.key}-${next.key}`}>
              <th>{item.label}</th>
              <td>{item.children}</td>
              <th>{next.label}</th>
              <td>{next.children}</td>
            </tr>
          )
          i += 2
        } else {
          rows.push(
            <tr key={item.key}>
              <th>{item.label}</th>
              <td colSpan={3}>{item.children}</td>
            </tr>
          )
          i += 1
        }
      }
    }
    return rows
  }

  return (
    <div className="school-detail-fullpage-view">
      <div className="program-detail-fullpage-modal__tabs-row school-detail-fullpage-view__tabs-row">
        <div className="program-detail-fullpage-modal__tabs">
          {SCHOOL_DETAIL_TAB_KEYS.map(key => (
            <button
              key={key}
              type="button"
              className={`program-detail-fullpage-modal__tab ${activeTab === key ? 'program-detail-fullpage-modal__tab--active' : ''}`}
              onClick={() => setActiveTab(key as SchoolDetailTabKey)}
            >
              <span className="program-detail-fullpage-modal__tab-label">
                {SCHOOL_DETAIL_TAB_LABELS[key]}
              </span>
            </button>
          ))}
        </div>
        {activeTab === 'application' && (
          <div className="program-detail-fullpage-modal__header-actions">
            <AppButton
              variant="danger"
              size="filter"
              disabled={isCancelApprovalDisabled}
              title={cancelApprovalDisabledReason ?? undefined}
              onClick={() => setCancelApprovalConfirmOpen(true)}
            >
              승인 취소
            </AppButton>
            <AppButton variant="primary" size="filter" onClick={() => {}}>
              정보 수정
            </AppButton>
            <AppButton variant="primary" size="filter-wide" onClick={() => {}}>
              개인정보 상세보기
            </AppButton>
          </div>
        )}
        {activeTab === 'posts' && (
          <div className="program-detail-fullpage-modal__header-actions">
            <AppButton variant="primary" size="filter" onClick={() => setPostWriteModalOpen(true)}>
              게시글 등록
            </AppButton>
          </div>
        )}
      </div>

      <div className="program-detail-fullpage-modal__content school-detail-fullpage-view__content">
        {activeTab === 'application' && (
          <div className="program-detail-fullpage-modal__info-tab">
            <div className="program-detail-fullpage-modal__info-tab-block school-detail-fullpage-view__admin-comment-section">
              <h3 className="program-detail-info-tab__section-title">관리자 코멘트</h3>
              <div
                className={`school-detail-fullpage-view__admin-comment-box ${
                  !mergedDetail.adminComment?.trim()
                    ? 'school-detail-fullpage-view__admin-comment-box--empty'
                    : ''
                }`}
                role="region"
                aria-label="관리자 코멘트"
              >
                {mergedDetail.adminComment?.trim()
                  ? mergedDetail.adminComment
                  : '등록된 코멘트가 없습니다.'}
              </div>
            </div>
            <div className="program-detail-fullpage-modal__info-tab-block">
              <h3 className="program-detail-info-tab__section-title">기본 정보</h3>
              <div className="program-detail-info-tab__table-wrapper program-detail-info-tab__table-wrapper--top">
                <table className="program-detail-info-tab__table program-detail-info-tab__table--basic">
                  <colgroup>
                    <col style={{ width: '200px' }} />
                    <col />
                    <col style={{ width: '200px' }} />
                    <col />
                  </colgroup>
                  <tbody>{toTableRows(basicInfoItems)}</tbody>
                </table>
              </div>
            </div>

            <div className="program-detail-fullpage-modal__info-tab-block school-detail-fullpage-view__guidance-block">
              <h3 className="program-detail-info-tab__section-title">안내 사항</h3>
              <div className="program-detail-info-tab__table-wrapper program-detail-info-tab__table-wrapper--top">
                <table className="program-detail-info-tab__table program-detail-info-tab__table--basic">
                  <colgroup>
                    <col style={{ width: '200px' }} />
                    <col />
                    <col style={{ width: '200px' }} />
                    <col />
                  </colgroup>
                  <tbody>{toTableRows(guidanceItems)}</tbody>
                </table>
              </div>
            </div>

            <div className="program-detail-fullpage-modal__info-tab-block">
              <h3 className="program-detail-info-tab__section-title">강의 회차별 교육 진행 현황</h3>
              <div className="program-detail-info-tab__table-wrapper program-detail-info-tab__table-wrapper--top">
                <table className="program-detail-info-tab__table program-detail-info-tab__table--basic school-detail-fullpage-view__sessions-table">
                  <colgroup>
                    <col style={{ width: '200px' }} />
                    <col />
                  </colgroup>
                  <tbody>
                    {sessions.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="school-detail-fullpage-view__sessions-empty">
                          등록된 회차가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      sessions.map(session => (
                        <SessionTableRow key={session.round} session={session} />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
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

        {activeTab === 'attendance' && (
          <div className="program-detail-fullpage-modal__info-tab">
            <p className="school-detail-fullpage-view__tab-placeholder">출석 관리 화면은 준비 중입니다.</p>
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="program-detail-fullpage-modal__info-tab">
            <p className="school-detail-fullpage-view__tab-placeholder">과제 관리 화면은 준비 중입니다.</p>
          </div>
        )}

        {activeTab === 'instructors' && (
          <div className="program-detail-fullpage-modal__info-tab school-detail-fullpage-view__instructor-tab">
            {/* 섹션 1: 배정된 강사 목록 */}
            <div className="school-detail-fullpage-view__instructor-section">
              <div className="participating-institutions-section__table-header">
                <div className="participating-institutions-section__table-heading">
                  <span className="participating-institutions-section__table-title">
                    배정된 강사 목록
                  </span>
                  <span className="participating-institutions-section__table-description">
                    {instructors.length} / {MOCK_REQUIRED_INSTRUCTORS}명
                  </span>
                </div>
                <div className="participating-institutions-section__table-actions">
                  <AppButton
                    variant="danger"
                    size="large"
                    onClick={() => {
                      if (selectedAssignedKeys.length === 0) {
                        message.warning('배정 취소할 강사를 선택해 주세요.')
                        return
                      }
                      setUnassignConfirmOpen(true)
                    }}
                  >
                    배정 취소
                  </AppButton>
                  <AppButton
                    variant="primary"
                    size="large"
                    className="participating-institutions-section__btn-approve"
                    onClick={() => {
                      if (instructors.length >= MOCK_REQUIRED_INSTRUCTORS) {
                        setAddAssignOverflowOpen(true)
                      } else {
                        setAddAssignModalOpen(true)
                      }
                    }}
                  >
                    추가 배정
                  </AppButton>
                </div>
              </div>
              <div className="participating-institutions-section__table-wrap">
                {assignedRows.length === 0 ? (
                  <div
                    className="school-detail-fullpage-view__assigned-empty"
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
              <div className="participating-institutions-section__table-header">
                <div className="participating-institutions-section__table-heading">
                  <span className="participating-institutions-section__table-title">
                    배정 대기 강사 목록
                  </span>
                  <span className="participating-institutions-section__table-description">
                    {waitingRows.length}건
                  </span>
                </div>
                <div className="participating-institutions-section__table-actions">
                  <AppButton
                    variant="primary"
                    size="large"
                    className="participating-institutions-section__btn-approve"
                    onClick={() => {
                      if (selectedWaitingKeys.length === 0) {
                        message.warning('배정할 강사를 선택해 주세요.')
                        return
                      }
                      setSelectAssignConfirmOpen(true)
                    }}
                  >
                    선택 배정
                  </AppButton>
                </div>
              </div>
              <div className="participating-institutions-section__table-wrap">
                <Table<WaitingInstructorRow>
                  className="participating-institutions-section__table cms-data-table"
                  rowKey="id"
                  size="middle"
                  pagination={false}
                  scroll={{ x: 1000 }}
                  rowSelection={{
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
                  locale={{ emptyText: '배정 대기 중인 강사가 없습니다.' }}
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
              schoolName={row.schoolName}
              instructorNames={assignedRows
                .filter(r => selectedAssignedKeys.includes(r.id))
                .map(r => r.instructorName)}
              onConfirm={handleUnassignConfirm}
            />
          </div>
        )}

        {activeTab === 'posts' && (
          <div className="program-detail-fullpage-modal__info-tab school-detail-fullpage-view__posts-tab-wrap">
            <EnrollmentProgramDetailPostsTab
              program={_program}
              schoolId={detail.id}
              showWriteButtonInSection={false}
              writeModalOpen={postWriteModalOpen}
              onWriteModalOpenChange={setPostWriteModalOpen}
            />
          </div>
        )}
      </div>

      {cancelApprovalConfirmOpen && (
        <DeleteGuideModal
          open={cancelApprovalConfirmOpen}
          onCancel={() => setCancelApprovalConfirmOpen(false)}
          onConfirm={() => {
            onCancelApproval?.(row.id)
            setCancelApprovalConfirmOpen(false)
          }}
          title="승인 취소 안내"
          lines={buildSchoolCancelApprovalMessageLines(row.schoolName)}
          confirmText="취소"
          confirmVariant="danger"
        />
      )}
    </div>
  )
}

function SessionTableRow({ session }: { session: ParticipatingSchoolSession }) {
  const isNotPlanned = session.status === 'not_planned' || !session.date
  const datePart = `${session.date.replace(/\./g, '. ')}(${session.dayOfWeek})`
  const durationFormat = `${session.duration} (${session.format})`
  const periodTime = `${session.classNum} (${session.timeRange.replace('~', ' ~ ')})`
  const statusLabel = session.status
    ? (SESSION_STATUS_LABELS[session.status] ?? session.status)
    : '미진행 희망'
  const statusClass =
    session.status === 'completed'
      ? 'school-detail-fullpage-view__session-status--completed'
      : session.status === 'pending'
        ? 'school-detail-fullpage-view__session-status--pending'
        : 'school-detail-fullpage-view__session-status--not_planned'

  const contentCell = isNotPlanned
    ? '미진행 희망'
    : withTdDivider([
        datePart,
        durationFormat,
        periodTime,
        <span key="status" className={`school-detail-fullpage-view__session-status ${statusClass}`}>
          {statusLabel}
        </span>,
      ])

  return (
    <tr>
      <th>{session.round}차시 강의</th>
      <td>{contentCell}</td>
    </tr>
  )
}
