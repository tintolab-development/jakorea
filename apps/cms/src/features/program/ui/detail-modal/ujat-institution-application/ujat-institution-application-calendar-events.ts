import type {
  UjatInstitutionApplicationRow,
  UjatInstitutionScheduleSlotKey,
} from './ujat-institution-application-types'
import { UJAT_INSTITUTION_SCHEDULE_COLUMNS } from './ujat-institution-application-types'

const SLOT_TO_ISO_DATE: Record<UjatInstitutionScheduleSlotKey, string> = {
  apr03: '2026-04-03',
  apr17: '2026-04-17',
  apr24: '2026-04-24',
  may01: '2026-05-01',
  may08: '2026-05-08',
  may15: '2026-05-15',
  may22: '2026-05-22',
  may29: '2026-05-29',
  jun05: '2026-06-05',
  jun12: '2026-06-12',
  jun19: '2026-06-19',
}

export type UjatInstitutionCalendarOriginalItem = UjatInstitutionApplicationRow & {
  schoolName: string
  /** 툴팁 등 — `총 N개 학급 | 학년별 상세` */
  calendarGradeSummary: string
  calendarTotalClassSummary: string
  calendarGradeDetail: string
}

export type UjatInstitutionCalendarEvent = {
  id: string
  title: string
  startDate: string
  endDate: string
  originalItem: UjatInstitutionCalendarOriginalItem
}

function formatGradeSummaries(row: UjatInstitutionApplicationRow): {
  calendarTotalClassSummary: string
  calendarGradeDetail: string
  calendarGradeSummary: string
} {
  const gradeDetail = row.gradeClassCounts
    .map(g => `${g.gradeLabel} ${g.classCount}학급`)
    .join(', ')
  const calendarTotalClassSummary = `총 ${row.totalClassCount}개 학급`
  return {
    calendarTotalClassSummary,
    calendarGradeDetail: gradeDetail,
    calendarGradeSummary: gradeDetail
      ? `${calendarTotalClassSummary} | ${gradeDetail}`
      : calendarTotalClassSummary,
  }
}

export function buildUjatInstitutionApplicationCalendarEvents(
  rows: UjatInstitutionApplicationRow[]
): UjatInstitutionCalendarEvent[] {
  const events: UjatInstitutionCalendarEvent[] = []

  for (const row of rows) {
    for (const col of UJAT_INSTITUTION_SCHEDULE_COLUMNS) {
      if (row.scheduleSlots[col.key] !== 'O') continue
      const dateIso = SLOT_TO_ISO_DATE[col.key]
      events.push({
        id: `${row.id}-${col.key}`,
        title: row.institutionName,
        startDate: `${dateIso}T00:00:00`,
        endDate: `${dateIso}T00:00:00`,
        originalItem: {
          ...row,
          schoolName: row.institutionName,
          ...formatGradeSummaries(row),
        },
      })
    }
  }

  return events
}
