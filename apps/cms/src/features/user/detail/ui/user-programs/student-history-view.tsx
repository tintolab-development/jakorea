import { MemberProgramLectureHistory } from '../member-program-lecture-history'
import type { RendererProps } from '../user-programs-view-renderer'

export function StudentHistoryView({
  user,
  enrollmentTableRows,
  loading,
  showCertificateBulkIssue,
  onRowClick,
  onOpenLectureAttendance,
  onOpenAssignment,
  onBulkDeleteHistory,
  onStudentCertificateBulkIssue,
}: RendererProps) {
  return (
    <MemberProgramLectureHistory
      mode="studentEnrollment"
      applications={enrollmentTableRows}
      loading={loading}
      memberId={user.memberId}
      showCertificateBulkIssue={showCertificateBulkIssue}
      onRowClick={onRowClick}
      onOpenAttendance={onOpenLectureAttendance}
      onOpenAssignment={onOpenAssignment}
      onBulkDelete={onBulkDeleteHistory}
      onCertificateIssue={onStudentCertificateBulkIssue}
    />
  )
}
