import type { CSSProperties } from 'react'
import { formatCalendarEventTimeLabel } from './format-calendar-event-time-label'

export const WEEK_TIME_GRID_HOURS = 24
/** Figma 시간 칸 64px + 1px 경계 */
export const WEEK_TIME_GRID_HOUR_PX = 65
export const WEEK_TIME_GRID_TOTAL_PX = WEEK_TIME_GRID_HOUR_PX * WEEK_TIME_GRID_HOURS
/** 카드 기본 높이: 1분 = 1px (30분=30, 1시간=60, 2시간=120) */
export const WEEK_EVENT_PX_PER_MINUTE = 1
/** 2시간 이상 일정이 차지하는 시간 칸당 +5px */
export const WEEK_EVENT_OCCUPIED_HOUR_SLOT_PX = 5
/** 30분 단위로 위·아래가 맞닿는 일정 하나당 -1px */
export const WEEK_EVENT_ADJACENT_PX = 1
/** Figma Calendar/Tag 1줄(29px): padding 6*2 + border 1*2 + 12px/130% 한 줄. 짧은 회차도 제목 1줄은 읽히게 한다. */
export const WEEK_EVENT_MIN_HEIGHT_PX = 29
/** Figma Calendar/Tag 내부 텍스트 metrics */
export const WEEK_EVENT_CARD_CHROME_PX = 14
export const WEEK_EVENT_LINE_PX = 15.6
export const WEEK_EVENT_LINE_GAP_PX = 2
/** Figma: 카드 제목 최대 2줄 */
export const WEEK_EVENT_TITLE_MAX_LINES = 2

export const WEEK_TIME_GRID_OVERLAP_GAP_PX = 2
/** Figma Calendar/Tag: 108px 열 안 104px 카드 → 좌우·상단 2px (높이는 occupancy와 분리) */
export const WEEK_EVENT_INSET_X_PX = 2
export const WEEK_EVENT_INSET_Y_PX = 2

/** 프로그램·일정에 시각 미설정 시 주간 격자·라벨용 */
export const WEEK_ALL_DAY_START_TIME = '00:00'
export const WEEK_ALL_DAY_END_TIME = '24:00'
export const WEEK_ALL_DAY_LABEL = '종일'

export function formatTimedGroupOverflowText(hiddenCount: number): string {
  return `외 ${hiddenCount}개의 항목`
}

export function formatAllDayGroupOverflowText(hiddenCount: number): string {
  return `외 ${hiddenCount}개의 일정`
}

export type AllDayWeekSortFields = {
  operationStartDate?: string
  title?: string
}

function titleScriptRank(title: string): number {
  const first = title.trim().charAt(0)
  if (/[가-힣]/.test(first)) return 0
  if (/[A-Za-z]/.test(first)) return 1
  return 2
}

/** 가나다 → 알파벳 → 그 외. 같은 스크립트 안에서는 ko locale. */
export function compareHangulThenLatinTitle(a: string, b: string): number {
  const rankA = titleScriptRank(a)
  const rankB = titleScriptRank(b)
  if (rankA !== rankB) return rankA - rankB
  return a.localeCompare(b, 'ko')
}

/** 운영 시작일 빠른 순. 날짜 동률·없음이면 프로그램명 가나다→알파벳. */
export function compareAllDayWeekRepresentatives(
  a: AllDayWeekSortFields,
  b: AllDayWeekSortFields
): number {
  const dateA = a.operationStartDate?.trim().slice(0, 10) ?? ''
  const dateB = b.operationStartDate?.trim().slice(0, 10) ?? ''
  if (dateA && dateB && dateA !== dateB) return dateA.localeCompare(dateB)
  if (dateA && !dateB) return -1
  if (!dateA && dateB) return 1
  return compareHangulThenLatinTitle(a.title?.trim() ?? '', b.title?.trim() ?? '')
}

export function pickAllDayWeekRepresentative<T>(
  items: readonly T[],
  readSortFields: (item: T) => AllDayWeekSortFields
): T {
  return [...items].sort((left, right) =>
    compareAllDayWeekRepresentatives(readSortFields(left), readSortFields(right))
  )[0]
}

export function hasTimedScheduleSpan<T>(item: T, readSpan: TimedSpanReader<T>): boolean {
  return parseHHmmToMinutes(readSpan(item).startTime) != null
}

export function isAllDayScheduleSpan<T>(item: T, readSpan: TimedSpanReader<T>): boolean {
  return !hasTimedScheduleSpan(item, readSpan)
}

