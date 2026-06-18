import dayjs from 'dayjs'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'

dayjs.extend(isSameOrBefore)

/**
 * 관리자가 프로그램 등록 시 설정한 교육 일정 기간(mock).
 * 실 API 연동 시 프로그램 교육 시작·종료일로 대체.
 */
export const UJAT_INSTITUTION_EDUCATION_PERIOD_MOCK = {
  startDate: '2026-04-03',
  endDate: '2026-06-19',
} as const

/** 프로그램 등록 시 선택한 교육 진행 불가일(mock) — 임시 배정 화면에서 금요일 목록 제외 */
export const UJAT_INSTITUTION_EDUCATION_UNAVAILABLE_MOCK = [
  '2026-05-15',
  '2026-06-12',
] as const

export const UJAT_INSTITUTION_EDUCATION_PERIOD_H2_MOCK = {
  startDate: '2026-09-11',
  endDate: '2026-11-20',
} as const

export const UJAT_INSTITUTION_EDUCATION_UNAVAILABLE_H2_MOCK = [
  '2026-10-23',
  '2026-10-30',
] as const

export type UjatInstitutionEducationSemesterKey = 'h1' | 'h2'

export function listAssignableFridayIsoDatesInPeriod(
  startDate: string,
  endDate: string,
  unavailableIsoDates: readonly string[] = []
): string[] {
  const blocked = new Set(unavailableIsoDates)
  return listFridayIsoDatesInPeriod(startDate, endDate).filter(iso => !blocked.has(iso))
}

export function resolveEducationSemesterForIsoDate(isoDate: string): UjatInstitutionEducationSemesterKey {
  const d = dayjs(isoDate)
  const h1Start = dayjs(UJAT_INSTITUTION_EDUCATION_PERIOD_MOCK.startDate)
  const h1End = dayjs(UJAT_INSTITUTION_EDUCATION_PERIOD_MOCK.endDate)
  if (!d.isBefore(h1Start, 'day') && !d.isAfter(h1End, 'day')) {
    return 'h1'
  }
  return 'h2'
}

/** 신청 기관 목록 — 상·하반기 구분 없이 교육 일정 기간 내 모든 금요일 */
const FRIDAY_ISO_DATES = [
  ...listFridayIsoDatesInPeriod(
    UJAT_INSTITUTION_EDUCATION_PERIOD_MOCK.startDate,
    UJAT_INSTITUTION_EDUCATION_PERIOD_MOCK.endDate
  ),
  ...listFridayIsoDatesInPeriod(
    UJAT_INSTITUTION_EDUCATION_PERIOD_H2_MOCK.startDate,
    UJAT_INSTITUTION_EDUCATION_PERIOD_H2_MOCK.endDate
  ),
]

/** 임시 배정 화면 — 1학기(상반기) 금요일만, 불가일 제외 */
export const UJAT_INSTITUTION_SCHEDULE_ASSIGN_DATES = listAssignableFridayIsoDatesInPeriod(
  UJAT_INSTITUTION_EDUCATION_PERIOD_MOCK.startDate,
  UJAT_INSTITUTION_EDUCATION_PERIOD_MOCK.endDate,
  UJAT_INSTITUTION_EDUCATION_UNAVAILABLE_MOCK
).map(iso => ({
  isoDate: iso,
  title: formatScheduleColumnTitle(iso),
  semester: 'h1' as const,
}))

export type UjatInstitutionScheduleSlotKey = (typeof FRIDAY_ISO_DATES)[number]

/** 교육 일정 기간 내 모든 금요일 — 테이블 「교육 일자」 열 */
export const UJAT_INSTITUTION_SCHEDULE_COLUMNS: ReadonlyArray<{
  key: UjatInstitutionScheduleSlotKey
  title: string
  isoDate: UjatInstitutionScheduleSlotKey
}> = FRIDAY_ISO_DATES.map(iso => ({
  key: iso,
  title: formatScheduleColumnTitle(iso),
  isoDate: iso,
}))

export function listFridayIsoDatesInPeriod(startDate: string, endDate: string): string[] {
  const start = dayjs(startDate).startOf('day')
  const end = dayjs(endDate).startOf('day')
  if (end.isBefore(start, 'day')) return []

  let cursor = start
  while (cursor.day() !== 5) {
    cursor = cursor.add(1, 'day')
    if (cursor.isAfter(end, 'day')) return []
  }

  const out: string[] = []
  while (cursor.isSameOrBefore(end, 'day')) {
    out.push(cursor.format('YYYY-MM-DD'))
    cursor = cursor.add(7, 'day')
  }
  return out
}

function formatScheduleColumnTitle(isoDate: string): string {
  const d = dayjs(isoDate)
  return `${d.month() + 1}월 ${d.date()}일`
}

/** 교육 진행 희망일 등 표시용 — `26년 4월 24일(금)` */
export function formatUjatInstitutionFridayDisplay(isoDate: string): string {
  const d = dayjs(isoDate)
  const yy = String(d.year()).slice(-2)
  return `${yy}년 ${d.month() + 1}월 ${d.date()}일(금)`
}

export function sumGradeClassCounts(
  gradeClassCounts: ReadonlyArray<{ classCount: number }>
): number {
  return gradeClassCounts.reduce((sum, g) => sum + g.classCount, 0)
}

export function buildEmptyScheduleSlots(): Record<UjatInstitutionScheduleSlotKey, 'O' | '-'> {
  return Object.fromEntries(
    UJAT_INSTITUTION_SCHEDULE_COLUMNS.map(col => [col.key, '-'])
  ) as Record<UjatInstitutionScheduleSlotKey, 'O' | '-'>
}
