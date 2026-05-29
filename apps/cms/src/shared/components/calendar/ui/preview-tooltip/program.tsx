import type { ReactNode } from 'react'
import {
  SCHEDULE_COLORS,
  type ScheduleColorPair,
} from '@/features/program/shared/ui/program-schedule-colors'
import type { CalendarItem } from '../../model/calendar-item'

import './program-preview.css'

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
): { title: string; location: string; countLabel: string } | null {
  if (!item) return null
  const summary = item.calendarInstitutionSummary as
    | { applicantCount: number; regionDisplay: string }
    | undefined
  if (summary && typeof item.schoolName === 'string') {
    return {
      title: item.schoolName,
      location: summary.regionDisplay || '-',
      countLabel: `신청 : ${summary.applicantCount}명`,
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
  /** 있으면 해당 id 행에 `program-preview-item--selected` 적용 */
  selectedIds?: ReadonlySet<string | number>
}

/** `CalendarMain` 툴팁 본문 — 신청자 일정 요약 행 */
export function ProgramPreviewTooltipBody({
  events,
  colorMap,
  selectedIds,
}: ProgramPreviewTooltipBodyProps): ReactNode {
  return (
    <div className="program-preview">
      {events.map(ev => {
        const colors = colorMap.get(ev.id) ?? SCHEDULE_COLORS[0]
        const parts = getProgramPreviewRowParts(ev.originalItem as Record<string, unknown> | undefined)
        const fallbackTitle = String(ev.title ?? '').replace(/^\[.*?\]\s*/, '')
        const selected = selectedIds?.has(ev.id) ?? false
        const itemClass = ['program-preview-item', selected ? 'program-preview-item--selected' : '']
          .filter(Boolean)
          .join(' ')

        if (!parts) {
          return (
            <div key={String(ev.id)} className={itemClass}>
              <span className="program-preview-item__title" style={{ color: colors.text }}>
                {fallbackTitle || '-'}
              </span>
            </div>
          )
        }

        return (
          <div key={String(ev.id)} className={itemClass}>
            <span className="program-preview-item__title" style={{ color: colors.text }}>
              {parts.title}
            </span>
            <span className="program-preview-item__sep" aria-hidden>
              |
            </span>
            <span className="program-preview-item__text">{parts.location}</span>
            <span className="program-preview-item__sep" aria-hidden>
              |
            </span>
            <span className="program-preview-item__text">{parts.countLabel}</span>
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
