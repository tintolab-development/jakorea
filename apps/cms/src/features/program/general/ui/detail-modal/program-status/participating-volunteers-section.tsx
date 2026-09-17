/**
 * 참여 봉사자 페이지 (풀페이지 모달 > 프로그램 진행 현황 > 참여 봉사자)
 */

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { Table, Spin } from 'antd'
import { CalendarOutlined, DownloadOutlined, UnorderedListOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { CmsButton, useCmsAlert } from '@/shared/ui'
import { displayServerPiiAsIs } from '@/features/program/shared/lib/program-pii-display'
import {
  ACTIVITY_CERTIFICATE_ISSUE_SELECT_ONE_VOLUNTEER_ALERT_MESSAGE,
  ACTIVITY_CERTIFICATE_ISSUE_SELECT_ONLY_ONE_VOLUNTEER_ALERT_MESSAGE,
} from '@/shared/constants/messages'
import { CMS_TABLE_NO_COL_CLASS } from '@/shared/constants/table'
import type { ParticipatingVolunteerRow } from '@/features/program/general/model/participating-volunteers'
import { participatingVolunteersFilterFields } from '@/features/program/general/lib/participating-volunteers-filter-fields'
import {
  ParticipatingVolunteerFullpageView,
  type VolunteerDetailTabKey,
} from './participating-volunteer-fullpage-view'
import { mergeParticipatingVolunteerDetailRow } from '@/features/program/general/lib/participating-volunteer-detail'
import { ParticipatingVolunteerActivityCertificatePreviewModal } from './participating-volunteer-activity-certificate-preview-modal'
import { notifyProgramApiUnavailable } from '@/features/program/shared/lib/program-api-unavailable'
import { useProgressVolunteerList } from '../../../hooks/use-progress-volunteer-list'
import { useGatedInfiniteScroll } from '@/shared/hooks/use-gated-infinite-scroll'
import { useProgressSchoolList } from '../../../hooks/use-progress-school-list'
import { useProgressInstructorList } from '../../../hooks/use-progress-instructor-list'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import type { Program } from '@/types/domain'
import { useParticipatingVolunteersParams } from '../../../hooks/use-participating-volunteers-params'
import type { ProgressFilters } from '../../../hooks/use-program-progress-params'
import {
  filterParticipatingVolunteers,
  formatParticipatingVolunteerAssignedInstitutions,
  type ParticipatingVolunteersFilters,
} from '../../../lib/participating-volunteers-filter'
import { formatParticipatingSchoolSessionLine } from '../../../lib/participating-school-session-display'
import { buildParticipatingVolunteerCalendarEvents } from '../../../lib/build-participating-volunteer-calendar-events'
import { getSchoolNamesForDateFromVolunteerEvents } from '../../../lib/participating-calendar-date-schools'
import { PARTICIPATING_INSTITUTIONS_SESSIONS_COLUMN_WIDTH } from '../../../lib/participating-institutions-table'
import { useContainerFitTableScrollX } from '@/shared/lib/resolve-table-min-scroll-x'
import { SCHEDULE_COLORS } from '@/features/program/shared/ui/program-schedule-colors'
import { renderProgramDetailPipeSeparated } from '@/features/program/shared/ui/program-detail-td-divider'
import { ParticipatingInstitutionsCalendarView } from './participating-institutions-calendar-view'
import { renderParticipatingVolunteerCalendarMonthEventContent } from './participating-volunteer-calendar-month-event'
import { ParticipatingVolunteersCalendarRight } from './participating-volunteers-calendar-right'
import './participating-institutions-section.css'
import './program-progress-tab.css'

export interface ParticipatingVolunteersSectionProps {
  programId?: string
  program?: Program | null
  /** URL volunteerId — 있으면 인라인 상세 뷰 */
  volunteerIdFromUrl?: string | null
  volunteerTabFromUrl?: VolunteerDetailTabKey | null
  onVolunteerTabChange?: (tab: VolunteerDetailTabKey) => void
  onVolunteerRowClick?: (row: ParticipatingVolunteerRow) => void
  onClearVolunteerId?: () => void
  onVolunteerDetailOpen?: (volunteerName: string) => void
  onVolunteerDetailClose?: () => void
}

export function ParticipatingVolunteersSection({
  programId,
  program,
  volunteerIdFromUrl,
  volunteerTabFromUrl,
  onVolunteerTabChange,
  onVolunteerRowClick,
  onClearVolunteerId,
  onVolunteerDetailOpen,
  onVolunteerDetailClose,
}: ParticipatingVolunteersSectionProps) {
  const { showAlert } = useCmsAlert()
  const {
    filters,
    appliedFilters,
    applyFilters,
    viewMode,
    setViewMode,
    progressCalendarGranularity,
    setProgressCalendarGranularity,
  } = useParticipatingVolunteersParams()
  const {
    volunteerList,
    applicationsLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useProgressVolunteerList(programId, program)
  const { sentinelRef: loadMoreRef } = useGatedInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    resetKey: `${programId ?? ''}:${viewMode}:${JSON.stringify(appliedFilters)}`,
  })

  const schoolFilters: ProgressFilters = useMemo(
    () => ({
      schoolName: '',
      region: 'all',
      institutionSido: '',
      institutionSigungu: '',
      educationGrade: 'all',
      lectureRound: 'all',
      textbookStatus: 'all',
      settlementStatus: 'all',
      teacherName: '',
    }),
    []
  )
  const { instructorList } = useProgressInstructorList({
    appliedFilters: schoolFilters,
    programId,
    program,
  })
  const { schoolList: schoolRows } = useProgressSchoolList({
    appliedFilters: schoolFilters,
    instructorList,
    programId,
    program,
  })

  const [pendingFilters, setPendingFilters] = useState<ParticipatingVolunteersFilters>(() => ({
    ...filters,
  }))
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<Dayjs>(() => dayjs())
  /** `null` — 해당 날짜 기관 전체 선택(날짜 변경 시 기본), `[]` — 사용자가 모두 해제 */
  const [calendarSelectedSchools, setCalendarSelectedSchools] = useState<string[] | null>(null)
  const [activityCertPreviewOpen, setActivityCertPreviewOpen] = useState(false)
  const [activityCertPreviewVolunteer, setActivityCertPreviewVolunteer] =
    useState<ParticipatingVolunteerRow | null>(null)

  useEffect(() => {
    setPendingFilters({ ...filters })
  }, [filters])

  const handleFilterChange = (key: string, value: unknown) => {
    if (key === 'volunteerName' || key === 'id1365') {
      setPendingFilters(prev => ({ ...prev, [key]: String(value ?? '') }))
    }
  }

  const handleFilterSearch = () => {
    applyFilters({ ...pendingFilters })
  }

  const filteredVolunteers = useMemo(
    () => filterParticipatingVolunteers(volunteerList, appliedFilters),
    [volunteerList, appliedFilters]
  )

  const volunteerCalendarEvents = useMemo(
    () => buildParticipatingVolunteerCalendarEvents(schoolRows, filteredVolunteers),
    [filteredVolunteers, schoolRows]
  )

  const schoolNameToScheduleColor = useMemo(() => {
    const sorted = Array.from(new Set(schoolRows.map(s => s.schoolName))).sort()
    const map = new Map<string, (typeof SCHEDULE_COLORS)[number]>()
    sorted.forEach((name, i) => {
      map.set(name, SCHEDULE_COLORS[i % SCHEDULE_COLORS.length])
    })
    return map
  }, [schoolRows])

  const schoolNamesOnCalendarDate = useMemo(
    () => getSchoolNamesForDateFromVolunteerEvents(volunteerCalendarEvents, calendarSelectedDate),
    [volunteerCalendarEvents, calendarSelectedDate]
  )

  const calendarSchoolFilterOptions = useMemo(() => {
    const names = [...schoolNamesOnCalendarDate].sort((a, b) => a.localeCompare(b, 'ko'))
    return names.map(school => {
      const pair = schoolNameToScheduleColor.get(school) ?? SCHEDULE_COLORS[0]
      return {
        value: school,
        label: school,
        tagColor: pair.bg,
        tagTextColor: pair.text,
      }
    })
  }, [schoolNamesOnCalendarDate, schoolNameToScheduleColor])

  useEffect(() => {
    setCalendarSelectedSchools(null)
  }, [calendarSchoolFilterOptions])

  const effectiveCalendarSelectedSchools = useMemo(() => {
    if (calendarSelectedSchools !== null) return calendarSelectedSchools
    return calendarSchoolFilterOptions.map(option => option.value)
  }, [calendarSelectedSchools, calendarSchoolFilterOptions])

  const volunteerEventsForCalendarDate = useMemo(
    () =>
      volunteerCalendarEvents.filter(event =>
        dayjs(event.startDate).isSame(calendarSelectedDate, 'day')
      ),
    [volunteerCalendarEvents, calendarSelectedDate]
  )

  const handleRegisterEmployeeVolunteerClick = useCallback(() => {
    notifyProgramApiUnavailable(
      'general-progress-volunteer-employee-register',
      '참여 봉사자 · 임직원 자원봉사자 등록'
    )
  }, [])

  const handleRegisterVolunteerClick = useCallback(() => {
    notifyProgramApiUnavailable(
      'general-progress-volunteer-register',
      '참여 봉사자 · 봉사자 등록'
    )
  }, [])

  const handleActivityCertificateIssueClick = useCallback(() => {
    const selectedCount = selectedRowKeys.length
    if (selectedCount === 0) {
      showAlert({
        title: '안내',
        content: ACTIVITY_CERTIFICATE_ISSUE_SELECT_ONE_VOLUNTEER_ALERT_MESSAGE,
      })
      return
    }
    if (selectedCount > 1) {
      showAlert({
        title: '안내',
        content: ACTIVITY_CERTIFICATE_ISSUE_SELECT_ONLY_ONE_VOLUNTEER_ALERT_MESSAGE,
      })
      return
    }
    const selectedId = String(selectedRowKeys[0])
    const selectedRow =
      volunteerList.find(row => row.id === selectedId) ??
      filteredVolunteers.find(row => row.id === selectedId)
    if (!selectedRow) {
      showAlert({
        title: '안내',
        content: ACTIVITY_CERTIFICATE_ISSUE_SELECT_ONE_VOLUNTEER_ALERT_MESSAGE,
      })
      return
    }
    setActivityCertPreviewVolunteer(selectedRow)
    setActivityCertPreviewOpen(true)
  }, [filteredVolunteers, selectedRowKeys, showAlert, volunteerList])

  const selectedVolunteerFromUrl = useMemo(() => {
    if (!volunteerIdFromUrl) return null
    const row = volunteerList.find(r => r.id === volunteerIdFromUrl)
    return row ? mergeParticipatingVolunteerDetailRow(row) : null
  }, [volunteerIdFromUrl, volunteerList])

  useEffect(() => {
    if (!volunteerIdFromUrl || !onClearVolunteerId) return
    // 목록 로딩 전 빈 배열에서 URL 상세를 지우지 않음
    if (volunteerList.length === 0) return
    const row = volunteerList.find(r => r.id === volunteerIdFromUrl)
    if (!row) onClearVolunteerId()
  }, [volunteerIdFromUrl, volunteerList, onClearVolunteerId])

  const prevVolunteerDetailId = useRef<string | null>(null)
  useEffect(() => {
    if (selectedVolunteerFromUrl) {
      onVolunteerDetailOpen?.(selectedVolunteerFromUrl.volunteerName)
      prevVolunteerDetailId.current = volunteerIdFromUrl ?? null
    } else {
      if (prevVolunteerDetailId.current != null) onVolunteerDetailClose?.()
      prevVolunteerDetailId.current = null
    }
  }, [
    selectedVolunteerFromUrl,
    volunteerIdFromUrl,
    onVolunteerDetailOpen,
    onVolunteerDetailClose,
  ])

  const handleCalendarView = () => {
    setCalendarSelectedSchools(null)
    setViewMode('calendar')
  }
  const handleListView = () => setViewMode('list')

  const columns = useMemo((): ColumnsType<ParticipatingVolunteerRow> => {
    return [
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
        title: '참여 봉사자명',
        dataIndex: 'volunteerName',
        key: 'volunteerName',
        width: 120,
        align: 'center',
      },
      {
        title: '1365 ID',
        dataIndex: 'id1365',
        key: 'id1365',
        width: 120,
        align: 'center',
      },
      {
        title: '기관명',
        key: 'assignedInstitutionNames',
        width: 220,
        minWidth: 220,
        align: 'center',
        render: (_: unknown, record) =>
          formatParticipatingVolunteerAssignedInstitutions(record.assignedInstitutionNames),
      },
      {
        title: '봉사 진행 일정',
        key: 'sessions',
        width: PARTICIPATING_INSTITUTIONS_SESSIONS_COLUMN_WIDTH,
        minWidth: PARTICIPATING_INSTITUTIONS_SESSIONS_COLUMN_WIDTH,
        className: 'participating-institutions-section__th-sessions',
        onHeaderCell: () => ({
          className: 'participating-institutions-section__th-sessions',
        }),
        onCell: () => ({ className: 'participating-institutions-section__td-sessions' }),
        render: (_: unknown, record) => {
          const sessions = record.sessions ?? []
          const total = sessions.length
          const showCount = total <= 3 ? total : 2
          const displaySessions = sessions.slice(0, showCount)
          const restCount = total - showCount
          return (
            <div className="participating-institutions-section__sessions-cell">
              {displaySessions.map((s: ParticipatingSchoolSession, index) => (
                <div
                  key={`${record.id}-session-${s.round}-${index}`}
                  className="participating-institutions-section__session-line"
                >
                  {renderProgramDetailPipeSeparated(formatParticipatingSchoolSessionLine(s))}
                </div>
              ))}
              {restCount > 0 && (
                <div className="participating-institutions-section__session-more">
                  외 {restCount}개의 봉사 일정
                </div>
              )}
            </div>
          )
        },
      },
      {
        title: '연락처',
        dataIndex: 'contact',
        key: 'contact',
        width: 140,
        minWidth: 140,
        align: 'center',
        ellipsis: { showTitle: true },
        className: 'participating-volunteers-section__col-contact',
        onHeaderCell: () => ({ className: 'participating-volunteers-section__col-contact' }),
        onCell: () => ({ className: 'participating-volunteers-section__col-contact' }),
        render: (v: string | undefined) => displayServerPiiAsIs(v),
      },
      {
        title: '이메일',
        dataIndex: 'email',
        key: 'email',
        width: 220,
        minWidth: 220,
        align: 'center',
        ellipsis: { showTitle: true },
        className: 'participating-volunteers-section__col-email',
        onHeaderCell: () => ({ className: 'participating-volunteers-section__col-email' }),
        onCell: () => ({ className: 'participating-volunteers-section__col-email' }),
        render: (v: string | undefined) => displayServerPiiAsIs(v),
      },
    ]
  }, [])

  const { tableWrapRef, tableScrollX } = useContainerFitTableScrollX(
    columns as ColumnsType<unknown>,
    {
      includeSelection: true,
      enabled: viewMode === 'list',
    }
  )

  if (applicationsLoading && volunteerList.length === 0) {
    return (
      <div className="flex min-h-[240px] w-full items-center justify-center" role="status">
        <Spin size="large" />
      </div>
    )
  }

  if (selectedVolunteerFromUrl && program) {
    return (
      <div className="program-status-participating program-status-participating--volunteers participating-institutions-section participating-institutions-section--volunteers">
        <ParticipatingVolunteerFullpageView
          program={program}
          volunteer={selectedVolunteerFromUrl}
          activeTab={volunteerTabFromUrl ?? undefined}
          onTabChange={onVolunteerTabChange}
          onClearVolunteerId={onClearVolunteerId ?? (() => {})}
        />
      </div>
    )
  }

  return (
    <div
      className={[
        'program-status-participating program-status-participating--volunteers participating-institutions-section participating-institutions-section--volunteers',
        viewMode === 'calendar' ? 'general-program-detail--calendar-view' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <FilterTableLayout
        className="participating-institutions-section__filter-layout"
        bordered={false}
        contentVariant={viewMode === 'calendar' ? 'calendar' : 'table'}
        fields={participatingVolunteersFilterFields}
        filters={pendingFilters}
        onFilterChange={handleFilterChange}
        onSearch={handleFilterSearch}
        title="참여 봉사자 목록"
        description={`${filteredVolunteers.length}건`}
        actions={
          <>
            <CmsButton
              variant="secondary"
              size="large"
              style={{ minWidth: 180 }}
              icon={<DownloadOutlined />}
              onClick={handleActivityCertificateIssueClick}
            >
              활동확인서 발급
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
              width={220}
              onClick={handleRegisterEmployeeVolunteerClick}
            >
              임직원 자원봉사자 등록
            </CmsButton>
            <CmsButton
              variant="primary"
              size="large"
              width={140}
              onClick={handleRegisterVolunteerClick}
            >
              봉사자 등록
            </CmsButton>
          </>
        }
        excelExport={{
          columns,
          data: filteredVolunteers,
        }}
      >
        {viewMode === 'list' ? (
          <div
            ref={tableWrapRef}
            className="participating-institutions-section__table-wrap"
            style={
              tableScrollX != null
                ? ({
                    ['--participating-institutions-table-width']: `${tableScrollX}px`,
                  } as CSSProperties)
                : undefined
            }
          >
            <Table<ParticipatingVolunteerRow>
              className="participating-institutions-section__table cms-data-table participating-institutions-section__table--clickable"
              rowKey="id"
              size="middle"
              pagination={false}
              tableLayout="fixed"
              scroll={tableScrollX != null ? { x: tableScrollX } : undefined}
              columns={columns}
              dataSource={filteredVolunteers}
              rowSelection={{
                selectedRowKeys,
                onChange: keys => setSelectedRowKeys(keys as string[]),
              }}
              onRow={record => ({
                onClick: e => {
                  const target = e.target as HTMLElement
                  if (
                    target.closest('.ant-table-selection-column') ||
                    target.closest('.ant-checkbox-wrapper')
                  )
                    return
                  onVolunteerRowClick?.(record)
                },
                style: { cursor: onVolunteerRowClick ? 'pointer' : undefined },
              })}
            />
          </div>
        ) : (
          <div className="participating-institutions-section__calendar-wrap">
            <ParticipatingInstitutionsCalendarView
              schools={schoolRows}
              selectedRowKeys={[]}
              onSelectionChange={() => {}}
              onSchoolClick={() => {}}
              onDateSelect={setCalendarSelectedDate}
              calendarGranularity={progressCalendarGranularity}
              onCalendarGranularityChange={setProgressCalendarGranularity}
              customEvents={volunteerCalendarEvents}
              renderMonthEventContent={renderParticipatingVolunteerCalendarMonthEventContent}
              rightContent={
                <ParticipatingVolunteersCalendarRight
                  events={volunteerEventsForCalendarDate}
                  schoolFilterOptions={calendarSchoolFilterOptions}
                  effectiveSelectedSchools={effectiveCalendarSelectedSchools}
                  onSelectedSchoolsChange={setCalendarSelectedSchools}
                  getColorForSchool={school =>
                    schoolNameToScheduleColor.get(school) ?? SCHEDULE_COLORS[0]
                  }
                  selectedVolunteerIds={selectedRowKeys}
                  onVolunteerSelectionChange={setSelectedRowKeys}
                />
              }
            />
          </div>
        )}
        <div ref={loadMoreRef} aria-hidden style={{ height: 1 }} />
      </FilterTableLayout>

      <div className="participating-institutions-section__page-bottom-spacer" aria-hidden />

      {activityCertPreviewVolunteer ? (
        <ParticipatingVolunteerActivityCertificatePreviewModal
          open={activityCertPreviewOpen}
          onClose={() => {
            setActivityCertPreviewOpen(false)
            setActivityCertPreviewVolunteer(null)
          }}
          volunteer={mergeParticipatingVolunteerDetailRow(activityCertPreviewVolunteer)}
          program={program}
        />
      ) : null}
    </div>
  )
}
