import { useMemo } from 'react'
import type { ColumnsType } from 'antd/es/table'
import type { ParticipatingIndividualParticipantRow } from '@/data/mock/participating-individual-participants'
import type { InstitutionApplicationProgramBridge } from '@/features/program/general/lib/institution-application-program-bridge'
import {
  getInstitutionApplicationSessionsTableSlice,
  shouldShowInstitutionApplicationSessionsColumn,
} from '@/features/program/general/lib/institution-application-session-display'
import { PARTICIPATING_INSTITUTIONS_SESSIONS_COLUMN_WIDTH } from '@/features/program/general/lib/participating-institutions-table'
import { CMS_TABLE_NO_COL_CLASS } from '@/shared/constants/table'
import { GeneralDetailSessionLine } from '@/features/program/shared/ui/program-detail/applicant-list/general-detail-session-line'

const PARTICIPANT_NAME_COL_WIDTH = 120
const AFFILIATION_COL_WIDTH = 160
const GRADE_COL_WIDTH = 120
const HOME_ADDRESS_COL_WIDTH = 200

export const PARTICIPATING_INDIVIDUAL_PARTICIPANTS_TABLE_MIN_SCROLL_X =
  48 +
  64 +
  PARTICIPANT_NAME_COL_WIDTH +
  AFFILIATION_COL_WIDTH +
  GRADE_COL_WIDTH +
  HOME_ADDRESS_COL_WIDTH +
  PARTICIPATING_INSTITUTIONS_SESSIONS_COLUMN_WIDTH

export function useParticipatingIndividualParticipantColumns(
  programBridge?: InstitutionApplicationProgramBridge | null
): ColumnsType<ParticipatingIndividualParticipantRow> {
  const showSessionsColumn =
    programBridge == null || shouldShowInstitutionApplicationSessionsColumn(programBridge)

  return useMemo(() => {
    const columns: ColumnsType<ParticipatingIndividualParticipantRow> = [
      {
        title: 'No.',
        dataIndex: 'no',
        key: 'no',
        width: 64,
        align: 'center',
        className: CMS_TABLE_NO_COL_CLASS,
      },
      {
        title: '참여자명',
        dataIndex: 'applicantName',
        key: 'participantName',
        width: PARTICIPANT_NAME_COL_WIDTH,
        align: 'center',
        ellipsis: true,
      },
      {
        title: '소속',
        dataIndex: 'affiliation',
        key: 'affiliation',
        width: AFFILIATION_COL_WIDTH,
        align: 'center',
        ellipsis: true,
      },
      {
        title: '교육 학년',
        dataIndex: 'educationGrade',
        key: 'educationGrade',
        width: GRADE_COL_WIDTH,
        align: 'center',
      },
      {
        title: '자택 주소지',
        dataIndex: 'homeAddress',
        key: 'homeAddress',
        width: HOME_ADDRESS_COL_WIDTH,
        align: 'center',
        ellipsis: true,
      },
      {
        title: '교육 진행 일정',
        key: 'sessions',
        width: PARTICIPATING_INSTITUTIONS_SESSIONS_COLUMN_WIDTH,
        align: 'center',
        className: 'participating-institutions-section__th-sessions',
        onHeaderCell: () => ({
          className: 'participating-institutions-section__th-sessions',
        }),
        onCell: () => ({ className: 'participating-institutions-section__td-sessions' }),
        render: (_: unknown, record: ParticipatingIndividualParticipantRow) => {
          const sessions = record.sessions ?? []
          if (sessions.length === 0) return '-'
          const { displaySessions, restCount } =
            getInstitutionApplicationSessionsTableSlice(sessions)
          return (
            <div className="participating-institutions-section__sessions-cell">
              {displaySessions.map((session, index) => (
                <div
                  key={`${session.round}-${session.date}-${index}`}
                  className="participating-institutions-section__session-line"
                >
                  <GeneralDetailSessionLine session={session} bridge={programBridge} />
                </div>
              ))}
              {restCount > 0 && (
                <div className="participating-institutions-section__session-more">
                  외 {restCount}개의 교육 일정
                </div>
              )}
            </div>
          )
        },
      },
    ]

    return showSessionsColumn ? columns : columns.filter(column => column.key !== 'sessions')
  }, [programBridge, showSessionsColumn])
}
