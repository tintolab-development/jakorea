import type { LectureReportStatus } from '../api/lecture-report-client'

export type LectureReportAction = 'disabled' | 'write' | 'read' | 'closed'

export function resolveLectureReportAction(
  status: LectureReportStatus | undefined,
  canSubmit: boolean,
): LectureReportAction {
  if (status === 'SUBMITTED') return 'read'
  if (status === 'BUSINESS_ENDED') return 'closed'
  if (status === 'UPCOMING') return 'disabled'
  if ((status === 'AVAILABLE' || status === 'OVERDUE') && canSubmit) return 'write'
  return 'disabled'
}

export function clampLectureReportPage(page: number, totalPages: number): number {
  if (totalPages <= 0) return 0
  return Math.max(0, Math.min(page, totalPages - 1))
}
