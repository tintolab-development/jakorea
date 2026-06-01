import { useMemo } from 'react'
import type { ColumnsType } from 'antd/es/table'
import { ApprovalStatusText } from '@/shared/components/approval-status-text'
import type { ApprovalStatusKey } from '@/shared/components/approval-status-badge'
import type { GeneralIndividualApplicantRow } from '@/data/mock/general-individual-applications-mock'
import { GeneralDetailSessionLine } from './general-detail-session-line'

export function useGeneralIndividualApplicantColumns(): ColumnsType<GeneralIndividualApplicantRow> {
  return useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: '64px', align: 'center' },
      {
        title: '신청자명',
        dataIndex: 'applicantName',
        key: 'applicantName',
        align: 'center',
      },
      {
        title: '소속',
        dataIndex: 'affiliation',
        key: 'affiliation',
        align: 'center',
        ellipsis: true,
      },
      {
        title: '신청 학년',
        dataIndex: 'educationGrade',
        key: 'educationGrade',
        align: 'center',
      },
      {
        title: '자택 주소지',
        dataIndex: 'homeAddress',
        key: 'homeAddress',
        align: 'center',
        ellipsis: true,
      },
      {
        title: '프로그램 승인 현황',
        dataIndex: 'approvalStatus',
        key: 'approvalStatus',
        width: '180px',
        align: 'center',
        render: (status: ApprovalStatusKey) =>
          status ? <ApprovalStatusText status={status} /> : '-',
      },
      {
        title: '진행 희망 교육 일정',
        key: 'sessions',
        width: '480px',
        align: 'center',
        className: 'applicant-details__th-sessions',
        onHeaderCell: () => ({ className: 'applicant-details__th-sessions' }),
        onCell: () => ({
          className:
            'applicant-details__td-sessions applicant-details__td-sessions--center',
        }),
        render: (_: unknown, record: GeneralIndividualApplicantRow) => {
          const sessions = record.sessions ?? []
          const total = sessions.length
          const showCount = total <= 3 ? total : 2
          const displaySessions = sessions.slice(0, showCount)
          const restCount = total - showCount
          return (
            <div className="applicant-details__sessions-cell">
              {displaySessions.map(s => (
                <div key={s.round} className="applicant-details__session-line">
                  <GeneralDetailSessionLine session={s} />
                </div>
              ))}
              {restCount > 0 && (
                <div className="applicant-details__session-more">외 {restCount}개의 교육 일정</div>
              )}
            </div>
          )
        },
      },
    ],
    []
  )
}
