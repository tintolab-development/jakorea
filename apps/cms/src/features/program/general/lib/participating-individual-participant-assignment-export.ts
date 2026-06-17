import type { ColumnsType } from 'antd/es/table'
import {
  ASSIGNMENT_TEAM_ROLE_LABELS,
  LECTURE_PROGRESS_DISPLAY_LABELS,
} from '@/features/program/general/model/school-detail-types'
import type { ParticipatingIndividualParticipantAssignmentRow } from '@/features/program/general/lib/participating-individual-participant-assignment-types'

function resolveSubmissionLabel(
  submission: ParticipatingIndividualParticipantAssignmentRow['submission']
): string {
  if (submission.kind === 'none') return '-'
  if (submission.kind === 'not_submitted') return '미제출'
  if (submission.kind === 'file') return submission.fileName
  if (submission.kind === 'link') return submission.label
  if (submission.kind === 'survey_view') return '설문조사 보기'
  return '만족도조사 보기'
}

export const PARTICIPATING_INDIVIDUAL_PARTICIPANT_ASSIGNMENT_EXCEL_COLUMNS: ColumnsType<
  ParticipatingIndividualParticipantAssignmentRow & { no: number }
> = [
  { title: 'No.', dataIndex: 'no', key: 'no' },
  {
    title: '역할',
    key: 'teamRole',
    render: (_value, record) => ASSIGNMENT_TEAM_ROLE_LABELS[record.teamRole],
  },
  { title: '팀명', dataIndex: 'teamName', key: 'teamName' },
  { title: '교육 진행 일정', dataIndex: 'scheduleLabel', key: 'scheduleLabel' },
  {
    title: '과제 제출 기간',
    key: 'assignmentPeriodLabel',
    render: (_value, record) => record.assignmentPeriodLabel?.trim() || '-',
  },
  {
    title: '제출 파일',
    key: 'submission',
    render: (_value, record) => resolveSubmissionLabel(record.submission),
  },
  {
    title: '교육 진행 현황',
    key: 'educationProgress',
    render: (_value, record) => LECTURE_PROGRESS_DISPLAY_LABELS[record.educationProgress],
  },
]
