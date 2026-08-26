import type {
  AccountPaymentRow,
  AccountPaymentStatusDetail,
} from '@/data/mock/account-payments-list'
import { ACCOUNT_PAYMENT_STATUS_LABELS } from '@/data/mock/account-payments-list'
import type {
  PaymentOrderCalculationStatementLine,
  PaymentOrderCalculationStatementSessionBlock,
} from '@/data/mock/payment-order-admin-list'
import type {
  AccountPaymentDetailResponse,
  SettlementFrontendItemResponse,
  SettlementFrontendResponse,
  SettlementItemResponse,
  SettlementResponse,
} from '@/shared/api/generated/settlement/schemas'
import { formatLectureSessionLabel } from '@/features/settlement-management/api/account-payments/map-settlement-context'
import { mapPaymentStatusToAccountPaymentStatus } from '@/features/settlement-management/api/shared/settlement-status-mappers'
import {
  formatBusinessIncomeEarnerLabel,
  formatBusinessPeriodDisplay,
  formatLectureFeeStandardTitle,
  formatProgramSessionProgressDisplay,
  formatWonAmountDisplay,
  mapCalculationDetailToBasisDetail,
  mapSettlementFrontendItemTypeToLineKind,
} from '@/features/settlement-management/api/shared/map-frontend-fields'
import { formatPaymentOrderCalculationItemLabel } from '@/shared/constants/settlement-item-type'

const KO_WEEKDAY = ['일', '월', '화', '수', '목', '금', '토'] as const

function formatTransferDateDisplay(iso: string): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  const date = new Date(y, m - 1, d)
  const dow = KO_WEEKDAY[date.getDay()]
  return `${y}. ${String(m).padStart(2, '0')}. ${String(d).padStart(2, '0')}(${dow})`
}

function formatLectureDateDisplay(iso: string | undefined): string {
  if (!iso) return '—'
  return formatTransferDateDisplay(iso)
}

function toRoundSessionLabel(label: string): string {
  return label.replace(/차시/g, '회차')
}

function resolveInstitutionName(row: AccountPaymentRow, institutionName?: string): string {
  const fromApi = institutionName?.trim()
  if (fromApi) return fromApi
  if (row.institutionName && row.institutionName !== '-') return row.institutionName
  return '—'
}

function resolveSessionDisplay(
  row: AccountPaymentRow,
  lectureSessionDisplay?: string,
  sessionOrdinal?: number
): string {
  const fromApi = lectureSessionDisplay?.trim()
  if (fromApi) return toRoundSessionLabel(fromApi)
  if (sessionOrdinal != null) return toRoundSessionLabel(formatLectureSessionLabel(sessionOrdinal))
  if (row.sessionLabel && row.sessionLabel !== '-') return toRoundSessionLabel(row.sessionLabel)
  return '—'
}

function mapFrontendItemToCalcLine(
  item: SettlementFrontendItemResponse,
  index: number
): PaymentOrderCalculationStatementLine {
  const amount = item.amount ?? 0
  return {
    id: `calc-line-api-${index}`,
    itemLabel: formatPaymentOrderCalculationItemLabel(item.type, amount),
    description: item.description?.trim() || '—',
    amount,
    kind: mapSettlementFrontendItemTypeToLineKind(item.type, amount),
    basisDetail: mapCalculationDetailToBasisDetail(item.calculationDetail),
  }
}

function mapSettlementItemToCalcLine(
  item: SettlementItemResponse,
  index: number
): PaymentOrderCalculationStatementLine {
  const amount = item.amount ?? 0
  const type = item.itemType ?? item.itemCategory
  return {
    id: `calc-line-settlement-${index}`,
    itemLabel: item.itemName?.trim() || formatPaymentOrderCalculationItemLabel(type, amount),
    description: item.itemName?.trim() || '—',
    amount,
    kind: mapSettlementFrontendItemTypeToLineKind(type, amount),
  }
}

