import type { ColumnsType } from 'antd/es/table'
import type { IndividualSettlementReviewListRow } from '@/features/program/general/lib/map-individual-settlement-review-rows'

export const INDIVIDUAL_SETTLEMENT_REVIEW_EXCEL_COLUMNS: ColumnsType<IndividualSettlementReviewListRow> =
  [
    { title: 'No.', dataIndex: 'no', key: 'no' },
    { title: '교육 진행 일정', dataIndex: 'educationScheduleLabel', key: 'educationScheduleLabel' },
    { title: '정산 상태', dataIndex: 'statusLabel', key: 'statusLabel' },
    { title: '정산 금액', dataIndex: 'totalAmountLabel', key: 'totalAmountLabel' },
    { title: 'Revision', dataIndex: 'latestRevisionNoLabel', key: 'latestRevisionNoLabel' },
    { title: '제출일시', dataIndex: 'submittedAtLabel', key: 'submittedAtLabel' },
  ]
