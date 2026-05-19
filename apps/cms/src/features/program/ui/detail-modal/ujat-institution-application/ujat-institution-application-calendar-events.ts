import type { UjatInstitutionApplicationRow } from './ujat-institution-application-types'
import { UJAT_INSTITUTION_SCHEDULE_COLUMNS } from './ujat-institution-application-types'

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
      const dateIso = col.isoDate
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
