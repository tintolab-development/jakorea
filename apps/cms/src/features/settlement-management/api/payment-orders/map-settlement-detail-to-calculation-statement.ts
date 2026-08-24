import type {
  PaymentOrderAdminInstructorDetail,
  PaymentOrderAdminInstructorDetailProgramRow,
  PaymentOrderAdminProgramDetailInstructorRow,
  PaymentOrderProgramCalculationStatement,
  PaymentOrderCalculationStatementLine,
  PaymentOrderCalculationStatementSessionBlock,
} from '@/data/mock/payment-order-admin-list'
import {
  PAYMENT_ORDER_ADMIN_LINE_STATUS_LABELS,
  addressDisplayForStatementBlur,
} from '@/data/mock/payment-order-admin-list'
import type { SettlementFrontendItemResponse, SettlementFrontendResponse } from '@/shared/api/generated/settlement/schemas'
import { formatPaymentOrderCalculationItemLabel } from '@/shared/constants/settlement-item-type'
import { MASKING_POLICY } from '@/shared/constants/download-policy'
import { KO_DOW } from '@/pages/settlement-management/payment-order-detail-fullpage-shared'

type ProgramDetailLineRow = PaymentOrderAdminProgramDetailInstructorRow
type InstructorDetailLineRow = PaymentOrderAdminInstructorDetailProgramRow
type DetailLineRow = ProgramDetailLineRow | InstructorDetailLineRow

function formatIsoToKoreanWeekday(iso: string): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  const date = new Date(y, m - 1, d)
  const dow = KO_DOW[date.getDay()]
  return `${y}. ${String(m).padStart(2, '0')}. ${String(d).padStart(2, '0')}(${dow})`
}

function mapItemToLine(item: SettlementFrontendItemResponse, index: number): PaymentOrderCalculationStatementLine {
  const amount = item.amount ?? 0
  return {
    id: `calc-line-remote-${index}`,
    itemLabel: formatPaymentOrderCalculationItemLabel(item.type, amount),
    description: item.description?.trim() || '—',
    amount,
    kind: amount < 0 ? 'withholding' : 'lecture_fee',
    // TODO(settlement-api): settlement.calculationDetails[index] → basisDetail 매핑 (layout/basisJson)
  }
}

function buildBlocks(
  lineRow: DetailLineRow,
  settlement: SettlementFrontendResponse
): PaymentOrderCalculationStatementSessionBlock[] {
  const items = settlement.items ?? []
  const lines = items.length > 0 ? items.map(mapItemToLine) : [
    {
      id: 'calc-line-remote-fallback',
      itemLabel: '정산 예정',
      description: '지급조서 확인',
      amount: lineRow.estimatedAmount,
      kind: 'lecture_fee' as const,
    },
  ]

  const sessionOrdinal = lineRow.sessionOrdinal
  return [
    {
      institutionName: lineRow.institutionName || '—',
      lectureDateDisplay: formatIsoToKoreanWeekday(lineRow.lectureDate),
      lectureSessionDisplay:
        sessionOrdinal != null ? `${sessionOrdinal} ~ ${sessionOrdinal}차시` : '—',
      lines,
    },
  ]
}

function sumItems(items: SettlementFrontendItemResponse[] | undefined): number {
  return (items ?? []).reduce((sum, item) => sum + (item.amount ?? 0), 0)
}

export function mapSettlementDetailToProgramCalculationStatement(
  lineRow: ProgramDetailLineRow,
  settlement: SettlementFrontendResponse,
  programName: string
): PaymentOrderProgramCalculationStatement {
  const blocks = buildBlocks(lineRow, settlement)
  const itemsTotal = sumItems(settlement.items)
  const totalAmount = settlement.totalAmount ?? (itemsTotal !== 0 ? itemsTotal : lineRow.estimatedAmount)

  return {
    context: 'program',
    sourceLineRowId: lineRow.id,
    basic: {
      programName,
      instructorNameKo: lineRow.instructorName,
      businessPeriodDisplay: settlement.period?.trim() || '—',
      programSessionProgressDisplay: '—',
      processingStatusDisplay: PAYMENT_ORDER_ADMIN_LINE_STATUS_LABELS[lineRow.processingStatus],
      processingStatusClass: lineRow.processingStatus,
      processingRejectionReason: lineRow.processingRejectionReason,
      lectureFeePaymentScheduledDateDisplay: lineRow.lectureFeePaymentScheduledDate
        ? formatIsoToKoreanWeekday(lineRow.lectureFeePaymentScheduledDate)
        : undefined,
      lectureFeeStandardTitle: '—',
      lectureFeeStandardAmount:
        lineRow.estimatedAmount > 0
          ? `${lineRow.estimatedAmount.toLocaleString('ko-KR')}원`
          : '—',
      businessIncomeEarnerLabel: '해당 없음',
    },
    blocks,
    formulaLabel: '정산 항목 합계',
    totalAmount,
  }
}

export function mapSettlementDetailToInstructorPageCalculationStatement(
  lineRow: InstructorDetailLineRow,
  settlement: SettlementFrontendResponse,
  instructorDetail: PaymentOrderAdminInstructorDetail
): PaymentOrderProgramCalculationStatement {
  const blocks = buildBlocks(lineRow, settlement)
  const itemsTotal = sumItems(settlement.items)
  const totalAmount = settlement.totalAmount ?? (itemsTotal !== 0 ? itemsTotal : lineRow.estimatedAmount)

  const { addressDisplay, addressBlurredTail } = addressDisplayForStatementBlur(
    instructorDetail.address
  )
  const settlementBankPart = [
    instructorDetail.bankName,
    MASKING_POLICY.accountNumber(instructorDetail.accountNumber),
  ]
    .filter(Boolean)
    .join(' ')

  return {
    context: 'instructor',
    sourceLineRowId: lineRow.id,
    basic: {
      nameKo: instructorDetail.nameKo,
      nameEn: instructorDetail.nameEn,
      phoneDisplay: MASKING_POLICY.phone(instructorDetail.phone),
      emailDisplay: MASKING_POLICY.email(instructorDetail.email),
      addressDisplay,
      addressBlurredTail,
      settlementAccountBankNumberPart: settlementBankPart || '—',
      settlementAccountHolderPart: MASKING_POLICY.accountHolderName(instructorDetail.accountHolder),
      genderBirthDisplay: '-',
      programName: lineRow.programName,
      processingStatusDisplay: PAYMENT_ORDER_ADMIN_LINE_STATUS_LABELS[lineRow.processingStatus],
      processingStatusClass: lineRow.processingStatus,
      processingRejectionReason: lineRow.processingRejectionReason,
      lectureFeePaymentScheduledDateDisplay: lineRow.lectureFeePaymentScheduledDate
        ? formatIsoToKoreanWeekday(lineRow.lectureFeePaymentScheduledDate)
        : undefined,
      lectureFeeStandardTitle: '—',
      lectureFeeStandardAmount:
        lineRow.estimatedAmount > 0
          ? `${lineRow.estimatedAmount.toLocaleString('ko-KR')}원`
          : '—',
      businessIncomeEarnerLabel: '해당 없음',
    },
    blocks,
    formulaLabel: '정산 항목 합계',
    totalAmount,
  }
}
