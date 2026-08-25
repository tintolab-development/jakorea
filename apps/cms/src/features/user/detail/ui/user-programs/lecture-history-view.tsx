import { MemberProgramLectureHistory } from '../member-program-lecture-history'
import type { RendererProps } from '../user-programs-view-renderer'

export function LectureHistoryView({
  user,
  applications,
  loading,
  onRowClick,
  onBulkDeleteHistory,
  onVolunteerCertificateBulkIssue,
}: RendererProps) {
  return (
    <MemberProgramLectureHistory
      applications={applications}
      loading={loading}
      memberId={user.memberId}
      onRowClick={onRowClick}
      onBulkDelete={onBulkDeleteHistory}
      onCertificateIssue={onVolunteerCertificateBulkIssue}
    />
  )
}
