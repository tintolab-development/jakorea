import { useMemo } from 'react'
import type { ColumnsType } from 'antd/es/table'
import type { UjatVolunteerApplicantRow } from '@/features/program/ujat/model/ujat-volunteer-applicant'
import { canReassignVolunteerInterviewAssignment } from '@/features/program/shared/lib/volunteer-interview-reassign'
import { CMS_DATA_TABLE_CELL_H40_ACTION_CLASS } from '@/shared/constants/table'
import { CmsButton } from '@/shared/ui'
import { InterviewAssignmentStatusText } from '../shared/interview-assignment-status-text'

const CENTER_CELL_CLASS = 'ujat-volunteer-doc-passed__center-cell'

/** Figma 4082:97956 Table / Horizontal — 80+160+180+160+231+215+180+180+160 = 1546 */
export const DOC_PASSED_TABLE_SCROLL_X = 80 + 160 + 180 + 160 + 231 + 215 + 180 + 180 + 160

export function useUjatVolunteerDocPassedColumns({
  onAssignInterview,
}: {
  onAssignInterview: (row: UjatVolunteerApplicantRow) => void
}) {
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
        width: 160,
        align: 'center' as const,
        className: CENTER_CELL_CLASS,
      },
      {
        title: '희망 교육 활동 지역',
        dataIndex: 'preferredRegion',
        key: 'preferredRegion',
        width: 180,
        align: 'center' as const,
        className: CENTER_CELL_CLASS,
      },
      {
        title: '면접 가능 일정 수',
        key: 'interviewSlotCount',
        width: 160,
        align: 'center' as const,
        className: CENTER_CELL_CLASS,
        render: (_value: unknown, record: UjatVolunteerApplicantRow) =>
          `${record.interviewSlotCount}개`,
      },
      {
        title: '연락처',
        dataIndex: 'contact',
        key: 'contact',
        width: 231,
        align: 'center' as const,
        ellipsis: true,
        className: CENTER_CELL_CLASS,
      },
      {
        title: '이메일',
        dataIndex: 'email',
        key: 'email',
        width: 215,
        align: 'center' as const,
        ellipsis: true,
        className: CENTER_CELL_CLASS,
      },
      {
        title: '교육 진행 경험 여부',
        key: 'educationExperience',
        width: 180,
        align: 'center' as const,
        className: CENTER_CELL_CLASS,
        render: (_value: unknown, record: UjatVolunteerApplicantRow) =>
          record.hasEducationExperience == null ? '-' : record.hasEducationExperience ? 'O' : 'X',
      },
      {
        title: '면접일 배정 현황',
        key: 'interviewAssignmentStatus',
        width: 180,
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
        className: `${CENTER_CELL_CLASS} ${CMS_DATA_TABLE_CELL_H40_ACTION_CLASS}`,
        onHeaderCell: () => ({
          className: `${CENTER_CELL_CLASS} ${CMS_DATA_TABLE_CELL_H40_ACTION_CLASS}`,
        }),
        onCell: () => ({
          className: `${CENTER_CELL_CLASS} ${CMS_DATA_TABLE_CELL_H40_ACTION_CLASS}`,
        }),
        render: (_value: unknown, record: UjatVolunteerApplicantRow) => {
          const isAssigned = record.interviewAssignmentStatus === 'assigned'
          const label = isAssigned ? '면접일 재배정' : '면접일 배정'
          const disabled =
            record.interviewAssignmentStatus === 'withdrawn' ||
            (isAssigned && !canReassignVolunteerInterviewAssignment(record))
          return (
            <CmsButton
              type="button"
              variant="secondary"
              size="medium"
              style={{ flexShrink: 0 }}
              disabled={disabled}
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
    return columns
  }, [onAssignInterview])
}
