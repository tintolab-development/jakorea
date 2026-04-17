import { Empty, Checkbox } from 'antd'
import type { Dayjs } from 'dayjs'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import { MOCK_APPLICANT_INSTRUCTORS } from '@/data/mock/applicant-instructors'
import type { ApplicantSchoolRow } from '@/data/mock/applicant-institutions'
import { MOCK_APPLICANT_INSTITUTIONS } from '@/data/mock/applicant-institutions'
import type { ScheduleColorPair } from '../../../ui/program-schedule-colors'
import './applicant-calendar-view.css'

/** 강사 캘린더 기관 집계 이벤트(대표 행 클릭 시) — 메타 제거 후 상세로 전달 */
function rowForCalendarDetailClick(originalItem: any) {
  if (
    originalItem &&
    typeof originalItem === 'object' &&
    'calendarInstitutionSummary' in originalItem
  ) {
    const { calendarInstitutionSummary: _omit, calendarInstitutionInstructors: _omit2, ...rest } =
      originalItem
    return rest
  }
  return originalItem
}

interface ApplicantScheduleListProps {
  selectedDate?: Dayjs
  events: any[]
  selectedRowKeys: React.Key[]
  onSelectionChange: (keys: React.Key[]) => void
  onEventClick: (item: any) => void
  getColorForEvent?: (event: any) => ScheduleColorPair
}

const LONG_DISTANCE_THRESHOLD_KM = 60

const SCHOOL_BY_NAME = new Map<string, ApplicantSchoolRow>(
  MOCK_APPLICANT_INSTITUTIONS.map(s => [s.schoolName, s])
)

function stableHash(input: string): number {
  let h = 0
  for (let i = 0; i < input.length; i++) {
    h = (Math.imul(31, h) + input.charCodeAt(i)) >>> 0
  }
  return h
}

function parsePrimaryInstructorName(raw?: string): string {
  if (!raw) return '-'
  const first = raw
    .split(/[|,/]/)
    .map(s => s.trim())
    .filter(Boolean)[0]
  return first || '-'
}

function normalizeTimeRange(range?: string): string {
  if (!range) return '-'
  return range.replace(/\s*~\s*/g, ' ~ ')
}

function getSessionTimeSummary(schoolName: string, fallbackPeriod?: string): string {
  const school = SCHOOL_BY_NAME.get(schoolName)
  const validSessions =
    school?.sessions
      ?.filter(s => s.status !== 'not_planned' && s.classNum && s.timeRange)
      .sort((a, b) => a.round - b.round) ?? []
  if (validSessions.length > 0) {
    const first = validSessions[0]!
    const last = validSessions[validSessions.length - 1]!
    if (validSessions.length === 1) {
      return `${first.classNum} (${normalizeTimeRange(first.timeRange)})`
    }
    return `${first.classNum} (${normalizeTimeRange(first.timeRange)}) ~ ${last.classNum} (${normalizeTimeRange(last.timeRange)})`
  }
  if (fallbackPeriod) {
    const match = fallbackPeriod.match(/(\d{1,2}:\d{2})\s*[-~]\s*(\d{1,2}:\d{2})/)
    if (match) return `${match[1]} ~ ${match[2]}`
  }
  return '-'
}

function getDistanceKm(schoolName: string, instructorName: string, instructorAddress?: string): number {
  const schoolRegion = SCHOOL_BY_NAME.get(schoolName)?.region ?? schoolName
  const seed = `${schoolRegion}|${instructorAddress ?? ''}|${instructorName}`
  return 20 + (stableHash(seed) % 121)
}

function getDispatchStats(instructorName: string): { dispatchCount: number; longDistanceCount: number } {
  const approvedRows = MOCK_APPLICANT_INSTRUCTORS.filter(
    row => row.instructorName === instructorName && row.approvalStatus === 'approved'
  )
  const longDistanceCount = approvedRows.filter(
    row => getDistanceKm(row.schoolName, row.instructorName, row.address) > LONG_DISTANCE_THRESHOLD_KM
  ).length
  return {
    dispatchCount: approvedRows.length,
    longDistanceCount,
  }
}

