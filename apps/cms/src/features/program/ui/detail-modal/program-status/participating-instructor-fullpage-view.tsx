/**
 * 참여 강사 상세 풀페이지 인라인 뷰
 * 프로그램 진행 현황 > 참여 강사 — instructorId 쿼리 시 목록 대신 표시
 */

import { useState, useEffect, useMemo, useCallback, type ReactNode, type Key } from 'react'
import { message, Table, Select } from 'antd'
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
import { MASKING_POLICY } from '@/shared/constants/download-policy'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { AppButton } from '@/shared/ui/app-button'
import { ContentModal } from '@/shared/ui/content-modal'
import { SendNotiButton } from '@/features/program/ui/detail-modal/components/send-noti-button'
import { EnrollmentProgramDetailPostsTab } from '@/features/user/detail/ui/enrollment-program-detail-posts-tab'
import { usePersonalInfoReveal } from '@/features/user/detail/lib/use-personal-info-reveal'
import { PersonalInfoRevealButton } from '@/features/user/detail/ui/personal-info-reveal-button'
import {
  ProgramDetailTdDivider,
  withProgramDetailTdDivider,
  ProgramDetailTdSegmentWrap,
} from '@/features/program/ui/program-detail-td-divider'
import type { InstructorRoleKey } from '@/features/program/model/school-detail-types'
import { INSTRUCTOR_ROLE_LABELS } from '@/features/program/model/school-detail-types'
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
} from '@/features/program/lib/instructor-institution-assignment-mock'
import './participating-institutions-section.css'
import '../../instructor-assignment-role-tag.css'
import '../../instructor-assignment-status-text.css'
import '../../school-detail-fullpage-view.css'
import './participating-instructor-fullpage-view.css'

const ASSIGNMENT_STATUS_LABELS: Record<InstructorWaitingAssignmentStatus, string> = {
  waiting: '배정 대기',
  cancelled: '배정 취소',
  assigned: '배정 완료',
}

export const INSTRUCTOR_DETAIL_TAB_KEYS = [
  'application',
  'institutionAssignment',
  'settlement',
  'posts',
] as const
export type InstructorDetailTabKey = (typeof INSTRUCTOR_DETAIL_TAB_KEYS)[number]

/** 참여 강사 풀페이지 — 정산 현황 탭 비활성화(표시만 유지) */
const INSTRUCTOR_TAB_DISABLED: Partial<Record<InstructorDetailTabKey, boolean>> = {
  settlement: true,
}

