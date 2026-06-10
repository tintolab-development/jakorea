/**
 * 참여 강사 페이지 (풀페이지 모달 > 프로그램 진행 현황 > 참여 강사)
 * 필터(쿼리 파라미터 연동) + 테이블(교육 참여 강사 목록, 정산현황 텍스트 컬러) + 액션 버튼
 */

import { useCallback, useMemo, useState, useEffect, useRef, type CSSProperties } from 'react'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { Table, Checkbox } from 'antd'
import { CalendarOutlined, UnorderedListOutlined, DownloadOutlined } from '@ant-design/icons'
import { CmsButton, useCmsAlert } from '@/shared/ui'
import { ExcelButton } from '@/shared/ui/excel-button'
import { CmsSelect } from '@/shared/ui'
import { UnifiedFilterCard, type FilterFieldConfig } from '@/shared/ui/unified-filter-card'
import type { ColumnsType } from 'antd/es/table'
import {
  ACTIVITY_CERTIFICATE_ISSUE_SELECT_ONE_ALERT_MESSAGE,
  ACTIVITY_CERTIFICATE_ISSUE_SELECT_ONLY_ONE_ALERT_MESSAGE,
  PARTICIPATING_INSTRUCTOR_ADD_COMPLETE_ALERT_MESSAGE,
  PARTICIPATING_INSTRUCTOR_ADD_SELECT_ALERT_MESSAGE,
} from '@/shared/constants/messages'
import {
  fetchParticipatingInstructorMemberCandidates,
  type ParticipatingInstructorMemberCandidate,
} from '@/features/program/general/lib/participating-instructor-member-candidates'
import { buildParticipatingInstructorCalendarEvents } from '@/features/program/general/lib/build-participating-instructor-calendar-events'
import { ActivityCertificateIssuancePreviewModal } from './activity-certificate-issuance-preview-modal'
import { renderParticipatingInstructorCalendarMonthEventContent } from './participating-instructor-calendar-month-event'
import {
  type ParticipatingInstructorRow,
  MOCK_PARTICIPATING_INSTRUCTORS,
} from '@/data/mock/participating-instructors'
import type { Program } from '@/types/domain'
import { MASKING_POLICY } from '@/shared/constants/download-policy'
import {
  useParticipatingInstructorsParams,
  type ParticipatingInstructorsFilters,
} from '../../../hooks/use-participating-instructors-params'
import type { ProgressFilters } from '../../../hooks/use-program-progress-params'
import { useProgressInstructorList } from '../../../hooks/use-progress-instructor-list'
import { Divider } from '@/shared/components/divider'
import { AddParticipatingInstructorModal } from '../../add-participating-instructor-modal'
import { ParticipatingInstructorAddConsentModal } from '../../participating-instructor-add-consent-modal'
import {
  ParticipatingInstructorFullpageView,
  type InstructorDetailTabKey,
} from './participating-instructor-fullpage-view'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import { InstructorSettlementStatusText } from '@/shared/ui/instructor-settlement-status-text'
import {
  INSTRUCTOR_SETTLEMENT_STATUS_LABELS_SHORT,
  type InstructorSettlementUiStatus,
} from '@/shared/constants/instructor-settlement-status'
import { MOCK_PARTICIPATING_SCHOOLS } from '@/data/mock/participating-schools'
import type { ParticipatingSchoolRow } from '@/data/mock/participating-schools'
import { ParticipatingInstitutionsCalendarView } from './participating-institutions-calendar-view'
import {
  getScheduleColorPair,
  SCHEDULE_COLORS,
  type ScheduleColorPair,
} from '../../../../shared/ui/program-schedule-colors'
import './participating-institutions-section.css'
import './program-progress-tab.css'

