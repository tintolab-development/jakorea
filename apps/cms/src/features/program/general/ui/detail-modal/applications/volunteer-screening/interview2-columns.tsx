import { useMemo } from 'react'
import type { ColumnsType } from 'antd/es/table'
import type { GeneralVolunteerApplicantRow } from '@/data/mock/general-volunteer-applicants-mock'
import { screeningApplicantNameLabel, type ScreeningSubjectKind } from '@/features/program/general/lib/screening-subject-kind'
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

export const GENERAL_VOLUNTEER_INTERVIEW2_TABLE_SCROLL_X = 892

export function useGeneralVolunteerInterview2Columns(
  subjectKind: ScreeningSubjectKind = 'volunteer'
): ColumnsType<GeneralVolunteerApplicantRow> {
  const applicantNameTitle = screeningApplicantNameLabel(subjectKind)

  return useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: 80, align: 'center', className: CENTER_CELL_CLASS },
      { title: applicantNameTitle, dataIndex: 'name', key: 'name', width: 140, align: 'center', className: CENTER_CELL_CLASS },
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
        width: 100,
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
    ],
    [applicantNameTitle]
  )
}