const TAB_LABELS: Record<InstructorDetailTabKey, string> = {
  application: '신청 정보',
  institutionAssignment: '기관 배정 현황',
  settlement: '정산 현황',
  posts: '게시글',
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

function formatBirthGenderAgeContent(d: ParticipatingInstructorRow): ReactNode {
  /** 생년월일과 (만 n세)는 한 문자열로 묶어 flex 분리 시 공백이 사라지지 않도록 함 */
  const birthAgeStr =
    d.birthDate && d.age != null
      ? `${d.birthDate} (만 ${d.age}세)`
      : d.birthDate
        ? d.birthDate
        : d.age != null
          ? `만 ${d.age}세`
          : null
  const parts = [d.gender, birthAgeStr].filter(Boolean) as string[]
  if (parts.length === 0) return '-'
  return withProgramDetailTdDivider(parts)
}

function formatAccountContent(d: ParticipatingInstructorRow, mask: boolean): ReactNode {
  const bank = d.bankName ?? ''
  const num = d.accountNumber ?? ''
  const holder = d.accountHolder ?? ''
  if (!bank && !num && !holder) return '-'
  if (mask) {
    const maskedNum = num ? MASKING_POLICY.accountNumber(num) : ''
    const maskedHolder = holder ? MASKING_POLICY.accountHolderName(holder) : ''
    const left = [bank, maskedNum].filter(Boolean).join(' ')
    if (!maskedHolder) return left || '-'
    if (!left) return maskedHolder
    return withProgramDetailTdDivider([left, maskedHolder])
  }
  const left = [bank, num].filter(Boolean).join(' ')
  if (!holder) return left || '-'
  if (!left) return holder
  return withProgramDetailTdDivider([left, holder])
}

/** 읍·면·동 단위까지 노출, 그 이후는 블러(마스킹 모드). 신청 강사 기본 정보와 동일 */
function splitAddressAfterDong(address: string): { head: string; tail: string } | null {
  const re = /(?:^|\s)([가-힣]{2,12}동)(?=\s|$)/u
  const m = address.match(re)
  if (!m) return null
  const dong = m[1]
  const i = address.indexOf(dong)
  if (i === -1) return null
  const end = i + dong.length
  return { head: address.slice(0, end), tail: address.slice(end) }
}

/** 동 미매칭 시: 행정구(OO구)까지 노출, 그 이후 블러 */
function splitAddressAfterGu(address: string): { head: string; tail: string } | null {
  const re = /(?:^|\s)([가-힣]{1,12}구)(?=\s|$)/u
  const m = address.match(re)
  if (!m) return null
  const gu = m[1]
  const i = address.indexOf(gu)
  if (i === -1) return null
  const end = i + gu.length
  return { head: address.slice(0, end), tail: address.slice(end) }
}

function splitAddressForPrivacyBlur(address: string): { head: string; tail: string } | null {
  return splitAddressAfterDong(address) ?? splitAddressAfterGu(address)
}

function maskEducationSchoolName(name: string): string {
  const suffixes = [
    '교육대학교',
    '전문대학교',
    '초등학교',
    '고등학교',
    '중학교',
    '대학교',
    '대학원',
    '대학',
    '전문대',
  ].sort((a, b) => b.length - a.length)
  for (const suf of suffixes) {
    if (name.endsWith(suf)) {
      return `**${suf}`
    }
  }
  if (name.length <= 2) return '**'
  return `**${name.slice(-2)}`
}

function ParticipatingAddressDisplay({ address, mask }: { address: string; mask: boolean }) {
  if (!address) return <>-</>
  if (!mask) return <>{address}</>
  const split = splitAddressForPrivacyBlur(address)
  if (!split) {
    return (
      <span className="participating-instructor-fullpage-view__address-blur" aria-hidden="true">
        {address}
      </span>
    )
  }
  const { head, tail } = split
  if (!tail.trim()) {
    return <>{head}</>
  }
  return (
    <>
      {head}
      <span className="participating-instructor-fullpage-view__address-blur" aria-hidden="true">
        {tail}
      </span>
    </>
  )
}

function lectureFeeCriteriaContent(d: ParticipatingInstructorRow): ReactNode {
  const cat = d.lectureFeeCategory?.trim()
  const amt = d.lectureFeeAmount?.trim()
  if (!cat && !amt) return '-'
  if (!cat) return amt ?? '-'
  if (!amt) return cat
  return withProgramDetailTdDivider([cat, amt])
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
  const [postWriteModalOpen, setPostWriteModalOpen] = useState(false)
  const [assignedSchools, setAssignedSchools] = useState<InstructorAssignedSchoolRow[]>([])
  const [waitingSchools, setWaitingSchools] = useState<InstructorWaitingSchoolRow[]>([])
  const [selectedAssignedSchoolKeys, setSelectedAssignedSchoolKeys] = useState<Key[]>([])
  const [selectedWaitingSchoolKeys, setSelectedWaitingSchoolKeys] = useState<Key[]>([])
  const [openRoleDropdownId, setOpenRoleDropdownId] = useState<string | null>(null)
  const [unassignConfirmOpen, setUnassignConfirmOpen] = useState(false)
  const [selectAssignConfirmOpen, setSelectAssignConfirmOpen] = useState(false)
  const [addAssignModalOpen, setAddAssignModalOpen] = useState(false)
  const [addAssignSchoolId, setAddAssignSchoolId] = useState<string | null>(null)

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
  const effectiveTab: InstructorDetailTabKey =
    activeTab === 'settlement' ? 'application' : activeTab
  const setActiveTab = (key: InstructorDetailTabKey) => {
    if (INSTRUCTOR_TAB_DISABLED[key]) return
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
    message.success('역할이 변경되었습니다.')
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
      { title: '기관 주소', dataIndex: 'region', key: 'region', width: 160 },
      {
        title: '자택과의 거리',
        dataIndex: 'distanceFromHome',
        key: 'distanceFromHome',
        width: 110,
        align: 'center',
      },
      {
        title: '교육 담당 날짜',
        dataIndex: 'assignedDate',
        key: 'assignedDate',
        width: 140,
        align: 'center',
      },
      {
        title: '교육 담당 수업 시간',
        dataIndex: 'assignedTime',
        key: 'assignedTime',
        width: 180,
      },
      {
        title: '교육 할당 차시',
        dataIndex: 'assignedSession',
        key: 'assignedSession',
        width: 110,
        align: 'center',
      },
      {
        title: '강사 배정 현황',
        dataIndex: 'instructorAssignmentLabel',
        key: 'instructorAssignmentLabel',
        width: 120,
        align: 'center',
      },
    ],
    [openRoleDropdownId, handleRoleChange]
  )

  const waitingSchoolColumns: ColumnsType<InstructorWaitingSchoolRow> = useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: 64, align: 'center' },
      { title: '기관명', dataIndex: 'schoolName', key: 'schoolName', width: 140 },
      { title: '기관 주소', dataIndex: 'region', key: 'region', width: 160 },
      {
        title: '자택과의 거리',
        dataIndex: 'distanceFromHome',
        key: 'distanceFromHome',
        width: 110,
        align: 'center',
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
        title: '교육 희망 날짜',
        dataIndex: 'hopeDate',
        key: 'hopeDate',
        width: 140,
        align: 'center',
      },
      {
        title: '교육 희망 수업 시간',
        dataIndex: 'hopeTime',
        key: 'hopeTime',
        width: 180,
      },
      {
        title: '교육 희망 차시',
        dataIndex: 'hopeSession',
        key: 'hopeSession',
        width: 110,
        align: 'center',
      },
      {
        title: '강사 배정 인원',
        dataIndex: 'instructorCountLabel',
        key: 'instructorCountLabel',
        width: 120,
        align: 'center',
      },
    ],
    []
  )

  const handleUnassignConfirm = useCallback(() => {
    if (selectedAssignedSchoolKeys.length === 0) return
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
    message.success('배정이 취소되었습니다.')
  }, [selectedAssignedSchoolKeys, schoolRows, d, instructorList])

  const handleSelectAssignConfirm = useCallback(() => {
    const selectedRows = waitingSchools.filter(
      w => selectedWaitingSchoolKeys.includes(w.id) && w.assignmentStatus !== 'assigned'
    )
    if (selectedRows.length === 0) {
      message.warning('배정할 기관을 선택해 주세요.')
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
    message.success('기관이 배정되었습니다.')
  }, [selectedWaitingSchoolKeys, waitingSchools, schoolRows, d, instructorList])

  const handleAddAssignConfirm = useCallback(() => {
    if (!addAssignSchoolId) {
      message.warning('기관을 선택해 주세요.')
      return
    }
    const school = schoolRows.find(s => s.id === addAssignSchoolId)
    if (!school) {
      message.warning('선택한 기관을 찾을 수 없습니다.')
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
    message.success('기관이 배정되었습니다.')
  }, [addAssignSchoolId, schoolRows, d, instructorList])

  const addAssignOptions = useMemo(
    () =>
      waitingSchools
        .filter(w => w.assignmentStatus !== 'assigned')
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
        .filter(w => selectedWaitingSchoolKeys.includes(w.id) && w.assignmentStatus !== 'assigned')
        .map(w => w.schoolName),
    [waitingSchools, selectedWaitingSchoolKeys]
  )

  const privacyMasked = !personalInfoRevealed

  const educationCell = useMemo(() => {
    const schoolPart = d.educationSchoolName
      ? privacyMasked
        ? maskEducationSchoolName(d.educationSchoolName)
        : d.educationSchoolName
      : ''
    return withProgramDetailTdDivider(
      [d.educationLevel, schoolPart].filter(s => Boolean(s)) as string[]
    )
  }, [d.educationLevel, d.educationSchoolName, privacyMasked])

  const educationSummary =
    d.educations?.[0]?.schoolType != null
      ? getEducationLevelBadge(undefined, d.educations[0].schoolType)
      : getEducationLevelBadge(d.educationLevel)
  const careerYearsFromDetails = getTotalCareerYears(d.careerDetails)
  const careerSummaryYears =
    careerYearsFromDetails > 0 ? careerYearsFromDetails : (d.lectureExperienceYears ?? 0)
  const qualificationCount = d.qualifications?.length ?? 0
  const affiliationCell = withProgramDetailTdDivider(
    [
      'JA강사단',
      d.lectureExperienceYears != null ? `${d.lectureExperienceYears}년` : null,
      d.jaEvaluationGrade,
    ].filter((x): x is string => Boolean(x))
  )

  const applicationTab = (
    <>
      <div className="program-detail-fullpage-modal__info-tab-block participating-instructor-fullpage-view__section-block">
        <div className="program-detail-info-tab__section-header-row">
          <h3 className="program-detail-info-tab__section-title">기본 정보</h3>
        </div>
        <div className="program-detail-info-tab__table-wrapper program-detail-info-tab__table-wrapper--top">
          <table className="program-detail-info-tab__table program-detail-info-tab__table--basic">
            <colgroup>
              <col style={{ width: '200px' }} />
              <col />
              <col style={{ width: '200px' }} />
              <col />
            </colgroup>
            <tbody>
              <tr>
                <th scope="row">성명</th>
                <td>
                  <ProgramDetailTdSegmentWrap>
                    <span>{d.instructorName}</span>
                    {d.nameEnglish ? (
                      <>
                        <ProgramDetailTdDivider />
                        <span>{d.nameEnglish}</span>
                      </>
                    ) : null}
                  </ProgramDetailTdSegmentWrap>
                </td>
                <th scope="row">프로그램 승인 현황</th>
                <td>
                  <ProgramDetailTdSegmentWrap>
                    <span>승인 완료</span>
                    <ProgramDetailTdDivider />
                    <SendNotiButton />
                  </ProgramDetailTdSegmentWrap>
                </td>
              </tr>
              <tr>
                <th scope="row">연락처</th>
                <td>
                  {d.contact ? (privacyMasked ? MASKING_POLICY.phone(d.contact) : d.contact) : '-'}
                </td>
                <th scope="row">성별 및 생년월일</th>
                <td>
                  <ProgramDetailTdSegmentWrap>
                    {formatBirthGenderAgeContent(d)}
                  </ProgramDetailTdSegmentWrap>
                </td>
              </tr>
              <tr>
                <th scope="row">자택 주소</th>
                <td>
                  {d.address ? (
                    <ParticipatingAddressDisplay address={d.address} mask={privacyMasked} />
                  ) : (
                    '-'
                  )}
                </td>
                <th scope="row">이메일</th>
                <td>{d.email ? (privacyMasked ? MASKING_POLICY.email(d.email) : d.email) : '-'}</td>
              </tr>
              <tr>
                <th scope="row">최종 학력</th>
                <td>
                  <ProgramDetailTdSegmentWrap>{educationCell}</ProgramDetailTdSegmentWrap>
                </td>
                <th scope="row">정산 계좌 정보</th>
                <td>
                  <ProgramDetailTdSegmentWrap>
                    {formatAccountContent(d, privacyMasked)}
                  </ProgramDetailTdSegmentWrap>
                </td>
              </tr>
              <tr>
                <th scope="row">한 줄 소개</th>
                <td colSpan={3}>{d.oneLineIntro ?? '-'}</td>
              </tr>
              <tr>
                <th scope="row">소속 및 강사 경력</th>
                <td colSpan={3}>
                  <ProgramDetailTdSegmentWrap>{affiliationCell}</ProgramDetailTdSegmentWrap>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="program-detail-info-tab__table-wrapper participating-instructor-fullpage-view__fee-table-wrap">
          <table className="program-detail-info-tab__table program-detail-info-tab__table--basic">
            <colgroup>
              <col style={{ width: '200px' }} />
              <col />
              <col style={{ width: '200px' }} />
              <col />
            </colgroup>
            <tbody>
              <tr>
                <th scope="row">강의비 책정 기준</th>
                <td>
                  <ProgramDetailTdSegmentWrap>
                    {lectureFeeCriteriaContent(d)}
                  </ProgramDetailTdSegmentWrap>
                </td>
                <th scope="row">사업소득자 여부</th>
                <td>{d.businessIncomeEarnerStatus?.trim() || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="program-detail-fullpage-modal__info-tab-block participating-instructor-fullpage-view__section-block instructor-resume-section">
        <h3 className="instructor-resume-section-title">
          학력사항
          <span className="instructor-resume-section-count">{educationSummary}</span>
        </h3>
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
      </div>

      <div className="program-detail-fullpage-modal__info-tab-block participating-instructor-fullpage-view__section-block instructor-resume-section">
        <h3 className="instructor-resume-section-title">
          경력사항
          <span className="instructor-resume-section-count">{careerSummaryYears}년</span>
        </h3>
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
      </div>

      <div className="program-detail-fullpage-modal__info-tab-block participating-instructor-fullpage-view__section-block instructor-resume-section">
        <h3 className="instructor-resume-section-title">
          자격 및 면허
          <span className="instructor-resume-section-count">{qualificationCount}개</span>
        </h3>
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
      </div>
    </>
  )

  return (
    <div className="participating-instructor-fullpage-view school-detail-fullpage-view">
      <div className="program-detail-fullpage-modal__tabs-row school-detail-fullpage-view__tabs-row">
        <div className="program-detail-fullpage-modal__tabs">
          {INSTRUCTOR_DETAIL_TAB_KEYS.map(key => (
            <button
              key={key}
              type="button"
              disabled={!!INSTRUCTOR_TAB_DISABLED[key]}
              className={`program-detail-fullpage-modal__tab ${effectiveTab === key ? 'program-detail-fullpage-modal__tab--active' : ''}`}
              onClick={() => setActiveTab(key)}
            >
              <span className="program-detail-fullpage-modal__tab-label">{TAB_LABELS[key]}</span>
            </button>
          ))}
        </div>
        {effectiveTab === 'application' && (
          <div className="program-detail-fullpage-modal__header-actions">
            <AppButton
              variant="danger"
              size="filter"
              onClick={() => message.info('승인 취소 기능 준비 중입니다.')}
            >
              승인 취소
            </AppButton>
            <AppButton
              variant="primary"
              size="filter"
              onClick={() => message.info('정보 수정 기능 준비 중입니다.')}
            >
              정보 수정
            </AppButton>
            <PersonalInfoRevealButton
              ui="app"
              labelMode="toggle"
              revealed={personalInfoRevealed}
              variant="primary"
              size="filter-wide"
              onClick={handlePrivacyToggleClick}
            />
          </div>
        )}
        {effectiveTab === 'institutionAssignment' && (
          <div className="program-detail-fullpage-modal__header-actions">
            <AppButton
              variant="danger"
              size="filter"
              onClick={() => message.info('승인 취소 기능 준비 중입니다.')}
            >
              승인 취소
            </AppButton>
            <PersonalInfoRevealButton
              ui="app"
              labelMode="toggle"
              revealed={personalInfoRevealed}
              variant="primary"
              size="filter-wide"
              onClick={handlePrivacyToggleClick}
            />
          </div>
        )}
        {effectiveTab === 'posts' && (
          <div className="program-detail-fullpage-modal__header-actions">
            <AppButton variant="primary" size="filter" onClick={() => setPostWriteModalOpen(true)}>
              게시글 등록
            </AppButton>
          </div>
        )}
      </div>

      <div className="program-detail-fullpage-modal__content school-detail-fullpage-view__content">
        {effectiveTab === 'application' && (
          <div className="program-detail-fullpage-modal__info-tab">{applicationTab}</div>
        )}
        {effectiveTab === 'institutionAssignment' && (
          <div className="program-detail-fullpage-modal__info-tab school-detail-fullpage-view__instructor-tab">
            <div className="school-detail-fullpage-view__instructor-section">
              <div className="participating-institutions-section__table-header">
                <div className="participating-institutions-section__table-heading">
                  <span className="participating-institutions-section__table-title">
                    배정된 학교 목록
                  </span>
                  <span className="participating-institutions-section__table-description">
                    {assignedSchools.length}건
                  </span>
                </div>
                <div className="participating-institutions-section__table-actions">
                  <AppButton
                    variant="danger"
                    size="large"
                    onClick={() => {
                      if (selectedAssignedSchoolKeys.length === 0) {
                        message.warning('배정 취소할 기관을 선택해 주세요.')
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
                      if (addAssignOptions.length === 0) {
                        message.warning('추가 배정 가능한 기관이 없습니다.')
                        return
                      }
                      setAddAssignSchoolId(addAssignOptions[0]?.value ?? null)
                      setAddAssignModalOpen(true)
                    }}
                  >
                    추가 배정
                  </AppButton>
                </div>
              </div>
              <div className="participating-institutions-section__table-wrap">
                {assignedSchools.length === 0 ? (
                  <div
                    className="school-detail-fullpage-view__assigned-empty"
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
                    scroll={{ x: 1280 }}
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
              <div className="participating-institutions-section__table-header">
                <div className="participating-institutions-section__table-heading">
                  <span className="participating-institutions-section__table-title">
                    배정 대기 학교 목록
                  </span>
                  <span className="participating-institutions-section__table-description">
                    {waitingSchools.length}건
                  </span>
                </div>
                <div className="participating-institutions-section__table-actions">
                  <AppButton
                    variant="primary"
                    size="large"
                    className="participating-institutions-section__btn-approve"
                    onClick={() => {
                      if (selectedWaitingSchoolKeys.length === 0) {
                        message.warning('배정할 기관을 선택해 주세요.')
                        return
                      }
                      const movable = waitingSchools.some(
                        w =>
                          selectedWaitingSchoolKeys.includes(w.id) &&
                          w.assignmentStatus !== 'assigned'
                      )
                      if (!movable) {
                        message.warning('배정 가능한 기관을 선택해 주세요.')
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
                <Table<InstructorWaitingSchoolRow>
                  className="participating-institutions-section__table cms-data-table"
                  rowKey="id"
                  size="middle"
                  pagination={false}
                  scroll={{ x: 1180 }}
                  rowSelection={{
                    columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
                    selectedRowKeys: selectedWaitingSchoolKeys,
                    onChange: keys => setSelectedWaitingSchoolKeys(keys),
                    getCheckboxProps: record => ({
                      disabled: record.assignmentStatus === 'assigned',
                    }),
                  }}
                  columns={waitingSchoolColumns}
                  dataSource={waitingSchools}
                  rowClassName={record =>
                    record.assignmentStatus === 'assigned'
                      ? 'school-detail-fullpage-view__waiting-row--assigned'
                      : ''
                  }
                  locale={{ emptyText: '배정 대기 중인 기관이 없습니다.' }}
                />
              </div>
            </div>

            <ContentModal
              open={unassignConfirmOpen}
              onCancel={() => setUnassignConfirmOpen(false)}
              title="배정 취소 안내"
              width={560}
              footer={
                <>
                  <AppButton
                    variant="cancel"
                    size="large"
                    onClick={() => setUnassignConfirmOpen(false)}
                  >
                    취소
                  </AppButton>
                  <AppButton variant="danger" size="large" onClick={handleUnassignConfirm}>
                    배정 취소
                  </AppButton>
                </>
              }
            >
              <p>
                [<strong>{d.instructorName}</strong>] 강사님의 선택한 기관(
                {unassignSchoolNames.map((name, i) => (
                  <span key={`${name}-${i}`}>
                    [<strong>{name}</strong>]{i < unassignSchoolNames.length - 1 ? ', ' : ''}
                  </span>
                ))}
                ) 배정을 취소하시겠습니까?
              </p>
            </ContentModal>

            <ContentModal
              open={selectAssignConfirmOpen}
              onCancel={() => setSelectAssignConfirmOpen(false)}
              title="기관 배정 안내"
              width={560}
              footer={
                <>
                  <AppButton
                    variant="cancel"
                    size="large"
                    onClick={() => setSelectAssignConfirmOpen(false)}
                  >
                    취소
                  </AppButton>
                  <AppButton variant="primary" size="large" onClick={handleSelectAssignConfirm}>
                    배정
                  </AppButton>
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
                  <AppButton
                    variant="cancel"
                    size="large"
                    onClick={() => {
                      setAddAssignModalOpen(false)
                      setAddAssignSchoolId(null)
                    }}
                  >
                    취소
                  </AppButton>
                  <AppButton variant="primary" size="large" onClick={handleAddAssignConfirm}>
                    배정
                  </AppButton>
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
        {effectiveTab === 'posts' && (
          <div className="program-detail-fullpage-modal__info-tab participating-instructor-fullpage-view__posts-tab-wrap">
            <EnrollmentProgramDetailPostsTab
              program={program}
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