const REGION_OPTIONS = [
  { label: '전체', value: 'all' },
  { label: '서울', value: '서울' },
  { label: '부산', value: '부산' },
  { label: '대구', value: '대구' },
  { label: '인천', value: '인천' },
  { label: '광주', value: '광주' },
  { label: '대전', value: '대전' },
  { label: '울산', value: '울산' },
  { label: '세종', value: '세종' },
  { label: '경기', value: '경기' },
  { label: '강원', value: '강원' },
  { label: '충북', value: '충북' },
  { label: '충남', value: '충남' },
  { label: '전북', value: '전북' },
  { label: '전남', value: '전남' },
  { label: '경북', value: '경북' },
  { label: '경남', value: '경남' },
  { label: '제주', value: '제주' },
]

const JA_LECTURE_EXPERIENCE_OPTIONS = [
  { label: '전체', value: 'all' },
  { label: '1년', value: '1' },
  { label: '2년', value: '2' },
  { label: '3년', value: '3' },
  { label: '5년', value: '5' },
]

const JA_EVALUATION_GRADE_OPTIONS = [
  { label: '전체', value: 'all' },
  { label: 'A등급', value: 'A등급' },
  { label: 'B등급', value: 'B등급' },
  { label: 'C등급', value: 'C등급' },
]

const EDUCATION_ASSIGNMENT_OPTIONS = [
  { label: '전체', value: 'all' },
  { label: '진행 전', value: '진행 전' },
  { label: '1회차', value: '1회차' },
  { label: '2회차', value: '2회차' },
  { label: '진행 완료', value: '진행 완료' },
]

const INSTRUCTOR_ELLIPSIS_CELL_CLASS = 'participating-instructors-section__ellipsis-cell'

/** 해당 날짜에 교육 일정이 있는 참여 학교명 목록 (캘린더 셀 클릭 시 우측 강사 목록 필터용) */
function getSchoolNamesForDate(schools: ParticipatingSchoolRow[], date: Dayjs): string[] {
  const names = new Set<string>()
  for (const school of schools) {
    const sessions = school.sessions ?? []
    for (const session of sessions) {
      const normalized = session.date.replace(/\s/g, '').replace(/\./g, '-')
      const sessionDate = dayjs(normalized)
      if (sessionDate.isSame(date, 'day')) {
        names.add(school.schoolName)
        break
      }
    }
  }
  return Array.from(names)
}

export interface ParticipatingInstructorsSectionProps {
  programId?: string
  program?: Program | null
  /** URL instructorId — 있으면 인라인 상세 뷰 */
  instructorIdFromUrl?: string | null
  instructorTabFromUrl?: InstructorDetailTabKey | null
  onInstructorTabChange?: (tab: InstructorDetailTabKey) => void
  onInstructorRowClick?: (row: ParticipatingInstructorRow) => void
  onClearInstructorId?: () => void
  onInstructorDetailOpen?: (name: string) => void
  onInstructorDetailClose?: () => void
}

/** 목록 행 + mock id 병합 (상세·이력서 필드) */
function mergeParticipatingInstructorRow(
  row: ParticipatingInstructorRow
): ParticipatingInstructorRow {
  const extended = MOCK_PARTICIPATING_INSTRUCTORS.find(m => m.id === row.id) ?? null
  return extended ? { ...row, ...extended } : row
}