/** 시각 없음 → 00:00–24:00(종일)로 격자 배치 */
export function readTimesOrAllDaySpan<T>(
  item: T,
  readSpan: TimedSpanReader<T>
): { startTime: string; endTime: string } {
  const span = readSpan(item)
  if (parseHHmmToMinutes(span.startTime) != null) {
    const endRaw = parseHHmmToMinutes(span.endTime)
    const startM = parseHHmmToMinutes(span.startTime)!
    let endM = endRaw != null && endRaw > startM ? endRaw : startM + 60
    endM = Math.min(endM, 24 * 60)
    const endH = Math.floor(endM / 60)
    const endMin = endM % 60
    return {
      startTime: span.startTime!,
      endTime: span.endTime?.trim()
        ? span.endTime
        : `${String(endH).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`,
    }
  }
  return { startTime: WEEK_ALL_DAY_START_TIME, endTime: WEEK_ALL_DAY_END_TIME }
}

export function countOccupiedHourSlots(startM: number, endM: number): number {
  const duration = Math.max(endM - startM, 0)
  return Math.max(Math.ceil(duration / 60), 1)
}

export function countAdjacentTouchingEvents(
  startM: number,
  endM: number,
  others: ReadonlyArray<{ startM: number; endM: number }>
): number {
  let count = 0
  for (const other of others) {
    if (other.startM === startM && other.endM === endM) continue
    if (other.endM === startM || other.startM === endM) count += 1
  }
  return count
}

export function computeWeekEventCardTop(
  startM: number,
  hourPx: number = WEEK_TIME_GRID_HOUR_PX
): number {
  return (startM / 60) * hourPx
}

export function computeWeekEventCardHeight(input: {
  startM: number
  endM: number
  adjacentEventCount: number
}): number {
  const durationMinutes = Math.max(input.endM - input.startM, 0)
  const base = durationMinutes * WEEK_EVENT_PX_PER_MINUTE
  const occupied = countOccupiedHourSlots(input.startM, input.endM)
  const slotBonus =
    durationMinutes >= 120 ? occupied * WEEK_EVENT_OCCUPIED_HOUR_SLOT_PX : 0
  return Math.max(
    base + slotBonus - input.adjacentEventCount * WEEK_EVENT_ADJACENT_PX,
    WEEK_EVENT_MIN_HEIGHT_PX
  )
}

/** `.calendar-week-time-grid__board` 테두리(1px). 격자 내용 높이 = 24*hourPx - 상하 테두리 */
export const WEEK_TIME_GRID_BOARD_BORDER_PX = 1

/**
 * 카드 하단이 격자 바닥(보드 테두리 안쪽)을 넘지 않게 높이를 줄인다.
 * 위쪽과 같은 2px inset을 아래에도 남겨 radius·테두리가 overflow:hidden에 잘리지 않게 한다.
 * (예: 00:00–24:00은 1440 + 24*5 = 1560px라 top inset 2px만큼 격자 밖으로 나가 하단이 잘렸다)
 */
export function clampWeekEventCardHeightToGrid(
  top: number,
  height: number,
  hourPx: number = WEEK_TIME_GRID_HOUR_PX
): number {
  const contentBottom = hourPx * WEEK_TIME_GRID_HOURS - WEEK_TIME_GRID_BOARD_BORDER_PX * 2
  const maxHeight = contentBottom - WEEK_EVENT_INSET_Y_PX - (top + WEEK_EVENT_INSET_Y_PX)
  return Math.max(Math.min(height, maxHeight), WEEK_EVENT_MIN_HEIGHT_PX)
}

export function countEventsOverlappingHourSlot(
  hourStartM: number,
  spans: ReadonlyArray<{ startM: number; endM: number }>
): number {
  const hourEndM = hourStartM + 60
  let count = 0
  for (const span of spans) {
    if (span.startM < hourEndM && span.endM > hourStartM) count += 1
  }
  return count
}

export function shouldShowWeekEventTimeText(
  durationMinutes: number,
  sameHourSlotEventCount: number
): boolean {
  if (durationMinutes < 60) return false
  if (durationMinutes < 120) return sameHourSlotEventCount === 1
  return true
}

