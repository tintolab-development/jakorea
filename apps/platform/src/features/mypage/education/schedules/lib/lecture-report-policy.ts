import type { LectureReportStatus } from '../api/lecture-report-client'

export type LectureReportAction = 'disabled' | 'write' | 'read' | 'closed'

export const LECTURE_REPORT_OVERDUE_CAN_SUBMIT_NOTICE =
  '제출 기한이 지났지만 사업 운영기간 내에는 제출할 수 있습니다. 기한 이후 제출 시 JA 강사 평가에서 감점이 적용될 수 있습니다.'

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

export function shouldShowLectureReportOverdueWarning(
  status: LectureReportStatus | undefined,
  canSubmit: boolean,
): boolean {
  return status === 'OVERDUE' && canSubmit
}

/** 서버가 감점 수치를 줄 때만 숫자를 붙인다. FE에서 감점을 계산하지 않는다. */
export function lectureReportOverdueWarningText(penaltyPoints?: number | null): string {
  if (typeof penaltyPoints === 'number' && Number.isFinite(penaltyPoints) && penaltyPoints !== 0) {
    return `${LECTURE_REPORT_OVERDUE_CAN_SUBMIT_NOTICE} 현재 반영된 감점은 ${penaltyPoints}점입니다.`
  }
  return LECTURE_REPORT_OVERDUE_CAN_SUBMIT_NOTICE
}

export function clampLectureReportPage(page: number, totalPages: number): number {
  if (totalPages <= 0) return 0
  return Math.max(0, Math.min(page, totalPages - 1))
}
