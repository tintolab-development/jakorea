import type { ColumnsType } from 'antd/es/table'
import {
  PARTICIPATING_INDIVIDUAL_INSTRUCTOR_LECTURE_PROGRESS_LABELS,
  PARTICIPATING_INDIVIDUAL_INSTRUCTOR_SUBMISSION_STATUS_LABELS,
} from '@/features/program/general/lib/participating-individual-instructor-lecture-report-display'
import type { ParticipatingIndividualInstructorLectureReportRow } from '@/features/program/general/lib/participating-individual-instructor-lecture-report-types'

export const PARTICIPATING_INDIVIDUAL_INSTRUCTOR_LECTURE_REPORT_EXCEL_COLUMNS: ColumnsType<
  ParticipatingIndividualInstructorLectureReportRow & { no: number }
> = [
  { title: 'No.', dataIndex: 'no', key: 'no' },
  { title: '교육 진행 일정', dataIndex: 'scheduleLabel', key: 'scheduleLabel' },
  {
    title: '강의보고서 제출 기간',
    dataIndex: 'submissionPeriodLabel',
    key: 'submissionPeriodLabel',
  },
  {
    title: '강의 진행 여부',
    key: 'lectureProgress',
    render: (_value, record) =>
      PARTICIPATING_INDIVIDUAL_INSTRUCTOR_LECTURE_PROGRESS_LABELS[record.lectureProgress],
  },
  {
    title: '제출 현황',
    key: 'submissionStatus',
    render: (_value, record) =>
      PARTICIPATING_INDIVIDUAL_INSTRUCTOR_SUBMISSION_STATUS_LABELS[record.submissionStatus],
  },
]
