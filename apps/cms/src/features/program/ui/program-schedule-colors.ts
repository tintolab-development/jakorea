/**
 * 프로그램 일정 색상: 캘린더 셀 배지(해시) · 우측 리스트(applicant / ProgramScheduleList 공통 팔레트)
 */

import type { Program } from '@/types/domain'

export const SCHEDULE_COLORS = [
  { name: 'red', text: '#C32F4A', border: 'rgba(195,47,74,0.10)', bg: 'rgba(195,47,74,0.06)' },
  { name: 'purple', text: '#7B61C8', border: 'rgba(123,97,200,0.10)', bg: 'rgba(123,97,200,0.06)' },
  { name: 'sky', text: '#0284C7', border: 'rgba(2,132,199,0.10)', bg: 'rgba(2,132,199,0.06)' },
  { name: 'green', text: '#4F8A64', border: 'rgba(79,138,100,0.10)', bg: 'rgba(79,138,100,0.06)' },

  { name: 'orange', text: '#C26A2D', border: 'rgba(194,106,45,0.10)', bg: 'rgba(194,106,45,0.06)' },
  { name: 'indigo', text: '#4F46E5', border: 'rgba(79,70,229,0.10)', bg: 'rgba(79,70,229,0.06)' },
  { name: 'mint', text: '#2FA4A9', border: 'rgba(47,164,169,0.10)', bg: 'rgba(47,164,169,0.06)' },
  { name: 'yellow', text: '#B58A2A', border: 'rgba(181,138,42,0.10)', bg: 'rgba(181,138,42,0.06)' },

  { name: 'rose', text: '#E11D48', border: 'rgba(225,29,72,0.10)', bg: 'rgba(225,29,72,0.06)' },
  { name: 'blue', text: '#3A7CA5', border: 'rgba(58,124,165,0.10)', bg: 'rgba(58,124,165,0.06)' },
  { name: 'emerald', text: '#059669', border: 'rgba(5,150,105,0.10)', bg: 'rgba(5,150,105,0.06)' },
  { name: 'amber', text: '#D97706', border: 'rgba(217,119,6,0.10)', bg: 'rgba(217,119,6,0.06)' },

  { name: 'pink', text: '#D63384', border: 'rgba(214,51,132,0.10)', bg: 'rgba(214,51,132,0.06)' },
  { name: 'cyan', text: '#0891B2', border: 'rgba(8,145,178,0.10)', bg: 'rgba(8,145,178,0.06)' },
  { name: 'lime', text: '#65A30D', border: 'rgba(101,163,13,0.10)', bg: 'rgba(101,163,13,0.06)' },
  { name: 'brown', text: '#8B5E3C', border: 'rgba(139,94,60,0.10)', bg: 'rgba(139,94,60,0.06)' },

  {
    name: 'fuchsia',
    text: '#C026D3',
    border: 'rgba(192,38,211,0.10)',
    bg: 'rgba(192,38,211,0.06)',
  },
  { name: 'teal', text: '#0D9488', border: 'rgba(13,148,136,0.10)', bg: 'rgba(13,148,136,0.06)' },
  { name: 'violet', text: '#6D28D9', border: 'rgba(109,40,217,0.10)', bg: 'rgba(109,40,217,0.06)' },
  { name: 'gray', text: '#6B7280', border: 'rgba(107,114,128,0.10)', bg: 'rgba(107,114,128,0.06)' },
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
