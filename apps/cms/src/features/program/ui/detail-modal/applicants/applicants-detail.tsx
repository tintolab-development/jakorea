import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Table, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { UnifiedFilterCard } from '@/shared/ui/unified-filter-card'
import type { FilterFieldConfig } from '@/shared/ui/unified-filter-card'
import { APP_MULTI_SELECT_TAG_COLORS } from '@/shared/ui/app-multi-select'
import { AppButton } from '@/shared/ui/app-button'
import {
  ApprovalStatusBadge,
  type ApprovalStatusKey,
} from '@/shared/components/approval-status-badge'
import {
  StatusDropdownCell,
  STATUS_DROPDOWN_CELL_CLASSNAME,
} from '@/shared/components/status-dropdown-cell'
import type { TabKey } from '../program-detail-nav-types'
import {
  institutionFilterFields,
  instructorFilterFields,
  volunteerFilterFields,
} from '../../table/applicant-filter-fields'
import {
  MOCK_APPLICANT_INSTITUTIONS,
  updateApplicantSchoolApprovalStatus,
  type ApplicantApprovalStatusKey,
  type ApplicantSchoolRow,
} from '@/data/mock/applicant-institutions'
import {
  MOCK_APPLICANT_INSTRUCTORS,
  patchApplicantInstructorForApprovalStatus,
  updateApplicantInstructorApprovalStatus,
  type ApplicantInstructorApprovalStatusKey,
  type ApplicantInstructorRow,
} from '@/data/mock/applicant-instructors'
import { ApplicantCalendarView } from './applicant-calendar-view'
import { ApplicantsDetailContents, type ApplicantType } from './applicants-detail-contents'
import { ApplicationApprovalModal } from '../components/application-approval-modal'
import './applicants-detail.css'
import { CalendarOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { Divider } from '@/shared/components/divider'
import dayjs from 'dayjs'

const APPLICANT_ID_PARAM = 'applicantId'
const DETAIL_TAB_PARAM = 'detailTab'

/** 강사 캘린더 집계 이벤트용 — `calendarInstitutionSummary` 있으면 팝오버는 기관·인원, 우측 목록은 `calendarInstitutionInstructors`로 강사별 행 */
export type ApplicantInstructorCalendarEventItem = ApplicantInstructorRow & {
  calendarInstitutionSummary?: {
    applicantCount: number
    regionDisplay: string
  }
  /** 해당 일·기관에 포함된 강사 전원(우측 일정 목록 N줄용) */
  calendarInstitutionInstructors?: ApplicantInstructorRow[]
}

function regionTokenFromAddress(address: string): string {
  const t = address.trim()
  if (!t) return '-'
  return t.split(/\s+/)[0] ?? '-'
}

function parseInstructorPreferredDateRange(
  row: ApplicantInstructorRow
): { start: dayjs.Dayjs; end: dayjs.Dayjs } | null {
  const dateRange = row.preferredSchools?.[0]?.dateRange
  if (!dateRange) return null
  const period = dateRange.trim()
  const dateMatch = period.match(/^(\d{4})\.(\d{2})\.(\d{2}).*~\s*(\d{4})\.(\d{2})\.(\d{2})/)
  if (!dateMatch) return null
  const start = dayjs(`${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`).startOf('day')
  const end = dayjs(`${dateMatch[4]}-${dateMatch[5]}-${dateMatch[6]}`).startOf('day')
  return { start, end }
}

function buildInstructorInstitutionCalendarEvents(rows: ApplicantInstructorRow[]) {
  type Bucket = { schoolName: string; dateKey: string; instructors: ApplicantInstructorRow[] }
  const buckets = new Map<string, Bucket>()

  for (const row of rows) {
    const range = parseInstructorPreferredDateRange(row)
    if (!range) continue
    const schoolName = row.schoolName?.trim()
    if (!schoolName) continue

    let d = range.start
    const end = range.end
    while (d.valueOf() <= end.valueOf()) {
      const dateKey = d.format('YYYY-MM-DD')
      const key = `${dateKey}|${schoolName}`
      const prev = buckets.get(key)
      if (prev) {
        prev.instructors.push(row)
      } else {
        buckets.set(key, { schoolName, dateKey, instructors: [row] })
      }
      d = d.add(1, 'day')
    }
  }

  const events: Array<{
    id: string
    title: string
    startDate: string
    endDate: string
    originalItem: ApplicantInstructorCalendarEventItem
  }> = []

  for (const [key, bucket] of buckets) {
    const sorted = [...bucket.instructors].sort((a, b) => a.id.localeCompare(b.id))
    const representative = sorted[0]!
    const regionShort = regionTokenFromAddress(representative.address)
    const count = bucket.instructors.length
    const dayIso = `${bucket.dateKey}T00:00:00`

    const originalItem: ApplicantInstructorCalendarEventItem = {
      ...representative,
      calendarInstitutionSummary: {
        applicantCount: count,
        regionDisplay: regionShort,
      },
      calendarInstitutionInstructors: sorted,
    }

    events.push({
      id: key,
      title: `[참여기관] ${bucket.schoolName} | ${regionShort}`,
      startDate: dayIso,
      endDate: dayIso,
      originalItem,
    })
  }

  return events
}

export interface ApplicantDetailsProps {
  menu: TabKey | ''
  /** 풀페이지 모달 X: 상세가 열려 있으면 목록으로만 돌아가도록 등록 (true면 모달은 닫지 않음) */
  onRegisterApplicantCloseHandler?: (fn: (() => boolean) | null) => void
}

export function ApplicantDetails({ menu, onRegisterApplicantCloseHandler }: ApplicantDetailsProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  // 필터 상태 관리
  const [pendingFilters, setPendingFilters] = useState<Record<string, any>>({})
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>({})

  // 데이터 상태 관리
  const [institutionList, setInstitutionList] = useState<ApplicantSchoolRow[]>(() => [
    ...MOCK_APPLICANT_INSTITUTIONS,
  ])
  const [instructorList, setInstructorList] = useState<ApplicantInstructorRow[]>(() => [
    ...MOCK_APPLICANT_INSTRUCTORS,
  ])

  // 상세 보기 상태 관리
  const [selectedItem, setSelectedItem] = useState<
    ApplicantSchoolRow | ApplicantInstructorRow | null
  >(null)
  const selectedItemRef = useRef(selectedItem)
  selectedItemRef.current = selectedItem

  useEffect(() => {
    if (!onRegisterApplicantCloseHandler) return
    const handler = () => {
      if (selectedItemRef.current) {
        setSelectedItem(null)
        return true
      }
      return false
    }
    onRegisterApplicantCloseHandler(handler)
    return () => onRegisterApplicantCloseHandler(null)
  }, [onRegisterApplicantCloseHandler])

  // 뷰 모드 상태 관리
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table')

  // 선택 상태 관리
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  // 프로그램 승인 현황 드롭다운 열림 상태 (participating-institutions-section과 동일 스타일)
  const [openApprovalDropdownId, setOpenApprovalDropdownId] = useState<string | null>(null)

  /** 강사 탭: 헤더 참여 승인 클릭 시 강사비 책정 모달 */
  const [instructorApprovalTarget, setInstructorApprovalTarget] = useState<{
    id: string
    name: string
  } | null>(null)

  useEffect(() => {
    if (!selectedItem) {
      setInstructorApprovalTarget(null)
    }
  }, [selectedItem])

  // 메뉴 변경 시에만 상태 초기화 + URL에서 applicantId/detailTab 제거 (초기 마운트 시 복원 방지)
  const prevMenuRef = useRef<TabKey | ''>(menu)
  useEffect(() => {
    if (prevMenuRef.current !== menu) {
      prevMenuRef.current = menu
      setPendingFilters({})
      setAppliedFilters({})
      setSelectedRowKeys([])
      setSelectedItem(null)
      setOpenApprovalDropdownId(null)
      setInstructorApprovalTarget(null)
      const next = new URLSearchParams(searchParams)
      if (next.has(APPLICANT_ID_PARAM)) {
        next.delete(APPLICANT_ID_PARAM)
        next.delete(DETAIL_TAB_PARAM)
        setSearchParams(next, { replace: true })
      }
    }
  }, [menu, searchParams, setSearchParams])

  // selectedItem ↔ URL applicantId 동기화
  useEffect(() => {
    const next = new URLSearchParams(searchParams)
    if (selectedItem) {
      if (next.get(APPLICANT_ID_PARAM) !== selectedItem.id) {
        next.set(APPLICANT_ID_PARAM, selectedItem.id)
        setSearchParams(next, { replace: true })
      }
    } else if (next.has(APPLICANT_ID_PARAM)) {
      next.delete(APPLICANT_ID_PARAM)
      next.delete(DETAIL_TAB_PARAM)
      setSearchParams(next, { replace: true })
    }
  }, [selectedItem, searchParams, setSearchParams])

  // URL applicantId로 상세 복원 (새로고침 시)
  useEffect(() => {
    if (!menu || menu === 'volunteers') return
    const applicantId = searchParams.get(APPLICANT_ID_PARAM)
    if (!applicantId) return
    const list = menu === 'institutions' ? institutionList : instructorList
    const found = list.find(item => item.id === applicantId)
    if (found) {
      setSelectedItem(found)
    }
  }, [menu, searchParams, institutionList, instructorList])

  // 현재 메뉴에 따른 필터 필드 설정 (강사: 기관명 옵션은 목록에서 유도)
  const fields = useMemo((): FilterFieldConfig[] => {
    switch (menu) {
      case 'institutions':
        return institutionFilterFields
      case 'instructors': {
        const uniqueNames = Array.from(
          new Set(instructorList.map(r => r.schoolName).filter(Boolean))
        ).sort((a, b) => a.localeCompare(b, 'ko'))
        return instructorFilterFields.map(field => {
          if (field.type !== 'multiSelect' || field.key !== 'schoolNames') return field
          return {
            ...field,
            multiSelectOptions: uniqueNames.map((name, i) => ({
              value: name,
              label: name,
              tagColor: APP_MULTI_SELECT_TAG_COLORS[i % APP_MULTI_SELECT_TAG_COLORS.length],
            })),
          }
        })
      }
      case 'volunteers':
        return volunteerFilterFields
      default:
        return []
    }
  }, [menu, instructorList])

  const approvalStatusKeys = useMemo<ApprovalStatusKey[]>(
    () => ['pending', 'rejected', 'approved'] as ApprovalStatusKey[],
    []
  )

  const handleInstitutionApprovalStatusChange = useCallback(
    (recordId: string, status: ApprovalStatusKey) => {
      const next = status as ApplicantApprovalStatusKey
      setInstitutionList(prev =>
        prev.map(row => (row.id === recordId ? { ...row, approvalStatus: next } : row))
      )
      setSelectedItem(prev =>
        prev && 'schoolName' in prev && prev.id === recordId
          ? { ...prev, approvalStatus: next }
          : prev
      )
      updateApplicantSchoolApprovalStatus(recordId, next)
      message.success('결재 현황이 변경되었습니다.')
    },
    []
  )

  const handleInstructorApprovalStatusChange = useCallback(
    (recordId: string, status: ApprovalStatusKey) => {
      const next = status as ApplicantInstructorApprovalStatusKey
      setInstructorList(prev =>
        prev.map(row =>
          row.id === recordId ? patchApplicantInstructorForApprovalStatus(row, next) : row
        )
      )
      setSelectedItem(prev =>
        prev && 'instructorName' in prev && prev.id === recordId
          ? patchApplicantInstructorForApprovalStatus(prev, next)
          : prev
      )
      updateApplicantInstructorApprovalStatus(recordId, next)
      message.success('결재 현황이 변경되었습니다.')
    },
    []
  )

  /** 날짜·시간·교시 구간 텍스트 (participating-institutions-section과 동일) */
  const getSessionLineParts = useCallback(
    (s: {
      date: string
      dayOfWeek: string
      duration: string
      format: string
      classNum: string
      timeRange: string
    }) => {
      const datePart = `${s.date.replace(/\./g, '. ')}(${s.dayOfWeek})`
      const durationPart = `${s.duration} (${s.format})`
      const periodPart = `${s.classNum} (${s.timeRange.replace('~', ' ~ ')})`
      return { datePart, durationPart, periodPart }
    },
    []
  )

  // 교육 신청 기관 컬럼 — 프로그램 진행 현황(참여 기관) 테이블 구조와 동일: 회차 컬럼 한 줄 처리, width: 1로 가로 스크롤
  const institutionColumns: ColumnsType<ApplicantSchoolRow> = useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: 64, align: 'center' },
      {
        title: '참여 기관명',
        dataIndex: 'schoolName',
        key: 'schoolName',
        width: 180,
        align: 'center',
        ellipsis: true,
        render: (text: string, record) => (
          <a
            onClick={() => setSelectedItem(record)}
            style={{ color: 'var(--color-primary)', fontWeight: 500 }}
          >
            {text}
          </a>
        ),
      },
      {
        title: '기관 지역',
        dataIndex: 'region',
        key: 'region',
        width: 200,
        align: 'center',
        ellipsis: true,
      },
      {
        title: '프로그램 승인 현황',
        dataIndex: 'approvalStatus',
        key: 'approvalStatus',
        width: 152,
        align: 'center',
        onCell: () => ({ className: STATUS_DROPDOWN_CELL_CLASSNAME }),
        render: (status: ApprovalStatusKey, record: ApplicantSchoolRow) => (
          <div onClick={e => e.stopPropagation()} style={{ display: 'inline-block' }}>
            <StatusDropdownCell<ApprovalStatusKey>
              status={status ?? null}
              statusOptions={approvalStatusKeys}
              renderBadge={s => <ApprovalStatusBadge status={s} />}
              isItemDisabled={(cur, opt) => cur === opt}
              onChange={newStatus => handleInstitutionApprovalStatusChange(record.id, newStatus)}
              isOpen={openApprovalDropdownId === record.id}
              onOpenChange={open => setOpenApprovalDropdownId(open ? record.id : null)}
              emptyPlaceholder="-"
            />
          </div>
        ),
      },
      {
        title: '강의 회차 별 희망 교육 날짜 및 시간',
        key: 'sessions',
        width: 480,
        onCell: () => ({ className: 'applicant-details__td-sessions' }),
        render: (_: unknown, record: ApplicantSchoolRow) => {
          const sessions = record.sessions ?? []
          const total = sessions.length
          const showCount = total <= 3 ? total : 2
          const displaySessions = sessions.slice(0, showCount)
          const restCount = total - showCount
          return (
            <div className="applicant-details__sessions-cell">
              {displaySessions.map(s => {
                const { datePart, durationPart, periodPart } = getSessionLineParts(s)
                return (
                  <div key={s.round} className="applicant-details__session-line">
                    {datePart}
                    <span className="applicant-details__session-divider" aria-hidden />
                    {durationPart}
                    <span className="applicant-details__session-divider" aria-hidden />
                    {periodPart}
                  </div>
                )
              })}
              {restCount > 0 && (
                <div className="applicant-details__session-more">외 {restCount}개의 교육 일정</div>
              )}
            </div>
          )
        },
      },
      {
        title: '대상 학년',
        dataIndex: 'educationGrade',
        key: 'educationGrade',
        width: 96,
        align: 'center',
      },
      {
        title: '대상 학급 수',
        dataIndex: 'classCount',
        key: 'classCount',
        width: 100,
        align: 'center',
        render: (v: number) => (v != null ? `${v}개` : '-'),
      },
      {
        title: '담당 교사명',
        dataIndex: 'teacherName',
        key: 'teacherName',
        width: 120,
        align: 'center',
      },
      {
        title: '담당 강사',
        dataIndex: 'assignedInstructorNames',
        key: 'assignedInstructorNames',
        width: 180,
        align: 'center',
        ellipsis: true,
        render: (v: string | undefined) => v ?? '-',
      },
    ],
    [
      approvalStatusKeys,
      getSessionLineParts,
      handleInstitutionApprovalStatusChange,
      openApprovalDropdownId,
    ]
  )

  // 신청 강사 컬럼 정의
  const instructorColumns: ColumnsType<ApplicantInstructorRow> = useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: 72, align: 'center' },
      {
        title: '강사명',
        dataIndex: 'instructorName',
        key: 'instructorName',
        width: 110,
        align: 'center',
        render: (text: string, record) => (
          <a
            onClick={() => setSelectedItem(record)}
            style={{ color: 'var(--color-primary)', fontWeight: 500 }}
          >
            {text}
          </a>
        ),
      },
      {
        title: '거주 지역',
        dataIndex: 'address',
        key: 'address',
        width: 150,
        align: 'center',
        ellipsis: true,
      },
      {
        title: 'JA 강의 경력',
        dataIndex: 'teachingExperience',
        key: 'teachingExperience',
        width: 120,
        align: 'center',
      },
      {
        title: 'JA 평가 등급',
        dataIndex: 'evaluationGrade',
        key: 'evaluationGrade',
        width: 110,
        align: 'center',
        render: (v: string) => (v ? `${v}등급` : '-'),
      },
      {
        title: '연락처',
        dataIndex: 'contact',
        key: 'contact',
        width: 130,
        align: 'center',
      },
      {
        title: '이메일',
        dataIndex: 'email',
        key: 'email',
        width: 160,
        align: 'center',
        ellipsis: true,
      },
      {
        title: '프로그램 승인 현황',
        dataIndex: 'approvalStatus',
        key: 'approvalStatus',
        width: 152,
        align: 'center',
        onCell: () => ({ className: STATUS_DROPDOWN_CELL_CLASSNAME }),
        render: (status: ApprovalStatusKey, record: ApplicantInstructorRow) => (
          <div onClick={e => e.stopPropagation()} style={{ display: 'inline-block' }}>
            <StatusDropdownCell<ApprovalStatusKey>
              status={status ?? null}
              statusOptions={approvalStatusKeys}
              renderBadge={s => <ApprovalStatusBadge status={s} />}
              isItemDisabled={(cur, opt) => cur === opt}
              onChange={newStatus => handleInstructorApprovalStatusChange(record.id, newStatus)}
              isOpen={openApprovalDropdownId === record.id}
              onOpenChange={open => setOpenApprovalDropdownId(open ? record.id : null)}
              emptyPlaceholder="-"
            />
          </div>
        ),
      },
    ],
    [approvalStatusKeys, handleInstructorApprovalStatusChange, openApprovalDropdownId]
  )

  const handleFilterChange = (key: string, value: any) => {
    setPendingFilters(prev => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSearch = () => {
    setAppliedFilters({ ...pendingFilters })
  }

  const handleBulkReject = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('반려할 항목을 선택해 주세요.')
      return
    }
    const keys = selectedRowKeys as string[]
    if (menu === 'institutions') {
      setInstitutionList(prev =>
        prev.map(row =>
          keys.includes(row.id) ? { ...row, approvalStatus: 'rejected' as const } : row
        )
      )
      keys.forEach(id => updateApplicantSchoolApprovalStatus(id, 'rejected'))
      message.success('선택한 학교 신청이 반려되었습니다.')
    } else if (menu === 'instructors') {
      setInstructorList(prev =>
        prev.map(row =>
          keys.includes(row.id) ? patchApplicantInstructorForApprovalStatus(row, 'rejected') : row
        )
      )
      keys.forEach(id => updateApplicantInstructorApprovalStatus(id, 'rejected'))
      message.success('선택한 강사 신청이 반려되었습니다.')
    } else {
      message.info('현재 메뉴에서는 일괄 반려를 사용할 수 없습니다.')
      return
    }
    setSelectedRowKeys([])
  }

  const handleBulkApprove = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('승인할 항목을 선택해 주세요.')
      return
    }
    const keys = selectedRowKeys as string[]
    if (menu === 'institutions') {
      setInstitutionList(prev =>
        prev.map(row =>
          keys.includes(row.id) ? { ...row, approvalStatus: 'approved' as const } : row
        )
      )
      keys.forEach(id => updateApplicantSchoolApprovalStatus(id, 'approved'))
      message.success('선택한 학교 신청이 승인되었습니다.')
    } else if (menu === 'instructors') {
      setInstructorList(prev =>
        prev.map(row =>
          keys.includes(row.id) ? patchApplicantInstructorForApprovalStatus(row, 'approved') : row
        )
      )
      keys.forEach(id => updateApplicantInstructorApprovalStatus(id, 'approved'))
      message.success('선택한 강사 신청이 승인되었습니다.')
    } else {
      message.info('현재 메뉴에서는 일괄 승인을 사용할 수 없습니다.')
      return
    }
    setSelectedRowKeys([])
  }

  const handleCancelApproval = (id: string) => {
    setInstitutionList(prev =>
      prev.map(row => (row.id === id ? { ...row, approvalStatus: 'pending' as const } : row))
    )
    setSelectedItem(prev =>
      prev && 'schoolName' in prev && prev.id === id
        ? { ...prev, approvalStatus: 'pending' as const }
        : prev
    )
    updateApplicantSchoolApprovalStatus(id, 'pending')
    message.success('승인이 취소되었습니다.')
  }

  const handleCancelApprovalInstructor = (id: string) => {
    setInstructorList(prev =>
      prev.map(row =>
        row.id === id ? patchApplicantInstructorForApprovalStatus(row, 'pending') : row
      )
    )
    setSelectedItem(prev =>
      prev && 'instructorName' in prev && prev.id === id
        ? patchApplicantInstructorForApprovalStatus(prev, 'pending')
        : prev
    )
    updateApplicantInstructorApprovalStatus(id, 'pending')
    message.success('승인이 취소되었습니다.')
  }

  const handleCancelRejectInstructor = (id: string) => {
    setInstructorList(prev =>
      prev.map(row =>
        row.id === id ? patchApplicantInstructorForApprovalStatus(row, 'pending') : row
      )
    )
    setSelectedItem(prev =>
      prev && 'instructorName' in prev && prev.id === id
        ? patchApplicantInstructorForApprovalStatus(prev, 'pending')
        : prev
    )
    updateApplicantInstructorApprovalStatus(id, 'pending')
    message.success('반려가 취소되었습니다.')
  }

  const handleCancelRejectInstitution = (id: string) => {
    setInstitutionList(prev =>
      prev.map(row => (row.id === id ? { ...row, approvalStatus: 'pending' as const } : row))
    )
    setSelectedItem(prev =>
      prev && 'schoolName' in prev && prev.id === id
        ? { ...prev, approvalStatus: 'pending' as const }
        : prev
    )
    updateApplicantSchoolApprovalStatus(id, 'pending')
    message.success('반려가 취소되었습니다.')
  }

  const handleViewCalendar = () => {
    setViewMode('calendar')
  }

  const title = useMemo(() => {
    switch (menu) {
      case 'institutions':
        return '교육 신청 기관 목록'
      case 'instructors':
        return '교육 신청 강사 목록'
      case 'volunteers':
        return '신청 봉사자 목록'
      default:
        return ''
    }
  }, [menu])

  const tableData = useMemo(() => {
    if (menu === 'institutions') {
      return institutionList.filter(item => {
        const { organizationName, region, grade, teacherName, approvalStatus } = appliedFilters
        if (
          organizationName &&
          organizationName.trim() !== '' &&
          !item.schoolName.includes(organizationName)
        )
          return false
        if (region && region !== 'all' && !item.region.includes(region)) return false
        if (grade && grade !== 'all' && item.educationGrade !== grade) return false
        if (teacherName && teacherName.trim() !== '' && !item.teacherName.includes(teacherName))
          return false
        if (approvalStatus && approvalStatus !== 'all' && item.approvalStatus !== approvalStatus)
          return false
        return true
      })
    }
    if (menu === 'instructors') {
      return instructorList.filter(item => {
        const {
          schoolNames,
          instructorName,
          residenceRegion,
          evaluationGrade,
          teachingExperience,
          approvalStatus,
        } = appliedFilters
        const names = Array.isArray(schoolNames) ? (schoolNames as string[]) : []
        if (names.length > 0 && !names.includes(item.schoolName)) return false
        if (
          instructorName &&
          instructorName.trim() !== '' &&
          !item.instructorName.includes(instructorName)
        )
          return false
        if (residenceRegion && residenceRegion !== 'all' && !item.address.includes(residenceRegion))
          return false
        if (
          evaluationGrade &&
          evaluationGrade !== 'all' &&
          item.evaluationGrade !== evaluationGrade
        )
          return false
        if (
          teachingExperience &&
          teachingExperience !== 'all' &&
          item.teachingExperience !== teachingExperience
        )
          return false
        if (approvalStatus && approvalStatus !== 'all' && item.approvalStatus !== approvalStatus)
          return false
        return true
      })
    }
    return []
  }, [menu, institutionList, instructorList, appliedFilters])

  const columns = useMemo(() => {
    if (menu === 'institutions') return institutionColumns
    if (menu === 'instructors') return instructorColumns
    return []
  }, [menu, institutionColumns, instructorColumns])

  /** 컬럼 너비 합. 회차 컬럼 520px(한 줄+좌우 24px 패딩) → 테이블이 화면보다 길면 테이블 자체 가로 스크롤 */
  const tableScrollX =
    menu === 'instructors'
      ? 48 + 72 + 110 + 150 + 120 + 110 + 130 + 160 + 152
      : 49 + 64 + 180 + 200 + 152 + 520 + 96 + 100 + 120 + 180

  // Helper function to map applicant data to calendar event format
  const mapApplicantDataToCalendarEvents = (
    data: ApplicantSchoolRow[] | ApplicantInstructorRow[],
    currentMenu: TabKey | ''
  ): any[] => {
    if (currentMenu === 'instructors') {
      return buildInstructorInstitutionCalendarEvents(data as ApplicantInstructorRow[])
    }

    return data.map((item, index) => {
      let title = ''
      let startDate = null
      let endDate = null
      // Use a unique ID for each event. Fallback to index if 'id' or 'no' is not available.
      const id = item.id || item.no || index

      if (
        currentMenu === 'institutions' &&
        'schoolName' in item &&
        'desiredEducationPeriod' in item
      ) {
        const applicant = item as ApplicantSchoolRow
        title = `[참여기관] ${applicant.schoolName}`
        if (applicant.desiredEducationPeriod) {
          const period = applicant.desiredEducationPeriod.trim()
          // Regex to capture YYYY-MM-DD and HH:MM - HH:MM
          const dateTimeMatch = period.match(
            /^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})$/
          )

          if (dateTimeMatch) {
            const datePart = dateTimeMatch[1] // "YYYY-MM-DD"
            const startTime = dateTimeMatch[2] // "HH:MM"
            const endTime = dateTimeMatch[3] // "HH:MM"
            startDate = `${datePart}T${startTime}:00`
            endDate = `${datePart}T${endTime}:00`
          } else {
            // Try matching YY.MM.DD(요일)~YY.MM.DD(요일)
            const rangeMatch = period.match(
              /^(\d{2})\.(\d{2})\.(\d{2})\(.*\)\s*~\s*(\d{2})\.(\d{2})\.(\d{2})\(.*\)/
            )
            if (rangeMatch) {
              startDate = `20${rangeMatch[1]}-${rangeMatch[2]}-${rangeMatch[3]}T00:00:00`
              endDate = `20${rangeMatch[4]}-${rangeMatch[5]}-${rangeMatch[6]}T23:59:59`
            }
          }
        }
      }
      // Add other menus if needed

      return {
        id,
        title,
        startDate,
        endDate,
        // Pass original item for potential use in click handler or calendar events
        originalItem: item,
      } as any
    })
  }

  return (
    <div className="applicant-details">
      {selectedItem ? (
        <ApplicantsDetailContents
          type={menu as ApplicantType}
          data={selectedItem}
          onBack={() => setSelectedItem(null)}
          onApprove={id => {
            if (menu === 'institutions') {
              setInstitutionList(prev =>
                prev.map(row =>
                  row.id === id ? { ...row, approvalStatus: 'approved' as const } : row
                )
              )
              updateApplicantSchoolApprovalStatus(id, 'approved')
              message.success('승인되었습니다.')
              setSelectedItem(null)
            } else if (menu === 'instructors') {
              const row = selectedItem
              if (row && 'instructorName' in row && row.id === id) {
                setInstructorApprovalTarget({ id, name: row.instructorName })
              }
            }
          }}
          onReject={id => {
            if (menu === 'institutions') {
              setInstitutionList(prev =>
                prev.map(row =>
                  row.id === id ? { ...row, approvalStatus: 'rejected' as const } : row
                )
              )
              updateApplicantSchoolApprovalStatus(id, 'rejected')
              message.success('반려되었습니다.')
              setSelectedItem(null)
            } else if (menu === 'instructors') {
              setInstructorList(prev =>
                prev.map(row =>
                  row.id === id ? patchApplicantInstructorForApprovalStatus(row, 'rejected') : row
                )
              )
              setSelectedItem(prev =>
                prev && 'instructorName' in prev && prev.id === id
                  ? patchApplicantInstructorForApprovalStatus(prev, 'rejected')
                  : prev
              )
              updateApplicantInstructorApprovalStatus(id, 'rejected')
              message.success('참여 반려되었습니다.')
            }
          }}
          onCancelApproval={
            menu === 'institutions'
              ? handleCancelApproval
              : menu === 'instructors'
                ? handleCancelApprovalInstructor
                : undefined
          }
          onCancelReject={
            menu === 'instructors'
              ? handleCancelRejectInstructor
              : menu === 'institutions'
                ? handleCancelRejectInstitution
                : undefined
          }
        />
      ) : null}
      <ApplicationApprovalModal
        open={instructorApprovalTarget != null && menu === 'instructors'}
        instructorName={instructorApprovalTarget?.name ?? ''}
        onCancel={() => setInstructorApprovalTarget(null)}
        onConfirm={() => {
          if (!instructorApprovalTarget) return
          const { id } = instructorApprovalTarget
          setInstructorApprovalTarget(null)
          setInstructorList(prev =>
            prev.map(row =>
              row.id === id ? patchApplicantInstructorForApprovalStatus(row, 'approved') : row
            )
          )
          setSelectedItem(prev =>
            prev && 'instructorName' in prev && prev.id === id
              ? patchApplicantInstructorForApprovalStatus(prev, 'approved')
              : prev
          )
          updateApplicantInstructorApprovalStatus(id, 'approved')
          message.success('참여 승인되었습니다.')
        }}
      />
      {!selectedItem ? (
        <>
          {fields.length > 0 && (
            <UnifiedFilterCard
              fields={fields}
              filters={pendingFilters}
              onFilterChange={handleFilterChange}
              onSearch={handleSearch}
              bordered={false}
              cardStyle={{
                paddingLeft: '24px',
                marginBottom: 0,
                background: 'transparent',
              }}
            />
          )}
          <div className="applicant-details__divider-wrapper">
            <Divider />
          </div>
          {menu && (
            <div className="applicant-details__below-divider">
              <div className="applicant-details__table-header">
                <div className="applicant-details__table-heading">
                  <span className="applicant-details__table-title">{title}</span>
                  <span className="applicant-details__table-description">{tableData.length}건</span>
                </div>
                <div className="applicant-details__table-actions">
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <AppButton variant="danger" size="filter" onClick={handleBulkReject}>
                      선택 반려
                    </AppButton>
                    <AppButton variant="cancel" size="filter" onClick={handleBulkApprove}>
                      선택 승인
                    </AppButton>
                    {viewMode === 'table' && (
                      <AppButton
                        icon={<CalendarOutlined />}
                        variant="cancel"
                        size="filter-wide"
                        onClick={handleViewCalendar}
                      >
                        캘린더 뷰로 보기
                      </AppButton>
                    )}
                    {viewMode === 'calendar' && (
                      <AppButton
                        variant="cancel"
                        icon={<UnorderedListOutlined />}
                        size="filter-wide"
                        onClick={() => setViewMode('table')}
                      >
                        리스트로 보기
                      </AppButton>
                    )}
                  </div>
                </div>
              </div>

              {viewMode === 'table' ? (
                <div className="applicant-details__table-wrap">
                  <Table<ApplicantSchoolRow | ApplicantInstructorRow>
                    rowKey="id"
                    columns={columns as ColumnsType<ApplicantSchoolRow | ApplicantInstructorRow>}
                    dataSource={tableData}
                    size="middle"
                    className="applicant-details__table applicant-details__table--clickable"
                    onRow={record => ({
                      onClick: e => {
                        const target = e.target as HTMLElement
                        if (
                          target.closest('.status-dropdown-cell__cell-status') ||
                          target.closest('.status-dropdown-cell__status-trigger') ||
                          target.closest('.ant-table-selection-column') ||
                          target.closest('.ant-checkbox-wrapper')
                        )
                          return
                        setSelectedItem(record)
                      },
                      style: { cursor: 'pointer' },
                    })}
                    scroll={{ x: tableScrollX }}
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
                    events={mapApplicantDataToCalendarEvents(tableData, menu)} // Map data for calendar
                    loading={false} // Assuming loading state can be managed
                    selectedRowKeys={selectedRowKeys}
                    onSelectionChange={setSelectedRowKeys}
                    onItemClick={setSelectedItem}
                  />
                </div>
              )}
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}