export function resolveWeekTimeGridSubtext<T>(
  item: T,
  groupSize: number,
  readSpan: TimedSpanReader<T>,
  options?: { sameHourSlotEventCount?: number; durationMinutes?: number }
): string | undefined {
  if (groupSize > 1) return formatTimedGroupOverflowText(groupSize - 1)
  const span = readSpan(item)
  const startM = parseHHmmToMinutes(span.startTime)
  const endM = parseHHmmToMinutes(span.endTime)
  if (startM == null) return formatCalendarEventTimeLabel(span.startTime, span.endTime)
  const durationMinutes =
    options?.durationMinutes ??
    (endM != null && endM > startM ? endM - startM : 60)
  const sameHourSlotEventCount = options?.sameHourSlotEventCount ?? 1
  if (!shouldShowWeekEventTimeText(durationMinutes, sameHourSlotEventCount)) return undefined
  return formatCalendarEventTimeLabel(span.startTime, span.endTime)
}

export function parseHHmmToMinutes(s: string | undefined): number | null {
  if (!s?.trim()) return null
  const t = s.trim()
  if (t === '24:00') return 24 * 60
  const m = /^(\d{1,2}):(\d{2})$/.exec(t)
  if (!m) return null
  const h = parseInt(m[1], 10)
  const min = parseInt(m[2], 10)
  if (h < 0 || h > 23 || min < 0 || min > 59) return null
  return h * 60 + min
}

export type TimedSpanReader<T> = (item: T) => {
  startTime?: string
  endTime?: string
}

export type TimedColumnLayout<T> = {
  item: T
  top: number
  height: number
  startM: number
  endM: number
  /** cluster 내 column 번호 (0-based) */
  columnIndex: number
  /** cluster 내 총 column 수 — 폭 = 100% / N */
  columnCount: number
}

function layoutTimedItemInGrid(
  startTime: string | undefined,
  endTime: string | undefined,
  hourPx: number,
  adjacentEventCount = 0
): { top: number; height: number; startM: number; endM: number } | null {
  const startM = parseHHmmToMinutes(startTime)
  if (startM == null) return null
  const endRaw = parseHHmmToMinutes(endTime)
  let endM = endRaw != null && endRaw > startM ? endRaw : startM + 60
  if (endM <= startM) endM = startM + 60
  endM = Math.min(endM, 24 * 60)
  return {
    top: computeWeekEventCardTop(startM, hourPx),
    height: computeWeekEventCardHeight({ startM, endM, adjacentEventCount }),
    startM,
    endM,
  }
}

/**
 * 하루의 시간 일정을 FullCalendar 식 column 레이아웃으로 배치.
 * - 같은 cluster(겹침 체인) 안에서 최대 동시 활성 column 수 N을 찾아 모두 같은 N으로 분할
 * - 겹치지 않는 단일 일정은 N=1이라 전체 폭을 점유
 */
export function layoutTimedItemsForDay<T>(
  items: T[],
  hourPx: number,
  readSpan: TimedSpanReader<T>
): TimedColumnLayout<T>[] {
  type Span = {
    item: T
    startM: number
    endM: number
    top: number
    height: number
    columnIndex: number
  }

  const spans: Span[] = []
  for (const item of items) {
    const { startTime, endTime } = readSpan(item)
    const grid = layoutTimedItemInGrid(startTime, endTime, hourPx)
    if (grid == null) continue
    spans.push({
      item,
      startM: grid.startM,
      endM: grid.endM,
      top: grid.top,
      height: grid.height,
      columnIndex: -1,
    })
  }

  for (const sp of spans) {
    const adjacentEventCount = countAdjacentTouchingEvents(sp.startM, sp.endM, spans)
    sp.height = computeWeekEventCardHeight({
      startM: sp.startM,
      endM: sp.endM,
      adjacentEventCount,
    })
  }

  spans.sort((a, b) => {
    if (a.startM !== b.startM) return a.startM - b.startM
    return b.endM - a.endM
  })

  const columnEnds: number[] = []
  for (const sp of spans) {
    let placed = -1
    for (let c = 0; c < columnEnds.length; c++) {
      if (columnEnds[c] <= sp.startM) {
        placed = c
        break
      }
    }
    if (placed === -1) {
      placed = columnEnds.length
      columnEnds.push(sp.endM)
    } else {
      columnEnds[placed] = sp.endM
    }
    sp.columnIndex = placed
  }

  const clusters: { startIdx: number; endIdx: number; columnCount: number }[] = []
  let clusterStart = 0
  let clusterMaxEnd = -Infinity
  for (let i = 0; i < spans.length; i++) {
    const sp = spans[i]
    if (i > 0 && sp.startM >= clusterMaxEnd) {
      clusters.push({
        startIdx: clusterStart,
        endIdx: i - 1,
        columnCount: 0,
      })
      clusterStart = i
      clusterMaxEnd = sp.endM
    } else {
      clusterMaxEnd = Math.max(clusterMaxEnd, sp.endM)
    }
  }
  if (spans.length > 0) {
    clusters.push({
      startIdx: clusterStart,
      endIdx: spans.length - 1,
      columnCount: 0,
    })
  }
  for (const cluster of clusters) {
    let max = 0
    for (let i = cluster.startIdx; i <= cluster.endIdx; i++) {
      if (spans[i].columnIndex + 1 > max) max = spans[i].columnIndex + 1
    }
    cluster.columnCount = Math.max(max, 1)
  }

  const layoutByItem = new Map<T, TimedColumnLayout<T>>()
  for (const cluster of clusters) {
    for (let i = cluster.startIdx; i <= cluster.endIdx; i++) {
      const sp = spans[i]
      layoutByItem.set(sp.item, {
        item: sp.item,
        top: sp.top,
        height: sp.height,
        startM: sp.startM,
        endM: sp.endM,
        columnIndex: sp.columnIndex,
        columnCount: cluster.columnCount,
      })
    }
  }

  return items
    .filter(item => parseHHmmToMinutes(readSpan(item).startTime) != null)
    .map(
      item =>
        layoutByItem.get(item) ?? {
          item,
          top: 0,
          height: WEEK_EVENT_MIN_HEIGHT_PX,
          startM: 0,
          endM: 60,
          columnIndex: 0,
          columnCount: 1,
        }
    )
}

