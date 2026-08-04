/**
 * 참여 봉사자 페이지 (풀페이지 모달 > 프로그램 진행 현황 > 참여 봉사자)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { Table, Spin } from 'antd'
import { CalendarOutlined, DownloadOutlined, UnorderedListOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { CmsButton, useCmsAlert } from '@/shared/ui'
import { MASKING_POLICY } from '@/shared/constants/download-policy'
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
import type { ParticipatingVolunteerRow } from '@/data/mock/participating-volunteers'
import {
  fetchParticipatingVolunteerMemberCandidates,
  type ParticipatingVolunteerMemberCandidate,
} from '@/features/program/general/lib/participating-volunteer-member-candidates'
import { participatingVolunteersFilterFields } from '@/features/program/general/lib/participating-volunteers-filter-fields'
import { AddParticipatingVolunteerModal } from '../../add-participating-volunteer-modal'
import { ParticipatingVolunteerAddRegistrationModal } from '../../participating-volunteer-add-registration-modal'
import {
  ParticipatingVolunteerFullpageView,
  type VolunteerDetailTabKey,
} from './participating-volunteer-fullpage-view'
import { mergeParticipatingVolunteerDetailRow } from '@/features/program/general/lib/participating-volunteer-detail'
import {
  RegisterEmployeeVolunteerModal,
  type RegisterEmployeeVolunteerPayload,
} from '../../register-employee-volunteer-modal'
import { useEmployeeVolunteerRegistration } from '../../../hooks/use-employee-volunteer-registration'
import { useProgressVolunteerList } from '../../../hooks/use-progress-volunteer-list'
import { useProgressSchoolList } from '../../../hooks/use-progress-school-list'
import { useProgressInstructorList } from '../../../hooks/use-progress-instructor-list'
import type { ParticipatingSchoolSession } from '@/data/mock/participating-schools'
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
import { SCHEDULE_COLORS } from '@/features/program/shared/ui/program-schedule-colors'
import { renderProgramDetailPipeSeparated } from '@/features/program/shared/ui/program-detail-td-divider'
import { ParticipatingInstitutionsCalendarView } from './participating-institutions-calendar-view'
import { renderParticipatingVolunteerCalendarMonthEventContent } from './participating-volunteer-calendar-month-event'
import { ParticipatingVolunteersCalendarRight } from './participating-volunteers-calendar-right'
import './participating-institutions-section.css'
import './program-progress-tab.css'

/** 체크박스(48) + 열 width 합 — 뷰포트보다 좁을 때만 가로 스크롤 */
const TABLE_SCROLL_X =
  48 + 64 + 120 + 120 + 220 + PARTICIPATING_INSTITUTIONS_SESSIONS_COLUMN_WIDTH + 140 + 180

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
  const { volunteerList, addVolunteerFromMember, applicationsLoading } =
    useProgressVolunteerList(programId)

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
  })
  const { schoolList: schoolRows } = useProgressSchoolList({
    appliedFilters: schoolFilters,
    instructorList,
    programId,
  })

  const { sessionRows, approvedInstitutionOptions, registrations, saveRegistration } =
    useEmployeeVolunteerRegistration(program, schoolRows, volunteerList)

  const [pendingFilters, setPendingFilters] = useState<ParticipatingVolunteersFilters>(() => ({
    ...filters,
  }))
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<Dayjs>(() => dayjs())
  /** `null` — 해당 날짜 기관 전체 선택(날짜 변경 시 기본), `[]` — 사용자가 모두 해제 */
  const [calendarSelectedSchools, setCalendarSelectedSchools] = useState<string[] | null>(null)
  const [addVolunteerModalOpen, setAddVolunteerModalOpen] = useState(false)
  const [volunteerRegistrationModalOpen, setVolunteerRegistrationModalOpen] = useState(false)
  const [pendingVolunteerMemberId, setPendingVolunteerMemberId] = useState<string | null>(null)
  const [addEmployeeVolunteerModalOpen, setAddEmployeeVolunteerModalOpen] = useState(false)
  const [volunteerMemberOptions, setVolunteerMemberOptions] = useState<
    ParticipatingVolunteerMemberCandidate[]
  >([])

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

  const registeredVolunteerNames = useMemo(
    () => volunteerList.map(row => row.volunteerName),
    [volunteerList]
  )

  useEffect(() => {
    let cancelled = false
    void fetchParticipatingVolunteerMemberCandidates(registeredVolunteerNames).then(options => {
      if (!cancelled) setVolunteerMemberOptions(options)
    })
    return () => {
      cancelled = true
    }
  }, [registeredVolunteerNames])

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

  const showVolunteerAddSelectAlert = useCallback(() => {
    showAlert({ title: '안내', content: PARTICIPATING_VOLUNTEER_ADD_SELECT_ALERT_MESSAGE })
  }, [showAlert])

  const showEmployeeVolunteerInstitutionSelectAlert = useCallback(() => {
    showAlert({
      title: '안내',
      content: PARTICIPATING_EMPLOYEE_VOLUNTEER_REGISTER_SELECT_INSTITUTION_ALERT_MESSAGE,
    })
  }, [showAlert])

  const showEmployeeVolunteerCountsRequiredAlert = useCallback(() => {
    showAlert({
      title: '안내',
      content: PARTICIPATING_EMPLOYEE_VOLUNTEER_REGISTER_COUNTS_REQUIRED_ALERT_MESSAGE,
    })
  }, [showAlert])

  const handleRegisterEmployeeVolunteer = useCallback(
    (payload: RegisterEmployeeVolunteerPayload) => {
      saveRegistration(payload.institutionId, payload.countsBySessionId)
      showAlert({
        title: '안내',
        content: PARTICIPATING_EMPLOYEE_VOLUNTEER_REGISTER_COMPLETE_ALERT_MESSAGE,
      })
    },
    [saveRegistration, showAlert]
  )

  const pendingVolunteerHideBasicInfo = useMemo(() => {
    if (!pendingVolunteerMemberId) return false
    const candidate = volunteerMemberOptions.find(
      member => member.memberId === pendingVolunteerMemberId
    )
    return candidate?.hasRegisteredId1365 ?? false
  }, [pendingVolunteerMemberId, volunteerMemberOptions])

  const handleProceedToVolunteerRegistration = useCallback((memberId: string) => {
    setPendingVolunteerMemberId(memberId)
    setVolunteerRegistrationModalOpen(true)
  }, [])

  const handleVolunteerRegistrationClose = useCallback(() => {
    setVolunteerRegistrationModalOpen(false)
    setPendingVolunteerMemberId(null)
  }, [])

  const handleVolunteerRegistrationConfirm = useCallback(async () => {
    const memberId = pendingVolunteerMemberId
    setVolunteerRegistrationModalOpen(false)
    setPendingVolunteerMemberId(null)
    if (!memberId) return

    const row = await addVolunteerFromMember(memberId)
    if (row) {
      showAlert({ title: '안내', content: PARTICIPATING_VOLUNTEER_ADD_COMPLETE_ALERT_MESSAGE })
    }
  }, [addVolunteerFromMember, pendingVolunteerMemberId, showAlert])

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
    onVolunteerRowClick?.(selectedRow)
  }, [filteredVolunteers, onVolunteerRowClick, selectedRowKeys, showAlert, volunteerList])

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
        width: 64,
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
        align: 'center',
        render: (v: string | undefined) => (v ? MASKING_POLICY.phone(v.replace(/\s/g, '')) : '-'),
      },
      {
        title: '이메일',
        dataIndex: 'email',
        key: 'email',
        width: 180,
        align: 'center',
        render: (v: string | undefined) => (v ? MASKING_POLICY.email(v) : '-'),
      },
    ]
  }, [])

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
        <AddParticipatingVolunteerModal
          open={addVolunteerModalOpen}
          onCancel={() => setAddVolunteerModalOpen(false)}
          memberOptions={volunteerMemberOptions}
          onNoMemberSelected={showVolunteerAddSelectAlert}
          onProceedToRegistration={handleProceedToVolunteerRegistration}
        />
        <ParticipatingVolunteerAddRegistrationModal
          open={volunteerRegistrationModalOpen}
          hideBasicInfoSection={pendingVolunteerHideBasicInfo}
          onClose={handleVolunteerRegistrationClose}
          onConfirm={handleVolunteerRegistrationConfirm}
        />
        <RegisterEmployeeVolunteerModal
          open={addEmployeeVolunteerModalOpen}
          onCancel={() => setAddEmployeeVolunteerModalOpen(false)}
          sessionRows={sessionRows}
          institutionOptions={approvedInstitutionOptions}
          savedRegistrations={registrations}
          onNoInstitutionSelected={showEmployeeVolunteerInstitutionSelectAlert}
          onIncompleteCounts={showEmployeeVolunteerCountsRequiredAlert}
          onRegister={handleRegisterEmployeeVolunteer}
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
              onClick={() => setAddEmployeeVolunteerModalOpen(true)}
            >
              임직원 자원봉사자 등록
            </CmsButton>
            <CmsButton
              variant="primary"
              size="large"
              width={140}
              onClick={() => setAddVolunteerModalOpen(true)}
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
          <div className="participating-institutions-section__table-wrap">
            <Table<ParticipatingVolunteerRow>
              className="participating-institutions-section__table cms-data-table participating-institutions-section__table--clickable"
              rowKey="id"
              size="middle"
              pagination={false}
              tableLayout="fixed"
              scroll={{ x: TABLE_SCROLL_X }}
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
      </FilterTableLayout>

      {viewMode === 'calendar' ? (
        <div className="participating-institutions-section__page-bottom-spacer" aria-hidden />
      ) : null}

      <AddParticipatingVolunteerModal
        open={addVolunteerModalOpen}
        onCancel={() => setAddVolunteerModalOpen(false)}
        memberOptions={volunteerMemberOptions}
        onNoMemberSelected={showVolunteerAddSelectAlert}
        onProceedToRegistration={handleProceedToVolunteerRegistration}
      />
      <ParticipatingVolunteerAddRegistrationModal
        open={volunteerRegistrationModalOpen}
        hideBasicInfoSection={pendingVolunteerHideBasicInfo}
        onClose={handleVolunteerRegistrationClose}
        onConfirm={handleVolunteerRegistrationConfirm}
      />
      <RegisterEmployeeVolunteerModal
        open={addEmployeeVolunteerModalOpen}
        onCancel={() => setAddEmployeeVolunteerModalOpen(false)}
        sessionRows={sessionRows}
        institutionOptions={approvedInstitutionOptions}
        savedRegistrations={registrations}
        onNoInstitutionSelected={showEmployeeVolunteerInstitutionSelectAlert}
        onIncompleteCounts={showEmployeeVolunteerCountsRequiredAlert}
        onRegister={handleRegisterEmployeeVolunteer}
      />
    </div>
  )
}
