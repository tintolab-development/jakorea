/**
 * 참여 기관 캘린더 우측 — 선택일 기관 목록 (학교명 + 지역 | 학년 | 회차·시간)
 */

import { useState } from 'react'
import { calendarListItemBackground } from '@/shared/components/calendar/lib/calendar-list-item-background'
import { CmsCheckbox, EmptyState } from '@/shared/ui'
import { StatusTag } from '@/shared/components/status-tag'
import type {
  ParticipatingSchoolRow,
  ParticipatingSchoolSession,
} from '@/features/program/general/model/participating-schools'
import { formatInstitutionRegionForCalendarListDisplay } from '@/shared/lib/format-institution-region-display'
import { formatEducationRoundSessionLabel } from '@/shared/lib/education-schedule-name'
import {
  resolveParticipatingSessionClassNumLead,
  sumKnownParticipatingSessionCurriculumCount,
} from '@/features/program/general/lib/participating-school-session-display'
import { toCalendarScheduleLeadLabel } from '@/features/program/general/lib/school-detail-attendance-display'
import { resolveGeneralScheduleUnitLabel } from '@/features/program/general/lib/schedule-unit-label'
import type { Program } from '@/types/domain'
import type { ScheduleColorPair } from '@/features/program/shared/ui/program-schedule-colors'

export type ParticipatingInstitutionsCalendarDayListEvent = {
  id: string
  originalItem: {
    row: ParticipatingSchoolRow
    sessionsOnDate: ParticipatingSchoolSession[]
    educationGrade: string
  }
}

/** mock `timeRange` (예: `9:20~10:10`, `09:20 ~ 11:20`) → 주간 격자 HH:mm */
export function parseParticipatingSessionTimeRange(
  timeRange: string
): { startTime: string; endTime: string } | null {
  const compact = timeRange.replace(/\s/g, '')
  const match = /^(\d{1,2}):(\d{2})[~\-–—]+(\d{1,2}):(\d{2})$/.exec(compact)
  if (!match) return null
  const toHhmm = (hour: string, minute: string) =>
    `${String(Number.parseInt(hour, 10)).padStart(2, '0')}:${minute}`
  return {
    startTime: toHhmm(match[1], match[2]),
    endTime: toHhmm(match[3], match[4]),
  }
}

function resolveParticipatingSessionPeriodLabel(
  session: ParticipatingSchoolSession,
  program?: Program | null
): string {
  // 일반 프로그램 — 교육 구조별(일정형=세부 일정명, 단일 회차=N차시, 복수 회차=N회차).
  // 일반에는 교시가 없고 classNum의 `N회차`는 순번으로 합성된 값이라 읽지 않는다. 모르면 시간만.
  const generalLabel = resolveGeneralScheduleUnitLabel(
    {
      sessionNo: session.sessionNo,
      curriculumSessionCount: session.curriculumSessionCount,
      scheduleRole: session.scheduleRole,
      educationSlotKey: session.educationSlotKey,
      scheduleName: session.scheduleName ?? session.educationScheduleLabel,
    },
    program
  )
  if (generalLabel !== undefined) return generalLabel ?? ''
  // 숫자만인 classNum(교시 번호 원본)만 `N교시`. 그 외 값 뒤에 `교시`를 붙이지 않는다
  const classNumLead = resolveParticipatingSessionClassNumLead(session.classNum)
  if (classNumLead) return classNumLead
  return formatEducationRoundSessionLabel({ roundNumber: session.round })
}

/** `{선행 라벨} (시간)` — 선행 라벨을 모르면 시간만. `program`이 일반 프로그램이면 교육 구조별 라벨 */
export function formatParticipatingSessionLine(
  session: ParticipatingSchoolSession,
  program?: Program | null
): string {
  const timeRangeDisplay = session.timeRange.replace(/\s*~\s*/, ' ~ ')
  const lead = toCalendarScheduleLeadLabel(resolveParticipatingSessionPeriodLabel(session, program))
  return lead ? `${lead} (${timeRangeDisplay})` : timeRangeDisplay
}

function timeToMinutes(value: string): number | null {
  const [hourRaw, minuteRaw = '00'] = value.split(':')
  const hour = Number.parseInt(hourRaw, 10)
  const minute = Number.parseInt(minuteRaw, 10)
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null
  return hour * 60 + minute
}

