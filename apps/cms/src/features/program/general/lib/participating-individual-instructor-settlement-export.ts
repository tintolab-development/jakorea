import type { ColumnsType } from 'antd/es/table'
import {
  PARTICIPATING_INDIVIDUAL_INSTRUCTOR_LECTURE_PROGRESS_LABELS,
} from '@/features/program/general/lib/participating-individual-instructor-lecture-report-display'
import {
  resolveIndividualPaymentStatementExportLabel,
  resolveIndividualSettlementExportAmount,
} from '@/features/program/general/lib/participating-individual-instructor-settlement-display'
import type { ParticipatingInstructorSettlementApiRow } from '@/features/program/general/lib/map-settlement-to-participating-instructor-settlement-row'
import {
  isIndividualSettlementRowNotApplicable,
  type IndividualSettlementReviewListRow,
} from '@/features/program/general/lib/map-individual-settlement-review-rows'
import { individualSettlementTableProcessingLabel } from '@/features/program/general/lib/individual-settlement-review-status'

export const PARTICIPATING_INDIVIDUAL_INSTRUCTOR_SETTLEMENT_EXCEL_COLUMNS: ColumnsType<ParticipatingInstructorSettlementApiRow> =
  [
  { title: 'No.', dataIndex: 'no', key: 'no' },
  { title: '교육 진행 일정', dataIndex: 'educationScheduleLabel', key: 'educationScheduleLabel' },
  {
    title: '강의 진행 여부',
    key: 'lectureProgress',
    render: (_value, record) =>
      PARTICIPATING_INDIVIDUAL_INSTRUCTOR_LECTURE_PROGRESS_LABELS[record.lectureProgress],
  },
  {
    title: '지급조서 처리현황',
    key: 'paymentStatementStatus',
    render: (_value, record) => resolveIndividualPaymentStatementExportLabel(record),
  },
  {
    title: '정산 예정 금액',
    key: 'scheduledSettlementAmount',
    render: (_value, record) => resolveIndividualSettlementExportAmount(record),
  },
]

export const PARTICIPATING_PARTICIPANT_SETTLEMENT_EXCEL_COLUMNS: ColumnsType<IndividualSettlementReviewListRow> =
  [
    { title: 'No.', dataIndex: 'no', key: 'no' },
    { title: '교육 진행 일정', dataIndex: 'educationScheduleLabel', key: 'educationScheduleLabel' },
    {
      title: '교육 진행 현황',
      key: 'lectureProgress',
      render: (_value, record) =>
        PARTICIPATING_INDIVIDUAL_INSTRUCTOR_LECTURE_PROGRESS_LABELS[record.lectureProgress],
    },
    {
      title: '지급조서 처리 현황',
      key: 'status',
      render: (_value, record) =>
        isIndividualSettlementRowNotApplicable(record)
          ? '-'
          : individualSettlementTableProcessingLabel(record.status),
    },
    {
      title: '정산 예정 금액',
      key: 'totalAmountLabel',
      render: (_value, record) =>
        isIndividualSettlementRowNotApplicable(record) ? '-' : record.totalAmountLabel,
    },
  ]
