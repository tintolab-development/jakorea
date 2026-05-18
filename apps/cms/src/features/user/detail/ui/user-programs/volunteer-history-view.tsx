import { MemberProgramLectureHistory } from '../member-program-lecture-history'
import type { RendererProps } from '../user-programs-view-renderer'

export function VolunteerHistoryView({
  volunteerHistories,
  volunteerHistoriesLoading,
  showCertificateBulkIssue,
}: RendererProps) {
  return (
    <MemberProgramLectureHistory
      mode="volunteerProgram"
      volunteerHistories={volunteerHistories}
      loading={volunteerHistoriesLoading}
      showCertificateBulkIssue={showCertificateBulkIssue}
      onVolunteerRowClick={() => {
        }}
      onVolunteerCertificateDownload={() => {
        window.alert('준비 중입니다.')
      }}
    />
  )
}
