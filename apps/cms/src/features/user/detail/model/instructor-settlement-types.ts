import type { InstructorSettlementUiStatus } from '@/shared/constants/instructor-settlement-status'

export type { InstructorSettlementUiStatus } from '@/shared/constants/instructor-settlement-status'

export interface InstructorSettlementInvoiceLineItem {
  key: string
  산정항목: string
  항목설명: string
  정산금액: number
  /** true면 +, false면 - */
  isPositive?: boolean
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
  totalFormulaLabel: string
  totalAmount: number
}

export type SettlementCalendarListTitleVariant = 'plain-instructor' | 'bracket-program'

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
