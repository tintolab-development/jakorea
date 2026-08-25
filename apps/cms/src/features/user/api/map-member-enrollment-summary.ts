import type { MemberEnrollmentSummaryResponse } from '@/shared/api/generated/members/schemas/memberEnrollmentSummaryResponse'
import type { Application } from '@/types/domain'

export function applyEnrollmentSummaryToApplication(
  application: Application,
  summary: MemberEnrollmentSummaryResponse
): Application {
  return {
    ...application,
    lectureAttendance: summary.lectureAttendance?.trim() || application.lectureAttendance,
    hasAssignmentSubmission:
      summary.hasAssignmentSubmission ?? application.hasAssignmentSubmission,
    hasLectureReportSubmission:
      summary.hasLectureReportSubmission ?? application.hasLectureReportSubmission,
    managerName: summary.managerName?.trim() || application.managerName,
  }
}