function buildBlocksFromFrontendSettlement(
  row: AccountPaymentRow,
  settlement: SettlementFrontendResponse
): PaymentOrderCalculationStatementSessionBlock[] {
  const items = settlement.items ?? []
  const lines = items.map(mapFrontendItemToCalcLine)

  if (lines.length === 0) {
    lines.push({
      id: 'calc-line-api-fallback',
      itemLabel: '정산 예정',
      description: '계좌 지급 확인',
      amount: row.amount,
      kind: 'lecture_fee',
    })
  }

  return [
    {
      institutionName: resolveInstitutionName(row, settlement.institutionName),
      lectureDateDisplay: formatLectureDateDisplay(row.transferScheduledDate),
      lectureSessionDisplay: resolveSessionDisplay(
        row,
        settlement.lectureSessionDisplay,
        settlement.sessionOrdinal
      ),
      lines,
    },
  ]
}

function buildBlocksFromSettlementResponse(
  row: AccountPaymentRow,
  settlement: SettlementResponse | undefined
): PaymentOrderCalculationStatementSessionBlock[] {
  const items = settlement?.items ?? []
  const lines = items.map(mapSettlementItemToCalcLine)

  if (lines.length === 0) {
    lines.push({
      id: 'calc-line-api-fallback',
      itemLabel: '정산 예정',
      description: '계좌 지급 확인',
      amount: row.amount,
      kind: 'lecture_fee',
    })
  }

  const lectureDate = settlement?.lectureDate ?? row.transferScheduledDate

  return [
    {
      institutionName: resolveInstitutionName(row),
      lectureDateDisplay: formatLectureDateDisplay(lectureDate),
      lectureSessionDisplay: resolveSessionDisplay(row),
      lines,
    },
  ]
}

function sumFrontendItemsAmount(items: SettlementFrontendItemResponse[] | undefined): number {
  return (items ?? []).reduce((sum, item) => sum + (item.amount ?? 0), 0)
}

function sumSettlementItemsAmount(items: SettlementItemResponse[] | undefined): number {
  return (items ?? []).reduce((sum, item) => sum + (item.amount ?? 0), 0)
}

function buildAccountPaymentStatusDetail(
  row: AccountPaymentRow,
  blocks: PaymentOrderCalculationStatementSessionBlock[],
  totalAmount: number,
  extras?: {
    programName?: string
    businessPeriodDisplay?: string
    programSessionProgressDisplay?: string
    lectureFeeStandardTitle?: string
    lectureFeeStandardAmount?: string
    businessIncomeEarnerLabel?: string
    accountPaymentStatus?: AccountPaymentStatusDetail['basic']['accountPaymentStatus']
    transferScheduledDate?: string
  }
): AccountPaymentStatusDetail {
  const bankAndNumber = [row.bankName, row.maskedAccountNo].filter(Boolean).join(' ') || '—'
  const accountPaymentStatus = extras?.accountPaymentStatus ?? row.accountPaymentStatus

  return {
    basic: {
      nameKo: row.instructorName,
      nameEn: '—',
      phoneDisplay: '—',
      emailDisplay: '—',
      addressDisplay: '—',
      settlementAccountBankNumberPart: bankAndNumber,
      settlementAccountHolderPart: row.accountHolder?.trim() || '—',
      programName: extras?.programName ?? row.programName,
      programSessionProgressDisplay:
        extras?.programSessionProgressDisplay ??
        (row.sessionLabel !== '-' ? toRoundSessionLabel(row.sessionLabel) : '—'),
      businessPeriodDisplay: extras?.businessPeriodDisplay ?? '—',
      accountPaymentStatus,
      accountPaymentStatusLabel: ACCOUNT_PAYMENT_STATUS_LABELS[accountPaymentStatus],
      transferScheduledDateDisplay: formatTransferDateDisplay(
        extras?.transferScheduledDate ?? row.transferScheduledDate
      ),
      lectureFeeStandardTitle: extras?.lectureFeeStandardTitle ?? '—',
      lectureFeeStandardAmount:
        extras?.lectureFeeStandardAmount ??
        (row.amount > 0 ? `${row.amount.toLocaleString('ko-KR')}원` : '—'),
      businessIncomeEarnerLabel: extras?.businessIncomeEarnerLabel ?? '해당 없음',
    },
    blocks,
    formulaLabel: '정산 항목 합계',
    totalAmount,
    plainAccountForPaymentConfirm: {
      bankAndNumber,
      holder: row.accountHolder?.trim() || row.instructorName,
    },
  }
}

