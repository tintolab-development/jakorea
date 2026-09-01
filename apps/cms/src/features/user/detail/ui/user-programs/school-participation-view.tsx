import { MemberProgramLectureHistory } from '../member-program-lecture-history'
import type { RendererProps } from '../user-programs-view-renderer'

export function SchoolParticipationView({
  enrollmentTableRows,
  loading,
  showCertificateBulkIssue,
  programsHistoryConfig,
  onRowClick,
  onBulkDeleteHistory,
  onStudentCertificateBulkIssue,
}: RendererProps) {
  const applications = enrollmentTableRows
  return (
    <MemberProgramLectureHistory
      mode="schoolProgramParticipation"
      applications={applications}
      loading={loading}
      summaryTitle={programsHistoryConfig.enrollmentSectionTitle}
      showCertificateBulkIssue={showCertificateBulkIssue}
      onRowClick={onRowClick}
      onBulkDelete={onBulkDeleteHistory}
      onCertificateIssue={onStudentCertificateBulkIssue}
    />
  )
}
