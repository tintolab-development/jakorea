import type { UjatInstitutionApplicationRow } from './types'

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
    .map(g => {
      const label = g.gradeLabel.trim()
      const hasLabel = Boolean(label) && label !== '-'
      if (g.classCount == null) return hasLabel ? label : ''
      if (!hasLabel) return `${g.classCount}학급`
      return `${label} ${g.classCount}학급`
    })
    .filter(Boolean)
    .join(', ')
  const calendarTotalClassSummary =
    row.totalClassCount == null ? '-' : `총 ${row.totalClassCount}개 학급`
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
    for (const [dateIso, mark] of Object.entries(row.scheduleSlots)) {
      if (mark !== 'O') continue
      events.push({
        id: `${row.id}-${dateIso}`,
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
