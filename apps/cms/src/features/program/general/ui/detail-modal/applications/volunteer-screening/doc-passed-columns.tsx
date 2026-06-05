import { useMemo } from 'react'
import type { ColumnsType } from 'antd/es/table'
import { CmsButton } from '@/shared/ui'
import type { GeneralVolunteerApplicantRow } from '@/data/mock/general-volunteer-applicants-mock'
import { GeneralInterviewAssignmentStatusText } from './status-text'

const CENTER_CELL_CLASS = 'general-volunteer-doc-passed__center-cell'

export function useGeneralVolunteerDocPassedColumns({
  onAssignInterview,
}: {
  onAssignInterview: (row: GeneralVolunteerApplicantRow) => void
}): ColumnsType<GeneralVolunteerApplicantRow> {
  return useMemo(
    (): ColumnsType<GeneralVolunteerApplicantRow> => [
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
        title: '면접 가능 일정 수',
        key: 'interviewSlotCount',
        width: 140,
        align: 'center',
        className: CENTER_CELL_CLASS,
        render: (_value, record) => `${record.interviewSlotCount}개`,
      },
      {
        title: '연락처',
        dataIndex: 'contact',
        key: 'contact',
        width: 140,
        align: 'center',
        ellipsis: true,
        className: CENTER_CELL_CLASS,
      },
      {
        title: '이메일',
        dataIndex: 'email',
        key: 'email',
        width: 220,
        align: 'center',
        ellipsis: true,
        className: CENTER_CELL_CLASS,
      },
      {
        title: '면접일 배정 현황',
        key: 'interviewAssignmentStatus',
        width: 140,
        align: 'center',
        className: CENTER_CELL_CLASS,
        render: (_value, record) => (
          <GeneralInterviewAssignmentStatusText status={record.interviewAssignmentStatus} />
        ),
      },
      {
        title: '면접일 배정',
        key: 'interviewAssignmentAction',
        width: 136,
        align: 'center',
        className: CENTER_CELL_CLASS,
        render: (_value, record) => {
          const withdrawn = record.interviewAssignmentStatus === 'withdrawn'
          const label =
            record.interviewAssignmentStatus === 'assigned' ? '면접일 재배정' : '면접일 배정'
          return (
            <CmsButton
              type="button"
              variant="secondary"
              size="small"
              width={120}
              className="general-volunteer-doc-passed__assign-btn"
              disabled={withdrawn}
              onClick={e => {
                e.stopPropagation()
                onAssignInterview(record)
              }}
            >
              {label}
            </CmsButton>
          )
        },
      },
    ],
    [onAssignInterview]
  )
}
