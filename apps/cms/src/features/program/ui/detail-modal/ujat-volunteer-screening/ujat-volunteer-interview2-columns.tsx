import { useMemo } from 'react'
import type { ColumnsType } from 'antd/es/table'
import type { UjatVolunteerApplicantRow } from '@/data/mock/ujat-volunteer-applicants-mock'
import { SecondInterviewScreeningStatusText } from './second-interview-screening-status-text'

const CENTER_CELL_CLASS = 'ujat-volunteer-interview2__center-cell'
const NOWRAP_CELL_CLASS = 'ujat-volunteer-doc-screening__nowrap-cell'
const SCORE_VALUE_CLASS = 'ujat-volunteer-interview2__score-value'

export const UJAT_VOLUNTEER_INTERVIEW2_TABLE_SCROLL_X = 1184

export function useUjatVolunteerInterview2Columns() {
  return useMemo(
    (): ColumnsType<UjatVolunteerApplicantRow> => [
      {
        title: 'No.',
        dataIndex: 'no',
        key: 'no',
        width: 72,
        align: 'center',
        className: CENTER_CELL_CLASS,
      },
      {
        title: '신청 봉사자명',
        dataIndex: 'name',
        key: 'name',
        width: 140,
        align: 'center',
        className: CENTER_CELL_CLASS,
      },
      {
        title: '희망 교육 활동 지역',
        dataIndex: 'preferredRegion',
        key: 'preferredRegion',
        width: 168,
        align: 'center',
        className: CENTER_CELL_CLASS,
      },
      {
        title: '연락처',
        dataIndex: 'contact',
        key: 'contact',
        width: 140,
        align: 'center',
        ellipsis: false,
        onHeaderCell: () => ({ className: CENTER_CELL_CLASS }),
        onCell: () => ({ className: `${CENTER_CELL_CLASS} ${NOWRAP_CELL_CLASS}` }),
      },
      {
        title: '면접일',
        key: 'assignedInterviewDateLabel',
        width: 140,
        align: 'center',
        className: CENTER_CELL_CLASS,
        render: (_value, record) => record.assignedInterviewDateLabel ?? '—',
      },
      {
        title: '면접 시간',
        key: 'assignedInterviewTime',
        width: 140,
        align: 'center',
        className: CENTER_CELL_CLASS,
        render: (_value, record) => record.assignedInterviewTime ?? '—',
      },
      {
        title: '점수 종합',
        key: 'totalScore',
        width: 100,
        align: 'center',
        className: CENTER_CELL_CLASS,
        render: (_value, record) =>
          record.totalScore != null ? (
            <span className={SCORE_VALUE_CLASS}>{record.totalScore}</span>
          ) : (
            '-'
          ),
      },
      {
        title: '2차 면접 심사 현황',
        key: 'secondInterviewScreeningStatus',
        width: 140,
        align: 'center',
        className: CENTER_CELL_CLASS,
        render: (_value, record) =>
          record.secondInterviewScreeningStatus ? (
            <SecondInterviewScreeningStatusText status={record.secondInterviewScreeningStatus} />
          ) : (
            '—'
          ),
      },
    ],
    []
  )
}
