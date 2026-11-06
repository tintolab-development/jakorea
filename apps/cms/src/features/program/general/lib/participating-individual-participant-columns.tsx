import { useMemo } from 'react'
import type { ColumnsType } from 'antd/es/table'
import type { ParticipatingIndividualParticipantRow } from '@/features/program/general/model/participating-individual-participants'
import type { InstitutionApplicationProgramBridge } from '@/features/program/general/lib/institution-application-program-bridge'
import { shouldShowInstitutionApplicationSessionsColumn } from '@/features/program/general/lib/institution-application-session-display'
import { PARTICIPATING_INSTITUTIONS_SESSIONS_COLUMN_WIDTH } from '@/features/program/general/lib/participating-institutions-table'
import { CMS_TABLE_NO_COL_CLASS } from '@/shared/constants/table'
import { resolveParticipatingIndividualProgressScheduleSessionsFallback } from '@/features/program/general/lib/participating-individual-progress-schedule-sessions'
import { ParticipatingProgressEducationScheduleCell } from '@/features/program/general/lib/participating-progress-education-schedule-cell'
import { generalEducationScheduleShapeFromBridge } from '@/features/program/shared/ui/program-detail/applicant-list/applicants-detail-session-format'
import { PrivacyHomeAddressDisplay } from '@/features/program/shared/lib/program-pii-display'
import type { GeneralEducationCurriculumSessionRef } from '@/features/program/general/lib/participating-school-session-display'

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
  programBridge?: InstitutionApplicationProgramBridge | null,
  scheduleDisplay?: {
    detailScheduleTimeSpan?: string | null
    curriculumSessionLabels?: readonly string[] | null
    curriculumSessions?: readonly GeneralEducationCurriculumSessionRef[] | null
  } | null
): ColumnsType<ParticipatingIndividualParticipantRow> {
  const hasScheduleMultiLines =
    programBridge?.educationStructure === 'schedule' &&
    programBridge.sessionRound === 'multi' &&
    (programBridge.educationScheduleLines?.length ?? 0) > 0
  const showSessionsColumn =
    hasScheduleMultiLines ||
    programBridge == null ||
    shouldShowInstitutionApplicationSessionsColumn(programBridge)

  return useMemo(() => {
    const progressShape = {
      ...generalEducationScheduleShapeFromBridge(programBridge),
      curriculumSessionLabels: scheduleDisplay?.curriculumSessionLabels,
      curriculumSessions: scheduleDisplay?.curriculumSessions,
    }
    const columns: ColumnsType<ParticipatingIndividualParticipantRow> = [
      {
        title: 'No.',
        dataIndex: 'no',
        key: 'no',
        width: 80,
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
        render: (value: string | undefined) => value?.trim() || '-',
      },
      {
        title: '자택 주소지',
        dataIndex: 'homeAddress',
        key: 'homeAddress',
        width: HOME_ADDRESS_COL_WIDTH,
        align: 'center',
        ellipsis: true,
        render: (value: string | undefined) => (
          <PrivacyHomeAddressDisplay address={value} revealed={false} />
        ),
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
        render: (_: unknown, record: ParticipatingIndividualParticipantRow) => (
          <ParticipatingProgressEducationScheduleCell
            sessions={resolveParticipatingIndividualProgressScheduleSessionsFallback(
              record.sessions
            )}
            shape={progressShape}
          />
        ),
      },
    ]

    return showSessionsColumn ? columns : columns.filter(column => column.key !== 'sessions')
  }, [programBridge, scheduleDisplay, showSessionsColumn])
}
