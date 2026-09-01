/**
 * @deprecated 회원 상세 정산 타입·유틸은 `@/features/user/detail/model/instructor-settlement-types`,
 * `@/features/user/detail/lib/instructor-settlement-list-utils` 를 사용하세요.
 * 본 파일은 정산 캘린더 등 legacy import 호환용 mock 데이터만 유지합니다.
 */

import dayjs from 'dayjs'

export type {
  InstructorSettlementInvoiceDetail,
  InstructorSettlementInvoiceLineItem,
  InstructorSettlementListRow,
  InstructorSettlementUiStatus,
  SettlementCalendarListTitleVariant,
  SummarizeSettlementRowsOptions,
} from '@/features/user/detail/model/instructor-settlement-types'

export {
  INSTRUCTOR_SETTLEMENT_STATUS_LABELS,
  INSTRUCTOR_SETTLEMENT_STATUS_LABELS_SHORT,
  INSTRUCTOR_SETTLEMENT_STATUS_TAG_STYLE,
  INSTRUCTOR_SETTLEMENT_STATUSES_ELIGIBLE_FOR_PAYMENT_STATEMENT_ISSUE,
  INSTRUCTOR_SETTLEMENT_FILTER_STATUS_OPTIONS,
  isInstructorSettlementEligibleForPaymentStatementIssue,
  getInstructorSettlementInvoiceStatusPresentation,
} from '@/shared/constants/instructor-settlement-status'

export {
  settlementCalendarPrimaryTitle,
  filterRowsByMonth,
  summarizeSettlementRows,
  rowsToCalendarEvents,
} from '@/features/user/detail/lib/instructor-settlement-list-utils'

import type {
  InstructorSettlementInvoiceDetail,
  InstructorSettlementListRow,
} from '@/features/user/detail/model/instructor-settlement-types'

const sampleInvoice = (
  partial: Partial<InstructorSettlementInvoiceDetail>
): InstructorSettlementInvoiceDetail => ({
  programName: '2026년 JA Korea 초등 경제교육',
  sessionProgress: '4 / 16',
  operationPeriod: '2025. 12. 08(월) ~ 2026. 12. 30(수)',
  paymentStatementStatus: 'payment_statement_verified',
  expectedTransferDate: '2026. 05. 24(일)',
  lectureFeeBasis: '특강 강의비 915,000원',
  businessIncomeEarner: '해당 없음',
  institutionName: '강서초등학교',
  lectureDateSessions: '2026. 04. 28(화) | 2 ~ 3차시',
  lineItems: [],
  withholdingRatePercent: 8.8,
  withholdingAmount: 90_092,
  totalFormulaLabel: '강의비 + 교통비 + 숙박비 - 원천징수',
  totalAmount: 936_408,
  ...partial,
})

/** @deprecated remote 정산 API 사용 — 회원 상세 정산 탭 mock 제거됨 */
export function getInstructorSettlementRows(_instructorUserId: string): InstructorSettlementListRow[] {
  void _instructorUserId
  void sampleInvoice
  void dayjs
  return []
}
