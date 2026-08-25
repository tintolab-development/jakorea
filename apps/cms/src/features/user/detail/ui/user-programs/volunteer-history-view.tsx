import { MemberProgramLectureHistory } from '../member-program-lecture-history'
import type { RendererProps } from '../user-programs-view-renderer'

export function VolunteerHistoryView({
  user,
  volunteerHistories,
  volunteerHistoriesLoading,
  showCertificateBulkIssue,
  onOpenVolunteerProgramDetail,
  onBulkDeleteHistory,
  onVolunteerCertificateBulkIssue,
  onStudentCertificateBulkIssue,
}: RendererProps) {
  return (
    <MemberProgramLectureHistory
      mode="volunteerProgram"
      volunteerHistories={volunteerHistories}
      loading={volunteerHistoriesLoading}
      memberId={user.memberId}
      showCertificateBulkIssue={showCertificateBulkIssue}
      onVolunteerRowClick={onOpenVolunteerProgramDetail}
      onBulkDelete={onBulkDeleteHistory}
      onCertificateIssue={onVolunteerCertificateBulkIssue}
      onStudentCertificateIssue={onStudentCertificateBulkIssue}
    />
  )
}
