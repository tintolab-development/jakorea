/**
 * 참여 강사 페이지 (풀페이지 모달 > 프로그램 진행 현황 > 참여 강사)
 * 필터(쿼리 파라미터 연동) + 테이블(교육 참여 강사 목록, 정산현황 텍스트 컬러) + 액션 버튼
 */

import { useCallback, useMemo, useState, useEffect, useRef, type CSSProperties } from 'react'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { Table, Checkbox, Spin } from 'antd'
import { CalendarOutlined, UnorderedListOutlined, DownloadOutlined } from '@ant-design/icons'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { CmsButton, useCmsAlert } from '@/shared/ui'
import { CmsSelect } from '@/shared/ui'
import { participatingInstructorsFilterFields } from '@/features/program/general/lib/participating-instructors-filter-fields'
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
import { matchesInstructorJaExperienceYears } from '@/features/program/general/lib/instructor-application-filter-options'
import {
  formatParticipatingInstructorAssignedInstitutions,
  formatParticipatingInstructorHomeAddress,
  getParticipatingInstructorAssignedSchoolNames,
} from '@/features/program/general/lib/participating-instructors-table-display'
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
import { useProgressSchoolList } from '../../../hooks/use-progress-school-list'
import { AddParticipatingInstructorModal } from '../../add-participating-instructor-modal'
import { ParticipatingInstructorAddConsentModal } from '../../participating-instructor-add-consent-modal'
import {
  ParticipatingInstructorFullpageView,
  type InstructorDetailTabKey,
} from './participating-instructor-fullpage-view'
import { InstructorSettlementStatusText } from '@/shared/ui/instructor-settlement-status-text'
import { getInstructorSettlementStatusLabel } from '@/shared/constants/instructor-settlement-status'
import {
  INSTRUCTOR_SETTLEMENT_STATUS_LABELS_SHORT,
  type InstructorSettlementUiStatus,
} from '@/shared/constants/instructor-settlement-status'
import { CMS_TABLE_NO_COL_CLASS } from '@/shared/constants/table'
import type { ParticipatingSchoolRow } from '@/data/mock/participating-schools'
import { ParticipatingInstitutionsCalendarView } from './participating-institutions-calendar-view'
import {
  getScheduleColorPair,
  SCHEDULE_COLORS,
  type ScheduleColorPair,
} from '../../../../shared/ui/program-schedule-colors'
import './participating-institutions-section.css'
import './program-progress-tab.css'

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

  const progressFilters: ProgressFilters = useMemo(
    () => ({
      schoolName: '',
      region: 'all',
      institutionSido: '',
      institutionSigungu: '',
      educationGrade: 'all',
      lectureRound: 'all',
      textbookStatus: 'all',
      settlementStatus: appliedFilters.settlementStatus || 'all',
      teacherName: appliedFilters.instructorName,
    }),
    [appliedFilters.settlementStatus, appliedFilters.instructorName]
  )

  const {
    instructorList,
    filteredInstructors: baseFiltered,
    selectedInstructorRowKeys,
    setSelectedInstructorRowKeys,
    addInstructorModalOpen,
    setAddInstructorModalOpen,
    handleAddInstructorByMemberId,
    isRemoteDataSource: instructorsRemote,
    applicationsLoading: instructorsLoading,
  } = useProgressInstructorList({
    appliedFilters: progressFilters,
    programId,
  })

  const { schoolList: schoolRows } = useProgressSchoolList({
    appliedFilters: progressFilters,
    instructorList,
    programId,
  })

  /** remote ON이면 mock 상세 필드로 덮어쓰지 않음 */
  const resolveInstructorRow = useCallback(
    (row: ParticipatingInstructorRow): ParticipatingInstructorRow => {
      if (instructorsRemote) return row
      return mergeParticipatingInstructorRow(row)
    },
    [instructorsRemote]
  )

  /** 좌측 캘린더 학교 일정 태그와 동일: 참여 학교명 가나다순 → SCHEDULE_COLORS 순환 */
  const schoolNameToScheduleColor = useMemo(() => {
    const sorted = Array.from(new Set(schoolRows.map(s => s.schoolName))).sort()
    const map = new Map<string, ScheduleColorPair>()
    sorted.forEach((name, i) => {
      map.set(name, SCHEDULE_COLORS[i % SCHEDULE_COLORS.length])
    })
    return map
  }, [schoolRows])
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

  const filterValues = useMemo(
    () => ({
      instructorName: pendingFilters.instructorName,
      homeSido: pendingFilters.homeSido,
      homeSigungu: pendingFilters.homeSigungu,
      experienceYears:
        pendingFilters.experienceYears === 'all' ? undefined : pendingFilters.experienceYears,
      evaluationGrade:
        pendingFilters.evaluationGrade === 'all' ? undefined : pendingFilters.evaluationGrade,
      settlementStatus:
        pendingFilters.settlementStatus === 'all' ? undefined : pendingFilters.settlementStatus,
    }),
    [pendingFilters]
  )

  const handleFilterChange = (key: string, value: unknown) => {
    if (key === 'instructorName') {
      setPendingFilters(prev => ({ ...prev, instructorName: String(value ?? '') }))
      return
    }
    if (key === 'homeSido') {
      setPendingFilters(prev => ({
        ...prev,
        homeSido: value == null || value === '' ? '' : String(value),
        homeSigungu: '',
      }))
      return
    }
    if (key === 'homeSigungu') {
      setPendingFilters(prev => ({
        ...prev,
        homeSigungu: value == null || value === '' ? '' : String(value),
      }))
      return
    }
    if (key === 'experienceYears' || key === 'evaluationGrade' || key === 'settlementStatus') {
      const v = value == null || value === '' || value === 'all' ? 'all' : String(value)
      setPendingFilters(prev => ({ ...prev, [key]: v }))
    }
  }

  const handleFilterSearch = () => {
    applyFilters(pendingFilters)
  }

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
      const addressText = row.address ?? row.region ?? ''
      const homeSido = appliedFilters.homeSido.trim()
      const homeSigungu = appliedFilters.homeSigungu.trim()
      if (homeSido && !addressText.includes(homeSido)) return false
      if (homeSigungu && !addressText.includes(homeSigungu)) return false
      if (
        !matchesInstructorJaExperienceYears(
          row.lectureExperienceYears ?? 0,
          appliedFilters.experienceYears
        )
      ) {
        return false
      }
      if (appliedFilters.evaluationGrade && appliedFilters.evaluationGrade !== 'all') {
        const rowGrade = (row.jaEvaluationGrade ?? '').replace(/등급$/, '')
        if (rowGrade !== appliedFilters.evaluationGrade) return false
      }
      return true
    })
  }, [
    baseFiltered,
    appliedFilters.homeSido,
    appliedFilters.homeSigungu,
    appliedFilters.experienceYears,
    appliedFilters.evaluationGrade,
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

    setActivityCertPreviewInstructor(resolveInstructorRow(selectedRow))
    setActivityCertPreviewOpen(true)
  }, [filteredInstructors, resolveInstructorRow, selectedInstructorRowKeys, showAlert])

  const selectedInstructorFromUrl = useMemo(() => {
    if (!instructorIdFromUrl) return null
    const row = instructorList.find(r => r.id === instructorIdFromUrl)
    return row ? resolveInstructorRow(row) : null
  }, [instructorIdFromUrl, instructorList, resolveInstructorRow])

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
    () => getSchoolNamesForDate(schoolRows, calendarSelectedDate),
    [calendarSelectedDate, schoolRows]
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
      buildParticipatingInstructorCalendarEvents(schoolRows, filteredInstructors),
    [filteredInstructors, schoolRows]
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

  const tableScrollX = 48 + 64 + 120 + 160 + 220 + 100 + 100 + 120 + 140 + 140

  const instructorListExportRows = useMemo(
    () =>
      filteredInstructors.map(row => ({
        no: row.no,
        instructorName: row.instructorName,
        homeAddress: formatParticipatingInstructorHomeAddress(
          row.address ? MASKING_POLICY.address(row.address) : row.region
        ),
        assignedInstitutions: formatParticipatingInstructorAssignedInstitutions(
          getParticipatingInstructorAssignedSchoolNames(row, schoolRows, instructorList)
        ),
        lectureExperienceYears:
          row.lectureExperienceYears != null ? `${row.lectureExperienceYears}년` : '-',
        jaEvaluationGrade: row.jaEvaluationGrade ?? '-',
        contact: row.contact ? MASKING_POLICY.phone(row.contact) : '-',
        email: row.email ? MASKING_POLICY.email(row.email) : '-',
        settlementStatus: getInstructorSettlementStatusLabel(row.settlementStatus),
      })),
    [filteredInstructors, instructorList]
  )

  const instructorListExportColumns: ColumnsType<(typeof instructorListExportRows)[number]> =
    useMemo(
      () => [
        { title: 'No.', dataIndex: 'no', key: 'no' },
        { title: '참여 강사명', dataIndex: 'instructorName', key: 'instructorName' },
        { title: '자택 주소지', dataIndex: 'homeAddress', key: 'homeAddress' },
        { title: '배정 기관명', dataIndex: 'assignedInstitutions', key: 'assignedInstitutions' },
        {
          title: 'JA 강의 경력',
          dataIndex: 'lectureExperienceYears',
          key: 'lectureExperienceYears',
        },
        { title: 'JA 평가 등급', dataIndex: 'jaEvaluationGrade', key: 'jaEvaluationGrade' },
        { title: '연락처', dataIndex: 'contact', key: 'contact' },
        { title: '이메일', dataIndex: 'email', key: 'email' },
        { title: '정산 현황', dataIndex: 'settlementStatus', key: 'settlementStatus' },
      ],
      []
    )

  const columns: ColumnsType<ParticipatingInstructorRow> = useMemo(
    () => [
      {
        title: 'No.',
        dataIndex: 'no',
        key: 'no',
        width: 80,
        align: 'center',
        className: CMS_TABLE_NO_COL_CLASS,
        onHeaderCell: () => ({ className: CMS_TABLE_NO_COL_CLASS }),
        onCell: () => ({ className: CMS_TABLE_NO_COL_CLASS }),
      },
      {
        title: '참여 강사명',
        dataIndex: 'instructorName',
        key: 'instructorName',
        width: 120,
        ellipsis: true,
      },
      {
        title: '자택 주소지',
        key: 'homeAddress',
        width: 160,
        ellipsis: true,
        render: (_: unknown, record: ParticipatingInstructorRow) => {
          const raw = record.address ?? record.region
          if (!raw) return '-'
          const display = record.address ? MASKING_POLICY.address(raw) : raw
          return formatParticipatingInstructorHomeAddress(display)
        },
      },
      {
        title: '배정 기관명',
        key: 'assignedInstitutions',
        width: 220,
        minWidth: 220,
        ellipsis: true,
        render: (_: unknown, record: ParticipatingInstructorRow) =>
          formatParticipatingInstructorAssignedInstitutions(
            getParticipatingInstructorAssignedSchoolNames(
              record,
              schoolRows,
              instructorList
            )
          ),
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
        render: (v: string | undefined) => v ?? '-',
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
        title: '정산 현황',
        dataIndex: 'settlementStatus',
        key: 'settlementStatus',
        width: 140,
        align: 'center',
        render: (status: InstructorSettlementUiStatus) => (
          <InstructorSettlementStatusText status={status} />
        ),
      },
    ],
    [instructorList]
  )

  if (instructorsLoading && instructorList.length === 0) {
    return (
      <div className="flex min-h-[240px] w-full items-center justify-center" role="status">
        <Spin size="large" />
      </div>
    )
  }

  if (selectedInstructorFromUrl && program) {
    return (
      <div className="program-status-participating program-status-participating--instructors participating-institutions-section participating-institutions-section--instructors">
        <ParticipatingInstructorFullpageView
          program={program}
          instructor={selectedInstructorFromUrl}
          activeTab={instructorTabFromUrl ?? undefined}
          onTabChange={onInstructorTabChange}
          onClearInstructorId={onClearInstructorId ?? (() => {})}
          schoolRows={schoolRows}
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
      <FilterTableLayout
        className="participating-institutions-section__filter-layout"
        bordered={false}
        filterResponsiveWrap={false}
        contentVariant={viewMode === 'calendar' ? 'calendar' : 'table'}
        fields={participatingInstructorsFilterFields}
        filters={filterValues}
        onFilterChange={handleFilterChange}
        onSearch={handleFilterSearch}
        title="교육 참여 강사 목록"
        description={`${filteredInstructors.length}건`}
        actions={
          <>
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
          </>
        }
        excelExport={{
          columns: instructorListExportColumns,
          data: instructorListExportRows,
        }}
      >
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
              schools={schoolRows}
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
                                <span className="participating-instructors-section__calendar-card-tag participating-instructors-section__calendar-card-tag--report">
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
      </FilterTableLayout>

      <div className="participating-institutions-section__page-bottom-spacer" aria-hidden />

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
