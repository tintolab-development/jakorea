import { useMemo } from 'react'
import type { ColumnsType } from 'antd/es/table'
import { ApprovalStatusText } from '@/shared/components/approval-status-text'
import type { ApprovalStatusKey } from '@/shared/components/approval-status-badge'
import type { GeneralIndividualApplicantRow } from '@/features/program/general/model/individual-applicant'
import type { InstitutionApplicationProgramBridge } from '@/features/program/general/lib/institution-application-program-bridge'
import { getInstitutionApplicationSessionsTableSlice } from '@/features/program/general/lib/institution-application-session-display'
import { PARTICIPANT_APPLICANT_NAME_COL_WIDTH } from '@/features/program/general/lib/participant-screening-table-widths'
import { prepareGeneralEducationScheduleSessions } from '@/features/program/general/lib/participating-school-session-display'
import { generalEducationScheduleShapeFromBridge } from './applicants-detail-session-format'
import { GeneralDetailSessionLine } from './general-detail-session-line'

/** 기관 신청 목록(general-detail)과 동일한 여유 폭 */
const GENERAL_DETAIL_INDIVIDUAL_AFFILIATION_COL_WIDTH = 200
const GENERAL_DETAIL_INDIVIDUAL_HOME_ADDRESS_COL_WIDTH = 220
const GENERAL_DETAIL_INDIVIDUAL_GRADE_COL_WIDTH = 128
const GENERAL_DETAIL_INDIVIDUAL_SESSIONS_COL_MIN_WIDTH = 480
const GENERAL_DETAIL_INDIVIDUAL_APPROVAL_COL_WIDTH = 196
const GENERAL_DETAIL_INDIVIDUAL_NO_COL_WIDTH = 72

/**
 * 일반(개인) 참여자 신청 목록 컬럼.
 * 「프로그램 승인 현황」 우측에 「진행 희망 교육 일정」을 항상 둔다.
 * (신청 폼 단락 숨김 조건과 달리, 심사 목록에서는 열을 유지하고 값 없으면 `-`)
 */
export function useGeneralIndividualApplicantColumns(
  programBridge?: InstitutionApplicationProgramBridge | null,
  detailScheduleTimeSpan?: string | null,
  curriculumSessionLabels?: readonly string[] | null,
  educationScheduleLines?: readonly string[] | null
): ColumnsType<GeneralIndividualApplicantRow> {
  const applicantNameColWidth = PARTICIPANT_APPLICANT_NAME_COL_WIDTH

  return useMemo(() => {
    const columns: ColumnsType<GeneralIndividualApplicantRow> = [
      {
        title: 'No.',
        dataIndex: 'no',
        key: 'no',
        width: GENERAL_DETAIL_INDIVIDUAL_NO_COL_WIDTH,
        minWidth: GENERAL_DETAIL_INDIVIDUAL_NO_COL_WIDTH,
        align: 'center',
      },
      {
        title: '신청자명',
        dataIndex: 'applicantName',
        key: 'applicantName',
        width: applicantNameColWidth,
        minWidth: applicantNameColWidth,
        align: 'center',
        ellipsis: true,
      },
      {
        title: '소속',
        dataIndex: 'affiliation',
        key: 'affiliation',
        width: GENERAL_DETAIL_INDIVIDUAL_AFFILIATION_COL_WIDTH,
        minWidth: GENERAL_DETAIL_INDIVIDUAL_AFFILIATION_COL_WIDTH,
        align: 'center',
        ellipsis: true,
        render: (value: string | undefined) => value?.trim() || '-',
      },
      {
        title: '신청 학년',
        dataIndex: 'educationGrade',
        key: 'educationGrade',
        width: GENERAL_DETAIL_INDIVIDUAL_GRADE_COL_WIDTH,
        minWidth: GENERAL_DETAIL_INDIVIDUAL_GRADE_COL_WIDTH,
        align: 'center',
        render: (value: string | undefined) => value?.trim() || '-',
      },
      {
        title: '자택 주소지',
        dataIndex: 'homeAddress',
        key: 'homeAddress',
        width: GENERAL_DETAIL_INDIVIDUAL_HOME_ADDRESS_COL_WIDTH,
        minWidth: GENERAL_DETAIL_INDIVIDUAL_HOME_ADDRESS_COL_WIDTH,
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
        className:
          'applicant-details__th-sessions applicant-details__th-sessions--general-detail',
        onHeaderCell: () => ({
          className:
            'applicant-details__th-sessions applicant-details__th-sessions--general-detail',
        }),
        onCell: () => ({
          className:
            'applicant-details__td-sessions applicant-details__td-sessions--general-detail applicant-details__td-sessions--center',
        }),
        render: (_: unknown, record: GeneralIndividualApplicantRow) => {
          const sessions = prepareGeneralEducationScheduleSessions(
            record.sessions ?? [],
            generalEducationScheduleShapeFromBridge(programBridge),
            {
              detailScheduleTimeSpan,
              educationScheduleLines:
                educationScheduleLines ?? programBridge?.educationScheduleLines,
            }
          )
          if (sessions.length === 0) return '-'
          const { displaySessions, restCount } =
            getInstitutionApplicationSessionsTableSlice(sessions)
          return (
            <div className="applicant-details__sessions-cell">
              {displaySessions.map(s => (
                <div key={s.round} className="applicant-details__session-line">
                  <GeneralDetailSessionLine
                    session={s}
                    bridge={programBridge}
                    detailScheduleTimeSpan={detailScheduleTimeSpan}
                    curriculumSessionLabels={curriculumSessionLabels}
                    preferFormOptionLabel
                  />
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

    return columns
  }, [
    applicantNameColWidth,
    curriculumSessionLabels,
    detailScheduleTimeSpan,
    educationScheduleLines,
    programBridge,
  ])
}
