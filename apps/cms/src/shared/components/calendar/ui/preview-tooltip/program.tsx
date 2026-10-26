import type { ReactNode } from 'react'
import type { ScheduleColorPair } from '@/features/program/shared/ui/program-schedule-colors'
import type { CalendarItem } from '../../model/calendar-item'
import { getInstructorTooltipSessionLabel } from '@/features/program/shared/ui/program-detail/applicant-list/applicant-instructor-calendar-session'

import '../../styles/calendar-preview-popover-content.css'

function calendarItemsToPopoverRows(
  items: CalendarItem[]
): Array<{ id: string | number; title?: string; originalItem?: unknown }> {
  return items.map(item => {
    const o = item.original
    const nested =
      o != null && typeof o === 'object' && 'originalItem' in o
        ? (o as { originalItem?: unknown }).originalItem
        : o
    return {
      id: item.id,
      title: item.title,
      originalItem: nested,
    }
  })
}

function getProgramPreviewRowParts(
  item: Record<string, unknown> | null | undefined
): { title: string; location: string; countLabel: string; sessionLabel?: string } | null {
  if (!item) return null
  const summary = item.calendarInstitutionSummary as
    | { applicantCount: number; regionDisplay: string }
    | undefined
  if (summary && typeof item.schoolName === 'string') {
    const sessionLabel = getInstructorTooltipSessionLabel(item)
    return {
      title: item.schoolName,
      location: summary.regionDisplay || '-',
      countLabel: `신청 : ${summary.applicantCount}명`,
      ...(sessionLabel ? { sessionLabel } : {}),
    }
  }
  if (typeof item.schoolName === 'string' && 'region' in item && item.region != null) {
    const regionStr = String(item.region).trim()
    const location = regionStr.split(/\s+/)[0] ?? regionStr
    const n = typeof item.studentCount === 'number' ? item.studentCount : 0
    return {
      title: item.schoolName,
      location: location || '-',
      countLabel: `신청 : ${n}명`,
    }
  }
  if (typeof item.instructorName === 'string') {
    const location =
      typeof item.schoolName === 'string' && item.schoolName
        ? item.schoolName
        : typeof item.address === 'string'
          ? item.address.split(/\s+/).slice(0, 2).join(' ') || '-'
          : '-'
    return {
      title: item.instructorName,
      location,
      countLabel: '신청 : 1명',
    }
  }
  return null
}

export type ProgramPreviewTooltipEventRow = {
  id: string | number
  title?: string
  originalItem?: unknown
}

type ProgramPreviewTooltipBodyProps = {
  events: ProgramPreviewTooltipEventRow[]
  colorMap: Map<string | number, ScheduleColorPair>
}

/** `CalendarMain` 툴팁 본문 — 신청자 일정 요약 행 */
export function ProgramPreviewTooltipBody({
  events,
}: ProgramPreviewTooltipBodyProps): ReactNode {
  return (
    <div className="calendar-preview-popover">
      {events.map(ev => {
        const parts = getProgramPreviewRowParts(ev.originalItem as Record<string, unknown> | undefined)
        const fallbackTitle = String(ev.title ?? '').replace(/^\[.*?\]\s*/, '')

        if (!parts) {
          return (
            <div key={String(ev.id)} className="calendar-preview-popover__entry">
              <span className="calendar-preview-popover__title">{fallbackTitle || '-'}</span>
            </div>
          )
        }

        return (
          <div key={String(ev.id)} className="calendar-preview-popover__entry">
            <span className="calendar-preview-popover__title">{parts.title}</span>
            <div className="calendar-preview-popover__meta">
              <span className="calendar-preview-popover__meta-part">
                {parts.location}
              </span>
              <span className="calendar-preview-popover__meta-sep" aria-hidden />
              <span className="calendar-preview-popover__meta-part">
                {parts.countLabel}
              </span>
              {parts.sessionLabel ? (
                <>
                  <span
                    className="calendar-preview-popover__meta-sep"
                    aria-hidden
                  />
                  <span className="calendar-preview-popover__meta-part calendar-preview-popover__meta-part--session">
                    {parts.sessionLabel}
                  </span>
                </>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/**
 * `previewTooltipContent`에 넘기면 `CalendarItem` 행을 신청자 패널 형식으로 표시합니다.
 * (미전달 시에는 툴팁이 열리지 않습니다.)
 */
export function renderProgramApplicantPreviewTooltipContent({
  events,
  colorMap,
}: {
  events: CalendarItem[]
  colorMap: Map<string | number, ScheduleColorPair>
}): ReactNode {
  return <ProgramPreviewTooltipBody events={calendarItemsToPopoverRows(events)} colorMap={colorMap} />
}

/**
 * `CalendarMain`의 `previewTooltipContent`에 넘기면 이벤트 모드 툴팁 본문을 렌더합니다.
 * (미전달 시에는 툴팁이 열리지 않습니다.)
 */
export function renderProgramCalendarEventsDefaultTooltipContent({
  events,
  colorMap,
}: {
  events: ProgramPreviewTooltipEventRow[]
  colorMap: Map<string | number, ScheduleColorPair>
}): ReactNode {
  return <ProgramPreviewTooltipBody events={events} colorMap={colorMap} />
}

export type GeneralProgramCalendarPreviewRow = {
  id: string | number
  programTitle: string
  scheduleContent: string
  timeLabel: string
}

function isGeneralProgramCalendarPreviewRow(
  value: unknown
): value is GeneralProgramCalendarPreviewRow {
  if (value == null || typeof value !== 'object') return false
  return (
    'programTitle' in value &&
    'scheduleContent' in value &&
    'timeLabel' in value &&
    'originalItem' in value
  )
}

function resolveGeneralProgramCalendarPreviewRow(
  item: CalendarItem
): GeneralProgramCalendarPreviewRow | null {
  const original = item.original
  if (!isGeneralProgramCalendarPreviewRow(original)) return null
  return {
    id: item.id,
    programTitle: original.programTitle,
    scheduleContent: original.scheduleContent,
    timeLabel: original.timeLabel,
  }
}

/** 일반 프로그램 목록 캘린더 — 이벤트 모드 셀 툴팁 (제목 + 일정 내용 | 시간) */
export function renderGeneralProgramCalendarPreviewTooltipContent({
  events,
}: {
  events: CalendarItem[]
  colorMap: Map<string | number, ScheduleColorPair>
}): ReactNode {
  return (
    <div className="calendar-preview-popover">
      {events.map(item => {
        const event = resolveGeneralProgramCalendarPreviewRow(item)
        if (!event) {
          return (
            <div key={String(item.id)} className="calendar-preview-popover__entry">
              <span className="calendar-preview-popover__title">{item.title ?? '-'}</span>
            </div>
          )
        }
        return (
          <div key={String(item.id)} className="calendar-preview-popover__entry">
            <span className="calendar-preview-popover__title">{event.programTitle}</span>
            <div className="calendar-preview-popover__meta">
              <span className="calendar-preview-popover__meta-part calendar-preview-popover__meta-part--session">
                {event.scheduleContent}
              </span>
              <span className="calendar-preview-popover__meta-sep" aria-hidden />
              <span className="calendar-preview-popover__meta-part">
                {event.timeLabel}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