export function ParticipatingInstructorsSection({
  programId,
  program,
  instructorIdFromUrl,
  instructorTabFromUrl,
  onInstructorTabChange,
  onInstructorRowClick,
  onClearInstructorId,
  onInstructorDetailOpen,
  onInstructorDetailClose,
}: ParticipatingInstructorsSectionProps) {
  const { showAlert } = useCmsAlert()
  const {
    filters,
    appliedFilters,
    applyFilters,
    viewMode,
    setViewMode,
    progressCalendarGranularity,
    setProgressCalendarGranularity,
  } = useParticipatingInstructorsParams()

  const programScheduleColors = useMemo(
    () => (programId ? getScheduleColorPair(programId) : SCHEDULE_COLORS[0]),
    [programId]
  )
  /** 좌측 캘린더 학교 일정 태그와 동일: 참여 학교명 가나다순 → SCHEDULE_COLORS 순환 */
  const schoolNameToScheduleColor = useMemo(() => {
    const sorted = Array.from(new Set(MOCK_PARTICIPATING_SCHOOLS.map(s => s.schoolName))).sort()
    const map = new Map<string, ScheduleColorPair>()
    sorted.forEach((name, i) => {
      map.set(name, SCHEDULE_COLORS[i % SCHEDULE_COLORS.length])
    })
    return map
  }, [])
  const [pendingFilters, setPendingFilters] = useState<ParticipatingInstructorsFilters>(() => ({
    ...filters,
  }))
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<Dayjs>(() => dayjs())
  /**
   * 캘린더 우측 기관 멀티셀렉트.
   * `null` — 해당 날짜 옵션 전체 선택(초기 진입·날짜 변경 기본값), `[]` — 사용자가 모두 해제한 경우.
   */
  const [calendarSelectedSchools, setCalendarSelectedSchools] = useState<string[] | null>(null)
  const [activityCertPreviewOpen, setActivityCertPreviewOpen] = useState(false)
  const [activityCertPreviewInstructor, setActivityCertPreviewInstructor] =
    useState<ParticipatingInstructorRow | null>(null)
  const [instructorMemberOptions, setInstructorMemberOptions] = useState<
    ParticipatingInstructorMemberCandidate[]
  >([])

  useEffect(() => {
    setPendingFilters({ ...filters })
  }, [filters])

  const instructorFilterFields = useMemo((): FilterFieldConfig[] => {
    const colWidth = '18%'
    return [
      {
        key: 'instructorName',
        type: 'search',
        label: '강사명',
        placeholder: '강사명을 입력하세요',
        width: colWidth,
      },
      {
        key: 'region',
        type: 'select',
        label: '거주 지역',
        placeholder: '전체',
        options: REGION_OPTIONS,
        width: colWidth,
      },
      {
        key: 'jaLectureExperience',
        type: 'select',
        label: 'JA 강의 이력',
        placeholder: '전체',
        options: JA_LECTURE_EXPERIENCE_OPTIONS,
        width: colWidth,
      },
      {
        key: 'jaEvaluationGrade',
        type: 'select',
        label: 'JA 평가 등급',
        placeholder: '전체',
        options: JA_EVALUATION_GRADE_OPTIONS,
        width: colWidth,
      },
      {
        key: 'educationAssignmentStatus',
        type: 'select',
        label: '교육 예정 현황',
        placeholder: '전체',
        options: EDUCATION_ASSIGNMENT_OPTIONS,
        width: colWidth,
      },
    ]
  }, [])

  const unifiedFilterCardValues = useMemo(
    () => ({
      instructorName: pendingFilters.instructorName,
      region: pendingFilters.region === 'all' ? undefined : pendingFilters.region,
      jaLectureExperience:
        pendingFilters.jaLectureExperience === 'all'
          ? undefined
          : pendingFilters.jaLectureExperience,
      jaEvaluationGrade:
        pendingFilters.jaEvaluationGrade === 'all' ? undefined : pendingFilters.jaEvaluationGrade,
      educationAssignmentStatus:
        pendingFilters.educationAssignmentStatus === 'all'
          ? undefined
          : pendingFilters.educationAssignmentStatus,
    }),
    [pendingFilters]
  )

  const handleUnifiedFilterChange = (key: string, value: unknown) => {
    if (key === 'instructorName') {
      setPendingFilters(prev => ({ ...prev, instructorName: String(value ?? '') }))
      return
    }
    const k = key as keyof ParticipatingInstructorsFilters
    const v = value == null || value === '' ? 'all' : String(value)
    setPendingFilters(prev => ({ ...prev, [k]: v }))
  }

  const handleUnifiedFilterSearch = () => {
    applyFilters(pendingFilters)
  }

  const progressFilters: ProgressFilters = useMemo(
    () => ({
      schoolName: '',
      region: 'all',
      institutionSido: '',
      institutionSigungu: '',
      educationGrade: 'all',
      lectureRound: appliedFilters.educationAssignmentStatus || 'all',
      textbookStatus: 'all',
      settlementStatus: 'all',
      teacherName: appliedFilters.instructorName,
    }),
    [appliedFilters.educationAssignmentStatus, appliedFilters.instructorName]
  )

  const {
    instructorList,
    filteredInstructors: baseFiltered,
    selectedInstructorRowKeys,
    setSelectedInstructorRowKeys,
    addInstructorModalOpen,
    setAddInstructorModalOpen,
    handleAddInstructorByMemberId,
  } = useProgressInstructorList({
    appliedFilters: progressFilters,
    preferMock: true,
  })

  const [instructorConsentModalOpen, setInstructorConsentModalOpen] = useState(false)
  const [pendingInstructorMemberId, setPendingInstructorMemberId] = useState<string | null>(null)

  const handleProceedToInstructorConsent = useCallback((memberId: string) => {
    setPendingInstructorMemberId(memberId)
    setInstructorConsentModalOpen(true)
  }, [])

  const handleInstructorConsentClose = useCallback(() => {
    setInstructorConsentModalOpen(false)
    setPendingInstructorMemberId(null)
  }, [])

  const handleInstructorConsentConfirm = useCallback(async () => {
    const memberId = pendingInstructorMemberId
    setInstructorConsentModalOpen(false)
    setPendingInstructorMemberId(null)
    if (!memberId) return

    const success = await handleAddInstructorByMemberId(memberId)
    if (success) {
      showAlert({ title: '안내', content: PARTICIPATING_INSTRUCTOR_ADD_COMPLETE_ALERT_MESSAGE })
    }
  }, [handleAddInstructorByMemberId, pendingInstructorMemberId, showAlert])

  const filteredInstructors = useMemo(() => {
    return baseFiltered.filter(row => {
      if (
        appliedFilters.region &&
        appliedFilters.region !== 'all' &&
        !(row.region ?? row.address ?? '').includes(appliedFilters.region)
      )
        return false
      if (appliedFilters.jaLectureExperience && appliedFilters.jaLectureExperience !== 'all') {
        const years = row.lectureExperienceYears ?? 0
        if (String(years) !== appliedFilters.jaLectureExperience) return false
      }
      if (
        appliedFilters.jaEvaluationGrade &&
        appliedFilters.jaEvaluationGrade !== 'all' &&
        row.jaEvaluationGrade !== appliedFilters.jaEvaluationGrade
      )
        return false
      return true
    })
  }, [
    baseFiltered,
    appliedFilters.region,
    appliedFilters.jaLectureExperience,
    appliedFilters.jaEvaluationGrade,
  ])

  const handleActivityCertificateIssueClick = useCallback(() => {
    const selectedCount = selectedInstructorRowKeys.length
    if (selectedCount === 0) {
      showAlert({ title: '안내', content: ACTIVITY_CERTIFICATE_ISSUE_SELECT_ONE_ALERT_MESSAGE })
      return
    }
    if (selectedCount > 1) {
      showAlert({ title: '안내', content: ACTIVITY_CERTIFICATE_ISSUE_SELECT_ONLY_ONE_ALERT_MESSAGE })
      return
    }

    const selectedId = String(selectedInstructorRowKeys[0])
    const selectedRow = filteredInstructors.find(row => row.id === selectedId)
    if (!selectedRow) {
      showAlert({ title: '안내', content: ACTIVITY_CERTIFICATE_ISSUE_SELECT_ONE_ALERT_MESSAGE })
      return
    }

    setActivityCertPreviewInstructor(mergeParticipatingInstructorRow(selectedRow))
    setActivityCertPreviewOpen(true)
  }, [filteredInstructors, selectedInstructorRowKeys, showAlert])

  const selectedInstructorFromUrl = useMemo(() => {
    if (!instructorIdFromUrl) return null
    const row = instructorList.find(r => r.id === instructorIdFromUrl)
    return row ? mergeParticipatingInstructorRow(row) : null
  }, [instructorIdFromUrl, instructorList])

  useEffect(() => {
    if (!instructorIdFromUrl || !onClearInstructorId) return
    const row = instructorList.find(r => r.id === instructorIdFromUrl)
    if (!row) onClearInstructorId()
  }, [instructorIdFromUrl, instructorList, onClearInstructorId])

  const prevInstructorDetailId = useRef<string | null>(null)
  useEffect(() => {
    if (selectedInstructorFromUrl) {
      onInstructorDetailOpen?.(selectedInstructorFromUrl.instructorName)
      prevInstructorDetailId.current = instructorIdFromUrl ?? null
    } else {
      if (prevInstructorDetailId.current != null) onInstructorDetailClose?.()
      prevInstructorDetailId.current = null
    }
  }, [
    selectedInstructorFromUrl,
    instructorIdFromUrl,
    onInstructorDetailOpen,
    onInstructorDetailClose,
  ])

  const schoolNamesOnCalendarDate = useMemo(
    () => getSchoolNamesForDate(MOCK_PARTICIPATING_SCHOOLS, calendarSelectedDate),
    [calendarSelectedDate]
  )

  /** 캘린더에서 선택한 날짜에 교육이 있는 학교에 배정된 강사만 우측 카드에 표시 */
  const instructorsForCalendarDate = useMemo(() => {
    if (schoolNamesOnCalendarDate.length === 0) return []
    return filteredInstructors.filter(row => schoolNamesOnCalendarDate.includes(row.schoolName))
  }, [filteredInstructors, schoolNamesOnCalendarDate])

  const calendarSchoolFilterOptions = useMemo(() => {
    const names = [...schoolNamesOnCalendarDate].sort((a, b) => a.localeCompare(b, 'ko'))
    return names.map(school => {
      const pair = schoolNameToScheduleColor.get(school) ?? programScheduleColors
      return {
        value: school,
        label: school,
        tagColor: pair.bg,
        tagTextColor: pair.text,
      }
    })
  }, [schoolNamesOnCalendarDate, schoolNameToScheduleColor, programScheduleColors])

  useEffect(() => {
    setCalendarSelectedSchools(null)
  }, [calendarSchoolFilterOptions])

  const effectiveCalendarSelectedSchools = useMemo(() => {
    if (calendarSelectedSchools !== null) return calendarSelectedSchools
    return calendarSchoolFilterOptions.map(option => option.value)
  }, [calendarSelectedSchools, calendarSchoolFilterOptions])

  const instructorsForCalendarDateFiltered = useMemo(() => {
    if (effectiveCalendarSelectedSchools.length === 0) return []
    const selected = new Set(effectiveCalendarSelectedSchools)
    return instructorsForCalendarDate.filter(row => selected.has(row.schoolName))
  }, [instructorsForCalendarDate, effectiveCalendarSelectedSchools])

  const instructorCalendarEvents = useMemo(
    () =>
      buildParticipatingInstructorCalendarEvents(MOCK_PARTICIPATING_SCHOOLS, filteredInstructors),
    [filteredInstructors]
  )

  const registeredInstructorNames = useMemo(
    () => instructorList.map(row => row.instructorName),
    [instructorList]
  )

  useEffect(() => {
    let cancelled = false
    void fetchParticipatingInstructorMemberCandidates(registeredInstructorNames).then(options => {
      if (!cancelled) setInstructorMemberOptions(options)
    })
    return () => {
      cancelled = true
    }
  }, [registeredInstructorNames])

  const showInstructorAddSelectAlert = useCallback(() => {
    showAlert({ title: '안내', content: PARTICIPATING_INSTRUCTOR_ADD_SELECT_ALERT_MESSAGE })
  }, [showAlert])

  const handleCalendarView = () => {
    setCalendarSelectedSchools(null)
    setViewMode('calendar')
  }
  const handleListView = () => setViewMode('list')

  const tableScrollX = 48 + 64 + 100 + 140 + 160 + 100 + 100 + 120 + 140 + 120

  const columns: ColumnsType<ParticipatingInstructorRow> = useMemo(
    () => [
      {
        title: 'No.',
        dataIndex: 'no',
        key: 'no',
        width: 64,
        align: 'center',
      },
      {
        title: '강사명',
        dataIndex: 'instructorName',
        key: 'instructorName',
        width: 100,
      },
      {
        title: '거주 지역',
        key: 'region',
        width: 140,
        render: (_: unknown, record: ParticipatingInstructorRow) => {
          if (record.region) return record.region
          if (record.address) return MASKING_POLICY.address(record.address)
          return '-'
        },
      },
      {
        title: '참여 학교',
        dataIndex: 'schoolName',
        key: 'schoolName',
        width: 160,
        ellipsis: true,
      },
      {
        title: 'JA 강의 경력',
        key: 'lectureExperienceYears',
        width: 100,
        align: 'center',
        render: (_: unknown, record: ParticipatingInstructorRow) =>
          record.lectureExperienceYears != null ? `${record.lectureExperienceYears}년` : '-',
      },
      {
        title: 'JA 평가 등급',
        dataIndex: 'jaEvaluationGrade',
        key: 'jaEvaluationGrade',
        width: 100,
        align: 'center',
        render: (v: string) => v ?? '-',
      },
      {
        title: '연락처',
        dataIndex: 'contact',
        key: 'contact',
        width: 120,
        minWidth: 120,
        ellipsis: { showTitle: true },
        onHeaderCell: () => ({ className: INSTRUCTOR_ELLIPSIS_CELL_CLASS }),
        onCell: () => ({ className: INSTRUCTOR_ELLIPSIS_CELL_CLASS }),
        render: (v: string | undefined) => (v ? MASKING_POLICY.phone(v) : '-'),
      },
      {
        title: '이메일',
        dataIndex: 'email',
        key: 'email',
        width: 140,
        minWidth: 140,
        ellipsis: { showTitle: true },
        onHeaderCell: () => ({ className: INSTRUCTOR_ELLIPSIS_CELL_CLASS }),
        onCell: () => ({ className: INSTRUCTOR_ELLIPSIS_CELL_CLASS }),
        render: (v: string | undefined) => (v ? MASKING_POLICY.email(v) : '-'),
      },
      {
        title: '정산현황',
        dataIndex: 'settlementStatus',
        key: 'settlementStatus',
        width: 120,
        align: 'center',
        render: (status: InstructorSettlementUiStatus) => (
          <InstructorSettlementStatusText status={status} />
        ),
      },
    ],
    []
  )

  const { exportExcel, isExporting: isExcelExporting } = useTableExcelExport({
    columns,
    data: filteredInstructors,
    filename: '교육 참여 강사 목록',
  })

  if (selectedInstructorFromUrl && program) {
    return (
      <div className="program-status-participating program-status-participating--instructors participating-institutions-section participating-institutions-section--instructors">
        <ParticipatingInstructorFullpageView
          program={program}
          instructor={selectedInstructorFromUrl}
          activeTab={instructorTabFromUrl ?? undefined}
          onTabChange={onInstructorTabChange}
          onClearInstructorId={onClearInstructorId ?? (() => {})}
          schoolRows={MOCK_PARTICIPATING_SCHOOLS}
          instructorList={instructorList}
        />
        <AddParticipatingInstructorModal
          open={addInstructorModalOpen}
          onCancel={() => setAddInstructorModalOpen(false)}
          memberOptions={instructorMemberOptions}
          onNoMemberSelected={showInstructorAddSelectAlert}
          onProceedToConsent={handleProceedToInstructorConsent}
        />
        <ParticipatingInstructorAddConsentModal
          open={instructorConsentModalOpen}
          onClose={handleInstructorConsentClose}
          onConfirm={handleInstructorConsentConfirm}
        />
      </div>
    )
  }

  return (
    <div
      className={[
        'program-status-participating program-status-participating--instructors participating-institutions-section participating-institutions-section--instructors',
        viewMode === 'calendar' ? 'general-program-detail--calendar-view' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <UnifiedFilterCard
        bordered={false}
        cardStyle={{ marginBottom: 0 }}
        fields={instructorFilterFields}
        filters={unifiedFilterCardValues}
        onFilterChange={handleUnifiedFilterChange}
        onSearch={handleUnifiedFilterSearch}
      />

      <Divider className="participating-institutions-section__divider" />

      <div className="participating-institutions-section__below-divider">
        <div className="table-header-actions">
          <div className="table-header-title--wrapper">
            <span className="table-title">
              교육 참여 강사 목록
            </span>
            <span className="table-description">
              {filteredInstructors.length}건
            </span>
          </div>
          <div className="info-section-buttons--wrapper">
            <CmsButton
              variant="secondary"
              size="large"
              style={{ minWidth: 180 }}
              icon={<DownloadOutlined />}
              onClick={handleActivityCertificateIssueClick}
            >
              활동인증서 발급
            </CmsButton>
            {viewMode === 'list' ? (
              <CmsButton
                variant="secondary"
                size="large"
                style={{ minWidth: 180 }}
                icon={<CalendarOutlined />}
                onClick={handleCalendarView}
              >
                캘린더 뷰로 보기
              </CmsButton>
            ) : (
              <CmsButton
                variant="secondary"
                size="large"
                style={{ minWidth: 180 }}
                icon={<UnorderedListOutlined />}
                onClick={handleListView}
              >
                리스트 뷰로 보기
              </CmsButton>
            )}
            <CmsButton
              variant="primary"
              size="large"
              width={160}
              onClick={() => setAddInstructorModalOpen(true)}
              className="participating-instructors-section__btn-add-instructor"
            >
              강사 등록
            </CmsButton>
            <ExcelButton onClick={exportExcel} loading={isExcelExporting} />
          </div>
        </div>

        {viewMode === 'list' ? (
          <div className="participating-institutions-section__table-wrap">
            <Table<ParticipatingInstructorRow>
              className="participating-institutions-section__table cms-data-table participating-institutions-section__table--clickable"
              rowKey="id"
              size="middle"
              pagination={false}
              tableLayout="fixed"
              scroll={{ x: tableScrollX }}
              columns={columns}
              dataSource={filteredInstructors}
              rowSelection={{
                selectedRowKeys: selectedInstructorRowKeys,
                onChange: keys => setSelectedInstructorRowKeys(keys as string[]),
              }}
              onRow={record => ({
                onClick: e => {
                  const target = e.target as HTMLElement
                  if (
                    target.closest('.ant-table-selection-column') ||
                    target.closest('.ant-checkbox-wrapper')
                  )
                    return
                  onInstructorRowClick?.(record)
                },
                style: { cursor: 'pointer' },
              })}
            />
          </div>
        ) : (
          <div className="participating-institutions-section__calendar-wrap">
            <ParticipatingInstitutionsCalendarView
              schools={MOCK_PARTICIPATING_SCHOOLS}
              customEvents={instructorCalendarEvents}
              renderMonthEventContent={renderParticipatingInstructorCalendarMonthEventContent}
              selectedRowKeys={[]}
              onSelectionChange={() => {}}
              onSchoolClick={() => {}}
              onDateSelect={setCalendarSelectedDate}
              calendarGranularity={progressCalendarGranularity}
              onCalendarGranularityChange={setProgressCalendarGranularity}
              rightContent={
              <div className="participating-instructors-section__calendar-right">
                <div className="calendar-split-card-right__toolbar participating-instructors-section__calendar-right__school-filter">
                  <CmsSelect
                    mode="multiple"
                    withAllOption={false}
                    width="100%"
                    value={effectiveCalendarSelectedSchools}
                    onChange={next => setCalendarSelectedSchools(next as string[])}
                    options={calendarSchoolFilterOptions}
                    placeholder="기관 선택"
                  />
                </div>
                <div className="participating-instructors-section__calendar-right-cards">
                  {instructorsForCalendarDateFiltered.map(row => {
                    const schoolColors =
                      schoolNameToScheduleColor.get(row.schoolName) ?? programScheduleColors
                    return (
                      <div
                        key={row.id}
                        className="participating-instructors-section__calendar-card"
                        role="button"
                        tabIndex={0}
                        style={
                          {
                            '--calendar-card-bg': schoolColors.bg,
                            '--calendar-card-border': schoolColors.border,
                          } as CSSProperties
                        }
                        onClick={e => {
                          const target = e.target as HTMLElement
                          if (
                            target.closest(
                              '.participating-instructors-section__calendar-card-checkbox-wrap'
                            )
                          )
                            return
                          onInstructorRowClick?.(row)
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            onInstructorRowClick?.(row)
                          }
                        }}
                      >
                        <div className="participating-instructors-section__calendar-card-main">
                          <div className="participating-instructors-section__calendar-card-body">
                            <div className="participating-instructors-section__calendar-card-header">
                              <span className="participating-instructors-section__calendar-card-school">
                                {row.schoolName}
                              </span>
                              <span
                                className="participating-instructors-section__calendar-card-divider"
                                aria-hidden
                              />
                              <span className="participating-instructors-section__calendar-card-name">
                                {row.instructorName}
                              </span>
                            </div>
                            <div className="participating-instructors-section__calendar-card-tags">
                              <span
                                className={
                                  'participating-instructors-section__calendar-card-tag participating-instructors-section__calendar-card-tag--settlement participating-instructors-section__calendar-card-tag--' +
                                  row.settlementStatus
                                }
                              >
                                {INSTRUCTOR_SETTLEMENT_STATUS_LABELS_SHORT[row.settlementStatus]}
                              </span>
                              <span
                                className="participating-instructors-section__calendar-card-tag participating-instructors-section__calendar-card-tag--report"
                              >
                                강의보고서 : {row.lectureReportSubmitted ? '제출' : '미제출'}
                              </span>
                            </div>
                          </div>
                          <div className="participating-instructors-section__calendar-card-checkbox-wrap">
                            <Checkbox
                              checked={selectedInstructorRowKeys.includes(row.id)}
                              onChange={e => {
                                e.stopPropagation()
                                const next = e.target.checked
                                  ? [...selectedInstructorRowKeys, row.id]
                                  : selectedInstructorRowKeys.filter(k => k !== row.id)
                                setSelectedInstructorRowKeys(next)
                              }}
                              onClick={e => e.stopPropagation()}
                              className="participating-instructors-section__calendar-card-checkbox"
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            }
            />
          </div>
        )}
      </div>

      {viewMode === 'calendar' ? (
        <div className="participating-institutions-section__page-bottom-spacer" aria-hidden />
      ) : null}

      <AddParticipatingInstructorModal
        open={addInstructorModalOpen}
        onCancel={() => setAddInstructorModalOpen(false)}
        memberOptions={instructorMemberOptions}
        onNoMemberSelected={showInstructorAddSelectAlert}
        onProceedToConsent={handleProceedToInstructorConsent}
      />
      <ParticipatingInstructorAddConsentModal
        open={instructorConsentModalOpen}
        onClose={handleInstructorConsentClose}
        onConfirm={handleInstructorConsentConfirm}
      />

      {activityCertPreviewInstructor ? (
        <ActivityCertificateIssuancePreviewModal
          open={activityCertPreviewOpen}
          onClose={() => setActivityCertPreviewOpen(false)}
          instructor={activityCertPreviewInstructor}
          program={program}
        />
      ) : null}
    </div>
  )
}
