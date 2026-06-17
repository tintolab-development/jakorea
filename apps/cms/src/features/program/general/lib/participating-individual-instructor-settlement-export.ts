import type { ColumnsType } from 'antd/es/table'
import {
  PARTICIPATING_INDIVIDUAL_INSTRUCTOR_LECTURE_PROGRESS_LABELS,
} from '@/features/program/general/lib/participating-individual-instructor-lecture-report-display'
import {
  resolveIndividualPaymentStatementExportLabel,
  resolveIndividualSettlementExportAmount,
} from '@/features/program/general/lib/participating-individual-instructor-settlement-display'
import type { ParticipatingIndividualInstructorSettlementRow } from '@/features/program/general/lib/participating-individual-instructor-settlement-types'

export const PARTICIPATING_INDIVIDUAL_INSTRUCTOR_SETTLEMENT_EXCEL_COLUMNS: ColumnsType<
  ParticipatingIndividualInstructorSettlementRow & { no: number }
> = [
  { title: 'No.', dataIndex: 'no', key: 'no' },
  { title: '교육 진행 일정', dataIndex: 'scheduleLabel', key: 'scheduleLabel' },
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