export type TimedItemGroupLayout<T> = {
  items: T[]
  representative: T
  startM: number
  endM: number
  top: number
  height: number
}

type TimedSpan<T> = {
  item: T
  startM: number
  endM: number
}

function buildTimedSpans<T>(items: T[], readSpan: TimedSpanReader<T>): TimedSpan<T>[] {
  const spans: TimedSpan<T>[] = []
  for (const item of items) {
    const { startTime, endTime } = readSpan(item)
    const startM = parseHHmmToMinutes(startTime)
    if (startM == null) continue
    const endRaw = parseHHmmToMinutes(endTime)
    let endM = endRaw != null && endRaw > startM ? endRaw : startM + 60
    if (endM <= startM) endM = startM + 60
    endM = Math.min(endM, 24 * 60)
    spans.push({ item, startM, endM })
  }
  return spans.sort(
    (a, b) =>
      a.startM - b.startM ||
      b.endM - a.endM ||
      defaultItemKey(a.item).localeCompare(defaultItemKey(b.item))
  )
}

function defaultItemKey(item: unknown): string {
  if (item != null && typeof item === 'object' && 'id' in item) {
    return String((item as { id: unknown }).id)
  }
  return String(item)
}

function pickRepresentativeSpan<T>(cluster: TimedSpan<T>[]): TimedSpan<T> {
  return [...cluster].sort((a, b) => {
    const durA = a.endM - a.startM
    const durB = b.endM - b.startM
    if (durA !== durB) return durB - durA
    if (a.startM !== b.startM) return a.startM - b.startM
    return defaultItemKey(a.item).localeCompare(defaultItemKey(b.item))
  })[0]
}

/**
 * 겹치는 시간 일정을 하나의 블록으로 집약.
 * - cluster 전체 시간 범위(가장 이른 시작 ~ 가장 늦은 종료)로 블록 높이
 * - 대표 일정: 기간이 가장 긴 항목
 * - 2건 이상이면 `외 N개의 항목` 문구용 hiddenCount 반환
 */
