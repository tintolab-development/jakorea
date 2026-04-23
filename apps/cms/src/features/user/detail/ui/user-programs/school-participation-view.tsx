import { message } from 'antd'
import { MemberProgramLectureHistory } from '../member-program-lecture-history'
import type { RendererProps } from '../user-programs-view-renderer'

export function SchoolParticipationView({
  enrollmentTableRows,
  loading,
  showCertificateBulkIssue,
  onRowClick,
}: RendererProps) {
  const applications = enrollmentTableRows
  return (
    <MemberProgramLectureHistory
      mode="schoolProgramParticipation"
      applications={applications}
      loading={loading}
      showCertificateBulkIssue={showCertificateBulkIssue}
      onRowClick={onRowClick}
      onBulkDelete={() => {
        message.info('이력 삭제는 추후 연결됩니다.')
      }}
    />
  )
}
