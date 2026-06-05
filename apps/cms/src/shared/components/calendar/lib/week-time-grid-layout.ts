import type { CSSProperties } from 'react'

export const WEEK_TIME_GRID_HOURS = 24
export const WEEK_TIME_GRID_HOUR_PX = 56
export const WEEK_TIME_GRID_TOTAL_PX = WEEK_TIME_GRID_HOUR_PX * WEEK_TIME_GRID_HOURS

export const WEEK_TIME_GRID_OVERLAP_GAP_PX = 2

/** 프로그램·일정에 시각 미설정 시 주간 격자·라벨용 */
export const WEEK_ALL_DAY_START_TIME = '00:00'
export const WEEK_ALL_DAY_END_TIME = '24:00'
export const WEEK_ALL_DAY_LABEL = '종일'

export function formatTimedGroupOverflowText(hiddenCount: number): string {
  return `외 ${hiddenCount}개의 항목`
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

export function resolveWeekTimeGridSubtext<T>(
  item: T,
  groupSize: number,
  readSpan: TimedSpanReader<T>
): string | undefined {
  if (groupSize > 1) return formatTimedGroupOverflowText(groupSize - 1)
  if (isAllDayScheduleSpan(item, readSpan)) return WEEK_ALL_DAY_LABEL
  return undefined
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
  /** cluster 내 column 번호 (0-based) */
  columnIndex: number
  /** cluster 내 총 column 수 — 폭 = 100% / N */
  columnCount: number
}

function layoutTimedItemInGrid(
  startTime: string | undefined,
  endTime: string | undefined,
  hourPx: number
): { top: number; height: number; startM: number; endM: number } | null {
  const startM = parseHHmmToMinutes(startTime)
  if (startM == null) return null
  const endRaw = parseHHmmToMinutes(endTime)
  let endM = endRaw != null && endRaw > startM ? endRaw : startM + 60
  if (endM <= startM) endM = startM + 60
  endM = Math.min(endM, 24 * 60)
  const top = (startM / 60) * hourPx
  const height = Math.max(((endM - startM) / 60) * hourPx, 28)
  return { top, height, startM, endM }
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
          height: 32,
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
      top: (clusterStart / 60) * hourPx,
      height: Math.max(((clusterEnd - clusterStart) / 60) * hourPx, 28),
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

/** 집약 블록: 전체 열 폭 */
export function buildWeekTimeGridGroupStyle(layout: {
  top: number
  height: number
}): Pick<CSSProperties, 'position' | 'top' | 'left' | 'right' | 'width' | 'height' | 'minHeight'> {
  return {
    position: 'absolute',
    top: layout.top,
    left: 0,
    right: 0,
    height: layout.height,
    minHeight: 28,
  }
}

/** 겹침 열 사이만 소간격, 열 좌우 가장자리는 0에 맞춤 */
export function buildWeekTimeGridColumnStyle(layout: {
  top: number
  height: number
  columnIndex: number
  columnCount: number
}): Pick<CSSProperties, 'position' | 'top' | 'left' | 'width' | 'height' | 'minHeight'> {
  const n = layout.columnCount
  const i = layout.columnIndex
  const gap = WEEK_TIME_GRID_OVERLAP_GAP_PX
  return {
    position: 'absolute',
    top: layout.top,
    left:
      n <= 1
        ? 0
        : `calc(${i} * (100% - ${(n - 1) * gap}px) / ${n} + ${i * gap}px)`,
    width: n <= 1 ? '100%' : `calc((100% - ${(n - 1) * gap}px) / ${n})`,
    height: layout.height,
    minHeight: 28,
  }
}