function minutesToTime(totalMinutes: number): string {
  const hour = Math.floor(totalMinutes / 60)
  const minute = totalMinutes % 60
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

/** 1사1교 캘린더(`usePreferredScheduleFormat`) 전용 — 날짜별 `N차시 (첫 시작 ~ 마지막 종료)` */
export function formatParticipatingSessionsPeriodForCalendarDisplay(
  sessions: ParticipatingSchoolSession[]
): string {
  const availableSessions = sessions.filter(session => session.status !== 'not_planned')
  if (availableSessions.length === 0) return '-'

  const sorted = [...availableSessions].sort((a, b) => a.round - b.round)
  const ranges = sorted
    .map(session => parseParticipatingSessionTimeRange(session.timeRange))
    .filter((range): range is NonNullable<typeof range> => range != null)
    .map(range => ({
      start: timeToMinutes(range.startTime),
      end: timeToMinutes(range.endTime),
    }))
    .filter(
      (range): range is { start: number; end: number } => range.start != null && range.end != null
    )

  /**
   * round(지망 순위·회차 번호)·일정 건수는 차시 수가 아니다. 그날 신청·연결된 실제 차시 수만 더하고,
   * 하나라도 모르면 차시 표기를 생략한다(시간만).
   */
  const sessionCount = sumKnownParticipatingSessionCurriculumCount(sorted)
  const countLabel = sessionCount != null ? `${sessionCount}차시` : null

  if (ranges.length === 0) return countLabel ?? '-'

  const start = Math.min(...ranges.map(range => range.start))
  const end = Math.max(...ranges.map(range => range.end))
  const timeLabel = `${minutesToTime(start)} ~ ${minutesToTime(end)}`
  return countLabel ? `${countLabel} (${timeLabel})` : timeLabel
}

/** 캘린더 우측 목록 2행 — 교시·차시 + 시간만 (학년 제외) */
export function formatParticipatingSessionPeriodForCalendarDisplay(
  session: ParticipatingSchoolSession,
  program?: Program | null
): string {
  return formatParticipatingSessionLine(session, program)
}

export function getPrimaryParticipatingSessionLine(
  sessions: ParticipatingSchoolSession[],
  program?: Program | null
): string {
  if (sessions.length === 0) return '-'
  const sorted = [...sessions].sort((a, b) => a.round - b.round)
  return formatParticipatingSessionLine(sorted[0]!, program)
}

export type ParticipatingInstitutionsCalendarDayListVariant = 'default' | 'general-institution'

export function ParticipatingInstitutionsCalendarDayList({
  events,
  getColorForEvent,
  onSchoolClick,
  usePreferredScheduleFormat = false,
  variant = 'default',
  program,
}: {
  events: ParticipatingInstitutionsCalendarDayListEvent[]
  getColorForEvent: (event: ParticipatingInstitutionsCalendarDayListEvent) => ScheduleColorPair
  onSchoolClick: (row: ParticipatingSchoolRow) => void
  usePreferredScheduleFormat?: boolean
  /**
   * `general-institution` — 일반 기관형 시안(01-2)·1사1교 시안(05-1 01-2): 카드 우측 체크박스, 기관명 옆 「활동 포기」 뱃지.
   * 체크박스는 화면 내 선택 표시만 한다(선택 대상 일괄 액션은 시안에 정의되지 않음).
   */
  variant?: ParticipatingInstitutionsCalendarDayListVariant
  /** 일반 프로그램 — 일정 라벨을 교육 구조별로 표시. 없으면 기존 표기 */
  program?: Program | null
}) {
  const isGeneralInstitution = variant === 'general-institution'
  const [checkedEventIds, setCheckedEventIds] = useState<ReadonlySet<string>>(() => new Set())
  const toggleChecked = (id: string, checked: boolean) => {
    setCheckedEventIds(prev => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }
  const sortedEvents = [...events].sort((a, b) =>
    (a.originalItem.row.schoolName || '').localeCompare(b.originalItem.row.schoolName || '', 'ko')
  )

  return (
    <div
      className={
        sortedEvents.length === 0
          ? 'calendar-list participating-institutions-calendar-day-list calendar-list--empty'
          : 'calendar-list participating-institutions-calendar-day-list'
      }
    >
      {sortedEvents.length === 0 ? (
        <EmptyState description="해당 날짜에 일정이 없습니다" />
      ) : (
        sortedEvents.map(ev => {
          const { row, sessionsOnDate, educationGrade } = ev.originalItem
          const color = getColorForEvent(ev)
          const region = formatInstitutionRegionForCalendarListDisplay(row.region)
          const grade = educationGrade?.trim() || row.educationGrade?.trim() || '-'
          const sessionLine = usePreferredScheduleFormat
            ? formatParticipatingSessionsPeriodForCalendarDisplay(sessionsOnDate)
            : getPrimaryParticipatingSessionLine(sessionsOnDate, program)

          const itemKey = `${ev.id}-${ev.originalItem.row.id}`
          const checked = isGeneralInstitution && checkedEventIds.has(itemKey)
          return (
            <div
              key={itemKey}
              role="button"
              tabIndex={0}
              className={[
                'calendar-list-item participating-institutions-calendar-day-list__item',
                isGeneralInstitution ? 'participating-institutions-calendar-day-list__item--selectable' : '',
                checked ? 'participating-institutions-calendar-day-list__item--checked' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              data-has-color="true"
              style={{
                backgroundColor: calendarListItemBackground(color.bg),
                border: `1px solid ${color.border}`,
              }}
              onClick={() => onSchoolClick(row)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSchoolClick(row)
                }
              }}
            >
              {isGeneralInstitution ? (
                <span
                  className="participating-institutions-calendar-day-list__check"
                  onClick={e => e.stopPropagation()}
                  onKeyDown={e => e.stopPropagation()}
                  role="presentation"
                >
                  <CmsCheckbox
                    checked={checked}
                    aria-label={`${row.schoolName?.trim() || '기관'} 선택`}
                    onChange={e => toggleChecked(itemKey, e.target.checked)}
                  />
                </span>
              ) : null}
              <div className="participating-institutions-calendar-day-list__title">
                {row.schoolName?.trim() || '-'}
                {isGeneralInstitution && row.activityWithdrawn ? (
                  <>
                    <span
                      className="participating-institutions-calendar-day-list__meta-sep"
                      aria-hidden
                    />
                    <StatusTag label="활동 포기" tone="red" />
                  </>
                ) : null}
              </div>
              <div className="participating-institutions-calendar-day-list__meta">
                <span className="participating-institutions-calendar-day-list__meta-part">
                  {region}
                </span>
                <span className="participating-institutions-calendar-day-list__meta-sep" aria-hidden />
                <span className="participating-institutions-calendar-day-list__meta-part">
                  {grade}
                </span>
                <span className="participating-institutions-calendar-day-list__meta-sep" aria-hidden />
                <span className="participating-institutions-calendar-day-list__meta-part participating-institutions-calendar-day-list__meta-part--session">
                  {sessionLine}
                </span>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
