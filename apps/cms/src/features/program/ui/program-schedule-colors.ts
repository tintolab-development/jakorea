/**
 * 프로그램 일정 색상: 캘린더 셀 배지(해시) · 우측 리스트(applicant / ProgramScheduleList 공통 팔레트)
 */

import type { Program } from '@/types/domain'

export const SCHEDULE_COLORS = [
  { name: 'pink', border: 'rgb(250, 232, 240)', bg: 'rgba(251, 243, 244, 0.6)' },
  { name: 'red', border: 'rgba(226, 120, 113, 0.3)', bg: 'rgba(250, 236, 236, 0.6)' },
  { name: 'mint', border: 'rgba(221, 241, 243, 0.6)', bg: 'rgba(240, 249, 250, 0.6)' },
  { name: 'orange', border: 'rgba(204, 120, 47, 0.2)', bg: 'rgba(248, 236, 223, 0.6)' },
  { name: 'yellow', border: 'rgba(194, 147, 67, 0.2)', bg: 'rgba(250, 243, 221, 0.6)' },
  { name: 'green', border: 'rgba(84, 129, 100, 0.2)', bg: 'rgba(238, 243, 237, 0.6)' },
  { name: 'blue', border: 'rgba(72, 124, 165, 0.2)', bg: 'rgba(233, 243, 247, 0.6)' },
  { name: 'purple', border: 'rgba(246, 243, 248, 0.6)', bg: 'rgba(243, 239, 249, 0.6)' },
] as const

export type ScheduleColorPair = (typeof SCHEDULE_COLORS)[number]

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
