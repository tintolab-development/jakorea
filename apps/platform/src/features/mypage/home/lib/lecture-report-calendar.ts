export const PORTAL_LECTURE_REPORT_DEADLINE_EVENT_TYPE = 'LECTURE_REPORT_DEADLINE'

const DEADLINE_EVENT_TYPE_COMPACT = 'LECTUREREPORTDEADLINE'

export function isPortalLectureReportDeadlineEventType(value: string | undefined): boolean {
  const compact = value?.trim().toUpperCase().replace(/[-_\s]/g, '')
  return compact === DEADLINE_EVENT_TYPE_COMPACT
}

export function lectureReportDeadlineCalendarTitle(scheduleName: string | undefined): string {
  return scheduleName?.trim() || '강의보고서 제출 마감'
}
