import { describe, expect, it } from 'vitest'
import {
  buildTimedItemGroupLayouts,
  buildWeekTimeGridColumnStyle,
  buildWeekTimeGridGroupStyle,
  compareAllDayWeekRepresentatives,
  computeWeekEventCardHeight,
  computeWeekEventCardTop,
  countAdjacentTouchingEvents,
  countOccupiedHourSlots,
  formatTimedGroupOverflowText,
  layoutTimedItemsForDay,
  readTimesOrAllDaySpan,
  resolveWeekEventCardContent,
  resolveWeekTimeGridSubtext,
  shouldShowWeekEventTimeText,
  WEEK_EVENT_INSET_X_PX,
  WEEK_EVENT_INSET_Y_PX,
  WEEK_EVENT_MIN_HEIGHT_PX,
  WEEK_TIME_GRID_HOUR_PX,
} from './week-time-grid-layout'

type Span = { id?: string; startTime?: string; endTime?: string }

const readSpan = (item: Span) => item

describe('week time grid layout vs labels', () => {
  it('synthesizes +1h only for layout height, not for subtext', () => {
    const item = { startTime: '14:00' }
    const layout = readTimesOrAllDaySpan(item, readSpan)
    expect(layout).toEqual({ startTime: '14:00', endTime: '15:00' })
    expect(
      resolveWeekTimeGridSubtext(item, 1, readSpan, {
        durationMinutes: 60,
        sameHourSlotEventCount: 1,
      })
    ).toBe('14:00')
  })

  it('shows 종일 for date-only items', () => {
    expect(resolveWeekTimeGridSubtext({}, 1, readSpan)).toBe('종일')
  })

  it('shows the real range when both clocks exist and the card may show time', () => {
    expect(
      resolveWeekTimeGridSubtext({ startTime: '09:30', endTime: '12:20' }, 1, readSpan, {
        durationMinutes: 170,
        sameHourSlotEventCount: 2,
      })
    ).toBe('09:30 ~ 12:20')
  })
})

describe('week event card metrics (Figma)', () => {
  it('W-01: 30 minute event is 30px and hides time', () => {
    expect(
      computeWeekEventCardHeight({ startM: 6 * 60, endM: 6 * 60 + 30, adjacentEventCount: 0 })
    ).toBe(30)
    expect(shouldShowWeekEventTimeText(30, 1)).toBe(false)
  })

  it('W-02 / W-03: 1 hour time text depends on same-hour-slot count', () => {
    expect(
      computeWeekEventCardHeight({ startM: 0, endM: 60, adjacentEventCount: 0 })
    ).toBe(60)
    expect(shouldShowWeekEventTimeText(60, 1)).toBe(true)
    expect(shouldShowWeekEventTimeText(60, 2)).toBe(false)
  })

  it('W-04 / W-05: 2 hour event can show time and is 128px with 2 occupied slots and 2 adjacent', () => {
    expect(countOccupiedHourSlots(150, 270)).toBe(2)
    expect(
      computeWeekEventCardHeight({
        startM: 150,
        endM: 270,
        adjacentEventCount: 2,
      })
    ).toBe(128)
    expect(shouldShowWeekEventTimeText(120, 3)).toBe(true)
  })

  it('W-06: 30-minute touching neighbors each subtract 1px', () => {
    expect(
      computeWeekEventCardHeight({ startM: 392, endM: 422, adjacentEventCount: 1 })
    ).toBe(29)
    expect(
      countAdjacentTouchingEvents(6 * 60, 6 * 60 + 30, [
        { startM: 6 * 60, endM: 6 * 60 + 30 },
        { startM: 6 * 60 + 30, endM: 7 * 60 },
      ])
    ).toBe(1)
  })

  it('places 00:00 / 00:30 / 01:00 on the 65px hour grid', () => {
    expect(computeWeekEventCardTop(0)).toBe(0)
    expect(computeWeekEventCardTop(30)).toBe(WEEK_TIME_GRID_HOUR_PX / 2)
    expect(computeWeekEventCardTop(60)).toBe(WEEK_TIME_GRID_HOUR_PX)
  })

  it('W-07 / W-08: overlapping events keep separate columns', () => {
    const items = [
      { id: 'a', startTime: '10:00', endTime: '11:00' },
      { id: 'b', startTime: '10:00', endTime: '11:00' },
      { id: 'c', startTime: '10:30', endTime: '11:30' },
    ]
    const layouts = layoutTimedItemsForDay(items, WEEK_TIME_GRID_HOUR_PX, readSpan)
    expect(layouts).toHaveLength(3)
    expect(Math.max(...layouts.map(row => row.columnCount))).toBeGreaterThanOrEqual(2)
    expect(new Set(layouts.map(row => row.columnIndex)).size).toBeGreaterThan(1)
  })

  it('visual inset is 2px and does not shrink occupancy height', () => {
    const column = buildWeekTimeGridColumnStyle({
      top: 0,
      height: 60,
      columnIndex: 0,
      columnCount: 1,
    })
    expect(WEEK_EVENT_INSET_X_PX).toBe(2)
    expect(WEEK_EVENT_INSET_Y_PX).toBe(2)
    expect(column.top).toBe(2)
    expect(column.left).toBe(2)
    expect(column.width).toBe('calc(100% - 4px)')
    expect(column.height).toBe(60)

    const group = buildWeekTimeGridGroupStyle({ top: 65, height: 125 })
    expect(group.top).toBe(67)
    expect(group.height).toBe(125)
    expect(group.left).toBe(2)
    expect(group.width).toBe('calc(100% - 4px)')
  })

  it('W-09: 23:30–24:00 stays in the last hour slot', () => {
    const [layout] = layoutTimedItemsForDay(
      [{ id: 'late', startTime: '23:30', endTime: '24:00' }],
      WEEK_TIME_GRID_HOUR_PX,
      readSpan
    )
    expect(layout?.startM).toBe(23 * 60 + 30)
    expect(layout?.endM).toBe(24 * 60)
    expect(layout?.top).toBe(computeWeekEventCardTop(23 * 60 + 30))
    expect(layout?.height).toBe(30)
  })

})

