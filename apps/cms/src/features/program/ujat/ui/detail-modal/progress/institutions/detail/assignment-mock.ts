type VolunteerSlot = {
  volunteerA: string | null
  volunteerB: string | null
}

type ScheduleClassKey = `${string}:${string}:${string}:${number}`

function classKey(
  institutionId: string,
  isoDate: string,
  gradeLabel: string,
  classNo: number
): ScheduleClassKey {
  return `${institutionId}:${isoDate}:${gradeLabel}:${classNo}`
}

/** 출결 담당자 — null이면 UI에서 「미정」 */
const ATTENDANCE_MANAGER_BY_SCHEDULE: Record<string, string | null> = {
  'gwangju-jinwol:2026-04-03': '고종욱',
  'gwangju-jinwol:2026-04-17': null,
}

const VOLUNTEER_BY_CLASS: Partial<Record<ScheduleClassKey, VolunteerSlot>> = {
  // 2026-04-03 — 1학년 1~6반 (스크린샷 시안)
  'gwangju-jinwol:2026-04-03:1학년:1': { volunteerA: '오지현', volunteerB: '박서현' },
  'gwangju-jinwol:2026-04-03:1학년:2': { volunteerA: '동지현', volunteerB: '노가현' },
  'gwangju-jinwol:2026-04-03:1학년:3': { volunteerA: '박지현', volunteerB: '김지현' },
  'gwangju-jinwol:2026-04-03:1학년:4': { volunteerA: '이지현', volunteerB: '최지현' },
  'gwangju-jinwol:2026-04-03:1학년:5': { volunteerA: '정지현', volunteerB: '한지현' },
  'gwangju-jinwol:2026-04-03:1학년:6': { volunteerA: '윤지현', volunteerB: '서지현' },
  // 2026-04-17 — 1학년 7~8반, 2학년 1~4반 (일부 미배정)
  'gwangju-jinwol:2026-04-17:1학년:7': { volunteerA: '오지현', volunteerB: null },
  'gwangju-jinwol:2026-04-17:1학년:8': { volunteerA: null, volunteerB: null },
  'gwangju-jinwol:2026-04-17:2학년:1': { volunteerA: '김민수', volunteerB: '이수진' },
  'gwangju-jinwol:2026-04-17:2학년:2': { volunteerA: '박서준', volunteerB: null },
  'gwangju-jinwol:2026-04-17:2학년:3': { volunteerA: null, volunteerB: null },
  'gwangju-jinwol:2026-04-17:2학년:4': { volunteerA: '최유진', volunteerB: '정하늘' },
}

function scheduleKey(institutionId: string, isoDate: string): string {
  return `${institutionId}:${isoDate}`
}

export function getAttendanceManagerForSchedule(
  institutionId: string,
  isoDate: string
): string | null {
  return ATTENDANCE_MANAGER_BY_SCHEDULE[scheduleKey(institutionId, isoDate)] ?? null
}

export function getVolunteersForClass(
  institutionId: string,
  isoDate: string,
  gradeLabel: string,
  classNo: number
): { volunteerA: string; volunteerB: string } {
  const slot = VOLUNTEER_BY_CLASS[classKey(institutionId, isoDate, gradeLabel, classNo)]
  return {
    volunteerA: slot?.volunteerA ?? '-',
    volunteerB: slot?.volunteerB ?? '-',
  }
}
