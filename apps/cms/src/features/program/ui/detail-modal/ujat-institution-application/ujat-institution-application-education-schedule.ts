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

const FRIDAY_ISO_DATES = listFridayIsoDatesInPeriod(
  UJAT_INSTITUTION_EDUCATION_PERIOD_MOCK.startDate,
  UJAT_INSTITUTION_EDUCATION_PERIOD_MOCK.endDate
)

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