export function mapAccountPaymentDetailRemote(
  row: AccountPaymentRow,
  settlement: SettlementFrontendResponse
): AccountPaymentStatusDetail {
  const blocks = buildBlocksFromFrontendSettlement(row, settlement)
  const itemsTotal = sumFrontendItemsAmount(settlement.items)
  const totalAmount = settlement.totalAmount ?? (itemsTotal !== 0 ? itemsTotal : row.amount)

  return buildAccountPaymentStatusDetail(row, blocks, totalAmount, {
    programName: settlement.programNameKo ?? row.programName,
    businessPeriodDisplay: formatBusinessPeriodDisplay({
      period: settlement.period,
      businessPeriodStart: settlement.businessPeriodStart,
      businessPeriodEnd: settlement.businessPeriodEnd,
      formatDate: formatTransferDateDisplay,
    }),
    programSessionProgressDisplay: toRoundSessionLabel(formatProgramSessionProgressDisplay(settlement)),
    lectureFeeStandardTitle: formatLectureFeeStandardTitle(settlement.lectureFeeStandardTitle),
    lectureFeeStandardAmount: formatWonAmountDisplay(settlement.lectureFeeStandardAmount),
    businessIncomeEarnerLabel: formatBusinessIncomeEarnerLabel(
      settlement.businessIncomeEarnerLabel
    ),
  })
}

export function mapAccountPaymentDetailFromGetApi(
  row: AccountPaymentRow,
  detail: AccountPaymentDetailResponse,
  settlementFrontend?: SettlementFrontendResponse
): AccountPaymentStatusDetail {
  const payment = detail.payment
  const settlement = detail.settlement

  const mergedRow: AccountPaymentRow = {
    ...row,
    instructorName: payment?.instructorName ?? settlement?.instructorName ?? row.instructorName,
    programName:
      settlementFrontend?.programNameKo ?? settlement?.programNameKo ?? row.programName,
    amount: payment?.netPaymentAmount ?? settlement?.netPaymentAmount ?? row.amount,
    transferScheduledDate:
      payment?.scheduledPaymentDate ?? settlement?.expectedTransferDate ?? row.transferScheduledDate,
    bankName: payment?.bankName ?? row.bankName,
    maskedAccountNo: payment?.maskedAccountNo ?? row.maskedAccountNo,
    accountHolder: payment?.accountHolder ?? row.accountHolder,
    accountPaymentStatus: mapPaymentStatusToAccountPaymentStatus(
      payment?.paymentStatus ?? settlement?.paymentStatus
    ),
  }

  if (settlementFrontend) {
    return mapAccountPaymentDetailRemote(mergedRow, settlementFrontend)
  }

  const blocks = buildBlocksFromSettlementResponse(mergedRow, settlement)
  const itemsTotal = sumSettlementItemsAmount(settlement?.items)
  const totalAmount =
    settlement?.netPaymentAmount ?? (itemsTotal !== 0 ? itemsTotal : mergedRow.amount)

  return buildAccountPaymentStatusDetail(mergedRow, blocks, totalAmount, {
    programName: settlement?.programNameKo ?? mergedRow.programName,
    businessPeriodDisplay: settlement?.calculatedAt?.slice(0, 10) ?? '—',
    accountPaymentStatus: mergedRow.accountPaymentStatus,
    transferScheduledDate: mergedRow.transferScheduledDate,
  })
}
