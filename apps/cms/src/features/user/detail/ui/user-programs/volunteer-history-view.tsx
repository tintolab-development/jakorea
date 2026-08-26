import { MemberProgramLectureHistory } from '../member-program-lecture-history'
import { memberShowsVolunteerHistoryCertificateBulkIssue } from '../../lib/member-program-history-certificate-bulk-issue'
import type { RendererProps } from '../user-programs-view-renderer'

export function VolunteerHistoryView({
  user,
  volunteerHistories,
  volunteerHistoriesLoading,
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
      showCertificateBulkIssue={memberShowsVolunteerHistoryCertificateBulkIssue(user)}
      onVolunteerRowClick={onOpenVolunteerProgramDetail}
      onBulkDelete={onBulkDeleteHistory}
      onCertificateIssue={onVolunteerCertificateBulkIssue}
      onStudentCertificateIssue={onStudentCertificateBulkIssue}
    />
  )
}
