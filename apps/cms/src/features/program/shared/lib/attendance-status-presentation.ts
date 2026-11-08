/**
 * 출석 현황·수료 여부 Text 표현 정본 (Figma Status / Text / 출석 현황 14804:19647 · 수료 여부 14804:19658).
 * 라벨은 호출처(업무 라벨·서버 원문)를 그대로 쓰고, 색만 여기서 정한다. 상태 판정·전이는 다루지 않는다.
 */

export type ProgramAttendanceStatusTextKind =
  | 'present'
  | 'late'
  | 'absent'
  | 'excused_absence'
  | 'withdrawn'
  | 'pending'
  | 'dash'

const NEUTRAL = 'var(--Netural-black, #3d3d3d)'
const RED = 'var(--Status-red-main, #c32f4a)'
const BLUE = 'var(--Status-blue-main, #017eaf)'

const ATTENDANCE_TEXT_ACCENT: Record<ProgramAttendanceStatusTextKind, string> = {
  present: NEUTRAL,
  late: RED,
  absent: RED,
  excused_absence: BLUE,
  /** 활동 포기 — 출석 시안에 없음. 기존 적색 유지 */
  withdrawn: RED,
  /** 미기록 `-` — 시안 `-`는 기본 검정 */
  pending: NEUTRAL,
  dash: NEUTRAL,
}

export function getProgramAttendanceTextPresentation<L>(
  kind: ProgramAttendanceStatusTextKind,
  label: L,
  lateTime?: string
): { label: L | string; accentColor: string } {
  const accentColor = ATTENDANCE_TEXT_ACCENT[kind]
  if (kind === 'pending' || kind === 'dash') return { label: '-', accentColor }
  if ((kind === 'late' || kind === 'absent') && lateTime) {
    return { label: `지각 (${lateTime})`, accentColor }
  }
  return { label, accentColor }
}

/** 수료 여부 — 라벨 기준(수료 불가·수료 불가(활동 포기) 적색, 수료 완료 청색, 그 외 검정) */
export function getProgramCompletionTextPresentation(label: string): { label: string; accentColor: string } {
  const accentColor = label.startsWith('수료 불가') ? RED : label === '수료 완료' ? BLUE : NEUTRAL
  return { label, accentColor }
}
