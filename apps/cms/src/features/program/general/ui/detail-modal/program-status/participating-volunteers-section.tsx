/**
 * 참여 봉사자 페이지 (풀페이지 모달 > 프로그램 진행 현황 > 참여 봉사자)
 */

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { Spin } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { useCmsAlert, FilterTableToolbarButton } from '@/shared/ui'
import { displayServerPiiAsIs } from '@/features/program/shared/lib/program-pii-display'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import {
  ACTIVITY_CERTIFICATE_ISSUE_SELECT_ONE_VOLUNTEER_ALERT_MESSAGE,
  ACTIVITY_CERTIFICATE_ISSUE_SELECT_ONLY_ONE_VOLUNTEER_ALERT_MESSAGE,
  PARTICIPATING_EMPLOYEE_VOLUNTEER_REGISTER_COMPLETE_ALERT_MESSAGE,
  PARTICIPATING_EMPLOYEE_VOLUNTEER_REGISTER_COUNTS_REQUIRED_ALERT_MESSAGE,
  PARTICIPATING_EMPLOYEE_VOLUNTEER_REGISTER_SELECT_INSTITUTION_ALERT_MESSAGE,
  PARTICIPATING_VOLUNTEER_ADD_COMPLETE_ALERT_MESSAGE,
  PARTICIPATING_VOLUNTEER_ADD_SELECT_ALERT_MESSAGE,
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
import { AddParticipatingVolunteerModal } from '@/features/program/general/ui/add-participating-volunteer-modal'
import { RegisterEmployeeVolunteerModal } from '@/features/program/general/ui/register-employee-volunteer-modal'
import { useEmployeeVolunteerRegistration } from '@/features/program/general/hooks/use-employee-volunteer-registration'
import { ParticipatingVolunteerAddRegistrationModal } from '@/features/program/general/ui/participating-volunteer-add-registration-modal'
import {
  fetchParticipatingVolunteerMemberCandidates,
  type ParticipatingVolunteerMemberCandidate,
} from '@/features/program/general/lib/participating-volunteer-member-candidates'
import { getGeneralProgramApiErrorMessage } from '@/features/program/general/api/get-general-program-api-error'
import { EmployeeVolunteerScheduleMappingError } from '@/features/program/general/lib/employee-volunteer-counts-remote'
import { useProgressVolunteerList } from '../../../hooks/use-progress-volunteer-list'
import { useGatedInfiniteScroll } from '@/shared/hooks/use-gated-infinite-scroll'
import { useProgressSchoolList } from '../../../hooks/use-progress-school-list'
import { isGeneralIndividualProgram } from '@/features/program/general/lib/survey-audience'
import { useProgressInstructorList } from '../../../hooks/use-progress-instructor-list'
import { useProgramProgressRemoteEnabledForSurface } from '@/features/program/1c-1s/lib/use-company-school-surface-remote'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import type { Program } from '@/types/domain'
import { useParticipatingVolunteersParams } from '../../../hooks/use-participating-volunteers-params'
import type { ProgressFilters } from '../../../hooks/use-program-progress-params'
import {
  filterParticipatingVolunteers,
  formatParticipatingVolunteerInstitutionCell,
  participatingVolunteerInstitutionColumnTitle,
  type ParticipatingVolunteersFilters,
} from '../../../lib/participating-volunteers-filter'
import { formatParticipatingSchoolSessionLine } from '../../../lib/participating-school-session-display'
import { buildParticipatingVolunteerCalendarEvents } from '../../../lib/build-participating-volunteer-calendar-events'
import { getSchoolNamesForDateFromVolunteerEvents } from '../../../lib/participating-calendar-date-schools'
import {
  PARTICIPATING_INSTITUTIONS_SESSIONS_COLUMN_WIDTH,
  participatingScheduleTableColumnLayout,
} from '../../../lib/participating-institutions-table'
import { useContainerFitTableScrollX } from '@/shared/lib/resolve-table-min-scroll-x'
import { SCHEDULE_COLORS } from '@/features/program/shared/ui/program-schedule-colors'
import { renderProgramDetailPipeSeparated } from '@/features/program/shared/ui/program-detail-td-divider'
import { ParticipatingInstitutionsCalendarView } from './participating-institutions-calendar-view'
import { renderParticipatingVolunteerCalendarMonthEventContent } from './participating-volunteer-calendar-month-event'
import { ParticipatingVolunteersCalendarRight } from './participating-volunteers-calendar-right'
import {
  ButtonCalendarIcon,
  ButtonDownloadIcon,
  ButtonListIcon,
} from '@/shared/ui/icons/ButtonIcons'
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
    isSuccess: isVolunteerListSuccess,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    registerVolunteerParticipant,
  } = useProgressVolunteerList(programId, program)
  const progressRemoteEnabled = useProgramProgressRemoteEnabledForSurface(programId)
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
    enabled: !(program != null && isGeneralIndividualProgram(program)),
  })
  const excludedVolunteerMemberIds = useMemo(
    () =>
      volunteerList
        .map(row => row.memberId)
        .filter((id): id is number => id != null && Number.isFinite(id) && id > 0),
    [volunteerList]
  )

  const {
    sessionRows: employeeVolunteerSessionRows,
    resolveSessionRowsForInstitution,
    approvedInstitutionOptions,
    registrations: employeeVolunteerRegistrations,
    isIndividualProgram: isEmployeeVolunteerIndividualProgram,
    individualProgramRegistrationScopeId,
    saveRegistration: saveEmployeeVolunteerRegistration,
    loadRegistrationForInstitution,
    loadIndividualProgramRegistration,
  } = useEmployeeVolunteerRegistration(program, schoolRows, volunteerList, {
    programId,
    remoteEnabled: progressRemoteEnabled,
  })
  const [employeeVolunteerModalOpen, setEmployeeVolunteerModalOpen] = useState(false)

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

  const [addVolunteerModalOpen, setAddVolunteerModalOpen] = useState(false)
  const [volunteerConsentOpen, setVolunteerConsentOpen] = useState(false)
  const [pendingVolunteerMemberId, setPendingVolunteerMemberId] = useState<string | null>(null)
  const [volunteerMemberOptions, setVolunteerMemberOptions] = useState<
    ParticipatingVolunteerMemberCandidate[]
  >([])

  const openVolunteerRegister = useCallback(() => {
    if (!programId) {
      notifyProgramApiUnavailable(
        'general-progress-volunteer-register',
        '참여 봉사자 · 봉사자 등록'
      )
      return
    }
    if (!progressRemoteEnabled) {
      notifyProgramApiUnavailable(
        'general-progress-volunteer-register',
        '참여 봉사자 · 봉사자 등록'
      )
      return
    }
    void fetchParticipatingVolunteerMemberCandidates({
      programId,
      volunteerKind: 'GENERAL',
      excludedMemberIds: excludedVolunteerMemberIds,
    })
      .then(options => {
        setVolunteerMemberOptions(options)
        setAddVolunteerModalOpen(true)
      })
      .catch(error => {
        showAlert({
          title: '봉사자 등록 실패',
          content: getGeneralProgramApiErrorMessage(
            error,
            '등록 가능한 회원 목록을 불러오지 못했습니다. 다시 시도해 주세요.'
          ),
        })
      })
  }, [excludedVolunteerMemberIds, programId, progressRemoteEnabled, showAlert])

  const handleRegisterEmployeeVolunteerClick = useCallback(() => {
    if (!programId) {
      notifyProgramApiUnavailable(
        'general-progress-volunteer-employee-register',
        '참여 봉사자 · 임직원 자원봉사자 등록'
      )
      return
    }
    if (!progressRemoteEnabled) {
      notifyProgramApiUnavailable(
        'general-progress-volunteer-employee-register',
        '참여 봉사자 · 임직원 자원봉사자 등록'
      )
      return
    }
    setEmployeeVolunteerModalOpen(true)
  }, [programId, progressRemoteEnabled])

  const handleRegisterVolunteerClick = useCallback(() => {
    openVolunteerRegister()
  }, [openVolunteerRegister])

  const handleEmployeeVolunteerProgramLevelOpen = useCallback(() => {
    void loadIndividualProgramRegistration().catch(error => {
      showAlert({
        title: '임직원 자원봉사자 조회 실패',
        content: getGeneralProgramApiErrorMessage(
          error,
          '저장된 임직원 자원봉사자 수를 불러오지 못했습니다. 다시 시도해 주세요.'
        ),
      })
    })
  }, [loadIndividualProgramRegistration, showAlert])

  const handleEmployeeVolunteerInstitutionChange = useCallback(
    (institutionId: string) => {
      void loadRegistrationForInstitution(institutionId).catch(error => {
        showAlert({
          title: '임직원 자원봉사자 조회 실패',
          content: getGeneralProgramApiErrorMessage(
            error,
            '저장된 임직원 자원봉사자 수를 불러오지 못했습니다. 다시 시도해 주세요.'
          ),
        })
      })
    },
    [loadRegistrationForInstitution, showAlert]
  )

  const handleProceedToVolunteerConsent = useCallback((memberId: string) => {
    setPendingVolunteerMemberId(memberId)
    setVolunteerConsentOpen(true)
  }, [])

  const handleVolunteerConsentClose = useCallback(() => {
    setVolunteerConsentOpen(false)
    setPendingVolunteerMemberId(null)
  }, [])

  const handleVolunteerRegisterSubmit = useCallback(
    async (
      payload: import('@/features/program/general/api/program-progress-api-client').VolunteerParticipantRegisterRequest
    ) => {
      try {
        const success = await registerVolunteerParticipant(payload)
        if (success) {
          setVolunteerConsentOpen(false)
          setPendingVolunteerMemberId(null)
          showAlert({
            title: '안내',
            content: PARTICIPATING_VOLUNTEER_ADD_COMPLETE_ALERT_MESSAGE,
          })
        }
      } catch (error) {
        showAlert({
          title: '봉사자 등록 실패',
          content: getGeneralProgramApiErrorMessage(
            error,
            '봉사자 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.'
          ),
        })
        throw error
      }
    },
    [registerVolunteerParticipant, showAlert]
  )

  const pendingVolunteerHasId1365 =
    volunteerMemberOptions.find(option => option.memberId === pendingVolunteerMemberId)
      ?.hasRegisteredId1365 === true

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
    if (!isVolunteerListSuccess) return
    const row = volunteerList.find(r => r.id === volunteerIdFromUrl)
    if (!row) onClearVolunteerId()
  }, [isVolunteerListSuccess, volunteerIdFromUrl, volunteerList, onClearVolunteerId])

  const prevVolunteerDetailId = useRef<string | null>(null)
  useEffect(() => {
    if (selectedVolunteerFromUrl) {
      onVolunteerDetailOpen?.(selectedVolunteerFromUrl.volunteerName)
      prevVolunteerDetailId.current = volunteerIdFromUrl ?? null
    } else {
      if (prevVolunteerDetailId.current != null) onVolunteerDetailClose?.()
      prevVolunteerDetailId.current = null
    }
  }, [selectedVolunteerFromUrl, volunteerIdFromUrl, onVolunteerDetailOpen, onVolunteerDetailClose])

  const handleCalendarView = () => {
    setCalendarSelectedSchools(null)
    setViewMode('calendar')
  }
  const handleListView = () => setViewMode('list')

  const institutionColumnTitle = participatingVolunteerInstitutionColumnTitle(program)

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
        title: institutionColumnTitle,
        key: 'assignedInstitutionNames',
        width: 220,
        minWidth: 220,
        align: 'center',
        render: (_: unknown, record) =>
          formatParticipatingVolunteerInstitutionCell(record, program),
      },
      {
        title: '봉사 진행 일정',
        key: 'sessions',
        width: PARTICIPATING_INSTITUTIONS_SESSIONS_COLUMN_WIDTH,
        minWidth: PARTICIPATING_INSTITUTIONS_SESSIONS_COLUMN_WIDTH,
        ...participatingScheduleTableColumnLayout(),
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
  }, [institutionColumnTitle, program])

  const { tableWrapRef, tableScrollX } = useContainerFitTableScrollX(
    columns as ColumnsType<unknown>,
    {
      includeSelection: true,
      enabled: viewMode === 'list',
    }
  )

  if (applicationsLoading && volunteerList.length === 0) {
    return (
      <div className="detail-fullpage-modal__loading" role="status">
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
          schoolRows={schoolRows}
          volunteerList={volunteerList}
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
          <div className="program-application-list-toolbar">
            <FilterTableToolbarButton
              variant="secondary"
              icon={<ButtonDownloadIcon />}
              onClick={handleActivityCertificateIssueClick} >
              활동확인서 발급
            </FilterTableToolbarButton>
            {viewMode === 'list' ? (
              <FilterTableToolbarButton
                variant="secondary"
                icon={<ButtonCalendarIcon />}
                onClick={handleCalendarView} >
                캘린더 뷰로 보기
              </FilterTableToolbarButton>
            ) : (
              <FilterTableToolbarButton
                variant="secondary"
                icon={<ButtonListIcon />}
                onClick={handleListView} >
                리스트 뷰로 보기
              </FilterTableToolbarButton>
            )}
            <FilterTableToolbarButton
              variant="primary"
              onClick={handleRegisterEmployeeVolunteerClick} >
              임직원 자원봉사자 등록
            </FilterTableToolbarButton>
            <FilterTableToolbarButton variant="primary" onClick={handleRegisterVolunteerClick}>
              봉사자 등록
            </FilterTableToolbarButton>
          </div>
        }
        excelExport={{
          columns,
          data: filteredVolunteers,
          selectedRowKeys,
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
            <CmsDataTable<ParticipatingVolunteerRow>
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

      <RegisterEmployeeVolunteerModal
        open={employeeVolunteerModalOpen}
        onCancel={() => setEmployeeVolunteerModalOpen(false)}
        sessionRows={employeeVolunteerSessionRows}
        resolveSessionRowsForInstitution={resolveSessionRowsForInstitution}
        institutionOptions={approvedInstitutionOptions}
        savedRegistrations={employeeVolunteerRegistrations}
        hideInstitutionSelect={isEmployeeVolunteerIndividualProgram}
        programLevelRegistrationScopeId={individualProgramRegistrationScopeId}
        onNoInstitutionSelected={() =>
          showAlert({
            title: '안내',
            content: PARTICIPATING_EMPLOYEE_VOLUNTEER_REGISTER_SELECT_INSTITUTION_ALERT_MESSAGE,
          })
        }
        onIncompleteCounts={() =>
          showAlert({
            title: '안내',
            content: PARTICIPATING_EMPLOYEE_VOLUNTEER_REGISTER_COUNTS_REQUIRED_ALERT_MESSAGE,
          })
        }
        onProgramLevelOpen={handleEmployeeVolunteerProgramLevelOpen}
        onInstitutionChange={handleEmployeeVolunteerInstitutionChange}
        onRegister={async payload => {
          try {
            await saveEmployeeVolunteerRegistration(
              payload.institutionId,
              payload.countsBySessionId
            )
            showAlert({
              title: '안내',
              content: PARTICIPATING_EMPLOYEE_VOLUNTEER_REGISTER_COMPLETE_ALERT_MESSAGE,
            })
          } catch (error) {
            const content =
              error instanceof EmployeeVolunteerScheduleMappingError
                ? error.message
                : getGeneralProgramApiErrorMessage(
                    error,
                    '임직원 자원봉사자 수 저장에 실패했습니다. 다시 시도해 주세요.'
                  )
            showAlert({
              title: '임직원 자원봉사자 등록 실패',
              content,
            })
            throw error
          }
        }}
      />
      <AddParticipatingVolunteerModal
        open={addVolunteerModalOpen}
        onCancel={() => setAddVolunteerModalOpen(false)}
        memberOptions={volunteerMemberOptions}
        onNoMemberSelected={() =>
          showAlert({ title: '안내', content: PARTICIPATING_VOLUNTEER_ADD_SELECT_ALERT_MESSAGE })
        }
        onProceedToRegistration={handleProceedToVolunteerConsent}
      />
      <ParticipatingVolunteerAddRegistrationModal
        open={volunteerConsentOpen}
        memberId={pendingVolunteerMemberId}
        programId={program?.id}
        hideBasicInfoSection={pendingVolunteerHasId1365}
        onClose={handleVolunteerConsentClose}
        onConfirm={handleVolunteerRegisterSubmit}
      />

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
