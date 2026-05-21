import type { UjatEducationProgressInstitutionRow } from './types'

export type UjatEducationProgressInstitutionCalendarOriginalItem =
  UjatEducationProgressInstitutionRow & {
    schoolName: string
    calendarTotalClassSummary: string
    calendarScheduleDetail: string
  }

export type UjatEducationProgressInstitutionCalendarEvent = {
  id: string
  title: string
  startDate: string
  endDate: string
  originalItem: UjatEducationProgressInstitutionCalendarOriginalItem
}

function formatCalendarMeta(row: UjatEducationProgressInstitutionRow): {
  calendarTotalClassSummary: string
  calendarScheduleDetail: string
} {
  const calendarTotalClassSummary =
    row.totalEducationClassCount > 0 ? `총 ${row.totalEducationClassCount}개 학급` : ''
  const calendarScheduleDetail =
    row.educationScheduleDisplay !== '-' ? row.educationScheduleDisplay : ''
  return { calendarTotalClassSummary, calendarScheduleDetail }
}

export function buildUjatEducationProgressInstitutionCalendarEvents(
  rows: UjatEducationProgressInstitutionRow[]
): UjatEducationProgressInstitutionCalendarEvent[] {
  const events: UjatEducationProgressInstitutionCalendarEvent[] = []

  for (const row of rows) {
    const meta = formatCalendarMeta(row)
    for (const isoDate of row.educationScheduleIsoDates) {
      events.push({
        id: `${row.id}-${isoDate}`,
        title: row.institutionName,
        startDate: `${isoDate}T00:00:00`,
        endDate: `${isoDate}T00:00:00`,
        originalItem: {
          ...row,
          schoolName: row.institutionName,
          ...meta,
        },
      })
    }
  }

  return events
}

export function toEducationProgressInstitutionCalendarListRow(
  item: UjatEducationProgressInstitutionCalendarOriginalItem
): {
  id: string
  institutionName: string
  statusLabel: string
  statusKey: string
  totalClassSummary: string
  gradeDetail: string
} {
  return {
    id: item.id,
    institutionName: item.institutionName,
    statusLabel: item.educationRegion,
    statusKey: item.regionKey,
    totalClassSummary: item.calendarTotalClassSummary,
    gradeDetail: item.calendarScheduleDetail,
  }
}
