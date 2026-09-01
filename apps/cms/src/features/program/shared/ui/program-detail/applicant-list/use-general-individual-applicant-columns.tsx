import { useMemo } from 'react'
import type { ColumnsType } from 'antd/es/table'
import { ApprovalStatusText } from '@/shared/components/approval-status-text'
import type { ApprovalStatusKey } from '@/shared/components/approval-status-badge'
import type { GeneralIndividualApplicantRow } from '@/data/mock/general-individual-applications-mock'
import type { InstitutionApplicationProgramBridge } from '@/features/program/general/lib/institution-application-program-bridge'
import {
  getInstitutionApplicationSessionsTableSlice,
  shouldShowInstitutionApplicationSessionsColumn,
} from '@/features/program/general/lib/institution-application-session-display'
import { GeneralDetailSessionLine } from './general-detail-session-line'

const GENERAL_DETAIL_INDIVIDUAL_TEXT_COL_MIN_WIDTH = 185
const GENERAL_DETAIL_INDIVIDUAL_TEXT_COL_WIDTH_WITHOUT_SESSIONS = 305
const GENERAL_DETAIL_INDIVIDUAL_GRADE_COL_WIDTH = 120
const GENERAL_DETAIL_INDIVIDUAL_SESSIONS_COL_MIN_WIDTH = 360
const GENERAL_DETAIL_INDIVIDUAL_APPROVAL_COL_WIDTH = 180

export function useGeneralIndividualApplicantColumns(
  programBridge?: InstitutionApplicationProgramBridge | null
): ColumnsType<GeneralIndividualApplicantRow> {
  const showSessionsColumn =
    programBridge == null || shouldShowInstitutionApplicationSessionsColumn(programBridge)
  const textColWidth = showSessionsColumn
    ? GENERAL_DETAIL_INDIVIDUAL_TEXT_COL_MIN_WIDTH
    : GENERAL_DETAIL_INDIVIDUAL_TEXT_COL_WIDTH_WITHOUT_SESSIONS

  return useMemo(() => {
    const columns: ColumnsType<GeneralIndividualApplicantRow> = [
      { title: 'No.', dataIndex: 'no', key: 'no', width: '64px', align: 'center' },
      {
        title: '신청자명',
        dataIndex: 'applicantName',
        key: 'applicantName',
        width: textColWidth,
        minWidth: textColWidth,
        align: 'center',
        ellipsis: true,
      },
      {
        title: '소속',
        dataIndex: 'affiliation',
        key: 'affiliation',
        width: textColWidth,
        minWidth: textColWidth,
        align: 'center',
        ellipsis: true,
      },
      {
        title: '신청 학년',
        dataIndex: 'educationGrade',
        key: 'educationGrade',
        width: GENERAL_DETAIL_INDIVIDUAL_GRADE_COL_WIDTH,
        minWidth: GENERAL_DETAIL_INDIVIDUAL_GRADE_COL_WIDTH,
        align: 'center',
      },
      {
        title: '자택 주소지',
        dataIndex: 'homeAddress',
        key: 'homeAddress',
        width: textColWidth,
        minWidth: textColWidth,
        align: 'center',
        ellipsis: true,
      },
      {
        title: '프로그램 승인 현황',
        dataIndex: 'approvalStatus',
        key: 'approvalStatus',
        width: GENERAL_DETAIL_INDIVIDUAL_APPROVAL_COL_WIDTH,
        minWidth: GENERAL_DETAIL_INDIVIDUAL_APPROVAL_COL_WIDTH,
        align: 'center',
        render: (status: ApprovalStatusKey) =>
          status ? <ApprovalStatusText status={status} /> : '-',
      },
      {
        title: '진행 희망 교육 일정',
        key: 'sessions',
        width: GENERAL_DETAIL_INDIVIDUAL_SESSIONS_COL_MIN_WIDTH,
        minWidth: GENERAL_DETAIL_INDIVIDUAL_SESSIONS_COL_MIN_WIDTH,
        align: 'center',
        className: 'applicant-details__th-sessions',
        onHeaderCell: () => ({ className: 'applicant-details__th-sessions' }),
        onCell: () => ({
          className: 'applicant-details__td-sessions applicant-details__td-sessions--center',
        }),
        render: (_: unknown, record: GeneralIndividualApplicantRow) => {
          const sessions = record.sessions ?? []
          if (sessions.length === 0) return '-'
          const { displaySessions, restCount } =
            getInstitutionApplicationSessionsTableSlice(sessions)
          return (
            <div className="applicant-details__sessions-cell">
              {displaySessions.map(s => (
                <div key={s.round} className="applicant-details__session-line">
                  <GeneralDetailSessionLine session={s} bridge={programBridge} />
                </div>
              ))}
              {restCount > 0 && (
                <div className="applicant-details__session-more">외 {restCount}개의 교육 일정</div>
              )}
            </div>
          )
        },
      },
    ]

    return showSessionsColumn ? columns : columns.filter(column => column.key !== 'sessions')
  }, [programBridge, showSessionsColumn, textColWidth])
}
