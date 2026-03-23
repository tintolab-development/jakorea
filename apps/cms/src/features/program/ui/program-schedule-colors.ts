/**
 * 프로그램 일정 색상: 캘린더 셀 배지와 우측 ProgramScheduleList 동일 팔레트·해시
 */

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
