import {
  UJAT_INSTITUTION_SCHEDULE_CONFIRM_CALENDAR_STATUS_LABEL,
  type UjatScheduleConfirmRow,
} from './types'

export type UjatScheduleConfirmCalendarOriginalItem = UjatScheduleConfirmRow & {
  schoolName: string
  calendarTotalClassSummary: string
  calendarScheduleDetail: string
}

export type UjatScheduleConfirmCalendarEvent = {
  id: string
  title: string
  startDate: string
  endDate: string
  originalItem: UjatScheduleConfirmCalendarOriginalItem
}

function formatCalendarMeta(row: UjatScheduleConfirmRow): {
  calendarTotalClassSummary: string
  calendarScheduleDetail: string
} {
  const calendarTotalClassSummary =
    row.totalEducationClassCount > 0 ? `총 ${row.totalEducationClassCount}개 학급` : ''
  const calendarScheduleDetail =
    row.confirmedScheduleDisplay !== '-' ? row.confirmedScheduleDisplay : ''
  return { calendarTotalClassSummary, calendarScheduleDetail }
}

export function buildUjatScheduleConfirmCalendarEvents(
  rows: UjatScheduleConfirmRow[]
): UjatScheduleConfirmCalendarEvent[] {
  const events: UjatScheduleConfirmCalendarEvent[] = []

  for (const row of rows) {
    const meta = formatCalendarMeta(row)
    for (const isoDate of row.confirmedScheduleIsoDates) {
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

export function toScheduleConfirmCalendarListRow(
  item: UjatScheduleConfirmCalendarOriginalItem
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
    statusLabel:
      UJAT_INSTITUTION_SCHEDULE_CONFIRM_CALENDAR_STATUS_LABEL[item.scheduleConfirmStatus],
    statusKey: item.scheduleConfirmStatus,
    totalClassSummary: item.calendarTotalClassSummary,
    gradeDetail: item.calendarScheduleDetail,
  }
}
