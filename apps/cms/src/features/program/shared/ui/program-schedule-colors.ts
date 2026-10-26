/**
 * 프로그램 일정 색상: 캘린더 셀 배지(해시) · 우측 리스트(applicant / ProgramScheduleList 공통 팔레트)
 */

import type { Program } from '@/types/domain'

const CALENDAR_CHIP_TEXT = 'var(--Netural-black, #3D3D3D)'
const CALENDAR_CHIP_BORDER = 'var(--Border-alpha-06, rgba(61, 61, 61, 0.06))'

export const SCHEDULE_COLORS = [
  {
    name: 'green',
    text: CALENDAR_CHIP_TEXT,
    border: CALENDAR_CHIP_BORDER,
    bg: 'var(--Tag-green, #E1F7D9)',
    accent: 'var(--Status-green-main, #1E8C29)',
  },
  {
    name: 'pink',
    text: CALENDAR_CHIP_TEXT,
    border: CALENDAR_CHIP_BORDER,
    bg: 'var(--Tag-red, #FFEBEB)',
    accent: 'var(--Status-red-main, #C32F4A)',
  },
  {
    name: 'sky',
    text: CALENDAR_CHIP_TEXT,
    border: CALENDAR_CHIP_BORDER,
    bg: 'var(--Tag-sky, #D0EFFF)',
    accent: 'var(--Status-blue-main, #017EAF)',
  },
  {
    name: 'purple',
    text: CALENDAR_CHIP_TEXT,
    border: CALENDAR_CHIP_BORDER,
    bg: 'var(--Tag-purple, #EBDFF9)',
    accent: 'var(--Status-purple-main, #8457CE)',
  },
  {
    name: 'yellow',
    text: CALENDAR_CHIP_TEXT,
    border: CALENDAR_CHIP_BORDER,
    bg: 'var(--Tag-yellow, #FFF2D2)',
    accent: 'var(--Status-orange-main, #F07917)',
  },
] as const satisfies readonly ScheduleColorPair[]

/** 프로그램 일정 팔레트 + 정산·주간 그리드 등 도메인별 `resolveEventColors` 오버라이드 */
export type ScheduleColorPair = {
  readonly name: string
  readonly text: string
  readonly border: string
  readonly bg: string
  readonly accent?: string
}

export function hashProgramId(programId: string): number {
  let h = 0
  for (let i = 0; i < programId.length; i++) {
    h = (Math.imul(31, h) + programId.charCodeAt(i)) >>> 0
  }
  return h
}

export function getScheduleColorPair(programId: string): ScheduleColorPair {
  return SCHEDULE_COLORS[hashProgramId(programId) % SCHEDULE_COLORS.length]
}

/**
 * ProgramScheduleList: applicant 일정 리스트와 동일 로직
 * — `SCHEDULE_COLORS` 팔레트, 프로그램 id 기준 순차 색 인덱스, 인접 행이 서로 다른 프로그램인데 같은 색이면 미사용 색 우선 배정
 */
export function buildResolvedScheduleColorMapForPrograms(
  programsInDisplayOrder: Program[]
): Map<string, ScheduleColorPair> {
  const colorPalette: ScheduleColorPair[] = [...SCHEDULE_COLORS]
  const keys = new Set<string>()
  programsInDisplayOrder.forEach(p => keys.add(String(p.id)))
  const sorted = Array.from(keys).sort()
  const entityToColorIndex = new Map<string, number>()
  sorted.forEach((k, i) => entityToColorIndex.set(k, i % colorPalette.length))

  const map = new Map<string, ScheduleColorPair>()
  const usedIndices = new Set<number>()
  let prevIdx = -1
  let prevKey = ''

  programsInDisplayOrder.forEach(program => {
    const key = String(program.id)
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
    map.set(String(program.id), colorPalette[idx])
  })
  return map
}