export function buildTimedItemGroupLayouts<T>(
  items: T[],
  hourPx: number,
  readSpan: TimedSpanReader<T>
): TimedItemGroupLayout<T>[] {
  const spans = buildTimedSpans(items, readSpan)
  if (spans.length === 0) return []

  const groups: TimedItemGroupLayout<T>[] = []
  let cluster: TimedSpan<T>[] = [spans[0]]
  let clusterMaxEnd = spans[0].endM

  const flushCluster = () => {
    const rep = pickRepresentativeSpan(cluster)
    const clusterStart = Math.min(...cluster.map(c => c.startM))
    const clusterEnd = Math.max(...cluster.map(c => c.endM))
    groups.push({
      items: cluster.map(c => c.item),
      representative: rep.item,
      startM: clusterStart,
      endM: clusterEnd,
      top: computeWeekEventCardTop(clusterStart, hourPx),
      height: clampWeekEventCardHeightToGrid(
        computeWeekEventCardTop(clusterStart, hourPx),
        computeWeekEventCardHeight({
          startM: clusterStart,
          endM: clusterEnd,
          adjacentEventCount: 0,
        }),
        hourPx
      ),
    })
  }

  for (let i = 1; i < spans.length; i++) {
    const sp = spans[i]
    if (sp.startM < clusterMaxEnd) {
      cluster.push(sp)
      clusterMaxEnd = Math.max(clusterMaxEnd, sp.endM)
      continue
    }
    flushCluster()
    cluster = [sp]
    clusterMaxEnd = sp.endM
  }
  flushCluster()

  return groups
}

export type WeekEventCardContent = {
  /** 제목 줄 수(1~2). 공간이 부족하면 시간·외 N개보다 제목을 먼저 1줄 말줄임한다. */
  titleLines: number
  showTime: boolean
  showOverflow: boolean
}

/**
 * Figma Calendar/Tag/2 Line 내용 규칙.
 * - 제목 1줄은 항상
 * - 겹침 묶음이면 `외 N개의 항목` 줄
 * - 시간 줄은 2시간 이상, 또는 일정 1개일 때 1시간 이상 + 한 줄 공간이 남을 때만 (잘린 `13:30 ~ 1…` 금지)
 * - 남는 공간이 있으면 제목 2줄
 */
export function resolveWeekEventCardContent(input: {
  height: number
  durationMinutes: number
  groupSize: number
}): WeekEventCardContent {
  const content = Math.max(input.height - WEEK_EVENT_CARD_CHROME_PX, 0)
  const lines = Math.max(
    Math.floor((content + WEEK_EVENT_LINE_GAP_PX + 0.01) / (WEEK_EVENT_LINE_PX + WEEK_EVENT_LINE_GAP_PX)),
    1
  )
  let remaining = lines - 1
  const showOverflow = input.groupSize > 1 && remaining >= 1
  if (showOverflow) remaining -= 1
  const timeAllowed =
    input.durationMinutes >= 120 || (input.durationMinutes >= 60 && input.groupSize === 1)
  const showTime = timeAllowed && remaining >= 1
  if (showTime) remaining -= 1
  return {
    titleLines: Math.min(WEEK_EVENT_TITLE_MAX_LINES, 1 + remaining),
    showTime,
    showOverflow,
  }
}

/** 집약 블록: 열 안 2px inset. height는 occupancy 계산값 그대로 */
export function buildWeekTimeGridGroupStyle(layout: {
  top: number
  height: number
}): Pick<CSSProperties, 'position' | 'top' | 'left' | 'width' | 'height' | 'minHeight'> {
  const insetX = WEEK_EVENT_INSET_X_PX
  return {
    position: 'absolute',
    top: layout.top + WEEK_EVENT_INSET_Y_PX,
    left: insetX,
    width: `calc(100% - ${insetX * 2}px)`,
    height: layout.height,
    minHeight: WEEK_EVENT_MIN_HEIGHT_PX,
  }
}

/** 겹침 열 사이 소간격 + 셀 가장자리 2px inset. height는 occupancy 계산값 그대로 */
export function buildWeekTimeGridColumnStyle(layout: {
  top: number
  height: number
  columnIndex: number
  columnCount: number
}): Pick<CSSProperties, 'position' | 'top' | 'left' | 'width' | 'height' | 'minHeight'> {
  const n = layout.columnCount
  const i = layout.columnIndex
  const gap = WEEK_TIME_GRID_OVERLAP_GAP_PX
  const insetX = WEEK_EVENT_INSET_X_PX
  const inner = `100% - ${insetX * 2}px`
  return {
    position: 'absolute',
    top: layout.top + WEEK_EVENT_INSET_Y_PX,
    left:
      n <= 1
        ? insetX
        : `calc(${insetX}px + ${i} * (${inner} - ${(n - 1) * gap}px) / ${n} + ${i * gap}px)`,
    width:
      n <= 1
        ? `calc(${inner})`
        : `calc((${inner} - ${(n - 1) * gap}px) / ${n})`,
    height: layout.height,
    minHeight: WEEK_EVENT_MIN_HEIGHT_PX,
  }
}
