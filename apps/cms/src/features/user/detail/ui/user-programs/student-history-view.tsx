import { MemberProgramLectureHistory } from '../member-program-lecture-history'
import type { RendererProps } from '../user-programs-view-renderer'

export function StudentHistoryView({
  applications,
  loading,
  showCertificateBulkIssue,
  onRowClick,
  onOpenLectureAttendance,
  onOpenAssignment,
}: RendererProps) {
  return (
    <MemberProgramLectureHistory
      mode="studentEnrollment"
      applications={applications}
      loading={loading}
      showCertificateBulkIssue={showCertificateBulkIssue}
      onRowClick={onRowClick}
      onOpenAttendance={onOpenLectureAttendance}
      onOpenAssignment={onOpenAssignment}
      onDownloadCertificate={() => {
        window.alert('준비 중입니다.')
      }}
    />
  )
}
