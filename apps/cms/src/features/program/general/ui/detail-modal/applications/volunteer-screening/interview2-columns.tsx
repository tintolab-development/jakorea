import { useMemo } from 'react'
import type { ColumnsType } from 'antd/es/table'
import type { GeneralVolunteerApplicantRow } from '@/data/mock/general-volunteer-applicants-mock'
import { GeneralSecondInterviewStatusText } from './status-text'

const CENTER_CELL_CLASS = 'general-volunteer-screening__center-cell'
const NOWRAP_CELL_CLASS = 'general-volunteer-screening__nowrap-cell'

export const GENERAL_VOLUNTEER_INTERVIEW2_TABLE_SCROLL_X = 1112

export function useGeneralVolunteerInterview2Columns(): ColumnsType<GeneralVolunteerApplicantRow> {
  return useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: 72, align: 'center', className: CENTER_CELL_CLASS },
      { title: '신청 봉사자명', dataIndex: 'name', key: 'name', width: 140, align: 'center', className: CENTER_CELL_CLASS },
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
        title: '이메일',
        dataIndex: 'email',
        key: 'email',
        width: 220,
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
        render: (_value, record) => record.totalScore ?? '-',
      },
      {
        title: '2차 면접 심사 현황',
        key: 'secondInterviewScreeningStatus',
        width: 160,
        align: 'center',
        className: CENTER_CELL_CLASS,
        render: (_value, record) =>
          record.secondInterviewScreeningStatus ? (
            <GeneralSecondInterviewStatusText status={record.secondInterviewScreeningStatus} />
          ) : (
            '-'
          ),
      },
    ],
    []
  )
}
