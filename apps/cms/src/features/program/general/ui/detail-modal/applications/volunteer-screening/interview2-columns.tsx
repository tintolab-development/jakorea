import { useMemo } from 'react'
import type { ColumnsType } from 'antd/es/table'
import { CmsButton } from '@/shared/ui'
import type { GeneralVolunteerApplicantRow } from '@/data/mock/general-volunteer-applicants-mock'
import { screeningApplicantNameLabel, type ScreeningSubjectKind } from '@/features/program/general/lib/screening-subject-kind'
import {
  PARTICIPANT_APPLICANT_NAME_COL_WIDTH,
  PARTICIPANT_TOTAL_SCORE_COL_WIDTH,
} from '@/features/program/general/lib/participant-screening-table-widths'
import {
  computeGeneralInterviewTotalScore,
  resolveGeneralEffectiveSecondInterviewStatus,
} from '@/features/program/general/lib/general-volunteer-interview2-display'
import {
  GeneralInterviewAssignmentStatusText,
  GeneralSecondInterviewStatusText,
} from './status-text'

const CENTER_CELL_CLASS = 'general-volunteer-screening__center-cell'
const NOWRAP_CELL_CLASS = 'general-volunteer-screening__nowrap-cell'
const SCORE_VALUE_CLASS = 'general-volunteer-interview2__score-value'
const VOLUNTEER_APPLICANT_NAME_COL_WIDTH = 140
const VOLUNTEER_TOTAL_SCORE_COL_WIDTH = 100

/** 봉사자 기본(140·100). 참여자는 공통 상수(198·120). +재배정 열 136 */
export function resolveGeneralInterview2TableScrollX(
  subjectKind: ScreeningSubjectKind = 'volunteer'
): number {
  const nameWidth =
    subjectKind === 'participant'
      ? PARTICIPANT_APPLICANT_NAME_COL_WIDTH
      : VOLUNTEER_APPLICANT_NAME_COL_WIDTH
  const scoreWidth =
    subjectKind === 'participant'
      ? PARTICIPANT_TOTAL_SCORE_COL_WIDTH
      : VOLUNTEER_TOTAL_SCORE_COL_WIDTH
  return 80 + nameWidth + 140 + 140 + 140 + scoreWidth + 160 + 136
}

/** @deprecated 봉사자 기본 scroll — `resolveGeneralInterview2TableScrollX` 사용 */
export const GENERAL_VOLUNTEER_INTERVIEW2_TABLE_SCROLL_X = resolveGeneralInterview2TableScrollX(
  'volunteer'
)

export function useGeneralVolunteerInterview2Columns({
  subjectKind = 'volunteer',
  onReassignInterview,
}: {
  subjectKind?: ScreeningSubjectKind
  onReassignInterview?: (row: GeneralVolunteerApplicantRow) => void
} = {}): ColumnsType<GeneralVolunteerApplicantRow> {
  const applicantNameTitle = screeningApplicantNameLabel(subjectKind)
  const applicantNameWidth =
    subjectKind === 'participant'
      ? PARTICIPANT_APPLICANT_NAME_COL_WIDTH
      : VOLUNTEER_APPLICANT_NAME_COL_WIDTH
  const totalScoreWidth =
    subjectKind === 'participant'
      ? PARTICIPANT_TOTAL_SCORE_COL_WIDTH
      : VOLUNTEER_TOTAL_SCORE_COL_WIDTH

  return useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: 80, align: 'center', className: CENTER_CELL_CLASS },
      {
        title: applicantNameTitle,
        dataIndex: 'name',
        key: 'name',
        width: applicantNameWidth,
        align: 'center',
        className: CENTER_CELL_CLASS,
      },
      {
        title: '연락처',
        dataIndex: 'contact',
        key: 'contact',
        width: 140,
        align: 'center',
        onHeaderCell: () => ({ className: CENTER_CELL_CLASS }),
        onCell: () => ({ className: `${CENTER_CELL_CLASS} ${NOWRAP_CELL_CLASS}` }),
      },
      {
        title: '면접일',
        key: 'assignedInterviewDateLabel',
        width: 140,
        align: 'center',
        className: CENTER_CELL_CLASS,
        render: (_value, record) => record.assignedInterviewDateLabel ?? '-',
      },
      {
        title: '면접 시간',
        key: 'assignedInterviewTime',
        width: 140,
        align: 'center',
        className: CENTER_CELL_CLASS,
        render: (_value, record) => record.assignedInterviewTime ?? '-',
      },
      {
        title: '점수 종합',
        key: 'totalScore',
        width: totalScoreWidth,
        align: 'center',
        className: CENTER_CELL_CLASS,
        render: (_value, record) => {
          const totalScore = computeGeneralInterviewTotalScore(record)
          return totalScore != null ? (
            <span className={SCORE_VALUE_CLASS}>{totalScore}</span>
          ) : (
            '-'
          )
        },
      },
      {
        title: '2차 면접 심사 현황',
        key: 'secondInterviewScreeningStatus',
        width: 160,
        align: 'center',
        className: CENTER_CELL_CLASS,
        render: (_value, record) => {
          const status = resolveGeneralEffectiveSecondInterviewStatus(record)
          if (status === 'withdrawn') {
            return <GeneralInterviewAssignmentStatusText status="withdrawn" />
          }
          return <GeneralSecondInterviewStatusText status={status} />
        },
      },
      ...(onReassignInterview
        ? ([
            {
              title: '면접일 재배정',
              key: 'interviewReassignAction',
              width: 136,
              align: 'center',
              className: CENTER_CELL_CLASS,
              render: (_value: unknown, record: GeneralVolunteerApplicantRow) => {
                const withdrawn = record.interviewAssignmentStatus === 'withdrawn'
                return (
                  <CmsButton
                    type="button"
                    variant="secondary"
                    size="small"
                    width={120}
                    disabled={withdrawn}
                    onClick={e => {
                      e.stopPropagation()
                      onReassignInterview(record)
                    }}
                  >
                    면접일 재배정
                  </CmsButton>
                )
              },
            },
          ] as ColumnsType<GeneralVolunteerApplicantRow>)
        : []),
    ],
    [applicantNameTitle, applicantNameWidth, onReassignInterview, totalScoreWidth]
  )
}
