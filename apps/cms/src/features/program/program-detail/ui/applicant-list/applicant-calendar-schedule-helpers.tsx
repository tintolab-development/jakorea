/**
 * 신청자 캘린더 일정 색상·툴팁 내용 (ProgramCalendar events 모드와 공유)
 */

import { useMemo, useCallback } from 'react'
import {
  SCHEDULE_COLORS,
  type ScheduleColorPair,
} from '../../../ui/program-schedule-colors'

export function getEntityKey(event: { originalItem?: unknown; title?: string }): string {
  const item = event?.originalItem as Record<string, unknown> | undefined
  if (item && typeof item.schoolName === 'string') return item.schoolName
  if (item && typeof item.instructorName === 'string') return item.instructorName
  return String(event?.title ?? '').replace(/^\[.*?\]\s*/, '') ?? ''
}

function getPopoverRowParts(
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

export function ApplicantCalendarEventPopoverContent({
  events,
  colorMap,
}: {
  events: Array<{ id: string | number; title?: string; originalItem?: unknown }>
  colorMap: Map<string | number, ScheduleColorPair>
}) {
  return (
    <div className="program-calendar-schedule-panel">
      {events.map(ev => {
        const colors = colorMap.get(ev.id) ?? SCHEDULE_COLORS[0]
        const parts = getPopoverRowParts(ev.originalItem as Record<string, unknown> | undefined)
        const fallbackTitle = String(ev.title ?? '').replace(/^\[.*?\]\s*/, '')
        if (!parts) {
          return (
            <div key={String(ev.id)} className="program-calendar-schedule-panel__row">
              <span className="program-calendar-schedule-panel__title" style={{ color: colors.text }}>
                {fallbackTitle || '-'}
              </span>
            </div>
          )
        }
        return (
          <div key={String(ev.id)} className="program-calendar-schedule-panel__row">
            <span className="program-calendar-schedule-panel__title" style={{ color: colors.text }}>
              {parts.title}
            </span>
            <span className="program-calendar-schedule-panel__sep" aria-hidden>
              |
            </span>
            <span className="program-calendar-schedule-panel__text">{parts.location}</span>
            <span className="program-calendar-schedule-panel__sep" aria-hidden>
              |
            </span>
            <span className="program-calendar-schedule-panel__text">{parts.countLabel}</span>
          </div>
        )
      })}
    </div>
  )
}

export function useApplicantCalendarColorMaps(events: unknown[]) {
  const colorPalette = SCHEDULE_COLORS

  const entityToColorIndex = useMemo(() => {
    const keys = new Set<string>()
    events.forEach(ev => {
      const k = getEntityKey(ev as { originalItem?: unknown; title?: string })
      if (k) keys.add(k)
    })
    const sorted = Array.from(keys).sort()
    const map = new Map<string, number>()
    sorted.forEach((k, i) => map.set(k, i % colorPalette.length))
    return map
  }, [events, colorPalette])

  const buildResolvedColorMap = useCallback(
    (eventList: Array<{ id: string | number } & { originalItem?: unknown; title?: string }>) => {
      const map = new Map<string | number, ScheduleColorPair>()
      const usedIndices = new Set<number>()
      let prevIdx = -1
      let prevKey = ''

      eventList.forEach(ev => {
        const key = getEntityKey(ev)
        let idx = entityToColorIndex.get(key) ?? 0

        if (prevIdx >= 0 && idx === prevIdx && key !== prevKey) {
          let altIdx = -1
          for (let i = 0; i < colorPalette.length; i++) {
            if (!usedIndices.has(i) && i !== prevIdx) {
              altIdx = i
              break
            }
          }
          if (altIdx >= 0) {
            idx = altIdx
          } else {
            idx = (prevIdx + 1) % colorPalette.length
          }
        }

        usedIndices.add(idx)
        prevIdx = idx
        prevKey = key
        map.set(ev.id, colorPalette[idx])
      })
      return map
    },
    [entityToColorIndex, colorPalette]
  )

  return { buildResolvedColorMap }
}
