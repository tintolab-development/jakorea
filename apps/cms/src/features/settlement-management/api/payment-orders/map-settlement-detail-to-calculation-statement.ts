import type {
  PaymentOrderAdminInstructorDetail,
  PaymentOrderAdminInstructorDetailProgramRow,
  PaymentOrderAdminProgramDetailInstructorRow,
  PaymentOrderProgramCalculationStatement,
  PaymentOrderCalculationStatementLine,
  PaymentOrderCalculationStatementSessionBlock,
} from '@/features/settlement-management/model/payment-order-admin-list'
import {
  PAYMENT_ORDER_ADMIN_LINE_STATUS_LABELS,
  addressDisplayForStatementBlur,
} from '@/features/settlement-management/model/payment-order-admin-list'
import type {
  SettlementFrontendItemResponse,
  SettlementFrontendResponse,
  SettlementTransportationSnapshotResponse,
} from '@/shared/api/generated/settlement/schemas'
import { formatPaymentOrderCalculationItemLabel } from '@/shared/constants/settlement-item-type'
import { MASKING_POLICY } from '@/shared/constants/download-policy'
import { formatDateDotWithWeekday } from '@/shared/utils/date'
import {
  formatBusinessIncomeEarnerLabel,
  formatBusinessPeriodDisplay,
  formatLectureFeeStandardTitle,
  formatLectureSessionLabel,
  formatProgramSessionProgressDisplay,
  formatWonAmountDisplay,
  mapCalculationDetailToBasisDetail,
  mapSettlementFrontendItemTypeToLineKind,
  prepareSettlementFrontendItemsForStatement,
} from '@/features/settlement-management/api/shared/map-frontend-fields'
import {
  mapTransportationSnapshotToBasisDetail,
  type PaymentOrderCalculationBasisDetailTransportSnapshot,
} from '@/features/settlement/ui/payment-record/payment-order-calculation-basis-detail'

type ProgramDetailLineRow = PaymentOrderAdminProgramDetailInstructorRow
type InstructorDetailLineRow = PaymentOrderAdminInstructorDetailProgramRow
type DetailLineRow = ProgramDetailLineRow | InstructorDetailLineRow

function formatIsoToKoreanWeekday(iso: string): string {
  if (!iso) return '—'
  const label = formatDateDotWithWeekday(iso)
  return label === '-' ? iso : label
}

function mapItemToLine(
  item: SettlementFrontendItemResponse,
  index: number,
  transportationSnapshot?: SettlementTransportationSnapshotResponse
): PaymentOrderCalculationStatementLine {
  const amount = item.amount ?? 0
  const mappedBasisDetail = mapCalculationDetailToBasisDetail(item.calculationDetail)
  const basisDetail = resolveItemBasisDetail(
    item.type,
    mappedBasisDetail,
    transportationSnapshot,
    amount
  )

  return {
    id: `calc-line-remote-${index}`,
    itemLabel: formatPaymentOrderCalculationItemLabel(item.type, amount),
    description: item.description?.trim() || '—',
    amount,
    kind: mapSettlementFrontendItemTypeToLineKind(item.type, amount),
    basisDetail,
  }
}

function resolveItemBasisDetail(
  itemType: SettlementFrontendItemResponse['type'],
  mappedBasisDetail: ReturnType<typeof mapCalculationDetailToBasisDetail>,
  transportationSnapshot: SettlementTransportationSnapshotResponse | undefined,
  amount: number
) {
  if (itemType !== 'transportation') return mappedBasisDetail

  if (mappedBasisDetail?.layout === 'transportSnapshot') {
    return withTransportationAmountFallback(mappedBasisDetail, amount)
  }

  const isLegacyTransportLayout =
    mappedBasisDetail?.layout === 'transportRoundTrip' ||
    mappedBasisDetail?.layout === 'transportOneWay' ||
    mappedBasisDetail?.layout === 'transportInstructor'
  if (isLegacyTransportLayout) return mappedBasisDetail

  return withTransportationAmountFallback(
    mapTransportationSnapshotToBasisDetail(transportationSnapshot),
    amount
  )
}

function withTransportationAmountFallback(
  detail: PaymentOrderCalculationBasisDetailTransportSnapshot | undefined,
  amount: number
): PaymentOrderCalculationBasisDetailTransportSnapshot | undefined {
  if (!detail) return undefined
  return {
    ...detail,
    calculatedTransportAmount: detail.calculatedTransportAmount ?? amount,
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
  sessionDisplay: 'range' | 'single' = 'range',
  transportationSnapshot?: SettlementTransportationSnapshotResponse
): PaymentOrderCalculationStatementSessionBlock[] {
  const items = prepareSettlementFrontendItemsForStatement(settlement.items)
  const lines =
    items.length > 0
      ? items.map((item, index) => mapItemToLine(item, index, transportationSnapshot))
      : [
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
  instructorNameKo: string,
  transportationSnapshot?: SettlementTransportationSnapshotResponse
): PaymentOrderProgramCalculationStatement {
  const blocks = buildBlocks(lineRow, settlement, 'range', transportationSnapshot)
  const itemsTotal = sumItems(settlement.items)
  const totalAmount =
    settlement.totalAmount ?? (itemsTotal !== 0 ? itemsTotal : lineRow.estimatedAmount)

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
  programName?: string,
  transportationSnapshot?: SettlementTransportationSnapshotResponse
): PaymentOrderProgramCalculationStatement {
  const blocks = buildBlocks(lineRow, settlement, 'single', transportationSnapshot)
  const itemsTotal = sumItems(settlement.items)
  const totalAmount =
    settlement.totalAmount ?? (itemsTotal !== 0 ? itemsTotal : lineRow.estimatedAmount)

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
