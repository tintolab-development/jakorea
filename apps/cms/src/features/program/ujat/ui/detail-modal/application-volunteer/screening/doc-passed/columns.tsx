import { useMemo } from 'react'
import type { ColumnsType } from 'antd/es/table'
import type { UjatVolunteerApplicantRow } from '@/features/program/ujat/model/ujat-volunteer-applicant'
import { CmsButton } from '@/shared/ui'
import { useUjatCanWrite } from '@/features/program/ujat/lib/use-can-write'
import { InterviewAssignmentStatusText } from '../shared/interview-assignment-status-text'

const CENTER_CELL_CLASS = 'ujat-volunteer-doc-passed__center-cell'

export const DOC_PASSED_TABLE_SCROLL_X = 72 + 140 + 168 + 140 + 140 + 220 + 140 + 140 + 136

export function useUjatVolunteerDocPassedColumns({
  onAssignInterview,
}: {
  onAssignInterview: (row: UjatVolunteerApplicantRow) => void
}) {
  const canWrite = useUjatCanWrite()
  return useMemo((): ColumnsType<UjatVolunteerApplicantRow> => {
    const columns: ColumnsType<UjatVolunteerApplicantRow> = [
      {
        title: 'No.',
        key: 'no',
        width: 80,
        align: 'center' as const,
        className: CENTER_CELL_CLASS,
        render: (_value: unknown, _record: UjatVolunteerApplicantRow, index: number) =>
          index + 1,
      },
      {
        title: '신청 봉사자명',
        dataIndex: 'name',
        key: 'name',
        width: 140,
        align: 'center' as const,
        className: CENTER_CELL_CLASS,
      },
      {
        title: '희망 교육 활동 지역',
        dataIndex: 'preferredRegion',
        key: 'preferredRegion',
        width: 168,
        align: 'center' as const,
        className: CENTER_CELL_CLASS,
      },
      {
        title: '면접 가능 일정 수',
        key: 'interviewSlotCount',
        width: 140,
        align: 'center' as const,
        className: CENTER_CELL_CLASS,
        render: (_value: unknown, record: UjatVolunteerApplicantRow) =>
          `${record.interviewSlotCount}개`,
      },
      {
        title: '연락처',
        dataIndex: 'contact',
        key: 'contact',
        width: 140,
        align: 'center' as const,
        ellipsis: true,
        className: CENTER_CELL_CLASS,
      },
      {
        title: '이메일',
        dataIndex: 'email',
        key: 'email',
        width: 220,
        align: 'center' as const,
        ellipsis: true,
        className: CENTER_CELL_CLASS,
      },
      {
        title: '교육 진행 경험',
        key: 'educationExperience',
        width: 140,
        align: 'center' as const,
        className: CENTER_CELL_CLASS,
        render: (_value: unknown, record: UjatVolunteerApplicantRow) =>
          record.hasEducationExperience == null ? '-' : record.hasEducationExperience ? 'O' : 'X',
      },
      {
        title: '면접일 배정 현황',
        key: 'interviewAssignmentStatus',
        width: 140,
        align: 'center' as const,
        className: CENTER_CELL_CLASS,
        render: (_value: unknown, record: UjatVolunteerApplicantRow) => (
          <InterviewAssignmentStatusText status={record.interviewAssignmentStatus} />
        ),
      },
      {
        title: '면접일 배정',
        key: 'interviewAssignmentAction',
        width: 160,
        align: 'center' as const,
        className: CENTER_CELL_CLASS,
        render: (_value: unknown, record: UjatVolunteerApplicantRow) => {
          const label =
            record.interviewAssignmentStatus === 'assigned' ? '면접일 재배정' : '면접일 배정'
          return (
            <CmsButton
              type="button"
              variant="secondary"
              size="medium"
              width={120}
              style={{ flexShrink: 0 }}
              disabled={record.interviewAssignmentStatus === 'withdrawn'}
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
    ]
    return columns.filter(column => canWrite || column.key !== 'interviewAssignmentAction')
  }, [canWrite, onAssignInterview])
}