describe('same-day all-day week grouping', () => {
  it('picks the earliest program operation start, then hangul before latin titles', () => {
    expect(
      compareAllDayWeekRepresentatives(
        { operationStartDate: '2026-03-01', title: '베타' },
        { operationStartDate: '2026-01-01', title: '알파' }
      )
    ).toBeGreaterThan(0)
    expect(
      compareAllDayWeekRepresentatives(
        { operationStartDate: '2026-01-01', title: 'Beta' },
        { operationStartDate: '2026-01-01', title: '가나다' }
      )
    ).toBeGreaterThan(0)
  })

})

describe('week overlap clusters (Figma: 1 card + 외 N개의 항목)', () => {
  it('collapses 15 overlapping 10:00–12:00 sessions into one full-width card with hiddenCount 14', () => {
    const items = Array.from({ length: 15 }, (_, i) => ({
      id: `s${String(i).padStart(2, '0')}`,
      startTime: '10:00',
      endTime: '12:00',
    }))
    const groups = buildTimedItemGroupLayouts(items, WEEK_TIME_GRID_HOUR_PX, readSpan)
    expect(groups).toHaveLength(1)
    expect(groups[0]?.items).toHaveLength(15)
    expect(groups[0]?.items.length - 1).toBe(14)
    expect(formatTimedGroupOverflowText(14)).toBe('외 14개의 항목')
    const style = buildWeekTimeGridGroupStyle(groups[0]!)
    expect(style.width).toBe('calc(100% - 4px)')
  })

  it('lays out an all-day item as 00:00–24:00 in the same grid and groups it with overlapping timed events', () => {
    const items: Span[] = [
      { id: 'milestone' },
      { id: 'edu-a', startTime: '10:00', endTime: '12:00' },
      { id: 'edu-b', startTime: '16:00', endTime: '16:02' },
    ]
    const groups = buildTimedItemGroupLayouts(items, WEEK_TIME_GRID_HOUR_PX, item =>
      readTimesOrAllDaySpan(item, readSpan)
    )
    expect(groups).toHaveLength(1)
    expect(groups[0]?.startM).toBe(0)
    expect(groups[0]?.endM).toBe(24 * 60)
    expect(groups[0]?.top).toBe(0)
    expect(groups[0]?.representative.id).toBe('milestone')
    expect(groups[0]?.items.map(item => item.id).sort()).toEqual(['edu-a', 'edu-b', 'milestone'])
    expect(
      resolveWeekEventCardContent({
        height: groups[0]!.height,
        durationMinutes: groups[0]!.endM - groups[0]!.startM,
        groupSize: groups[0]!.items.length,
      })
    ).toEqual({ titleLines: 2, showTime: true, showOverflow: true })
  })

  it('keeps the bottom inset for cards that reach 24:00 so radius/border are not clipped', () => {
    const [group] = buildTimedItemGroupLayouts(
      [{ id: 'all-day' }],
      WEEK_TIME_GRID_HOUR_PX,
      item => readTimesOrAllDaySpan(item, readSpan)
    )
    const style = buildWeekTimeGridGroupStyle(group!)
    const gridContentBottom = WEEK_TIME_GRID_HOUR_PX * 24 - 2
    expect(Number(style.top) + Number(style.height)).toBe(gridContentBottom - WEEK_EVENT_INSET_Y_PX)
    expect(Number(style.top)).toBe(WEEK_EVENT_INSET_Y_PX)

    const [late] = buildTimedItemGroupLayouts(
      [{ id: 'late', startTime: '22:00', endTime: '24:00' }],
      WEEK_TIME_GRID_HOUR_PX,
      readSpan
    )
    const lateStyle = buildWeekTimeGridGroupStyle(late!)
    expect(Number(lateStyle.top) + Number(lateStyle.height)).toBeLessThanOrEqual(
      gridContentBottom - WEEK_EVENT_INSET_Y_PX
    )
  })

  it('does not shrink cards that end before the grid bottom', () => {
    const [group] = buildTimedItemGroupLayouts(
      [{ id: 'mid', startTime: '10:00', endTime: '12:00' }],
      WEEK_TIME_GRID_HOUR_PX,
      readSpan
    )
    expect(group?.height).toBe(130)
  })

  it('keeps non-overlapping short sessions as separate cards', () => {
    const groups = buildTimedItemGroupLayouts(
      [
        { id: 'a', startTime: '16:00', endTime: '16:02' },
        { id: 'b', startTime: '16:05', endTime: '16:06' },
        { id: 'c', startTime: '10:00', endTime: '12:00' },
      ],
      WEEK_TIME_GRID_HOUR_PX,
      readSpan
    )
    expect(groups.map(group => group.items.length)).toEqual([1, 1, 1])
  })

  it('gives a 1–2 minute session at least one readable line', () => {
    const height = computeWeekEventCardHeight({ startM: 960, endM: 962, adjacentEventCount: 0 })
    expect(height).toBe(WEEK_EVENT_MIN_HEIGHT_PX)
    expect(WEEK_EVENT_MIN_HEIGHT_PX).toBeGreaterThanOrEqual(29)
    expect(resolveWeekEventCardContent({ height, durationMinutes: 2, groupSize: 1 })).toEqual({
      titleLines: 1,
      showTime: false,
      showOverflow: false,
    })
  })
})

describe('week event card content (Figma Calendar/Tag/2 Line)', () => {
  it('1h cluster of 2 (60px): title 1 line + 외 N, no time', () => {
    expect(resolveWeekEventCardContent({ height: 60, durationMinutes: 60, groupSize: 2 })).toEqual({
      titleLines: 1,
      showTime: false,
      showOverflow: true,
    })
  })

  it('2h cluster (125px): 2-line title + time + 외 N', () => {
    expect(resolveWeekEventCardContent({ height: 125, durationMinutes: 120, groupSize: 2 })).toEqual({
      titleLines: 2,
      showTime: true,
      showOverflow: true,
    })
  })

  it('single 1h event (60px): title 1 line + time, never a truncated time', () => {
    expect(resolveWeekEventCardContent({ height: 60, durationMinutes: 60, groupSize: 1 })).toEqual({
      titleLines: 1,
      showTime: true,
      showOverflow: false,
    })
  })

  it('30 minute card: title only', () => {
    expect(resolveWeekEventCardContent({ height: 30, durationMinutes: 30, groupSize: 1 })).toEqual({
      titleLines: 1,
      showTime: false,
      showOverflow: false,
    })
  })
})