export function ApplicantScheduleList({
  events,
  selectedRowKeys,
  onSelectionChange,
  onEventClick,
  getColorForEvent,
}: ApplicantScheduleListProps) {
  const handleToggleSelection = (id: React.Key) => {
    if (selectedRowKeys.includes(id)) {
      onSelectionChange(selectedRowKeys.filter(k => k !== id))
    } else {
      onSelectionChange([...selectedRowKeys, id])
    }
  }

  return (
    <div className="applicant-schedule-list">
      <div className="applicant-schedule-list-content">
        {events.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="해당 날짜에 일정이 없습니다" />
        ) : (
          events.map(event => {
            const color = getColorForEvent?.(event)
            const originalItem = event.originalItem
            const institutionRows = originalItem?.calendarInstitutionInstructors as
              | ApplicantInstructorRow[]
              | undefined

            if (institutionRows && institutionRows.length > 0) {
              const schoolName = String(originalItem?.schoolName ?? '').trim() || '기관'
              return (
                <div key={event.id} className="applicant-schedule-list__institution-group">
                  {institutionRows.map(inst => {
                    const isInstSelected = selectedRowKeys.includes(inst.id)
                    const instructorName = inst.instructorName || '-'
                    const sessionSummary = getSessionTimeSummary(schoolName)
                    const distanceKm = getDistanceKm(schoolName, instructorName, inst.address)
                    const { dispatchCount, longDistanceCount } = getDispatchStats(instructorName)
                    const isLongDistance = distanceKm > LONG_DISTANCE_THRESHOLD_KM
                    return (
                      <div
                        key={`${event.id}-${inst.id}`}
                        className={`applicant-schedule-item ${isInstSelected ? 'applicant-schedule-item--selected' : ''}`}
                        data-has-color={color ? 'true' : undefined}
                        style={
                          color
                            ? {
                                backgroundColor: color.bg,
                                border: `1px solid ${color.border}`,
                              }
                            : undefined
                        }
                      >
                        <div
                          className="applicant-schedule-item-info"
                          onClick={() => onEventClick(inst)}
                        >
                          <div className="applicant-schedule-item-title-row">
                            <span className="applicant-schedule-item-title">{schoolName}</span>
                            <span className="applicant-schedule-item-title-divider" aria-hidden>
                              |
                            </span>
                            <span className="applicant-schedule-item-title">
                              {instructorName}
                            </span>
                          </div>
                          <div className="applicant-schedule-item-session">{sessionSummary}</div>
                          <div className="applicant-schedule-item-tags">
                            <span
                              className={`applicant-schedule-item-tag ${isLongDistance ? '' : 'applicant-schedule-item-tag--mint'}`.trim()}
                            >
                              거리 : {distanceKm}km
                            </span>
                            <span className="applicant-schedule-item-tag">출강 : {dispatchCount}회</span>
                            <span className="applicant-schedule-item-tag">
                              장거리 : {longDistanceCount}회
                            </span>
                          </div>
                        </div>
                        <div
                          className="applicant-schedule-item-checkbox"
                          onClick={e => {
                            e.stopPropagation()
                            handleToggleSelection(inst.id)
                          }}
                        >
                          <Checkbox checked={isInstSelected} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            }

            const displayTitle = event.title.replace(/^\[.*?\]\s*/, '')
            const isSelected = selectedRowKeys.includes(event.id)
            const schoolName = String(originalItem?.schoolName ?? displayTitle).trim() || '기관'
            const instructorName =
              typeof originalItem?.instructorName === 'string'
                ? originalItem.instructorName
                : parsePrimaryInstructorName(originalItem?.assignedInstructorNames)
            const sessionSummary = getSessionTimeSummary(
              schoolName,
              originalItem?.desiredEducationPeriod as string | undefined
            )
            const distanceKm = getDistanceKm(
              schoolName,
              instructorName,
              originalItem?.address as string | undefined
            )
            const { dispatchCount, longDistanceCount } = getDispatchStats(instructorName)
            const isLongDistance = distanceKm > LONG_DISTANCE_THRESHOLD_KM

            return (
              <div
                key={event.id}
                className={`applicant-schedule-item ${isSelected ? 'applicant-schedule-item--selected' : ''}`}
                data-has-color={color ? 'true' : undefined}
                style={
                  color
                    ? {
                        backgroundColor: color.bg,
                        border: `1px solid ${color.border}`,
                      }
                    : undefined
                }
              >
                <div
                  className="applicant-schedule-item-info"
                  onClick={() => onEventClick(rowForCalendarDetailClick(originalItem))}
                >
                  <div className="applicant-schedule-item-title-row">
                    <span className="applicant-schedule-item-title">{schoolName}</span>
                    <span className="applicant-schedule-item-title-divider" aria-hidden>
                      |
                    </span>
                    <span className="applicant-schedule-item-title">{instructorName}</span>
                  </div>
                  <div className="applicant-schedule-item-session">{sessionSummary}</div>
                  <div className="applicant-schedule-item-tags">
                    <span
                      className={`applicant-schedule-item-tag ${isLongDistance ? '' : 'applicant-schedule-item-tag--mint'}`.trim()}
                    >
                      거리 : {distanceKm}km
                    </span>
                    <span className="applicant-schedule-item-tag">출강 : {dispatchCount}회</span>
                    <span className="applicant-schedule-item-tag">장거리 : {longDistanceCount}회</span>
                  </div>
                </div>
                <div
                  className="applicant-schedule-item-checkbox"
                  onClick={e => {
                    e.stopPropagation()
                    handleToggleSelection(event.id)
                  }}
                >
                  <Checkbox checked={isSelected} />
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
