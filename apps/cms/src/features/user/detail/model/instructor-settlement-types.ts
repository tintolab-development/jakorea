import type { InstructorSettlementUiStatus } from '@/shared/constants/instructor-settlement-status'
import type { PaymentOrderCalculationBasisDetail } from '@/features/settlement/ui/payment-record/payment-order-calculation-basis-detail'
import type { PaymentOrderCalculationLineKind } from '@/features/settlement-management/model/payment-order-admin-list'

export type { InstructorSettlementUiStatus } from '@/shared/constants/instructor-settlement-status'

export interface InstructorSettlementInvoiceLineItem {
  key: string
  산정항목: string
  항목설명: string
  정산금액: number
  /** true면 +, false면 - */
  isPositive?: boolean
  kind?: PaymentOrderCalculationLineKind
  /** 정산 상세 API `calculationDetail` → 산정 기준 상세 모달 */
  basisDetail?: PaymentOrderCalculationBasisDetail
}

export interface InstructorSettlementInvoiceDetail {
  programName: string
  sessionProgress: string
  operationPeriod: string
  paymentStatementStatus: InstructorSettlementUiStatus
  expectedTransferDate: string
  lectureFeeBasis: string
  businessIncomeEarner: string
  institutionName: string
  lectureDateSessions: string
  lineItems: InstructorSettlementInvoiceLineItem[]
  withholdingRatePercent: number
  withholdingAmount: number
  /** 원천징수 행용 산정 기준 상세 (items에서 분리된 경우) */
  withholdingBasisDetail?: PaymentOrderCalculationBasisDetail
  totalFormulaLabel: string
  totalAmount: number
}

export type SettlementCalendarListTitleVariant =
  | 'plain-instructor'
  | 'bracket-program'
  | 'pipe-program'

export interface SummarizeSettlementRowsOptions {
  allRowsForTotal?: InstructorSettlementListRow[]
}

export interface InstructorSettlementListRow {
  id: string
  settlementId: number
  statementId?: number
  correctionRequestId?: number
  no: number
  programName: string
  instructorName?: string
  settlementListTitleVariant?: SettlementCalendarListTitleVariant
  institutionName: string
  lectureDateDisplay: string
  calendarDate: string
  status: InstructorSettlementUiStatus
  scheduledAmount: number
  detailAvailable: boolean
  invoice: InstructorSettlementInvoiceDetail
}
