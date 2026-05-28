/**
 * 신청자 캘린더 일정 색상 맵 (`CalendarMain` 이벤트 모드와 공유)
 */

import { useMemo, useCallback } from 'react'
import {
  SCHEDULE_COLORS,
  type ScheduleColorPair,
} from '@/features/program/shared/ui/program-schedule-colors'

export function getEntityKey(event: {
  originalItem?: unknown
  title?: string
  /** `CalendarItem` 등에서 중첩 페이로드 */
  original?: unknown
}): string {
  const fromNested =
    event.originalItem ??
    (event.original != null && typeof event.original === 'object' && 'originalItem' in event.original
      ? (event.original as { originalItem?: unknown }).originalItem
      : event.original)
  const item = fromNested as Record<string, unknown> | undefined
  if (item && typeof item.schoolName === 'string') return item.schoolName
  if (item && typeof item.instructorName === 'string') return item.instructorName
  if (item && typeof item.name === 'string') return item.name
  return String(event?.title ?? '').replace(/^\[.*?\]\s*/, '') ?? ''
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
    (
      eventList: Array<
        { id: string | number } & { originalItem?: unknown; title?: string; original?: unknown }
      >
    ) => {
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
