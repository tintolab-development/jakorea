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
import {
  formatBusinessIncomeEarnerLabel,
  formatBusinessPeriodDisplay,
  formatLectureFeeStandardTitle,
  formatLectureSessionLabel,
  formatProgramSessionProgressDisplay,
  formatWonAmountDisplay,
  mapCalculationDetailToBasisDetail,
  mapSettlementFrontendItemTypeToLineKind,
} from '@/features/settlement-management/api/shared/map-frontend-fields'

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
    kind: mapSettlementFrontendItemTypeToLineKind(item.type, amount),
    basisDetail: mapCalculationDetailToBasisDetail(item.calculationDetail),
  }
}

function resolveLectureSessionDisplay(
  lineRow: DetailLineRow,
  settlement: SettlementFrontendResponse,
  sessionDisplay: 'range' | 'single'
): string {
  const fromApi = settlement.lectureSessionDisplay?.trim()
  if (fromApi) return fromApi

  const sessionOrdinal = settlement.sessionOrdinal ?? lineRow.sessionOrdinal
  if (sessionOrdinal == null || sessionOrdinal <= 0) return '—'

  const single = formatLectureSessionLabel(sessionOrdinal)
  if (sessionDisplay === 'single') return single
  return `${sessionOrdinal} ~ ${sessionOrdinal}차시`
}

function buildBlocks(
  lineRow: DetailLineRow,
  settlement: SettlementFrontendResponse,
  sessionDisplay: 'range' | 'single' = 'range'
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

  const institutionName =
    settlement.institutionName?.trim() || lineRow.institutionName?.trim() || '—'

  return [
    {
      institutionName: institutionName === '-' ? '—' : institutionName,
      lectureDateDisplay: formatIsoToKoreanWeekday(lineRow.lectureDate),
      lectureSessionDisplay: resolveLectureSessionDisplay(lineRow, settlement, sessionDisplay),
      lines,
    },
  ]
}

function sumItems(items: SettlementFrontendItemResponse[] | undefined): number {
  return (items ?? []).reduce((sum, item) => sum + (item.amount ?? 0), 0)
}

function mapCalculationStatementSharedBasic(settlement: SettlementFrontendResponse) {
  return {
    lectureFeeStandardTitle: formatLectureFeeStandardTitle(settlement.lectureFeeStandardTitle),
    lectureFeeStandardAmount: formatWonAmountDisplay(settlement.lectureFeeStandardAmount),
    businessIncomeEarnerLabel: formatBusinessIncomeEarnerLabel(
      settlement.businessIncomeEarnerLabel
    ),
  }
}

export function mapSettlementDetailToProgramCalculationStatement(
  lineRow: DetailLineRow,
  settlement: SettlementFrontendResponse,
  programName: string,
  instructorNameKo: string
): PaymentOrderProgramCalculationStatement {
  const blocks = buildBlocks(lineRow, settlement)
  const itemsTotal = sumItems(settlement.items)
  const totalAmount = settlement.totalAmount ?? (itemsTotal !== 0 ? itemsTotal : lineRow.estimatedAmount)

  return {
    context: 'program',
    sourceLineRowId: lineRow.id,
    basic: {
      programName,
      instructorNameKo,
      businessPeriodDisplay: formatBusinessPeriodDisplay({
        period: settlement.period,
        businessPeriodStart: settlement.businessPeriodStart,
        businessPeriodEnd: settlement.businessPeriodEnd,
        formatDate: formatIsoToKoreanWeekday,
      }),
      programSessionProgressDisplay: formatProgramSessionProgressDisplay(settlement),
      processingStatusDisplay: PAYMENT_ORDER_ADMIN_LINE_STATUS_LABELS[lineRow.processingStatus],
      processingStatusClass: lineRow.processingStatus,
      processingRejectionReason: lineRow.processingRejectionReason,
      lectureFeePaymentScheduledDateDisplay: lineRow.lectureFeePaymentScheduledDate
        ? formatIsoToKoreanWeekday(lineRow.lectureFeePaymentScheduledDate)
        : settlement.expectedTransferDate
          ? formatIsoToKoreanWeekday(settlement.expectedTransferDate)
          : undefined,
      ...mapCalculationStatementSharedBasic(settlement),
    },
    blocks,
    formulaLabel: '정산 항목 합계',
    totalAmount,
  }
}

export function instructorIdentityFromLine(
  instructorNameKo: string
): PaymentOrderAdminInstructorDetail {
  return {
    instructorNo: 0,
    nameKo: instructorNameKo,
    nameEn: '-',
    address: '-',
    phone: '-',
    email: '-',
    bankName: '-',
    accountNumber: '-',
    accountHolder: '-',
    totalEstimatedAmount: 0,
    programRows: [],
  }
}

export function mapSettlementDetailToInstructorPageCalculationStatement(
  lineRow: DetailLineRow,
  settlement: SettlementFrontendResponse,
  instructorDetail: PaymentOrderAdminInstructorDetail,
  programName?: string
): PaymentOrderProgramCalculationStatement {
  const blocks = buildBlocks(lineRow, settlement, 'single')
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

  const resolvedProgramName =
    programName ?? ('programName' in lineRow ? lineRow.programName : undefined)

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
      programName: resolvedProgramName,
      processingStatusDisplay: PAYMENT_ORDER_ADMIN_LINE_STATUS_LABELS[lineRow.processingStatus],
      processingStatusClass: lineRow.processingStatus,
      processingRejectionReason: lineRow.processingRejectionReason,
      lectureFeePaymentScheduledDateDisplay: lineRow.lectureFeePaymentScheduledDate
        ? formatIsoToKoreanWeekday(lineRow.lectureFeePaymentScheduledDate)
        : settlement.expectedTransferDate
          ? formatIsoToKoreanWeekday(settlement.expectedTransferDate)
          : undefined,
      ...mapCalculationStatementSharedBasic(settlement),
    },
    blocks,
    formulaLabel: '정산 항목 합계',
    totalAmount,
  }
}
