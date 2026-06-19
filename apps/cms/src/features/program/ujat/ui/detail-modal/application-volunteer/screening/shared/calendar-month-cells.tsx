import type { ReactNode } from 'react'
import type { ScheduleColorPair } from '@/features/program/shared/ui/program-schedule-colors'
import { CalendarMonthEventTitleWithDivider } from '@/shared/components/calendar/ui/calendar-month-event-title'
import type { CalendarMonthCellRow } from '@/shared/components/calendar/model/calendar-month-cell-row'
import type { CalendarItem } from '@/shared/components/calendar/lib/calendar-helpers'
import { calendarItemsForEventMode } from '@/shared/components/calendar/lib/calendar-helpers'

type UjatMonthCellMeta = {
  titleParts: {
    left: string
    right?: string
  }
}

function readVolunteerKey(event: CalendarItem): string | null {
  const payload = event.original as Record<string, unknown> | undefined
  if (!payload || typeof payload !== 'object') return null
  const volunteerName = payload.volunteerName
  if (typeof volunteerName !== 'string' || volunteerName.trim() === '') return null
  return volunteerName.trim()
}

function readSlotLabel(event: CalendarItem): string | null {
  const payload = event.original as Record<string, unknown> | undefined
  if (!payload || typeof payload !== 'object') return null
  const slotLabel = payload.slotLabel
  if (typeof slotLabel === 'string' && slotLabel.trim() !== '') return slotLabel.trim()
  const startTime = payload.startTime
  const endTime = payload.endTime
  if (typeof startTime === 'string' && typeof endTime === 'string') {
    return `${startTime.trim()} ~ ${endTime.trim()}`
  }
  return null
}

/** UJAT 봉사자 면접 — 월간 셀: 지원자별 슬롯 시간 묶음 */
export function buildUjatVolunteerInterviewMonthCellRows(
  dayItems: CalendarItem[]
): CalendarMonthCellRow[] {
  const dayEvents = calendarItemsForEventMode(dayItems)

  const grouped = new Map<
    string,
    {
      sourceEvent: CalendarItem
      slots: string[]
      dedupe: Set<string>
    }
  >()

  for (const event of dayEvents) {
    const volunteerKey = readVolunteerKey(event)
    if (!volunteerKey) continue
    const slotLabel = readSlotLabel(event)
    let group = grouped.get(volunteerKey)
    if (!group) {
      group = {
        sourceEvent: event,
        slots: [],
        dedupe: new Set<string>(),
      }
      grouped.set(volunteerKey, group)
    }
    if (slotLabel && !group.dedupe.has(slotLabel)) {
      group.dedupe.add(slotLabel)
      group.slots.push(slotLabel)
    }
  }

  return Array.from(grouped.entries()).map(([volunteerName, group]) => ({
    id: `volunteer-${group.sourceEvent.id}`,
    sourceEvent: group.sourceEvent,
    meta: {
      titleParts: {
        left: volunteerName,
        right: group.slots.join(', '),
      },
    } satisfies UjatMonthCellMeta,
  }))
}

export function renderUjatVolunteerInterviewMonthEventContent({
  row,
  colors,
}: {
  row: CalendarMonthCellRow
  colors: ScheduleColorPair
}): ReactNode {
  const meta = row.meta as UjatMonthCellMeta | undefined
  const titleParts = meta?.titleParts ?? { left: String(row.sourceEvent.title ?? '') }
  return (
    <CalendarMonthEventTitleWithDivider parts={titleParts} accentColor={colors.text} />
  )
}
