import { message } from 'antd'
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
        message.info('봉사 프로그램 상세는 추후 연결됩니다.')
      }}
      onVolunteerCertificateDownload={() => {
        window.alert('준비 중입니다.')
      }}
    />
  )
}
