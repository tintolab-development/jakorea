/**
 * 회원 상세 강사 정산 산출 내역서 → 지급조서 확인/반려 모달용 `PaymentOrderProgramCalculationStatement` 변환
 */

import type {
  PaymentOrderAdminLineProcessingStatus,
  PaymentOrderCalculationStatementLine,
  PaymentOrderProgramCalculationStatement,
} from '@/data/mock/payment-order-admin-list'
import type {
  InstructorSettlementInvoiceDetail,
  InstructorSettlementUiStatus,
} from '@/data/mock/instructor-member-settlements'
import { getInstructorSettlementInvoiceStatusPresentation } from '@/data/mock/instructor-member-settlements'

function mapInstructorUiStatusToLineStatus(
  status: InstructorSettlementUiStatus
): PaymentOrderAdminLineProcessingStatus {
  switch (status) {
    case 'payment_statement_verified':
      return 'confirmed'
    case 'account_paid':
      return 'rejected'
    case 'application_rejected':
      return 'application_rejected'
    case 'payment_correction_requested':
      return 'correction'
    default:
      return 'pending'
  }
}

function parseLectureDateSessions(raw: string): { lectureDateDisplay: string; lectureSessionDisplay: string } {
  const parts = raw.split('|').map(s => s.trim())
  if (parts.length >= 2) {
    return { lectureDateDisplay: parts[0], lectureSessionDisplay: parts[1] }
  }
  return { lectureDateDisplay: raw.trim() || '-', lectureSessionDisplay: '-' }
}

function splitLectureFeeBasis(raw: string): { title: string; amount: string } {
  const pipe = raw.split('|').map(s => s.trim())
  if (pipe.length >= 2) return { title: pipe[0], amount: pipe[1] }
  const m = raw.match(/^(.+?)\s+([\d,]+원)\s*$/u)
  if (m) return { title: m[1].trim(), amount: m[2].trim() }
  return { title: raw.trim(), amount: '' }
}

function lineKindForItemLabel(label: string): PaymentOrderCalculationStatementLine['kind'] {
  if (label.includes('교통')) return 'travel'
  if (label.includes('숙')) return 'lodging'
  if (label.includes('원천')) return 'withholding'
  return 'lecture_fee'
}

export function buildPaymentOrderStatementFromInstructorInvoice(
  invoice: InstructorSettlementInvoiceDetail,
  sourceLineRowId: string,
  instructorNameKo: string
): PaymentOrderProgramCalculationStatement {
  const { lectureDateDisplay, lectureSessionDisplay } = parseLectureDateSessions(
    invoice.lectureDateSessions
  )
  const { title: lectureFeeStandardTitle, amount: lectureFeeStandardAmount } = splitLectureFeeBasis(
    invoice.lectureFeeBasis
  )
  const processingStatusClass = mapInstructorUiStatusToLineStatus(invoice.paymentStatementStatus)
  const processingStatusDisplay = getInstructorSettlementInvoiceStatusPresentation(
    invoice.paymentStatementStatus
  ).label

  const lines: PaymentOrderCalculationStatementLine[] = invoice.lineItems.map((item, i) => ({
    id: `${sourceLineRowId}-inv-line-${item.key}-${i}`,
    itemLabel: item.산정항목,
    description: item.항목설명,
    amount: item.isPositive === false ? -Math.abs(item.정산금액) : item.정산금액,
    kind: lineKindForItemLabel(item.산정항목),
  }))

  return {
    context: 'program',
    sourceLineRowId,
    basic: {
      programName: invoice.programName,
      instructorNameKo,
      businessPeriodDisplay: invoice.operationPeriod,
      programSessionProgressDisplay: invoice.sessionProgress,
      processingStatusDisplay,
      processingStatusClass,
      lectureFeeStandardTitle,
      lectureFeeStandardAmount,
      businessIncomeEarnerLabel: invoice.businessIncomeEarner,
    },
    blocks: [
      {
        institutionName: invoice.institutionName,
        lectureDateDisplay,
        lectureSessionDisplay,
        lines,
      },
    ],
    formulaLabel: invoice.totalFormulaLabel,
    totalAmount: invoice.totalAmount,
  }
}
